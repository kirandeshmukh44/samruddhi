# backend/app/routers/businesses.py
import re
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Business, User, UserPlan
from app.schemas import BusinessCreate, BusinessUpdate, BusinessOut
from app.security import get_current_user, require_business_access

router = APIRouter(prefix="/businesses", tags=["businesses"])

GSTIN_REGEX = r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$"


def validate_gstin_format(gstin: str):
    if gstin and not re.match(GSTIN_REGEX, gstin):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid GSTIN format (must be 15 characters, e.g. 27ABCDE1234F1Z5)",
        )


@router.post("", response_model=BusinessOut)
def create_business(
    bus_in: BusinessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if bus_in.gstin:
        validate_gstin_format(bus_in.gstin)

    # Free plan enforcement: maximum 1 business
    if current_user.plan == UserPlan.free.value:
        count = db.query(Business).filter(Business.owner_id == current_user.id).count()
        if count >= 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Free plan limit reached: maximum 1 business allowed. Upgrade to premium for unlimited businesses.",
            )

    new_bus = Business(
        owner_id=current_user.id,
        name=bus_in.name,
        gstin=bus_in.gstin,
        address=bus_in.address,
        state=bus_in.state,
        phone=bus_in.phone,
        invoice_prefix=bus_in.invoice_prefix or "INV",
    )
    db.add(new_bus)
    db.commit()
    db.refresh(new_bus)
    return new_bus


@router.get("", response_model=list[BusinessOut])
def list_my_businesses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    businesses = (
        db.query(Business)
        .filter(Business.owner_id == current_user.id)
        .order_by(Business.created_at.asc())
        .all()
    )
    return businesses


@router.get("/{business_id}", response_model=BusinessOut)
def get_business(
    business: Business = Depends(require_business_access),
):
    return business


@router.put("/{business_id}", response_model=BusinessOut)
def update_business(
    update_in: BusinessUpdate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    if update_in.gstin is not None:
        if update_in.gstin:
            validate_gstin_format(update_in.gstin)
        business.gstin = update_in.gstin

    if update_in.name is not None:
        business.name = update_in.name
    if update_in.address is not None:
        business.address = update_in.address
    if update_in.state is not None:
        business.state = update_in.state
    if update_in.phone is not None:
        business.phone = update_in.phone
    if update_in.invoice_prefix is not None:
        business.invoice_prefix = update_in.invoice_prefix

    db.commit()
    db.refresh(business)
    return business

