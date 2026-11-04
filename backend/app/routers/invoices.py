# backend/app/routers/invoices.py
import urllib.parse
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Business, Invoice, InvoiceItem
from app.schemas import InvoiceCreate, InvoiceOut, InvoiceListResponse
from app.security import require_business_access
from app.services.invoice_service import create_invoice, delete_invoice
from app.services.pdf_service import generate_invoice_pdf

router = APIRouter(prefix="/businesses/{business_id}/invoices", tags=["invoices"])


@router.post("", response_model=InvoiceOut)
def new_invoice(
    invoice_in: InvoiceCreate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    inv = create_invoice(db, business, invoice_in)
    return inv


@router.get("", response_model=InvoiceListResponse)
def list_invoices(
    type: Optional[str] = None,
    status: Optional[str] = None,
    party_id: Optional[str] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    q: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    query = db.query(Invoice).filter(Invoice.business_id == business.id)

    if type:
        query = query.filter(Invoice.type == type)
    if status:
        query = query.filter(Invoice.status == status)
    if party_id:
        query = query.filter(Invoice.party_id == party_id)
    if date_from:
        query = query.filter(Invoice.date >= date_from)
    if date_to:
        query = query.filter(Invoice.date <= date_to)
    if q:
        query = query.filter(Invoice.invoice_no.ilike(f"%{q}%"))

    total_count = query.count()
    total_amount = (
        query.with_entities(func.coalesce(func.sum(Invoice.total), 0)).scalar() or 0
    )

    invoices = (
        query.order_by(Invoice.date.desc(), Invoice.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return InvoiceListResponse(
        total_count=total_count,
        total_amount=int(total_amount),
        invoices=[InvoiceOut.model_validate(inv) for inv in invoices],
    )


@router.get("/{invoice_id}", response_model=InvoiceOut)
def get_invoice(
    invoice_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.business_id == business.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.delete("/{invoice_id}")
def remove_invoice(
    invoice_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.business_id == business.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    delete_invoice(db, business, invoice)
    return {"detail": "Invoice and stock changes reversed successfully"}


@router.get("/{invoice_id}/pdf")
def get_invoice_pdf(
    invoice_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.business_id == business.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    pdf_bytes = generate_invoice_pdf(invoice, business)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={invoice.invoice_no}.pdf"},
    )


@router.get("/{invoice_id}/share-link")
def get_share_link(
    invoice_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id, Invoice.business_id == business.id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    party_name = invoice.party.name if invoice.party else "Customer"
    balance_due = (invoice.total - invoice.paid_amount) / 100
    total_rs = invoice.total / 100

    msg = (
        f"Hello {party_name},\n"
        f"Here is your invoice {invoice.invoice_no} from {business.name}.\n"
        f"Total: ₹{total_rs:.2f}\n"
        f"Balance Due: ₹{balance_due:.2f}\n"
        f"Thank you for your business!"
    )
    encoded = urllib.parse.quote(msg)
    phone_clean = (
        "".join(filter(str.isdigit, invoice.party.phone or "")) if invoice.party else ""
    )
    wa_url = f"https://wa.me/{phone_clean}?text={encoded}"
    return {"share_url": wa_url, "text": msg}

