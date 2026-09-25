"""CuraReach 360 - Configuration Module
Tagline: Predict the Gap. Adapt the Pathway. Complete the Care.
Team ID: AX26-202
"""
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "CuraReach 360"
    TAGLINE: str = "Predict the Gap. Adapt the Pathway. Complete the Care."
    TEAM_ID: str = "AX26-202"
    TEAM_MEMBERS: list[str] = [
        "Huzefa Salami (Team Lead)",
        "MD Muneeb",
        "Mohammed Uzair",
        "G Sumith Reddy"
    ]
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "curareach-360-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours for seamless judging & demo
    
    # Database
    is_vercel: bool = bool(os.getenv("VERCEL"))
    
    @property
    def get_database_url(self) -> str:
        if self.is_vercel:
            import shutil
            tmp_db = "/tmp/curareach360.db"
            if not os.path.exists(tmp_db):
                base_db = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "curareach360.db")
                if os.path.exists(base_db):
                    try:
                        shutil.copy2(base_db, tmp_db)
                    except Exception:
                        pass
            return os.getenv("DATABASE_URL", f"sqlite:///{tmp_db}")
        return os.getenv("DATABASE_URL", "sqlite:///./curareach360.db")

    DATABASE_URL: str = os.getenv("DATABASE_URL", (
        "/tmp/curareach360.db" if os.getenv("VERCEL") else "sqlite:///./curareach360.db"
    ) if not os.getenv("VERCEL") else f"sqlite:////tmp/curareach360.db")
    
    # Private Storage
    STORAGE_DIR: str = "/tmp/uploads/private" if os.getenv("VERCEL") else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "uploads", 
        "private"
    )
    MAX_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_MIMES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    ALLOWED_DOC_MIMES: list[str] = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"]
    
    # AI Engine
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEMO_MODE: bool = True  # Guaranteed 100% deterministic seed responses without external API keys
    
    # Server
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()

# Ensure private storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
