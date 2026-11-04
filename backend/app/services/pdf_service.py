# backend/app/services/pdf_service.py
import io
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.models import Invoice, Business


def num_to_words_indian(num: int) -> str:
    """
    Converts rupees integer to Indian number words.
    e.g. 12500 -> 'Twelve Thousand Five Hundred Rupees Only'
    """
    if num == 0:
        return "Zero Rupees Only"

    units = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen",
    ]
    tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

    def convert_upto_thousand(n: int) -> str:
        res = ""
        if n >= 100:
            res += units[n // 100] + " Hundred "
            n %= 100
        if n >= 20:
            res += tens[n // 10] + " "
            n %= 10
        if n > 0:
            res += units[n] + " "
        return res.strip()

    crore = num // 10000000
    num %= 10000000
    lakh = num // 100000
    num %= 100000
    thousand = num // 1000
    num %= 1000
    rem = num

    parts = []
    if crore > 0:
        parts.append(convert_upto_thousand(crore) + " Crore")
    if lakh > 0:
        parts.append(convert_upto_thousand(lakh) + " Lakh")
    if thousand > 0:
        parts.append(convert_upto_thousand(thousand) + " Thousand")
    if rem > 0:
        parts.append(convert_upto_thousand(rem))

    words = " ".join(parts).strip()
    return f"{words} Rupees Only"


def generate_invoice_pdf(invoice: Invoice, business: Business) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=30,
        leftMargin=30,
        topMargin=30,
        bottomMargin=30,
    )
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Normal"],
        fontSize=18,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0F766E"),
    )
    bold_style = ParagraphStyle("Bold", parent=styles["Normal"], fontName="Helvetica-Bold", fontSize=9)
    normal_style = ParagraphStyle("NormalText", parent=styles["Normal"], fontSize=9)

    elements = []

    # Header: Business details & Invoice Info
    party = invoice.party
    header_data = [
        [
            Paragraph(f"<b>{business.name}</b><br/>{business.address or ''}<br/>GSTIN: {business.gstin or 'N/A'}<br/>State: {business.state}", normal_style),
            Paragraph(f"<font size=14 color='#0F766E'><b>TAX INVOICE</b></font><br/><b>Invoice No:</b> {invoice.invoice_no}<br/><b>Date:</b> {invoice.date}<br/><b>Type:</b> {invoice.type.upper()}", normal_style),
        ],
        [
            Paragraph(f"<b>Bill To:</b><br/>{party.name if party else 'Cash Customer'}<br/>Phone: {party.phone if party else '-'}<br/>GSTIN: {party.gstin if party and party.gstin else 'N/A'}<br/>State: {party.state if party else business.state}", normal_style),
            Paragraph(f"<b>Payment Status:</b> {invoice.status.upper()}<br/><b>Paid:</b> ₹ {invoice.paid_amount/100:.2f}<br/><b>Balance Due:</b> ₹ {(invoice.total - invoice.paid_amount)/100:.2f}", normal_style),
        ],
    ]
    header_table = Table(header_data, colWidths=[270, 260])
    header_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    elements.append(header_table)
    elements.append(Spacer(1, 15))

    # Items Table
    table_rows = [
        [
            Paragraph("<b>Item Name</b>", bold_style),
            Paragraph("<b>HSN</b>", bold_style),
            Paragraph("<b>Qty</b>", bold_style),
            Paragraph("<b>Rate (₹)</b>", bold_style),
            Paragraph("<b>GST %</b>", bold_style),
            Paragraph("<b>Taxable</b>", bold_style),
            Paragraph("<b>Amount (₹)</b>", bold_style),
        ]
    ]

    for item in invoice.items:
        table_rows.append([
            Paragraph(item.item_name, normal_style),
            Paragraph(item.hsn or "-", normal_style),
            Paragraph(f"{item.qty / 1000:.2f}", normal_style),
            Paragraph(f"{item.rate / 100:.2f}", normal_style),
            Paragraph(f"{item.gst_rate}%", normal_style),
            Paragraph(f"{item.taxable_value / 100:.2f}", normal_style),
            Paragraph(f"{item.amount / 100:.2f}", normal_style),
        ])

    items_table = Table(table_rows, colWidths=[150, 50, 50, 65, 50, 80, 85])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 15))

    # Summary
    words_total = num_to_words_indian(invoice.total // 100)
    summary_data = [
        [Paragraph(f"<b>Amount in Words:</b><br/>{words_total}", normal_style), Paragraph("<b>Subtotal:</b>", normal_style), Paragraph(f"₹ {invoice.subtotal/100:.2f}", normal_style)],
        ["", Paragraph("<b>Discount:</b>", normal_style), Paragraph(f"₹ {invoice.discount/100:.2f}", normal_style)],
        ["", Paragraph("<b>CGST:</b>", normal_style), Paragraph(f"₹ {invoice.cgst/100:.2f}", normal_style)],
        ["", Paragraph("<b>SGST:</b>", normal_style), Paragraph(f"₹ {invoice.sgst/100:.2f}", normal_style)],
        ["", Paragraph("<b>IGST:</b>", normal_style), Paragraph(f"₹ {invoice.igst/100:.2f}", normal_style)],
        ["", Paragraph("<b>Round Off:</b>", normal_style), Paragraph(f"₹ {invoice.round_off/100:.2f}", normal_style)],
        ["", Paragraph("<b>Grand Total:</b>", bold_style), Paragraph(f"<b>₹ {invoice.total/100:.2f}</b>", bold_style)],
    ]
    summary_table = Table(summary_data, colWidths=[310, 110, 110])
    summary_table.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (-1, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 3),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
    ]))
    elements.append(summary_table)

    doc.build(elements)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes

