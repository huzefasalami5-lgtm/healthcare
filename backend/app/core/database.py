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
        tables = inspector.get_table_names()
        
        # 1. Ensure patient_profiles columns
        if "patient_profiles" in tables:
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

        # 2. Ensure medical_records columns
        if "medical_records" in tables:
            mr_cols = [c["name"] for c in inspector.get_columns("medical_records")]
            new_mr_cols = [
                ("doctor_id", "VARCHAR(36)"),
                ("visit_date", "VARCHAR(50)"),
                ("symptoms", "TEXT"),
                ("diagnosis", "TEXT"),
                ("treatment", "TEXT"),
                ("doctor_notes", "TEXT"),
                ("follow_up_date", "VARCHAR(50)"),
                ("updated_at", "DATETIME")
            ]
            for col_name, col_type in new_mr_cols:
                if col_name not in mr_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE medical_records ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception:
                        pass

        # 3. Ensure prescriptions columns
        if "prescriptions" in tables:
            rx_cols = [c["name"] for c in inspector.get_columns("prescriptions")]
            new_rx_cols = [
                ("doctor_id", "VARCHAR(36)"),
                ("medicine_name", "VARCHAR(255)"),
                ("dosage", "VARCHAR(100)"),
                ("frequency", "VARCHAR(100)"),
                ("duration", "VARCHAR(100)"),
                ("instructions", "TEXT"),
                ("prescription_date", "VARCHAR(50)"),
                ("created_at", "DATETIME")
            ]
            for col_name, col_type in new_rx_cols:
                if col_name not in rx_cols:
                    try:
                        conn.execute(text(f"ALTER TABLE prescriptions ADD COLUMN {col_name} {col_type}"))
                        conn.commit()
                    except Exception:
                        pass

        # 4. Ensure appointments columns and nullable constraints
        if "appointments" in tables:
            referral_col = next((c for c in inspector.get_columns("appointments") if c["name"] == "referral_id"), None)
            if referral_col and not referral_col.get("nullable", True) and "sqlite" in str(engine.url):
                try:
                    conn.execute(text("ALTER TABLE appointments RENAME TO _appointments_old"))
                    conn.commit()
                    Base.metadata.tables["appointments"].create(bind=engine)
                    conn.execute(text("""
                        INSERT INTO appointments (id, referral_id, case_id, hospital_id, scheduled_at, department_name, doctor_name, status, arrival_status, consultation_notes, discharge_instructions, attendance_logged_at, created_at)
                        SELECT id, referral_id, case_id, hospital_id, scheduled_at, department_name, doctor_name, status, arrival_status, consultation_notes, discharge_instructions, attendance_logged_at, created_at FROM _appointments_old
                    """))
                    conn.commit()
                    conn.execute(text("DROP TABLE _appointments_old"))
                    conn.commit()
                except Exception:
                    pass
            else:
                app_cols = [c["name"] for c in inspector.get_columns("appointments")]
                new_app_cols = [
                    ("patient_id", "VARCHAR(36)"),
                    ("doctor_id", "VARCHAR(36)"),
                    ("appointment_date", "VARCHAR(50)"),
                    ("appointment_time", "VARCHAR(50)"),
                    ("reason", "TEXT"),
                    ("notes", "TEXT"),
                    ("updated_at", "DATETIME")
                ]
                for col_name, col_type in new_app_cols:
                    if col_name not in app_cols:
                        try:
                            conn.execute(text(f"ALTER TABLE appointments ADD COLUMN {col_name} {col_type}"))
                            conn.commit()
                        except Exception:
                            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
