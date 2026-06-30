from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Business
from app.schemas import UserRegister, UserLogin, Token
from app.security import get_password_hash, verify_password, create_access_token
from app.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already registered."
        )

    # Create new user
    hashed_password = get_password_hash(user_in.password)
    new_user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        phone=user_in.phone,
        password_hash=hashed_password,
        role=user_in.role,
        city=user_in.city,
        area=user_in.area,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    new_user = db.query(User).filter(User.email == user_in.email.lower()).first()

    # If the user is a SELLER, auto-initialize a default business profile for them
    if new_user.role == "SELLER":
        # Use company_name if provided, fallback to user's name
        business_name = (user_in.company_name or '').strip() or f"{new_user.name}'s Business"
        new_business = Business(
            user_id=new_user.id,
            name=business_name,
            category="Other",
            city=new_user.city,
            area=new_user.area,
            verified=False,
            rating=0.0,
            rating_count=0
        )
        db.add(new_business)
        db.commit()

    # Generate token
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role,
        "user": new_user
    }

@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated."
        )

    # Generate token
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user": user
    }

@router.get("/me", response_model=Token)
def get_me(current_user: User = Depends(get_current_user)):
    # Simply regenerate/return current status
    access_token = create_access_token(data={"sub": current_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": current_user.role,
        "user": current_user
    }


from pydantic import BaseModel as PydanticBaseModel

class ResetPasswordRequest(PydanticBaseModel):
    email: str
    new_password: str

@router.post("/reset-password", status_code=200)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address."
        )
    
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters."
        )
    
    user.password_hash = get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully."}
