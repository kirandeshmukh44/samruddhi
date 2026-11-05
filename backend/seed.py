# backend/seed.py
from datetime import date
from app.database import Base, engine, SessionLocal
from app.models import (
    User,
    Business,
    Party,
    Item,
    Invoice,
    InvoiceItem,
    Payment,
    StockMovement,
    UserRole,
    UserPlan,
    PartyType,
    InvoiceType,
    InvoiceStatus,
    PaymentMode,
    PaymentDirection,
    StockMovementReason,
)
from app.security import get_password_hash
from app.services.gst import calculate_line, calculate_round_off


def run_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if already seeded
        admin_user = db.query(User).filter(User.email == "admin@biluerp.com").first()
        if admin_user:
            print("Database already seeded.")
            return

        print("Seeding database...")

        # 1. Admin user
        admin = User(
            name="Platform Admin",
            email="admin@biluerp.com",
            phone="9000000000",
            password_hash=get_password_hash("Admin@123"),
            role=UserRole.admin.value,
            plan=UserPlan.premium.value,
            is_active=True,
            language="en",
        )
        db.add(admin)

        # 2. Demo owner
        demo_owner = User(
            name="Ramesh Gupta",
            email="owner@biluerp.com",
            phone="9876543210",
            password_hash=get_password_hash("Owner@123"),
            role=UserRole.owner.value,
            plan=UserPlan.free.value,
            is_active=True,
            language="en",
        )
        db.add(demo_owner)
        db.flush()

        # 3. Business: Gupta Traders (Maharashtra)
        gupta_traders = Business(
            owner_id=demo_owner.id,
            name="Gupta Traders",
            gstin="27ABCDE1234F1Z5",
            address="Shop No 14, Market Yard, Pune, Maharashtra",
            state="Maharashtra",
            phone="9876543210",
            invoice_prefix="INV",
        )
        db.add(gupta_traders)
        db.flush()

        # 4. 6 Realistic Indian Parties (Customers and Suppliers)
        parties_data = [
            ("Sharma Retail", "9820011111", "27AAAAA0000A1Z5", "Maharashtra", PartyType.customer.value, 0),
            ("Patel Wholesale", "9820022222", "24BBBBB1111B1Z6", "Gujarat", PartyType.customer.value, 500000),
            ("Khan Provision Store", "9820033333", None, "Maharashtra", PartyType.customer.value, 0),
            ("Mehta Distributors", "9820044444", "27CCCCC2222C1Z7", "Maharashtra", PartyType.supplier.value, -200000),
            ("Deshmukh Agro", "9820055555", "27DDDDD3333D1Z8", "Maharashtra", PartyType.supplier.value, 0),
            ("Jain Packaging", "9820066666", "23EEEEE4444E1Z9", "Madhya Pradesh", PartyType.supplier.value, -50000),
        ]

        party_objects = []
        for name, phone, gstin, state, p_type, op_bal in parties_data:
            p = Party(
                business_id=gupta_traders.id,
                name=name,
                phone=phone,
                gstin=gstin,
                state=state,
                type=p_type,
                opening_balance=op_bal,
                is_active=True,
            )
            db.add(p)
            party_objects.append(p)
        db.flush()

        # 5. 10 Realistic Items (Groceries, Spices, Staples)
        # Note: stock stored as integer thousandths (1000 = 1 unit)
        items_data = [
            ("Basmati Rice 25kg", "1006", "bag", 125000, 105000, 5, 50000, 10000),
            ("Wheat Flour 10kg", "1101", "bag", 42000, 36000, 5, 40000, 8000),
            ("Sugar 1kg", "1701", "kg", 4500, 3900, 5, 100000, 20000),
            ("Sunflower Oil 1L", "1512", "ltr", 14500, 12500, 5, 15000, 5000),
            ("Toor Dal 1kg", "0713", "kg", 16000, 14000, 5, 25000, 5000),
            ("Tea Powder 250g", "0902", "pkt", 9500, 7500, 5, 30000, 10000),
            ("Washing Powder 1kg", "3402", "pkt", 12000, 9500, 18, 20000, 5000),
            ("Bathing Soap 100g", "3401", "pcs", 4000, 3000, 18, 50000, 10000),
            ("Red Chilli Powder 500g", "0904", "pkt", 22000, 18000, 5, 8000, 10000),  # Low stock
            ("Dry Fruits Gift Pack", "0802", "box", 85000, 65000, 12, 5000, 10000),  # Low stock
        ]

        item_objects = []
        for name, hsn, unit, s_price, p_price, gst, stock, low_limit in items_data:
            it = Item(
                business_id=gupta_traders.id,
                name=name,
                hsn=hsn,
                unit=unit,
                sale_price=s_price,
                purchase_price=p_price,
                gst_rate=gst,
                stock_qty=stock,
                low_stock_limit=low_limit,
                is_active=True,
            )
            db.add(it)
            item_objects.append(it)
        db.flush()

        # 6. Sample Invoices
        # Invoice 1: Intra-state Sale to Sharma Retail
        item1 = item_objects[0]  # Rice
        item2 = item_objects[2]  # Sugar
        line1 = calculate_line(qty=2000, rate=item1.sale_price, discount=0, gst_rate=item1.gst_rate, same_state=True)
        line2 = calculate_line(qty=5000, rate=item2.sale_price, discount=0, gst_rate=item2.gst_rate, same_state=True)

        unrounded = line1["amount"] + line2["amount"]
        round_off, total = calculate_round_off(unrounded)

        inv1 = Invoice(
            business_id=gupta_traders.id,
            party_id=party_objects[0].id,
            invoice_no="INV-2026-27-0001",
            type=InvoiceType.sale.value,
            date=date.today(),
            subtotal=line1["taxable_value"] + line2["taxable_value"],
            discount=0,
            cgst=line1["cgst"] + line2["cgst"],
            sgst=line1["sgst"] + line2["sgst"],
            igst=0,
            round_off=round_off,
            total=total,
            paid_amount=total,
            status=InvoiceStatus.paid.value,
            notes="Thank you for your purchase",
        )
        db.add(inv1)
        db.flush()

        ii1 = InvoiceItem(
            invoice_id=inv1.id,
            item_id=item1.id,
            item_name=item1.name,
            hsn=item1.hsn,
            qty=2000,
            rate=item1.sale_price,
            discount=0,
            gst_rate=item1.gst_rate,
            taxable_value=line1["taxable_value"],
            cgst=line1["cgst"],
            sgst=line1["sgst"],
            igst=0,
            amount=line1["amount"],
        )
        ii2 = InvoiceItem(
            invoice_id=inv1.id,
            item_id=item2.id,
            item_name=item2.name,
            hsn=item2.hsn,
            qty=5000,
            rate=item2.sale_price,
            discount=0,
            gst_rate=item2.gst_rate,
            taxable_value=line2["taxable_value"],
            cgst=line2["cgst"],
            sgst=line2["sgst"],
            igst=0,
            amount=line2["amount"],
        )
        db.add_all([ii1, ii2])

        # Payment for invoice 1
        pay1 = Payment(
            business_id=gupta_traders.id,
            party_id=party_objects[0].id,
            invoice_id=inv1.id,
            amount=total,
            mode=PaymentMode.upi.value,
            direction=PaymentDirection.in_.value,
            date=date.today(),
            note="UPI payment received",
        )
        db.add(pay1)

        db.commit()
        print("Database seeded successfully with Admin, Demo Owner, Gupta Traders, 6 Parties, 10 Items, and Sample Invoices!")

    finally:
        db.close()


if __name__ == "__main__":
    run_seed()

