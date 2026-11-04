# backend/app/routers/items.py
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Business, Item, StockMovement, StockMovementReason
from app.schemas import ItemCreate, ItemUpdate, ItemOut, StockAdjustRequest
from app.security import require_business_access

router = APIRouter(prefix="/businesses/{business_id}/items", tags=["items"])


@router.post("", response_model=ItemOut)
def create_item(
    item_in: ItemCreate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    item = Item(
        business_id=business.id,
        name=item_in.name,
        hsn=item_in.hsn,
        unit=item_in.unit or "pcs",
        sale_price=item_in.sale_price,
        purchase_price=item_in.purchase_price,
        gst_rate=item_in.gst_rate,
        stock_qty=item_in.stock_qty,
        low_stock_limit=item_in.low_stock_limit,
        is_active=True,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    if item.stock_qty != 0:
        sm = StockMovement(
            business_id=business.id,
            item_id=item.id,
            qty_change=item.stock_qty,
            reason=StockMovementReason.adjustment.value,
            date=date.today(),
        )
        db.add(sm)
        db.commit()

    return item


@router.get("", response_model=list[ItemOut])
def list_items(
    q: Optional[str] = None,
    low_stock: Optional[bool] = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    query = db.query(Item).filter(
        Item.business_id == business.id,
        Item.is_active == True,
    )

    if q:
        query = query.filter(
            (Item.name.ilike(f"%{q}%")) | (Item.hsn.ilike(f"%{q}%"))
        )
    if low_stock:
        query = query.filter(Item.stock_qty <= Item.low_stock_limit)

    items = query.order_by(Item.name.asc()).offset(offset).limit(limit).all()
    return items


@router.get("/{item_id}", response_model=ItemOut)
def get_item(
    item_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.business_id == business.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.put("/{item_id}", response_model=ItemOut)
def update_item(
    item_id: str,
    item_in: ItemUpdate,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.business_id == business.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if item_in.name is not None:
        item.name = item_in.name
    if item_in.hsn is not None:
        item.hsn = item_in.hsn
    if item_in.unit is not None:
        item.unit = item_in.unit
    if item_in.sale_price is not None:
        item.sale_price = item_in.sale_price
    if item_in.purchase_price is not None:
        item.purchase_price = item_in.purchase_price
    if item_in.gst_rate is not None:
        item.gst_rate = item_in.gst_rate
    if item_in.stock_qty is not None:
        item.stock_qty = item_in.stock_qty
    if item_in.low_stock_limit is not None:
        item.low_stock_limit = item_in.low_stock_limit

    db.commit()
    db.refresh(item)
    return item


@router.post("/{item_id}/adjust-stock", response_model=ItemOut)
def adjust_stock(
    item_id: str,
    req: StockAdjustRequest,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.business_id == business.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.stock_qty += req.qty_change
    sm = StockMovement(
        business_id=business.id,
        item_id=item.id,
        qty_change=req.qty_change,
        reason=req.reason or StockMovementReason.adjustment.value,
        date=date.today(),
    )
    db.add(sm)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete_item(
    item_id: str,
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    item = (
        db.query(Item)
        .filter(Item.id == item_id, Item.business_id == business.id)
        .first()
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.is_active = False
    db.commit()
    return {"detail": "Item soft deleted successfully"}

