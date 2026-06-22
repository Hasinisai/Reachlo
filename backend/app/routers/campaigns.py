import json
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import User, Business, Campaign, CampaignView
from app.schemas import CampaignCreate, CampaignUpdate, CampaignResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/campaigns", tags=["Campaigns"])


def _parse_stored_image_urls(campaign: Campaign) -> list[str]:
    urls: list[str] = []
    if campaign.image_urls:
        try:
            parsed = json.loads(campaign.image_urls)
            if isinstance(parsed, list):
                urls = [u for u in parsed if u]
        except json.JSONDecodeError:
            pass
    if not urls and campaign.image_url:
        urls = [campaign.image_url]
    return urls[:5]


def _normalize_image_urls(image_url: Optional[str], image_urls: Optional[list[str]]) -> tuple[Optional[str], Optional[str], list[str]]:
    urls = [u for u in (image_urls or []) if u]
    if image_url and image_url not in urls:
        urls.insert(0, image_url)
    urls = urls[:5]
    primary = urls[0] if urls else image_url
    stored = json.dumps(urls) if urls else None
    return primary, stored, urls


def _enrich_campaign_response(campaign: Campaign, business: Optional[Business] = None) -> CampaignResponse:
    urls = _parse_stored_image_urls(campaign)
    biz = business or campaign.business

    # Build response manually — DB stores image_urls as JSON text, not a Python list
    res = CampaignResponse(
        id=campaign.id,
        business_id=campaign.business_id,
        title=campaign.title,
        description=campaign.description,
        offer=campaign.offer,
        image_url=urls[0] if urls else campaign.image_url,
        image_urls=urls,
        cta_type=campaign.cta_type,
        cta_value=campaign.cta_value,
        city=campaign.city,
        area=campaign.area,
        category=campaign.category,
        target_audience=campaign.target_audience,
        price=campaign.price,
        price_min=campaign.price_min,
        start_date=campaign.start_date,
        end_date=campaign.end_date,
        status=campaign.status,
        is_boosted=campaign.is_boosted,
        boost_until=campaign.boost_until,
        view_count=campaign.view_count or 0,
        lead_count=campaign.lead_count or 0,
        created_at=campaign.created_at,
        business_name=biz.name if biz else "Unknown Business",
        business_verified=bool(biz.verified) if biz else False,
    )
    return res


@router.get("", response_model=List[CampaignResponse])
def get_campaigns(
    category: Optional[str] = None,
    city: Optional[str] = None,
    seller_mode: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    query = db.query(Campaign).join(Business)

    if seller_mode:
        if not current_user or current_user.role != "SELLER":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only sellers can view campaigns in seller mode."
            )
        business = db.query(Business).filter(Business.user_id == current_user.id).first()
        if not business:
            return []

        query = query.filter(
            Campaign.business_id == business.id
        )
    else:
        query = query.filter(
            Campaign.status == "ACTIVE",
            Campaign.image_url.isnot(None),
            Campaign.image_url != "",
        )

        if category and category != "All":
            query = query.filter(Campaign.category == category)
        if city:
            query = query.filter(Campaign.city == city)

    campaigns = query.order_by(Campaign.is_boosted.desc(), Campaign.created_at.desc()).all()

    return [_enrich_campaign_response(c) for c in campaigns]


@router.post("/filter-active", response_model=List[str])
def filter_active_campaigns(
    campaign_ids: List[str],
    db: Session = Depends(get_db)
):
    """Takes a list of campaign IDs and returns only those that are still ACTIVE."""
    active_ids = db.query(Campaign.id).filter(
        Campaign.id.in_(campaign_ids),
        Campaign.status == "ACTIVE"
    ).all()
    return [r[0] for r in active_ids]


@router.post("", response_model=CampaignResponse, status_code=status.HTTP_201_CREATED)
def create_campaign(
    campaign_in: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "SELLER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can create campaigns."
        )

    business = db.query(Business).filter(Business.user_id == current_user.id).first()
    if not business:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller business profile not found."
        )

    primary_url, stored_urls, _ = _normalize_image_urls(campaign_in.image_url, campaign_in.image_urls)

    new_campaign = Campaign(
        business_id=business.id,
        title=campaign_in.title,
        description=campaign_in.description,
        offer=campaign_in.offer,
        image_url=primary_url,
        image_urls=stored_urls,
        cta_type=campaign_in.cta_type or "WhatsApp",
        cta_value=campaign_in.cta_value or business.whatsapp_number or current_user.phone,
        city=campaign_in.city or business.city,
        area=campaign_in.area or business.area,
        category=campaign_in.category or business.category,
        target_audience=campaign_in.target_audience,
        price=campaign_in.price,
        price_min=campaign_in.price_min,
        start_date=campaign_in.start_date or datetime.utcnow(),
        end_date=campaign_in.end_date,
        status="ACTIVE"
    )

    db.add(new_campaign)
    db.commit()
    db.refresh(new_campaign)

    return _enrich_campaign_response(new_campaign, business)


@router.put("/{id}", response_model=CampaignResponse)
def update_campaign(
    id: str,
    campaign_in: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found."
        )

    business = db.query(Business).filter(Business.id == campaign.business_id).first()
    if not business or business.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this campaign's business profile."
        )

    update_data = campaign_in.dict(exclude_unset=True)

    if "image_urls" in update_data or "image_url" in update_data:
        incoming_urls = update_data.pop("image_urls", None)
        incoming_primary = update_data.pop("image_url", campaign.image_url)
        primary_url, stored_urls, _ = _normalize_image_urls(incoming_primary, incoming_urls)
        campaign.image_url = primary_url
        campaign.image_urls = stored_urls

    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)

    return _enrich_campaign_response(campaign, business)


@router.delete("/{id}", response_model=CampaignResponse)
def delete_campaign(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found."
        )

    business = db.query(Business).filter(Business.id == campaign.business_id).first()
    if not business or business.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not own this campaign's business profile."
        )

    campaign.status = "DELETED"
    db.commit()
    db.refresh(campaign)

    return _enrich_campaign_response(campaign, business)


@router.post("/{id}/view", response_model=CampaignResponse)
def track_campaign_view(
    id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    campaign = db.query(Campaign).filter(Campaign.id == id).first()
    if not campaign:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Campaign not found."
        )

    if current_user:
        existing_view = db.query(CampaignView).filter(
            CampaignView.campaign_id == campaign.id,
            CampaignView.viewer_id == current_user.id
        ).first()
        if not existing_view:
            campaign.view_count += 1
            db.add(CampaignView(
                campaign_id=campaign.id,
                viewer_id=current_user.id
            ))

    db.commit()
    db.refresh(campaign)

    business = db.query(Business).filter(Business.id == campaign.business_id).first()
    return _enrich_campaign_response(campaign, business)
