import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    phone = Column(String(20), nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="BUYER") # BUYER, SELLER, ADMIN
    city = Column(String(100), nullable=False)
    area = Column(String(100), nullable=True)
    fcm_token = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="user", uselist=False, cascade="all, delete-orphan")
    leads = relationship("Lead", back_populates="buyer", foreign_keys="Lead.buyer_id")
    views = relationship("CampaignView", back_populates="viewer")
    saved_campaigns = relationship("SavedCampaign", back_populates="buyer", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="buyer")


class Business(Base):
    __tablename__ = "businesses"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    name = Column(String(150), nullable=False)
    category = Column(String(100), nullable=False)
    sub_category = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    logo_url = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    area = Column(String(100), nullable=True)
    website_url = Column(String(255), nullable=True)
    whatsapp_number = Column(String(20), nullable=True)
    verified = Column(Boolean, default=False)
    rating = Column(Float, default=0.0)
    rating_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="business")
    campaigns = relationship("Campaign", back_populates="business", cascade="all, delete-orphan")
    ratings = relationship("Rating", back_populates="business", cascade="all, delete-orphan")


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    offer = Column(String(150), nullable=False) # e.g. "Buy 1 Get 1 Free"
    image_url = Column(String(255), nullable=True)
    image_urls = Column(Text, nullable=True)  # JSON array of up to 5 image URLs
    cta_type = Column(String(50), nullable=True) # WhatsApp, Call, Link
    cta_value = Column(String(255), nullable=True)
    city = Column(String(100), nullable=False)
    area = Column(String(100), nullable=True)
    category = Column(String(100), nullable=False)
    target_audience = Column(String(255), nullable=True)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    status = Column(String(20), default="ACTIVE") # ACTIVE, DRAFT, EXPIRED, DELETED
    is_boosted = Column(Boolean, default=False)
    boost_until = Column(DateTime, nullable=True)
    view_count = Column(Integer, default=0)
    lead_count = Column(Integer, default=0)
    price = Column(Float, nullable=True)  # Max price in range
    price_min = Column(Float, nullable=True)  # Min price in range
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="campaigns")
    leads = relationship("Lead", back_populates="campaign", cascade="all, delete-orphan")
    views = relationship("CampaignView", back_populates="campaign", cascade="all, delete-orphan")
    saved_by = relationship("SavedCampaign", back_populates="campaign", cascade="all, delete-orphan")


class Lead(Base):
    __tablename__ = "leads"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    message = Column(Text, nullable=True)
    label = Column(String(20), default="NEW") # NEW, HOT, WARM, COLD
    notes = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="leads")
    buyer = relationship("User", back_populates="leads", foreign_keys=[buyer_id])
    ratings = relationship("Rating", back_populates="lead")


class CampaignView(Base):
    __tablename__ = "campaign_views"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    viewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    campaign = relationship("Campaign", back_populates="views")
    viewer = relationship("User", back_populates="views")


class SavedCampaign(Base):
    __tablename__ = "saved_campaigns"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    buyer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    campaign_id = Column(String(36), ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    saved_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    buyer = relationship("User", back_populates="saved_campaigns")
    campaign = relationship("Campaign", back_populates="saved_by")


class Rating(Base):
    __tablename__ = "ratings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    business_id = Column(String(36), ForeignKey("businesses.id", ondelete="CASCADE"), nullable=False)
    buyer_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    lead_id = Column(String(36), ForeignKey("leads.id", ondelete="SET NULL"), nullable=True)
    score = Column(Integer, nullable=False) # 1 to 5
    review_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    business = relationship("Business", back_populates="ratings")
    buyer = relationship("User", back_populates="ratings")
    lead = relationship("Lead", back_populates="ratings")
