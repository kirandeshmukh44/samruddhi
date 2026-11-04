# backend/app/models.py
import uuid
import enum
from datetime import date, datetime
from sqlalchemy import (
    String,
    Integer,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


def new_uuid() -> str:
    return str(uuid.uuid4())


def ts_now() -> datetime:
    return datetime.utcnow()


class UserRole(str, enum.Enum):
    admin = "admin"
    owner = "owner"


class UserPlan(str, enum.Enum):
    free = "free"
    premium = "premium"


class PartyType(str, enum.Enum):
    customer = "customer"
    supplier = "supplier"


class InvoiceType(str, enum.Enum):
    sale = "sale"
    purchase = "purchase"


class InvoiceStatus(str, enum.Enum):
    unpaid = "unpaid"
    partial = "partial"
    paid = "paid"


class PaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    card = "card"
    bank = "bank"
    cheque = "cheque"


class PaymentDirection(str, enum.Enum):
    in_ = "in"
    out = "out"


class StockMovementReason(str, enum.Enum):
    sale = "sale"
    purchase = "purchase"
    adjustment = "adjustment"
    delete_reversal = "delete_reversal"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), unique=True, index=True, nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), default=UserRole.owner.value, nullable=False)
    plan: Mapped[str] = mapped_column(String(20), default=UserPlan.free.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)  # en, hi, mr
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    businesses: Mapped[list["Business"]] = relationship(back_populates="owner", cascade="all, delete-orphan")


class Business(Base):
    __tablename__ = "businesses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    owner_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    state: Mapped[str] = mapped_column(String(50), default="Maharashtra", nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    invoice_prefix: Mapped[str] = mapped_column(String(20), default="INV", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    owner: Mapped["User"] = relationship(back_populates="businesses")
    parties: Mapped[list["Party"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    items: Mapped[list["Item"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="business", cascade="all, delete-orphan")
    stock_movements: Mapped[list["StockMovement"]] = relationship(back_populates="business", cascade="all, delete-orphan")


class Party(Base):
    __tablename__ = "parties"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gstin: Mapped[str | None] = mapped_column(String(20), nullable=True)
    state: Mapped[str] = mapped_column(String(50), default="Maharashtra", nullable=False)
    type: Mapped[str] = mapped_column(String(20), default=PartyType.customer.value, nullable=False)
    opening_balance: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # in paise
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    business: Mapped["Business"] = relationship(back_populates="parties")
    invoices: Mapped[list["Invoice"]] = relationship(back_populates="party")
    payments: Mapped[list["Payment"]] = relationship(back_populates="party")


class Item(Base):
    __tablename__ = "items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    hsn: Mapped[str | None] = mapped_column(String(20), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="pcs", nullable=False)
    sale_price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    purchase_price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    gst_rate: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0, 5, 12, 18, 28
    stock_qty: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # integer thousandths (1000 = 1.000)
    low_stock_limit: Mapped[int] = mapped_column(Integer, default=10000, nullable=False)  # thousandths
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    business: Mapped["Business"] = relationship(back_populates="items")
    stock_movements: Mapped[list["StockMovement"]] = relationship(back_populates="item", cascade="all, delete-orphan")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    party_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("parties.id"), nullable=True, index=True)
    invoice_no: Mapped[str] = mapped_column(String(50), nullable=False)
    type: Mapped[str] = mapped_column(String(20), default=InvoiceType.sale.value, nullable=False)
    date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    subtotal: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    discount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    cgst: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    sgst: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    igst: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    round_off: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    total: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    paid_amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    status: Mapped[str] = mapped_column(String(20), default=InvoiceStatus.unpaid.value, nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    __table_args__ = (
        UniqueConstraint("business_id", "type", "invoice_no", name="uq_business_type_invoice_no"),
    )

    business: Mapped["Business"] = relationship(back_populates="invoices")
    party: Mapped["Party | None"] = relationship(back_populates="invoices")
    items: Mapped[list["InvoiceItem"]] = relationship(back_populates="invoice", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship(back_populates="invoice")
    stock_movements: Mapped[list["StockMovement"]] = relationship(back_populates="invoice")

    @property
    def party_name(self) -> str | None:
        return self.party.name if self.party else None


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    invoice_id: Mapped[str] = mapped_column(String(36), ForeignKey("invoices.id"), nullable=False, index=True)
    item_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("items.id"), nullable=True)
    item_name: Mapped[str] = mapped_column(String(150), nullable=False)  # snapshot
    hsn: Mapped[str | None] = mapped_column(String(20), nullable=True)  # snapshot
    qty: Mapped[int] = mapped_column(Integer, default=1000, nullable=False)  # thousandths
    rate: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    discount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    gst_rate: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # percent
    taxable_value: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    cgst: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    sgst: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    igst: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    amount: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # paise
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    invoice: Mapped["Invoice"] = relationship(back_populates="items")


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    party_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("parties.id"), nullable=True, index=True)
    invoice_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("invoices.id"), nullable=True, index=True)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)  # paise
    mode: Mapped[str] = mapped_column(String(20), default=PaymentMode.cash.value, nullable=False)
    direction: Mapped[str] = mapped_column(String(10), default=PaymentDirection.in_.value, nullable=False)
    date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    business: Mapped["Business"] = relationship(back_populates="payments")
    party: Mapped["Party | None"] = relationship(back_populates="payments")
    invoice: Mapped["Invoice | None"] = relationship(back_populates="payments")

    @property
    def party_name(self) -> str | None:
        return self.party.name if self.party else None


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_uuid)
    business_id: Mapped[str] = mapped_column(String(36), ForeignKey("businesses.id"), nullable=False, index=True)
    item_id: Mapped[str] = mapped_column(String(36), ForeignKey("items.id"), nullable=False, index=True)
    qty_change: Mapped[int] = mapped_column(Integer, nullable=False)  # thousandths (+ or -)
    reason: Mapped[str] = mapped_column(String(30), nullable=False)  # sale, purchase, adjustment, delete_reversal
    invoice_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("invoices.id"), nullable=True, index=True)
    date: Mapped[date] = mapped_column(Date, default=date.today, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=ts_now, onupdate=ts_now, nullable=False)

    business: Mapped["Business"] = relationship(back_populates="stock_movements")
    item: Mapped["Item"] = relationship(back_populates="stock_movements")
    invoice: Mapped["Invoice | None"] = relationship(back_populates="stock_movements")
