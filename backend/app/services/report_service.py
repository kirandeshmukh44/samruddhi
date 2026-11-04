# backend/app/services/report_service.py
from datetime import date
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import (
    Business,
    Invoice,
    Party,
    Item,
    Payment,
    InvoiceItem,
    InvoiceType,
)


def get_dashboard_stats(db: Session, business: Business) -> dict:
    today = date.today()
    this_year = today.year
    this_month = today.month

    # Today's sale
    today_sale = (
        db.query(func.coalesce(func.sum(Invoice.total), 0))
        .filter(
            Invoice.business_id == business.id,
            Invoice.type == InvoiceType.sale.value,
            Invoice.date == today,
        )
        .scalar()
    )

    # Month sales and purchases
    month_sale = (
        db.query(func.coalesce(func.sum(Invoice.total), 0))
        .filter(
            Invoice.business_id == business.id,
            Invoice.type == InvoiceType.sale.value,
            func.extract("year", Invoice.date) == this_year,
            func.extract("month", Invoice.date) == this_month,
        )
        .scalar()
    )
    month_purchase = (
        db.query(func.coalesce(func.sum(Invoice.total), 0))
        .filter(
            Invoice.business_id == business.id,
            Invoice.type == InvoiceType.purchase.value,
            func.extract("year", Invoice.date) == this_year,
            func.extract("month", Invoice.date) == this_month,
        )
        .scalar()
    )

    # To collect (Customer outstanding: unpaid sale total - paid)
    unpaid_sales = (
        db.query(func.coalesce(func.sum(Invoice.total - Invoice.paid_amount), 0))
        .filter(
            Invoice.business_id == business.id,
            Invoice.type == InvoiceType.sale.value,
        )
        .scalar()
    )

    # To pay (Supplier outstanding: unpaid purchase total - paid)
    unpaid_purchases = (
        db.query(func.coalesce(func.sum(Invoice.total - Invoice.paid_amount), 0))
        .filter(
            Invoice.business_id == business.id,
            Invoice.type == InvoiceType.purchase.value,
        )
        .scalar()
    )

    # Low stock count and top 5 items
    low_stock_items_query = (
        db.query(Item)
        .filter(
            Item.business_id == business.id,
            Item.is_active == True,
            Item.stock_qty <= Item.low_stock_limit,
        )
        .order_by(Item.stock_qty.asc())
    )
    low_stock_count = low_stock_items_query.count()
    low_stock_items = [
        {
            "id": it.id,
            "name": it.name,
            "stock_qty": it.stock_qty,
            "unit": it.unit,
            "low_stock_limit": it.low_stock_limit,
        }
        for it in low_stock_items_query.limit(5).all()
    ]

    # Recent transactions (last 5 invoices)
    recent_invs = (
        db.query(Invoice)
        .filter(Invoice.business_id == business.id)
        .order_by(Invoice.date.desc(), Invoice.created_at.desc())
        .limit(5)
        .all()
    )
    recent_transactions = [
        {
            "id": inv.id,
            "invoice_no": inv.invoice_no,
            "type": inv.type,
            "party_name": inv.party.name if inv.party else "Unknown",
            "date": str(inv.date),
            "total": inv.total,
            "status": inv.status,
        }
        for inv in recent_invs
    ]

    return {
        "today_sale": int(today_sale),
        "to_collect": int(unpaid_sales),
        "to_pay": int(unpaid_purchases),
        "low_stock_count": low_stock_count,
        "low_stock_items": low_stock_items,
        "recent_transactions": recent_transactions,
        "month_sale": int(month_sale),
        "month_purchase": int(month_purchase),
    }


def get_party_outstanding(db: Session, party: Party) -> int:
    """
    Computes party outstanding balance in paise.
    Positive = to collect (customer owes).
    Negative = to pay (supplier is owed).
    Formula: opening_balance + sum(unpaid sale amounts) - sum(unpaid purchase amounts)
    """
    # Unpaid sales
    unpaid_sales = (
        db.query(func.coalesce(func.sum(Invoice.total - Invoice.paid_amount), 0))
        .filter(
            Invoice.party_id == party.id,
            Invoice.type == InvoiceType.sale.value,
        )
        .scalar()
    )
    # Unpaid purchases
    unpaid_purchases = (
        db.query(func.coalesce(func.sum(Invoice.total - Invoice.paid_amount), 0))
        .filter(
            Invoice.party_id == party.id,
            Invoice.type == InvoiceType.purchase.value,
        )
        .scalar()
    )
    # Unallocated payments
    unallocated_in = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.party_id == party.id,
            Payment.invoice_id == None,
            Payment.direction == "in",
        )
        .scalar()
    )
    unallocated_out = (
        db.query(func.coalesce(func.sum(Payment.amount), 0))
        .filter(
            Payment.party_id == party.id,
            Payment.invoice_id == None,
            Payment.direction == "out",
        )
        .scalar()
    )

    if party.type == "customer":
        balance = party.opening_balance + unpaid_sales - unallocated_in
    else:
        balance = party.opening_balance - unpaid_purchases + unallocated_out

    return int(balance)

