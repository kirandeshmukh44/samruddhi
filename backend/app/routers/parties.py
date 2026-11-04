# backend/app/routers/parties.py
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Business, Party, Invoice, Payment
from app.schemas import PartyCreate, PartyUpdate, PartyOut, InvoiceOut, PaymentOut
from app.security import require_business_access
from app.services.report_service import get_party_outstanding

router = APIRouter(prefix="/businesses/{business_id}/parties", tags=["parties"])


@router.post("", response_model=PartyOut)
def create_party(
    party_in: PartyCreate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    party = Party(
        business_id=business.id,
        name=party_in.name,
        phone=party_in.phone,
        gstin=party_in.gstin,
        state=party_in.state or business.state,
        type=party_in.type,
        opening_balance=party_in.opening_balance,
        is_active=True,
    )
    db.add(party)
    db.commit()
    db.refresh(party)

    party_out = PartyOut.model_validate(party)
    party_out.outstanding_balance = get_party_outstanding(db, party)
    return party_out


@router.get("", response_model=list[PartyOut])
def list_parties(
    q: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    query = db.query(Party).filter(
        Party.business_id == business.id,
        Party.is_active == True,
    )

    if q:
        query = query.filter(
            (Party.name.ilike(f"%{q}%")) | (Party.phone.ilike(f"%{q}%"))
        )
    if type:
        query = query.filter(Party.type == type)

    parties = query.order_by(Party.name.asc()).offset(offset).limit(limit).all()

    result = []
    for p in parties:
        p_out = PartyOut.model_validate(p)
        p_out.outstanding_balance = get_party_outstanding(db, p)
        result.append(p_out)

    return result


@router.get("/{party_id}")
def get_party_details(
    party_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    party = (
        db.query(Party)
        .filter(Party.id == party_id, Party.business_id == business.id)
        .first()
    )
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    p_out = PartyOut.model_validate(party)
    p_out.outstanding_balance = get_party_outstanding(db, party)

    invoices = (
        db.query(Invoice)
        .filter(Invoice.party_id == party.id)
        .order_by(Invoice.date.desc())
        .all()
    )
    payments = (
        db.query(Payment)
        .filter(Payment.party_id == party.id)
        .order_by(Payment.date.desc())
        .all()
    )

    return {
        "party": p_out,
        "invoices": [InvoiceOut.model_validate(i) for i in invoices],
        "payments": [PaymentOut.model_validate(p) for p in payments],
    }


@router.put("/{party_id}", response_model=PartyOut)
def update_party(
    party_id: str,
    party_in: PartyUpdate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    party = (
        db.query(Party)
        .filter(Party.id == party_id, Party.business_id == business.id)
        .first()
    )
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    if party_in.name is not None:
        party.name = party_in.name
    if party_in.phone is not None:
        party.phone = party_in.phone
    if party_in.gstin is not None:
        party.gstin = party_in.gstin
    if party_in.state is not None:
        party.state = party_in.state
    if party_in.type is not None:
        party.type = party_in.type
    if party_in.opening_balance is not None:
        party.opening_balance = party_in.opening_balance

    db.commit()
    db.refresh(party)

    p_out = PartyOut.model_validate(party)
    p_out.outstanding_balance = get_party_outstanding(db, party)
    return p_out


@router.delete("/{party_id}")
def delete_party(
    party_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    party = (
        db.query(Party)
        .filter(Party.id == party_id, Party.business_id == business.id)
        .first()
    )
    if not party:
        raise HTTPException(status_code=404, detail="Party not found")

    # Soft delete
    party.is_active = False
    db.commit()
    return {"detail": "Party soft deleted successfully"}

