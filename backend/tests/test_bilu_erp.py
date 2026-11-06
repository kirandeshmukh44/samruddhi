# backend/tests/test_bilu_erp.py
import pytest
from datetime import date
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app
from app.models import (
    User,
    Business,
    Party,
    Item,
    Invoice,
    Payment,
    StockMovement,
    UserPlan,
    InvoiceStatus,
    InvoiceType,
)
from app.services.gst import calculate_line, calculate_round_off
from app.security import get_password_hash, create_access_token

# Temporary SQLite test DB
TEST_DATABASE_URL = "sqlite:///./test_bilu_erp.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


# ---------------- PHASE 4: GST Unit Tests ----------------
def test_gst_calculations():
    # 1. Intra-state calculation (CGST + SGST equal split)
    line = calculate_line(qty=1000, rate=10000, discount=0, gst_rate=18, same_state=True)
    assert line["taxable_value"] == 10000
    assert line["cgst"] == 900
    assert line["sgst"] == 900
    assert line["igst"] == 0
    assert line["amount"] == 11800

    # 2. Inter-state calculation (IGST full)
    line_inter = calculate_line(qty=1000, rate=10000, discount=0, gst_rate=18, same_state=False)
    assert line_inter["taxable_value"] == 10000
    assert line_inter["cgst"] == 0
    assert line_inter["sgst"] == 0
    assert line_inter["igst"] == 1800
    assert line_inter["amount"] == 11800

    # 3. Discount applied before tax
    line_disc = calculate_line(qty=2000, rate=5000, discount=1000, gst_rate=5, same_state=True)
    # Gross = 2 * 5000 = 10000. Taxable = 10000 - 1000 = 9000. Tax = 450.
    assert line_disc["taxable_value"] == 9000
    assert line_disc["cgst"] == 225
    assert line_disc["sgst"] == 225
    assert line_disc["amount"] == 9450

    # 4. Odd-paise split (e.g. tax = 15 paise -> cgst = 7, sgst = 8, total tax = 15)
    line_odd = calculate_line(qty=1000, rate=305, discount=0, gst_rate=5, same_state=True)
    # Taxable = 305. Tax = round(305 * 5 / 100) = 15.
    assert line_odd["taxable_value"] == 305
    assert line_odd["cgst"] + line_odd["sgst"] == 15
    assert line_odd["amount"] == 320

    # 5. Round off calculation
    round_off, total = calculate_round_off(10245)  # 45 paise -> round down
    assert round_off == -45
    assert total == 10200

    round_off_up, total_up = calculate_round_off(10260)  # 60 paise -> round up
    assert round_off_up == 40
    assert total_up == 10300


# Helper to create a user and business
def create_test_user_and_business(db, email, phone, state="Maharashtra", plan="free"):
    user = User(
        name="Test User",
        email=email,
        phone=phone,
        password_hash=get_password_hash("password123"),
        role="owner",
        plan=plan,
        is_active=True,
    )
    db.add(user)
    db.flush()

    business = Business(
        owner_id=user.id,
        name="Test Business",
        state=state,
        invoice_prefix="INV",
    )
    db.add(business)
    db.commit()
    db.refresh(user)
    db.refresh(business)
    token = create_access_token({"sub": user.id})
    return user, business, token


# ---------------- INVOICE & STOCK TESTS ----------------
def test_invoice_creation_stock_and_numbering():
    db = TestingSessionLocal()
    user, business, token = create_test_user_and_business(db, "owner1@biluerp.com", "9800000001")

    # Add item with stock = 10 units (10,000 thousandths)
    item = Item(
        business_id=business.id,
        name="Rice",
        sale_price=10000,
        purchase_price=8000,
        gst_rate=5,
        stock_qty=10000,
        low_stock_limit=2000,
        is_active=True,
    )
    # Add party
    party = Party(
        business_id=business.id,
        name="Retailer",
        state="Maharashtra",
        type="customer",
        opening_balance=0,
        is_active=True,
    )
    db.add_all([item, party])
    db.commit()

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create Sale Invoice for 3 units (3,000 thousandths) with paid_amount
    payload = {
        "type": "sale",
        "party_id": party.id,
        "date": str(date.today()),
        "items": [{"item_id": item.id, "qty": 3000, "rate": 10000, "discount": 0}],
        "paid_amount": 10000,
        "payment_mode": "upi",
    }
    res = client.post(f"/businesses/{business.id}/invoices", json=payload, headers=headers)
    assert res.status_code == 200, res.text
    data = res.json()
    assert data["status"] == "partial"
    assert data["paid_amount"] == 10000
    assert "INV-" in data["invoice_no"]
    assert data["invoice_no"].endswith("-0001")

    # Stock should reduce by 3 units -> 7,000 remaining
    db.refresh(item)
    assert item.stock_qty == 7000

    # 2. Reject sale if insufficient stock (request 8 units when 7 left)
    over_payload = {
        "type": "sale",
        "party_id": party.id,
        "date": str(date.today()),
        "items": [{"item_id": item.id, "qty": 8000, "rate": 10000, "discount": 0}],
    }
    res_over = client.post(f"/businesses/{business.id}/invoices", json=over_payload, headers=headers)
    assert res_over.status_code == 400
    assert "Insufficient stock" in res_over.json()["detail"]

    # 3. Second invoice should increment invoice sequence to 0002
    res2 = client.post(f"/businesses/{business.id}/invoices", json=payload, headers=headers)
    assert res2.status_code == 200
    assert res2.json()["invoice_no"].endswith("-0002")

    # 4. Delete invoice reverses stock
    inv1_id = data["id"]
    del_res = client.delete(f"/businesses/{business.id}/invoices/{inv1_id}", headers=headers)
    assert del_res.status_code == 200
    db.refresh(item)
    assert item.stock_qty == 7000  # -3000 + 3000 reversal = 7000


