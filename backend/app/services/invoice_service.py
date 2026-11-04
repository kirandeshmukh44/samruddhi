# backend/app/services/invoice_service.py
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from fastapi import HTTPException, status
from app.models import (
    Business,
    Party,
    Item,
    Invoice,
    InvoiceItem,
    Payment,
    StockMovement,
    UserPlan,
    InvoiceStatus,
    PaymentMode,
    PaymentDirection,
    StockMovementReason,
)
from app.schemas import InvoiceCreate
from app.services.gst import calculate_line, calculate_round_off


def get_financial_year_str(d: date) -> str:
    """
    Returns Indian financial year string, e.g. date in 2026-11 -> '2026-27'.
    FY runs from April 1 to March 31.
    """
    if d.month >= 4:
        start_year = d.year
        end_year = (d.year + 1) % 100
    else:
        start_year = d.year - 1
        end_year = d.year % 100
    return f"{start_year}-{end_year:02d}"


def generate_invoice_no(db: Session, business: Business, inv_type: str, d: date) -> str:
    fy_str = get_financial_year_str(d)
    prefix = business.invoice_prefix if inv_type == "sale" else "PUR"
    prefix_pattern = f"{prefix}-{fy_str}-%"

    # Count existing invoices of this business, type, and FY to find next sequence
    last_inv = (
        db.query(Invoice)
        .filter(
            Invoice.business_id == business.id,
            Invoice.type == inv_type,
            Invoice.invoice_no.like(prefix_pattern),
        )
        .order_by(Invoice.invoice_no.desc())
        .first()
    )

    next_seq = 1
    if last_inv:
        try:
            parts = last_inv.invoice_no.split("-")
            next_seq = int(parts[-1]) + 1
        except Exception:
            next_seq = 1

    return f"{prefix}-{fy_str}-{next_seq:04d}"


