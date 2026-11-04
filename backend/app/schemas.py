# backend/app/schemas.py
import datetime as dt_module
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field


# ----------------- Auth & Users -----------------
class UserRegister(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    password: str

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    identifier: Optional[str] = None  # email or phone
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str


class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    language: Optional[str] = None  # en, hi, mr


class UserOut(BaseModel):
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str
    plan: str
    is_active: bool
    language: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ----------------- Businesses -----------------
class BusinessCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    address: Optional[str] = None
    state: str = "Maharashtra"
    phone: Optional[str] = None
    invoice_prefix: str = "INV"


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    address: Optional[str] = None
    state: Optional[str] = None
    phone: Optional[str] = None
    invoice_prefix: Optional[str] = None


class BusinessOut(BaseModel):
    id: str
    owner_id: str
    name: str
    gstin: Optional[str] = None
    address: Optional[str] = None
    state: str
    phone: Optional[str] = None
    invoice_prefix: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Parties -----------------
class PartyCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    gstin: Optional[str] = None
    state: Optional[str] = "Maharashtra"
    type: str = "customer"  # customer or supplier
    opening_balance: int = 0  # paise


class PartyUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    gstin: Optional[str] = None
    state: Optional[str] = None
    type: Optional[str] = None
    opening_balance: Optional[int] = None


class PartyOut(BaseModel):
    id: str
    business_id: str
    name: str
    phone: Optional[str] = None
    gstin: Optional[str] = None
    state: str
    type: str
    opening_balance: int
    outstanding_balance: int = 0  # computed in paise
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Items -----------------
class ItemCreate(BaseModel):
    name: str
    hsn: Optional[str] = None
    unit: str = "pcs"
    sale_price: int = 0  # paise
    purchase_price: int = 0  # paise
    gst_rate: int = 0  # in {0, 5, 12, 18, 28}
    stock_qty: int = 0  # thousandths
    low_stock_limit: int = 10000  # thousandths


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    hsn: Optional[str] = None
    unit: Optional[str] = None
    sale_price: Optional[int] = None
    purchase_price: Optional[int] = None
    gst_rate: Optional[int] = None
    stock_qty: Optional[int] = None
    low_stock_limit: Optional[int] = None


class StockAdjustRequest(BaseModel):
    qty_change: int  # thousandths (+ or -)
    reason: str = "adjustment"  # adjustment, sale, purchase, delete_reversal
    note: Optional[str] = None


class ItemOut(BaseModel):
    id: str
    business_id: str
    name: str
    hsn: Optional[str] = None
    unit: str
    sale_price: int
    purchase_price: int
    gst_rate: int
    stock_qty: int
    low_stock_limit: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Invoices -----------------
class InvoiceItemInput(BaseModel):
    item_id: str
    qty: int  # thousandths (e.g. 1000 = 1 item)
    rate: int  # paise per single unit (per 1000 thousandths)
    discount: int = 0  # paise


class InvoiceCreate(BaseModel):
    type: str = "sale"  # sale or purchase
    party_id: Optional[str] = None
    date: dt_module.date = Field(default_factory=dt_module.date.today)
    items: List[InvoiceItemInput]
    paid_amount: int = 0  # paise
    payment_mode: Optional[str] = "cash"
    notes: Optional[str] = None


class InvoiceItemOut(BaseModel):
    id: str
    invoice_id: str
    item_id: Optional[str] = None
    item_name: str
    hsn: Optional[str] = None
    qty: int
    rate: int
    discount: int
    gst_rate: int
    taxable_value: int
    cgst: int
    sgst: int
    igst: int
    amount: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class InvoiceOut(BaseModel):
    id: str
    business_id: str
    party_id: Optional[str] = None
    party_name: Optional[str] = None
    invoice_no: str
    type: str
    date: date
    subtotal: int
    discount: int
    cgst: int
    sgst: int
    igst: int
    round_off: int
    total: int
    paid_amount: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    items: List[InvoiceItemOut] = []

    model_config = ConfigDict(from_attributes=True)


class InvoiceListResponse(BaseModel):
    total_count: int
    total_amount: int
    invoices: List[InvoiceOut]


# ----------------- Payments -----------------
class PaymentCreate(BaseModel):
    party_id: str
    amount: int  # paise
    mode: str = "cash"  # cash, upi, card, bank, cheque
    direction: str = "in"  # in or out
    date: dt_module.date = Field(default_factory=dt_module.date.today)
    invoice_id: Optional[str] = None
    note: Optional[str] = None


class PaymentOut(BaseModel):
    id: str
    business_id: str
    party_id: Optional[str] = None
    party_name: Optional[str] = None
    invoice_id: Optional[str] = None
    amount: int
    mode: str
    direction: str
    date: date
    note: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ----------------- Dashboard & Reports -----------------
class DashboardResponse(BaseModel):
    today_sale: int
    to_collect: int
    to_pay: int
    low_stock_count: int
    low_stock_items: List[dict]
    recent_transactions: List[dict]
    month_sale: int
    month_purchase: int


# ----------------- Admin -----------------
class AdminUserPatch(BaseModel):
    is_active: Optional[bool] = None
    plan: Optional[str] = None  # free or premium


class AdminStats(BaseModel):
    total_users: int
    total_businesses: int
    total_invoices_this_month: int
    premium_users: int
