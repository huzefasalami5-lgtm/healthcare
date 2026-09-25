"""Base Agent definition with schema validation and auditable execution logging"""
import time
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.models.audit import AgentExecution
from app.core.config import settings

class BaseAgent:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    def log_execution(
        self,
        case_id: Optional[str],
        input_summary: str,
        output_summary: str,
        duration_ms: int,
        is_deterministic: bool,
        db: Optional[Session] = None
    ) -> None:
        if db is not None:
            exec_log = AgentExecution(
                case_id=case_id,
                agent_name=self.name,
                status="SUCCESS",
                input_summary=input_summary[:1000],
                output_summary=output_summary[:1000],
                execution_duration_ms=duration_ms,
                is_deterministic=is_deterministic,
                created_at=datetime.now(timezone.utc)
            )
            db.add(exec_log)
            db.commit()
