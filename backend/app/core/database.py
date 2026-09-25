"""Database setup using SQLAlchemy 2.0 and SQLite"""
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)

from sqlalchemy import event

@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    if "sqlite" in settings.DATABASE_URL:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def ensure_database_schema():
    """Ensure all tables and enhanced columns exist in the database without data loss"""
    import app.models  # noqa: F401 - ensure all ORM models are registered
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        inspector = inspect(engine)
        if "patient_profiles" in inspector.get_table_names():
            existing_cols = [c["name"] for c in inspector.get_columns("patient_profiles")]
            new_cols = [
                ("patient_identifier", "VARCHAR(50)"),
                ("blood_group", "VARCHAR(10) DEFAULT 'O+'"),
                ("state", "VARCHAR(100) DEFAULT 'Karnataka'"),
                ("pincode", "VARCHAR(20) DEFAULT '577201'"),
                ("emergency_contact_name", "VARCHAR(100)"),
                ("emergency_contact_relation", "VARCHAR(50) DEFAULT 'Family Member'"),
                ("primary_language", "VARCHAR(50) DEFAULT 'English'"),
                ("abha_id", "VARCHAR(50)")
            ]
            for col_name, col_type in new_cols:
                if col_name not in existing_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE patient_profiles ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception:
                        pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
