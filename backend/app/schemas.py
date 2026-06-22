from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime

# --- USER SCHEMAS ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    password: str = Field(..., min_length=8)
    role: str = Field("BUYER", pattern="^(BUYER|SELLER|ADMIN)$")
    city: str
    area: Optional[str] = None
    company_name: Optional[str] = None  # Brand/company name for SELLER accounts

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    city: str
    area: Optional[str] = None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- BUSINESS SCHEMAS ---
class BusinessResponse(BaseModel):
    id: str
    user_id: str
    name: str
    category: str
    sub_category: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    city: str
    area: Optional[str] = None
    website_url: Optional[str] = None
    whatsapp_number: Optional[str] = None
    verified: bool
    rating: float
    rating_count: int
    created_at: datetime

    class Config:
        from_attributes = True

class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    website_url: Optional[str] = None
    whatsapp_number: Optional[str] = None

# --- CAMPAIGN SCHEMAS ---
class CampaignCreate(BaseModel):
    title: str = Field(..., max_length=150)
    description: str
    offer: str = Field(..., max_length=150)
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    cta_type: Optional[str] = None
    cta_value: Optional[str] = None
    city: str
    area: Optional[str] = None
    category: str
    target_audience: Optional[str] = None
    price: Optional[float] = None
    price_min: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    offer: Optional[str] = None
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    cta_type: Optional[str] = None
    cta_value: Optional[str] = None
    city: Optional[str] = None
    area: Optional[str] = None
    category: Optional[str] = None
    target_audience: Optional[str] = None
    price: Optional[float] = None
    price_min: Optional[float] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class CampaignResponse(BaseModel):
    id: str
    business_id: str
    title: str
    description: str
    offer: str
    image_url: Optional[str] = None
    image_urls: Optional[List[str]] = None
    cta_type: Optional[str] = None
    cta_value: Optional[str] = None
    city: str
    area: Optional[str] = None
    category: str
    target_audience: Optional[str] = None
    price: Optional[float] = None
    price_min: Optional[float] = None
    start_date: datetime
    end_date: Optional[datetime] = None
    status: str
    is_boosted: Optional[bool] = False
    boost_until: Optional[datetime] = None
    view_count: Optional[int] = 0
    lead_count: Optional[int] = 0
    created_at: datetime
    business_name: Optional[str] = None
    business_verified: Optional[bool] = False

    class Config:
        from_attributes = True

# --- LEAD SCHEMAS ---
class LeadCreate(BaseModel):
    name: str
    phone: str
    message: Optional[str] = None

class LeadUpdate(BaseModel):
    label: Optional[str] = None
    notes: Optional[str] = None
    is_read: Optional[bool] = None

class LeadResponse(BaseModel):
    id: str
    campaign_id: str
    buyer_id: Optional[str] = None
    name: str
    phone: str
    message: Optional[str] = None
    label: str
    notes: Optional[str] = None
    is_read: bool
    created_at: datetime
    campaign_title: Optional[str] = None

    class Config:
        from_attributes = True

# --- AUTH TOKEN RESPONSE ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user: UserResponse
