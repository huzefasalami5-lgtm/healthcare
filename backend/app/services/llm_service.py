import os
import json
import logging
import httpx
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("curareach.llm")

class LLMService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.is_active = bool(self.api_key)

    async def generate_structured_response(
        self, 
        agent_role: str, 
        prompt: str, 
        fallback_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Attempts to call Google Gemini API if GEMINI_API_KEY is available.
        Otherwise or on any network/format error, safely returns the deterministic fallback data.
        """
        if not self.is_active:
            # Deterministic fallback mode
            fallback_data["llm_mode"] = "deterministic_rule_engine"
            return fallback_data

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={self.api_key}"
            system_instruction = (
                f"You are the {agent_role} in the CuraReach AgentX healthcare network. "
                "You provide clinical decision support for rural and underserved health workers in India. "
                "Output ONLY valid JSON matching the requested schema. Do NOT prescribe medical diagnoses."
            )
            payload = {
                "system_instruction": {"parts": [{"text": system_instruction}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {
                    "response_mime_type": "application/json",
                    "temperature": 0.2
                }
            }
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    parsed = json.loads(raw_text)
                    parsed["llm_mode"] = "live_gemini_api"
                    return parsed
                else:
                    logger.warning(f"LLM API returned {res.status_code}, falling back to deterministic.")
        except Exception as e:
            logger.warning(f"LLM call exception: {e}. Falling back to deterministic engine.")

        fallback_data["llm_mode"] = "fallback_decision_support_mode"
        return fallback_data

llm_service = LLMService()
