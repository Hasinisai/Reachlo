from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Business
from app.schemas import BusinessResponse, BusinessUpdate
from app.dependencies import get_current_user

router = APIRouter(prefix="/businesses", tags=["Businesses"])

@router.get("/me", response_model=BusinessResponse)
def get_my_business(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "SELLER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers have a business profile."
        )
        
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found."
        )
    return business

@router.put("/me", response_model=BusinessResponse)
def update_my_business(
    business_in: BusinessUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "SELLER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers have a business profile."
        )
        
    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Business profile not found."
        )
        
    update_data = business_in.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(business, field, value)
        
    db.commit()
    db.refresh(business)
    return business
