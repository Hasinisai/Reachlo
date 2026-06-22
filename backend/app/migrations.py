from sqlalchemy import inspect, text

from app.database import engine
from app import models  # noqa: F401 - register models with Base


def run_migrations() -> None:
    """Apply lightweight schema updates for columns added after initial table creation."""
    inspector = inspect(engine)

    if "campaigns" not in inspector.get_table_names():
        return

    columns = {col["name"] for col in inspector.get_columns("campaigns")}
    alterations = []
    if "price" not in columns:
        alterations.append("ALTER TABLE campaigns ADD COLUMN price FLOAT NULL")
    if "price_min" not in columns:
        alterations.append("ALTER TABLE campaigns ADD COLUMN price_min FLOAT NULL")
    if "image_urls" not in columns:
        alterations.append("ALTER TABLE campaigns ADD COLUMN image_urls TEXT NULL")
    if alterations:
        with engine.begin() as conn:
            for statement in alterations:
                conn.execute(text(statement))
