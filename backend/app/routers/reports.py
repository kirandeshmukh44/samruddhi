# backend/app/routers/reports.py
import csv
import io
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Business, Invoice, Party, Item, Payment, InvoiceItem, InvoiceType
from app.security import require_business_access
from app.services.report_service import get_party_outstanding

router = APIRouter(prefix="/businesses/{business_id}/reports", tags=["reports"])


def create_csv_response(filename: str, rows: list[list]) -> Response:
    output = io.StringIO()
    writer = csv.writer(output)
    for row in rows:
        writer.writerow(row)
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}.csv"},
    )


# 1. Sales Report
@router.get("/sales")
def sales_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: Optional[str] = None,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    q = db.query(Invoice).filter(
        Invoice.business_id == business.id,
        Invoice.type == InvoiceType.sale.value,
    )
    if date_from:
        q = q.filter(Invoice.date >= date_from)
    if date_to:
        q = q.filter(Invoice.date <= date_to)

    invoices = q.order_by(Invoice.date.desc()).all()

    if format == "csv":
        rows = [["Invoice No", "Date", "Party", "Taxable", "CGST", "SGST", "IGST", "Total", "Status"]]
        for inv in invoices:
            rows.append([
                inv.invoice_no,
                str(inv.date),
                inv.party.name if inv.party else "Unknown",
                f"{inv.subtotal/100:.2f}",
                f"{inv.cgst/100:.2f}",
                f"{inv.sgst/100:.2f}",
                f"{inv.igst/100:.2f}",
                f"{inv.total/100:.2f}",
                inv.status,
            ])
        return create_csv_response("sales_report", rows)

    return {
        "count": len(invoices),
        "total_sales": sum(i.total for i in invoices),
        "invoices": [
            {
                "id": i.id,
                "invoice_no": i.invoice_no,
                "date": str(i.date),
                "party": i.party.name if i.party else "Unknown",
                "subtotal": i.subtotal,
                "cgst": i.cgst,
                "sgst": i.sgst,
                "igst": i.igst,
                "total": i.total,
                "status": i.status,
            }
            for i in invoices
        ],
    }


