import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

def _get_engine():
    try:
        print("Attempting to connect to primary database...")
        eng = create_engine(
            settings.DATABASE_URL,
            pool_pre_ping=True,
            pool_recycle=280,
            connect_args={'connect_timeout': 5}
        )
        # Test the connection to fail fast if unreachable
        with eng.connect() as conn:
            pass
        print("Successfully connected to primary database.")
        return eng
    except Exception as e:
        print(f"Primary database connection failed: {e}")
        print("Falling back to local SQLite database (local_fallback.db)...")
        sqlite_url = "sqlite:///./local_fallback.db"
        return create_engine(sqlite_url, connect_args={"check_same_thread": False})

# Create engine
engine = _get_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
