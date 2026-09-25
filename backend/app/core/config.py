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
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./curareach360.db")
    
    # Private Storage
    STORAGE_DIR: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 
        "uploads", 
        "private"
    )
    MAX_IMAGE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_IMAGE_MIMES: list[str] = ["image/jpeg", "image/png", "image/webp"]
    
    # AI Engine
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    DEMO_MODE: bool = True  # Guaranteed 100% deterministic seed responses without external API keys
    
    # Server
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")

settings = Settings()

# Ensure private storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