# 2. Purchase Report
@router.get("/purchases")
def purchases_report(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: Optional[str] = None,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    q = db.query(Invoice).filter(
        Invoice.business_id == business.id,
        Invoice.type == InvoiceType.purchase.value,
    )
    if date_from:
        q = q.filter(Invoice.date >= date_from)
    if date_to:
        q = q.filter(Invoice.date <= date_to)

    invoices = q.order_by(Invoice.date.desc()).all()

    if format == "csv":
        rows = [["Bill No", "Date", "Supplier", "Taxable", "CGST", "SGST", "IGST", "Total", "Status"]]
        for inv in invoices:
            rows.append([
                inv.invoice_no,
                str(inv.date),
                inv.party.name if inv.party else "Unknown",
                f"{inv.subtotal/100:.2f}",
                f"{inv.cgst/100:.2f}",
                f"{inv.sgst/100:.2f}",
                f"{inv.igst/100:.2f}",
                f"{inv.total/100:.2f}",
                inv.status,
            ])
        return create_csv_response("purchases_report", rows)

    return {
        "count": len(invoices),
        "total_purchases": sum(i.total for i in invoices),
        "invoices": [
            {
                "id": i.id,
                "invoice_no": i.invoice_no,
                "date": str(i.date),
                "party": i.party.name if i.party else "Unknown",
                "subtotal": i.subtotal,
                "cgst": i.cgst,
                "sgst": i.sgst,
                "igst": i.igst,
                "total": i.total,
                "status": i.status,
            }
            for i in invoices
        ],
    }


# 3. Party Statement (Ledger)
@router.get("/party-statement/{party_id}")
def party_statement(
    party_id: str,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: Optional[str] = None,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    party = db.query(Party).filter(Party.id == party_id, Party.business_id == business.id).first()
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    invoices = db.query(Invoice).filter(Invoice.party_id == party.id)
    payments = db.query(Payment).filter(Payment.party_id == party.id)
    if date_from:
        invoices = invoices.filter(Invoice.date >= date_from)
        payments = payments.filter(Payment.date >= date_from)
    if date_to:
        invoices = invoices.filter(Invoice.date <= date_to)
        payments = payments.filter(Payment.date <= date_to)

    entries = []
    for inv in invoices.all():
        entries.append({
            "date": str(inv.date),
            "type": f"Invoice ({inv.type.upper()})",
            "ref": inv.invoice_no,
            "debit": inv.total if inv.type == "sale" else 0,
            "credit": inv.total if inv.type == "purchase" else 0,
        })
    for p in payments.all():
        entries.append({
            "date": str(p.date),
            "type": f"Payment ({p.mode})",
            "ref": p.id[:8],
            "debit": p.amount if p.direction == "out" else 0,
            "credit": p.amount if p.direction == "in" else 0,
        })

    entries.sort(key=lambda x: x["date"])

    running = party.opening_balance
    ledger = []
    for e in entries:
        running += e["debit"] - e["credit"]
        ledger.append({**e, "balance": running})

    if format == "csv":
        rows = [["Date", "Type", "Ref", "Debit", "Credit", "Running Balance"]]
        for row in ledger:
            rows.append([
                row["date"],
                row["type"],
                row["ref"],
                f"{row['debit']/100:.2f}",
                f"{row['credit']/100:.2f}",
                f"{row['balance']/100:.2f}",
            ])
        return create_csv_response(f"ledger_{party.name}", rows)

    return {
        "party": party.name,
        "opening_balance": party.opening_balance,
        "current_balance": running,
        "ledger": ledger,
    }


# 4. Stock Summary
@router.get("/stock-summary")
def stock_summary(
    format: Optional[str] = None,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    items = db.query(Item).filter(Item.business_id == business.id, Item.is_active == True).all()

    stock_data = []
    total_val = 0
    for it in items:
        qty_units = it.stock_qty / 1000
        val = int(qty_units * it.purchase_price)
        total_val += val
        stock_data.append({
            "name": it.name,
            "hsn": it.hsn,
            "stock_qty": it.stock_qty,
            "unit": it.unit,
            "purchase_price": it.purchase_price,
            "stock_value": val,
        })

    if format == "csv":
        rows = [["Item Name", "HSN", "Qty", "Unit", "Purchase Price", "Stock Value"]]
        for s in stock_data:
            rows.append([
                s["name"],
                s["hsn"] or "-",
                f"{s['stock_qty']/1000:.2f}",
                s["unit"],
                f"{s['purchase_price']/100:.2f}",
                f"{s['stock_value']/100:.2f}",
            ])
        return create_csv_response("stock_summary", rows)

    return {
        "total_items": len(items),
        "total_stock_value": total_val,
        "items": stock_data,
    }


# 5. GST Summary
@router.get("/gst-summary")
def gst_summary(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: Optional[str] = None,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    sales_q = db.query(Invoice).filter(Invoice.business_id == business.id, Invoice.type == "sale")
    purch_q = db.query(Invoice).filter(Invoice.business_id == business.id, Invoice.type == "purchase")
    if date_from:
        sales_q = sales_q.filter(Invoice.date >= date_from)
        purch_q = purch_q.filter(Invoice.date >= date_from)
    if date_to:
        sales_q = sales_q.filter(Invoice.date <= date_to)
        purch_q = purch_q.filter(Invoice.date <= date_to)

    sales = sales_q.all()
    purchases = purch_q.all()

    sales_cgst = sum(s.cgst for s in sales)
    sales_sgst = sum(s.sgst for s in sales)
    sales_igst = sum(s.igst for s in sales)
    sales_tax_total = sales_cgst + sales_sgst + sales_igst

    purch_cgst = sum(p.cgst for p in purchases)
    purch_sgst = sum(p.sgst for p in purchases)
    purch_igst = sum(p.igst for p in purchases)
    purch_tax_total = purch_cgst + purch_sgst + purch_igst

    net_payable = max(0, sales_tax_total - purch_tax_total)

    if format == "csv":
        rows = [
            ["Tax Head", "Output Tax (Sales)", "Input Tax (Purchases)", "Net Payable"],
            ["CGST", f"{sales_cgst/100:.2f}", f"{purch_cgst/100:.2f}", f"{(sales_cgst - purch_cgst)/100:.2f}"],
            ["SGST", f"{sales_sgst/100:.2f}", f"{purch_sgst/100:.2f}", f"{(sales_sgst - purch_sgst)/100:.2f}"],
            ["IGST", f"{sales_igst/100:.2f}", f"{purch_igst/100:.2f}", f"{(sales_igst - purch_igst)/100:.2f}"],
            ["TOTAL", f"{sales_tax_total/100:.2f}", f"{purch_tax_total/100:.2f}", f"{net_payable/100:.2f}"],
        ]
        return create_csv_response("gst_summary", rows)

    return {
        "output_tax": {"cgst": sales_cgst, "sgst": sales_sgst, "igst": sales_igst, "total": sales_tax_total},
        "input_tax_credit": {"cgst": purch_cgst, "sgst": purch_sgst, "igst": purch_igst, "total": purch_tax_total},
        "net_gst_payable": net_payable,
    }


# 6. Bill-wise Profit
@router.get("/bill-wise-profit")
def bill_wise_profit(
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    format: Optional[str] = None,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    sales_q = db.query(Invoice).filter(Invoice.business_id == business.id, Invoice.type == "sale")
    if date_from:
        sales_q = sales_q.filter(Invoice.date >= date_from)
    if date_to:
        sales_q = sales_q.filter(Invoice.date <= date_to)

    sales = sales_q.order_by(Invoice.date.desc()).all()

    profit_list = []
    overall_profit = 0

    for inv in sales:
        inv_cost = 0
        for item in inv.items:
            # lookup item purchase price
            it = db.query(Item).filter(Item.id == item.item_id).first()
            cost_rate = it.purchase_price if it else 0
            inv_cost += int((item.qty / 1000) * cost_rate)

        profit = inv.subtotal - inv_cost
        overall_profit += profit
        profit_list.append({
            "invoice_no": inv.invoice_no,
            "date": str(inv.date),
            "party": inv.party.name if inv.party else "Customer",
            "sale_taxable": inv.subtotal,
            "cost_value": inv_cost,
            "profit": profit,
        })

    if format == "csv":
        rows = [["Invoice No", "Date", "Party", "Sale Value", "Cost Value", "Gross Profit"]]
        for p in profit_list:
            rows.append([
                p["invoice_no"],
                p["date"],
                p["party"],
                f"{p['sale_taxable']/100:.2f}",
                f"{p['cost_value']/100:.2f}",
                f"{p['profit']/100:.2f}",
            ])
        return create_csv_response("bill_wise_profit", rows)

    return {
        "overall_gross_profit": overall_profit,
        "invoices": profit_list,
    }

