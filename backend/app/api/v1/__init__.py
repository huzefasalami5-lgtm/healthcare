"""API v1 Master Router Assembly"""
from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.cases import router as cases_router
from app.api.v1.intake import router as intake_router
from app.api.v1.images import router as images_router
from app.api.v1.triage import router as triage_router
from app.api.v1.facilities import router as facilities_router
from app.api.v1.referrals import router as referrals_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.followup import router as followup_router
from app.api.v1.community import router as community_router
from app.api.v1.hospitals import router as hospitals_router
from app.api.v1.admin import router as admin_router
from app.api.v1.demo import router as demo_router
from app.api.v1.medical_history import router as medical_history_router
from app.api.v1.medical_records import router as medical_records_router
from app.api.v1.prescriptions import router as prescriptions_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.lifelink import router as lifelink_router

api_v1_router = APIRouter(prefix="/v1")

api_v1_router.include_router(auth_router)
api_v1_router.include_router(cases_router)
api_v1_router.include_router(intake_router)
api_v1_router.include_router(images_router)
api_v1_router.include_router(triage_router)
api_v1_router.include_router(facilities_router)
api_v1_router.include_router(referrals_router)
api_v1_router.include_router(appointments_router)
api_v1_router.include_router(followup_router)
api_v1_router.include_router(community_router)
api_v1_router.include_router(hospitals_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(demo_router)
api_v1_router.include_router(medical_history_router)
api_v1_router.include_router(medical_records_router)
api_v1_router.include_router(prescriptions_router)
api_v1_router.include_router(transactions_router)
api_v1_router.include_router(lifelink_router)