# ---------------- PAYMENTS FIFO ALLOCATION ----------------
def test_payments_fifo_allocation():
    db = TestingSessionLocal()
    user, business, token = create_test_user_and_business(db, "owner2@biluerp.com", "9800000002")

    item = Item(
        business_id=business.id,
        name="Oil",
        sale_price=5000,
        purchase_price=4000,
        gst_rate=0,
        stock_qty=50000,
        is_active=True,
    )
    party = Party(
        business_id=business.id,
        name="Customer FIFO",
        state="Maharashtra",
        type="customer",
        opening_balance=0,
        is_active=True,
    )
    db.add_all([item, party])
    db.commit()

    headers = {"Authorization": f"Bearer {token}"}

    # Create 2 unpaid invoices: Inv1 = 5,000 paise, Inv2 = 5,000 paise
    p1 = {"type": "sale", "party_id": party.id, "date": "2026-11-01", "items": [{"item_id": item.id, "qty": 1000, "rate": 5000, "discount": 0}]}
    p2 = {"type": "sale", "party_id": party.id, "date": "2026-11-02", "items": [{"item_id": item.id, "qty": 1000, "rate": 5000, "discount": 0}]}
    r1 = client.post(f"/businesses/{business.id}/invoices", json=p1, headers=headers).json()
    r2 = client.post(f"/businesses/{business.id}/invoices", json=p2, headers=headers).json()

    # Apply 7,000 paise unallocated payment: should fully pay Inv1 (5000) and partial pay Inv2 (2000)
    pay_payload = {
        "party_id": party.id,
        "amount": 7000,
        "mode": "cash",
        "direction": "in",
    }
    pay_res = client.post(f"/businesses/{business.id}/payments", json=pay_payload, headers=headers)
    assert pay_res.status_code == 200

    inv1_db = db.query(Invoice).filter(Invoice.id == r1["id"]).first()
    inv2_db = db.query(Invoice).filter(Invoice.id == r2["id"]).first()
    db.refresh(inv1_db)
    db.refresh(inv2_db)

    assert inv1_db.status == InvoiceStatus.paid.value
    assert inv1_db.paid_amount == 5000
    assert inv2_db.status == InvoiceStatus.partial.value
    assert inv2_db.paid_amount == 2000


# ---------------- FREE PLAN LIMITS ----------------
def test_free_plan_limits():
    db = TestingSessionLocal()
    user, business, token = create_test_user_and_business(db, "free@biluerp.com", "9800000003", plan="free")
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt to create 2nd business on free plan -> Should return 403
    bus_payload = {"name": "Second Business", "state": "Maharashtra"}
    res_bus = client.post("/businesses", json=bus_payload, headers=headers)
    assert res_bus.status_code == 403
    assert "Free plan limit reached" in res_bus.json()["detail"]


# ---------------- TENANT ISOLATION ----------------
def test_tenant_isolation():
    db = TestingSessionLocal()
    user_a, bus_a, token_a = create_test_user_and_business(db, "usera@biluerp.com", "9800000004")
    user_b, bus_b, token_b = create_test_user_and_business(db, "userb@biluerp.com", "9800000005")

    # User A tries to access User B's business endpoints -> Should return 403
    headers_a = {"Authorization": f"Bearer {token_a}"}
    res = client.get(f"/businesses/{bus_b.id}/parties", headers=headers_a)
    assert res.status_code == 403
    assert "Access forbidden" in res.json()["detail"]

