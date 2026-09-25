"""CuraReach Admin Operations, Hospital Verifications, Subscriptions, and Agent Audits (Section 3E & 11)"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, Role
from app.models.user import User
from app.models.case import ClinicalCase, CaseStatus, UrgencyLevel
from app.models.clinical import ClinicianReview
from app.models.hospital import Hospital
from app.models.referral import Referral
from app.models.billing import SubscriptionPlan, OrganizationSubscription, DemoInvoice
from app.models.audit import AgentExecution, AuditLog
from app.schemas import HospitalVerificationRequest

router = APIRouter(prefix="/admin", tags=["CuraReach Admin Operations"])

@router.get("/metrics")
def get_platform_metrics(
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    total_cases = db.query(ClinicalCase).count()
    active_cases = db.query(ClinicalCase).filter(ClinicalCase.current_state != CaseStatus.CLOSED).count()
    emergency_cases = db.query(ClinicalCase).filter(ClinicalCase.provisional_urgency == UrgencyLevel.EMERGENCY).count()
    
    total_referrals = db.query(Referral).count()
    accepted_referrals = db.query(Referral).filter(Referral.status == "ACCEPTED").count()
    declined_referrals = db.query(Referral).filter(Referral.status == "DECLINED").count()
    
    total_hospitals = db.query(Hospital).count()
    verified_hospitals = db.query(Hospital).filter(Hospital.verification_status == "VERIFIED").count()
    pending_hospitals = db.query(Hospital).filter(Hospital.verification_status == "SUBMITTED").count()
    
    overrides_count = db.query(ClinicianReview).filter(ClinicianReview.is_overridden == True).count()
    agent_runs = db.query(AgentExecution).count()

    return {
        "total_cases": total_cases,
        "active_cases": active_cases,
        "emergency_cases": emergency_cases,
        "total_referrals": total_referrals,
        "accepted_referrals": accepted_referrals,
        "declined_referrals": declined_referrals,
        "referral_success_rate_pct": round((accepted_referrals / total_referrals * 100), 1) if total_referrals > 0 else 100.0,
        "total_hospitals": total_hospitals,
        "verified_hospitals": verified_hospitals,
        "pending_hospital_verifications": pending_hospitals,
        "clinician_overrides": overrides_count,
        "total_agent_executions": agent_runs
    }

@router.get("/hospitals")
def list_admin_hospitals(
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    hospitals = db.query(Hospital).all()
    return [
        {
            "id": h.id,
            "name": h.name,
            "facility_type": h.facility_type,
            "district": h.district,
            "verification_status": h.verification_status,
            "verification_notes": h.verification_notes,
            "total_beds": h.total_beds,
            "available_beds": h.available_beds,
            "has_icu": h.has_icu,
            "has_oxygen_manifold": h.has_oxygen_manifold,
            "contact_email": h.contact_email,
            "contact_phone": h.contact_phone
        } for h in hospitals
    ]

@router.post("/verify-hospital/{hospital_id}")
def verify_hospital(
    hospital_id: str,
    req: HospitalVerificationRequest,
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    """Step 9 / Scenario F: Admin reviews and sets hospital verification status"""
    hosp = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hosp:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hospital not found.")

    hosp.verification_status = req.verification_status
    hosp.verification_notes = req.verification_notes
    if req.verification_status == "VERIFIED":
        hosp.verified_at = datetime.now(timezone.utc)
    db.commit()

    db.add(AuditLog(
        user_id=current_user.id,
        action="UPDATE_HOSPITAL_VERIFICATION",
        resource_type="Hospital",
        resource_id=hosp.id,
        details=f"Status changed to {req.verification_status}. Notes: {req.verification_notes}"
    ))
    db.commit()

    return {"message": f"Hospital status updated to {req.verification_status}.", "hospital_id": hosp.id}

@router.get("/subscriptions")
def list_subscriptions(
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    plans = db.query(SubscriptionPlan).all()
    subs = db.query(OrganizationSubscription).all()
    return {
        "plans": [
            {
                "id": p.id,
                "plan_name": p.plan_name,
                "tier": p.tier,
                "monthly_fee_inr": p.monthly_fee_inr,
                "max_monthly_referrals": p.max_monthly_referrals,
                "analytics_enabled": p.analytics_enabled
            } for p in plans
        ],
        "active_subscriptions": [
            {
                "id": s.id,
                "hospital_name": s.hospital.name if s.hospital else "",
                "plan_name": s.plan.plan_name if s.plan else "",
                "status": s.status,
                "start_date": s.start_date.isoformat() if s.start_date else None,
                "end_date": s.end_date.isoformat() if s.end_date else None
            } for s in subs
        ]
    }

@router.get("/invoices")
def list_invoices(
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    invoices = db.query(DemoInvoice).order_by(DemoInvoice.issued_date.desc()).all()
    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "hospital_name": inv.hospital.name if inv.hospital else "",
            "amount_inr": inv.amount_inr,
            "status": inv.status,
            "issued_date": inv.issued_date.isoformat() if inv.issued_date else None,
            "payment_method": inv.payment_method
        } for inv in invoices
    ]

@router.get("/agent-executions")
def list_agent_executions(
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    executions = db.query(AgentExecution).order_by(AgentExecution.created_at.desc()).limit(25).all()
    return [
        {
            "id": e.id,
            "case_id": e.case_id,
            "agent_name": e.agent_name,
            "status": e.status,
            "input_summary": e.input_summary,
            "output_summary": e.output_summary,
            "duration_ms": e.execution_duration_ms,
            "is_deterministic": e.is_deterministic,
            "timestamp": e.created_at.isoformat() if e.created_at else None
        } for e in executions
    ]

@router.get("/audit-logs")
def list_audit_logs(
    current_user: User = Depends(require_roles(Role.CURAREACH_ADMIN)),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(25).all()
    return [
        {
            "id": l.id,
            "user_id": l.user_id,
            "action": l.action,
            "resource_type": l.resource_type,
            "resource_id": l.resource_id,
            "details": l.details,
            "timestamp": l.timestamp.isoformat() if l.timestamp else None
        } for l in logs
    ]
