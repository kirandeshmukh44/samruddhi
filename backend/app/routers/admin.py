# backend/app/routers/admin.py
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import User, Business, Invoice, UserRole
from app.schemas import UserOut, AdminUserPatch, AdminStats, BusinessOut
from app.security import require_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users")
def list_all_users(
    q: Optional[str] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    query = db.query(User)
    if q:
        query = query.filter(
            (User.name.ilike(f"%{q}%")) | (User.email.ilike(f"%{q}%")) | (User.phone.ilike(f"%{q}%"))
        )

    users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()

    result = []
    for u in users:
        bus_count = db.query(Business).filter(Business.owner_id == u.id).count()
        u_dict = UserOut.model_validate(u).model_dump()
        u_dict["business_count"] = bus_count
        result.append(u_dict)

    return result


@router.patch("/users/{user_id}", response_model=UserOut)
def patch_user(
    user_id: str,
    patch_in: AdminUserPatch,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if patch_in.is_active is not None:
        user.is_active = patch_in.is_active
    if patch_in.plan is not None:
        if patch_in.plan not in ("free", "premium"):
            raise HTTPException(status_code=400, detail="Plan must be free or premium")
        user.plan = patch_in.plan

    db.commit()
    db.refresh(user)
    return user


@router.get("/businesses", response_model=list[BusinessOut])
def list_all_businesses(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    return db.query(Business).order_by(Business.created_at.desc()).all()


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    today = date.today()
    total_users = db.query(User).count()
    total_businesses = db.query(Business).count()
    premium_users = db.query(User).filter(User.plan == "premium").count()

    total_invoices_this_month = (
        db.query(func.count(Invoice.id))
        .filter(
            func.extract("year", Invoice.date) == today.year,
            func.extract("month", Invoice.date) == today.month,
        )
        .scalar()
        or 0
    )

    return AdminStats(
        total_users=total_users,
        total_businesses=total_businesses,
        total_invoices_this_month=total_invoices_this_month,
        premium_users=premium_users,
    )

