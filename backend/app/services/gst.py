# backend/app/services/gst.py
from decimal import Decimal, ROUND_HALF_UP


def round_half_up(value: Decimal) -> int:
    """
    Rounds a Decimal value to the nearest integer paise using ROUND_HALF_UP.
    """
    return int(value.quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def calculate_line(
    qty: int, rate: int, discount: int, gst_rate: int, same_state: bool
) -> dict:
    """
    Calculates line level taxes in INTEGER PAISE.
    qty: thousandths (1000 = 1.000 items)
    rate: paise per 1.000 unit (1000 qty)
    discount: paise
    gst_rate: integer percentage (0, 5, 12, 18, 28)
    same_state: boolean (CGST+SGST vs IGST)

    Returns:
    {
      "taxable_value": int (paise),
      "cgst": int,
      "sgst": int,
      "igst": int,
      "amount": int
    }
    """
    qty_dec = Decimal(qty) / Decimal(1000)
    rate_dec = Decimal(rate)
    gross = qty_dec * rate_dec
    taxable_dec = max(Decimal(0), gross - Decimal(discount))
    taxable_value = round_half_up(taxable_dec)

    total_tax_dec = (Decimal(taxable_value) * Decimal(gst_rate)) / Decimal(100)
    total_tax = round_half_up(total_tax_dec)

    cgst = 0
    sgst = 0
    igst = 0

    if same_state:
        # Split equally. Handle odd paise: cgst = total_tax // 2, sgst = total_tax - cgst
        cgst = total_tax // 2
        sgst = total_tax - cgst
    else:
        igst = total_tax

    amount = taxable_value + total_tax
    return {
        "taxable_value": taxable_value,
        "cgst": cgst,
        "sgst": sgst,
        "igst": igst,
        "amount": amount,
    }


def calculate_round_off(unrounded_total: int) -> tuple[int, int]:
    """
    Calculates invoice-level round_off to the nearest rupee (100 paise).
    Returns (round_off_paise, rounded_total_paise).
    Rounding half-up to nearest 100 paise:
    remainder = unrounded_total % 100
    If remainder >= 50: add (100 - remainder)
    If remainder < 50: subtract remainder
    """
    remainder = unrounded_total % 100
    if remainder >= 50:
        round_off = 100 - remainder
    else:
        round_off = -remainder
    rounded_total = unrounded_total + round_off
    return round_off, rounded_total