def create_invoice(
    db: Session, business: Business, invoice_in: InvoiceCreate
) -> Invoice:
    # 0. Check Free Plan Limit (50 invoices per calendar month)
    owner = business.owner
    if owner and owner.plan == UserPlan.free.value:
        inv_date = invoice_in.date
        month_count = (
            db.query(func.count(Invoice.id))
            .filter(
                Invoice.business_id == business.id,
                extract("year", Invoice.date) == inv_date.year,
                extract("month", Invoice.date) == inv_date.month,
            )
            .scalar()
        )
        if month_count >= 50:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free plan limit reached: maximum 50 invoices per month allowed",
            )

    # 1. Validate party
    party = None
    if invoice_in.party_id:
        party = (
            db.query(Party)
            .filter(Party.id == invoice_in.party_id, Party.business_id == business.id)
            .first()
        )
        if not party:
            raise HTTPException(status_code=400, detail="Party does not belong to this business")

    same_state = True
    if party and party.state and business.state:
        same_state = party.state.strip().lower() == business.state.strip().lower()

    # 2. Validate items and compute lines
    db_items: dict[str, Item] = {}
    for item_input in invoice_in.items:
        db_item = (
            db.query(Item)
            .filter(Item.id == item_input.item_id, Item.business_id == business.id)
            .first()
        )
        if not db_item:
            raise HTTPException(
                status_code=400,
                detail=f"Item {item_input.item_id} not found or does not belong to this business",
            )
        db_items[item_input.item_id] = db_item

    # Stock check for sale
    if invoice_in.type == "sale":
        for item_input in invoice_in.items:
            db_item = db_items[item_input.item_id]
            if db_item.stock_qty < item_input.qty:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock for item '{db_item.name}'. Available: {db_item.stock_qty / 1000}, Requested: {item_input.qty / 1000}",
                )

    # 3. Compute all line calculations
    subtotal = 0
    total_discount = 0
    total_cgst = 0
    total_sgst = 0
    total_igst = 0
    unrounded_total = 0

    invoice_item_records: list[InvoiceItem] = []

    for item_input in invoice_in.items:
        db_item = db_items[item_input.item_id]
        line = calculate_line(
            qty=item_input.qty,
            rate=item_input.rate,
            discount=item_input.discount,
            gst_rate=db_item.gst_rate,
            same_state=same_state,
        )

        subtotal += line["taxable_value"]
        total_discount += item_input.discount
        total_cgst += line["cgst"]
        total_sgst += line["sgst"]
        total_igst += line["igst"]
        unrounded_total += line["amount"]

        inv_item = InvoiceItem(
            item_id=db_item.id,
            item_name=db_item.name,
            hsn=db_item.hsn,
            qty=item_input.qty,
            rate=item_input.rate,
            discount=item_input.discount,
            gst_rate=db_item.gst_rate,
            taxable_value=line["taxable_value"],
            cgst=line["cgst"],
            sgst=line["sgst"],
            igst=line["igst"],
            amount=line["amount"],
        )
        invoice_item_records.append(inv_item)

    round_off, grand_total = calculate_round_off(unrounded_total)

    # 4. Generate invoice number
    invoice_no = generate_invoice_no(db, business, invoice_in.type, invoice_in.date)

    paid_amount = max(0, min(invoice_in.paid_amount, grand_total))
    if paid_amount == 0:
        inv_status = InvoiceStatus.unpaid.value
    elif paid_amount >= grand_total:
        inv_status = InvoiceStatus.paid.value
    else:
        inv_status = InvoiceStatus.partial.value

    # 5. Create invoice
    new_invoice = Invoice(
        business_id=business.id,
        party_id=invoice_in.party_id,
        invoice_no=invoice_no,
        type=invoice_in.type,
        date=invoice_in.date,
        subtotal=subtotal,
        discount=total_discount,
        cgst=total_cgst,
        sgst=total_sgst,
        igst=total_igst,
        round_off=round_off,
        total=grand_total,
        paid_amount=paid_amount,
        status=inv_status,
        notes=invoice_in.notes,
    )
    db.add(new_invoice)
    db.flush()  # assign new_invoice.id

    for inv_item in invoice_item_records:
        inv_item.invoice_id = new_invoice.id
        db.add(inv_item)

    # 6. Stock changes and StockMovements
    for item_input in invoice_in.items:
        db_item = db_items[item_input.item_id]
        if invoice_in.type == "sale":
            db_item.stock_qty -= item_input.qty
            sm = StockMovement(
                business_id=business.id,
                item_id=db_item.id,
                qty_change=-item_input.qty,
                reason=StockMovementReason.sale.value,
                invoice_id=new_invoice.id,
                date=invoice_in.date,
            )
            db.add(sm)
        else:  # purchase
            db_item.stock_qty += item_input.qty
            # Update purchase price if provided
            if item_input.rate > 0:
                db_item.purchase_price = item_input.rate
            sm = StockMovement(
                business_id=business.id,
                item_id=db_item.id,
                qty_change=item_input.qty,
                reason=StockMovementReason.purchase.value,
                invoice_id=new_invoice.id,
                date=invoice_in.date,
            )
            db.add(sm)

    # 7. Payment row if paid_amount > 0
    if paid_amount > 0:
        direction = (
            PaymentDirection.in_.value
            if invoice_in.type == "sale"
            else PaymentDirection.out.value
        )
        pay_mode = invoice_in.payment_mode or PaymentMode.cash.value
        payment = Payment(
            business_id=business.id,
            party_id=invoice_in.party_id,
            invoice_id=new_invoice.id,
            amount=paid_amount,
            mode=pay_mode,
            direction=direction,
            date=invoice_in.date,
            note=f"Payment for {invoice_no}",
        )
        db.add(payment)

    db.commit()
    db.refresh(new_invoice)
    return new_invoice


def delete_invoice(db: Session, business: Business, invoice: Invoice) -> None:
    # 1. Reverse stock movements
    for inv_item in invoice.items:
        if inv_item.item_id:
            db_item = db.query(Item).filter(Item.id == inv_item.item_id).first()
            if db_item:
                if invoice.type == "sale":
                    db_item.stock_qty += inv_item.qty
                    reversal_qty = inv_item.qty
                else:
                    db_item.stock_qty -= inv_item.qty
                    reversal_qty = -inv_item.qty

                sm = StockMovement(
                    business_id=business.id,
                    item_id=db_item.id,
                    qty_change=reversal_qty,
                    reason=StockMovementReason.delete_reversal.value,
                    invoice_id=None,
                    date=date.today(),
                )
                db.add(sm)

    # 2. Delete linked payments
    db.query(Payment).filter(Payment.invoice_id == invoice.id).delete()

    # 3. Delete invoice and items (cascaded)
    db.delete(invoice)
    db.commit()

