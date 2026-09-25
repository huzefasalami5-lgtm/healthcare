"""CuraReach AgentX - Application Configuration"""
import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "CuraReach AgentX"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    PORT: int = int(os.getenv("PORT", "8000"))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    FALLBACK_MODE: bool = os.getenv("GEMINI_API_KEY", "") == ""

settings = Settings()
