# backend/app/routers/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Business
from app.schemas import DashboardResponse
from app.security import require_business_access
from app.services.report_service import get_dashboard_stats

router = APIRouter(prefix="/businesses/{business_id}/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
def get_dashboard(
    business: Business = Depends(require_business_access),
    db: Session = Depends(get_db),
):
    stats = get_dashboard_stats(db, business)
    return stats

