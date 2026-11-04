# backend/app/routers/payments.py
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Business, Payment, Invoice, InvoiceStatus, InvoiceType
from app.schemas import PaymentCreate, PaymentOut
from app.security import require_business_access

router = APIRouter(prefix="/businesses/{business_id}/payments", tags=["payments"])


@router.post("", response_model=PaymentOut)
def record_payment(
    payment_in: PaymentCreate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    amount_remaining = payment_in.amount
    if amount_remaining <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than zero")

    created_payment = None

    # If invoice_id provided, apply directly to that invoice
    if payment_in.invoice_id:
        invoice = (
            db.query(Invoice)
            .filter(
                Invoice.id == payment_in.invoice_id,
                Invoice.business_id == business.id,
            )
            .first()
        )
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

        due = invoice.total - invoice.paid_amount
        if payment_in.amount > due:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Overpayment not allowed: amount ({payment_in.amount/100}) exceeds due ({due/100})",
            )

        invoice.paid_amount += payment_in.amount
        if invoice.paid_amount >= invoice.total:
            invoice.status = InvoiceStatus.paid.value
        else:
            invoice.status = InvoiceStatus.partial.value

        created_payment = Payment(
            business_id=business.id,
            party_id=payment_in.party_id,
            invoice_id=invoice.id,
            amount=payment_in.amount,
            mode=payment_in.mode,
            direction=payment_in.direction,
            date=payment_in.date,
            note=payment_in.note,
        )
        db.add(created_payment)
    else:
        # FIFO allocation to oldest unpaid invoices of this party
        inv_type = InvoiceType.sale.value if payment_in.direction == "in" else InvoiceType.purchase.value
        unpaid_invoices = (
            db.query(Invoice)
            .filter(
                Invoice.business_id == business.id,
                Invoice.party_id == payment_in.party_id,
                Invoice.type == inv_type,
                Invoice.status != InvoiceStatus.paid.value,
            )
            .order_by(Invoice.date.asc(), Invoice.created_at.asc())
            .all()
        )

        for inv in unpaid_invoices:
            if amount_remaining <= 0:
                break
            due = inv.total - inv.paid_amount
            applied = min(due, amount_remaining)
            inv.paid_amount += applied
            amount_remaining -= applied
            if inv.paid_amount >= inv.total:
                inv.status = InvoiceStatus.paid.value
            else:
                inv.status = InvoiceStatus.partial.value

        # Record payment row
        created_payment = Payment(
            business_id=business.id,
            party_id=payment_in.party_id,
            invoice_id=None,
            amount=payment_in.amount,
            mode=payment_in.mode,
            direction=payment_in.direction,
            date=payment_in.date,
            note=payment_in.note,
        )
        db.add(created_payment)

    db.commit()
    db.refresh(created_payment)
    return created_payment


@router.get("", response_model=list[PaymentOut])
def list_payments(
    direction: Optional[str] = None,
    party_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    query = db.query(Payment).filter(Payment.business_id == business.id)
    if direction:
        query = query.filter(Payment.direction == direction)
    if party_id:
        query = query.filter(Payment.party_id == party_id)
    if date_from:
        query = query.filter(Payment.date >= date_from)
    if date_to:
        query = query.filter(Payment.date <= date_to)

    payments = (
        query.order_by(Payment.date.desc(), Payment.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return payments


@router.delete("/{payment_id}")
def delete_payment(
    payment_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id, Payment.business_id == business.id)
        .first()
    )
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # If linked to single invoice, reverse allocation
    if payment.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == payment.invoice_id).first()
        if invoice:
            invoice.paid_amount = max(0, invoice.paid_amount - payment.amount)
            if invoice.paid_amount == 0:
                invoice.status = InvoiceStatus.unpaid.value
            elif invoice.paid_amount < invoice.total:
                invoice.status = InvoiceStatus.partial.value
            else:
                invoice.status = InvoiceStatus.paid.value

    db.delete(payment)
    db.commit()
    return {"detail": "Payment deleted successfully"}

