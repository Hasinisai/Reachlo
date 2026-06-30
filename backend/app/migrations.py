from sqlalchemy import inspect, text

from app.database import engine
from app import models  # noqa: F401 - register models with Base


def run_migrations() -> None:
    """Apply lightweight schema updates for columns added after initial table creation."""
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    alterations = []

    if "users" in table_names:
        columns = {col["name"] for col in inspector.get_columns("users")}
        if "area" not in columns:
            alterations.append("ALTER TABLE users ADD COLUMN area VARCHAR(100) NULL")
        if "fcm_token" not in columns:
            alterations.append("ALTER TABLE users ADD COLUMN fcm_token VARCHAR(255) NULL")

    if "campaigns" in table_names:
        columns = {col["name"] for col in inspector.get_columns("campaigns")}
        if "price" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN price FLOAT NULL")
        if "price_min" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN price_min FLOAT NULL")
        if "image_urls" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN image_urls TEXT NULL")
        if "location_address" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN location_address TEXT NULL")
        if "latitude" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN latitude FLOAT NULL")
        if "longitude" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN longitude FLOAT NULL")
        # Add Google Place ID
        if "google_place_id" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN google_place_id VARCHAR(255) NULL")
        if "view_count" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN view_count INT NULL DEFAULT 0")
        if "lead_count" not in columns:
            alterations.append("ALTER TABLE campaigns ADD COLUMN lead_count INT NULL DEFAULT 0")
        alterations.append("UPDATE campaigns SET view_count = 0 WHERE view_count IS NULL")
        alterations.append("UPDATE campaigns SET lead_count = 0 WHERE lead_count IS NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN view_count INT NOT NULL DEFAULT 0")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN lead_count INT NOT NULL DEFAULT 0")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN cta_type VARCHAR(50) NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN city VARCHAR(100) NOT NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN area VARCHAR(100) NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN category VARCHAR(150) NOT NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN target_audience VARCHAR(255) NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN status VARCHAR(20) NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN start_date DATETIME NOT NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN end_date DATETIME NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN boost_until DATETIME NULL")
        # Ensure latitude/longitude use DECIMAL with sufficient precision for storage
        try:
            existing_indexes = {idx['name'] for idx in inspector.get_indexes('campaigns')}
        except Exception:
            existing_indexes = set()

        # Convert latitude/longitude to DECIMAL if needed (safe attempt)
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN latitude DECIMAL(10,8) NULL")
        alterations.append("ALTER TABLE campaigns MODIFY COLUMN longitude DECIMAL(11,8) NULL")

        # Add indexes for faster proximity queries
        if 'idx_campaigns_latitude' not in existing_indexes:
            alterations.append("CREATE INDEX idx_campaigns_latitude ON campaigns (latitude)")
        if 'idx_campaigns_longitude' not in existing_indexes:
            alterations.append("CREATE INDEX idx_campaigns_longitude ON campaigns (longitude)")
        if 'idx_campaigns_status' not in existing_indexes:
            alterations.append("CREATE INDEX idx_campaigns_status ON campaigns (status)")

    if "campaign_views" in table_names:
        columns = {col["name"] for col in inspector.get_columns("campaign_views")}
        if "viewer_id" not in columns:
            alterations.append("ALTER TABLE campaign_views ADD COLUMN viewer_id VARCHAR(10) NULL")
        if "created_at" not in columns:
            alterations.append("ALTER TABLE campaign_views ADD COLUMN created_at DATETIME NULL")
        if "viewer_ip" in columns:
            alterations.append("ALTER TABLE campaign_views MODIFY COLUMN viewer_ip VARCHAR(45) NULL")

    if alterations:
        with engine.begin() as conn:
            for statement in alterations:
                conn.execute(text(statement))
