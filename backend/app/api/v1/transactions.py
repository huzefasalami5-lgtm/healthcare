"""Patient Treatment Invoicing and Financial Transactions API Endpoints
STRICT SEPARATION: Hospital clinical treatment charges are completely separated from 
CuraReach B2B software subscriptions (which are handled in billing.py).
All payments are clearly marked as simulated.
"""
import random
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, Role
from app.models.user import User, PatientProfile
from app.models.treatment_billing import (
    PatientTreatmentTransaction,
    TransactionType,
    PaymentStatus,
    PaymentMethod
)
from app.models.hospital import Hospital
from app.models.audit import AuditLog
from app.schemas import TreatmentInvoiceCreate, RecordPaymentRequest, ProcessRefundRequest

router = APIRouter(prefix="/transactions", tags=["Patient Treatment Billing & Transactions"])

def generate_invoice_number(db: Session) -> str:
    count = db.query(PatientTreatmentTransaction).count() + 1
    return f"INV-MED-2026-{count:04d}"

def generate_txn_ref(method: str) -> str:
    num = random.randint(10000000, 99999999)
    prefix = method.upper() if method else "SIM"
    return f"TXN-{prefix}-{num}"

def resolve_patient_profile(patient_id: str, current_user: User, db: Session) -> PatientProfile:
    if patient_id == "me":
        if not current_user.patient_profile:
            raise HTTPException(status_code=400, detail="Current user does not have a patient profile.")
        return current_user.patient_profile

    profile = db.query(PatientProfile).filter(PatientProfile.id == patient_id).first()
    if not profile:
        profile = db.query(PatientProfile).filter(PatientProfile.user_id == patient_id).first()
    if not profile:
        profile = db.query(PatientProfile).filter(PatientProfile.patient_identifier == patient_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found.")
    return profile

@router.get("/patient/{patient_id}")
def list_patient_transactions(
    patient_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all clinical treatment invoices and payments for a patient"""
    profile = resolve_patient_profile(patient_id, current_user, db)
    
    txns = db.query(PatientTreatmentTransaction).filter(
        PatientTreatmentTransaction.patient_id == profile.id
    ).order_by(PatientTreatmentTransaction.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "invoice_number": t.invoice_number,
            "patient_id": t.patient_id,
            "patient_identifier": profile.patient_identifier,
            "patient_name": profile.user.full_name if profile.user else "Patient",
            "hospital_name": t.hospital.name if t.hospital else "CuraReach Health Network",
            "case_id": t.case_id,
            "appointment_id": t.appointment_id,
            "transaction_type": t.transaction_type,
            "item_description": t.item_description,
            "amount_inr": t.amount_inr,
            "discount_inr": t.discount_inr,
            "net_amount_inr": t.net_amount_inr,
            "payment_status": t.payment_status,
            "payment_method": t.payment_method,
            "transaction_reference": t.transaction_reference,
            "is_simulated": t.is_simulated,
            "notes": t.notes,
            "payment_date": t.payment_date.strftime("%Y-%m-%d %H:%M") if t.payment_date else None,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for t in txns
    ]

@router.get("")
def list_all_treatment_transactions(
    hospital_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Hospital Staff and Admin view of clinical billing transactions"""
    query = db.query(PatientTreatmentTransaction)
    
    if hospital_id:
        query = query.filter(PatientTreatmentTransaction.hospital_id == hospital_id)
    elif current_user.role == Role.HOSPITAL_STAFF and current_user.organization_id:
        query = query.filter(PatientTreatmentTransaction.hospital_id == current_user.organization_id)
        
    if status:
        query = query.filter(PatientTreatmentTransaction.payment_status == status)
        
    txns = query.order_by(PatientTreatmentTransaction.created_at.desc()).all()
    
    return [
        {
            "id": t.id,
            "invoice_number": t.invoice_number,
            "patient_id": t.patient_id,
            "patient_identifier": t.patient.patient_identifier if t.patient else "Unknown",
            "patient_name": t.patient.user.full_name if (t.patient and t.patient.user) else "Patient",
            "hospital_name": t.hospital.name if t.hospital else "CuraReach Health Network",
            "case_id": t.case_id,
            "appointment_id": t.appointment_id,
            "transaction_type": t.transaction_type,
            "item_description": t.item_description,
            "amount_inr": t.amount_inr,
            "discount_inr": t.discount_inr,
            "net_amount_inr": t.net_amount_inr,
            "payment_status": t.payment_status,
            "payment_method": t.payment_method,
            "transaction_reference": t.transaction_reference,
            "is_simulated": t.is_simulated,
            "notes": t.notes,
            "payment_date": t.payment_date.strftime("%Y-%m-%d %H:%M") if t.payment_date else None,
            "created_at": t.created_at.strftime("%Y-%m-%d %H:%M")
        }
        for t in txns
    ]

@router.post("/invoice")
def create_treatment_invoice(
    req: TreatmentInvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new medical treatment invoice (Consultation, Lab, Pharmacy, Admission)"""
    profile = resolve_patient_profile(req.patient_id, current_user, db)
    inv_num = generate_invoice_number(db)
    
    net = max(0.0, req.amount_inr - req.discount_inr)
    
    # If initial payment status is PAID (e.g. upfront cash or PM-JAY coverage), generate txn ref
    txn_ref = None
    pay_date = None
    if req.payment_status in [PaymentStatus.PAID, PaymentStatus.WAIVED_CSR, PaymentStatus.GOVT_SCHEME_PMJAY]:
        txn_ref = generate_txn_ref(req.payment_method)
        pay_date = datetime.now(timezone.utc)
        
    txn = PatientTreatmentTransaction(
        invoice_number=inv_num,
        patient_id=profile.id,
        case_id=req.case_id,
        hospital_id=req.hospital_id or current_user.organization_id,
        appointment_id=req.appointment_id,
        transaction_type=req.transaction_type,
        item_description=req.item_description,
        amount_inr=req.amount_inr,
        discount_inr=req.discount_inr,
        net_amount_inr=net,
        payment_status=req.payment_status,
        payment_method=req.payment_method,
        transaction_reference=txn_ref,
        is_simulated=True,
        notes=req.notes,
        payment_date=pay_date
    )
    db.add(txn)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_TREATMENT_INVOICE",
        resource_type="PatientTreatmentTransaction",
        resource_id=txn.id,
        details=f"Created treatment invoice {inv_num} for ₹{net} ({req.transaction_type})"
    ))
    db.commit()
    db.refresh(txn)
    
    return {
        "success": True,
        "message": f"Treatment invoice {inv_num} created successfully.",
        "invoice_number": inv_num,
        "transaction_id": txn.id,
        "net_amount_inr": net,
        "payment_status": txn.payment_status
    }

@router.post("/{transaction_id}/pay")
def record_treatment_payment(
    transaction_id: str,
    req: RecordPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simulate recording a treatment payment (UPI / Cash / Card / PM-JAY / CSR)"""
    txn = db.query(PatientTreatmentTransaction).filter(PatientTreatmentTransaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")
        
    txn_ref = req.transaction_reference or generate_txn_ref(req.payment_method)
    
    txn.payment_status = PaymentStatus.PAID
    txn.payment_method = req.payment_method
    txn.transaction_reference = txn_ref
    txn.payment_date = datetime.now(timezone.utc)
    if req.notes:
        txn.notes = (txn.notes or "") + f" | Payment Note: {req.notes}"
        
    db.add(AuditLog(
        user_id=current_user.id,
        action="RECORD_TREATMENT_PAYMENT",
        resource_type="PatientTreatmentTransaction",
        resource_id=txn.id,
        details=f"Recorded payment for invoice {txn.invoice_number} (₹{txn.net_amount_inr} via {req.payment_method} ref: {txn_ref})"
    ))
    db.commit()
    db.refresh(txn)
    
    return {
        "success": True,
        "message": f"Simulated payment of ₹{txn.net_amount_inr} recorded successfully via {req.payment_method}.",
        "invoice_number": txn.invoice_number,
        "transaction_reference": txn_ref,
        "payment_status": txn.payment_status,
        "payment_date": txn.payment_date.isoformat(),
        "is_simulated": True
    }

@router.post("/{transaction_id}/refund")
def process_treatment_refund(
    transaction_id: str,
    req: ProcessRefundRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Process a simulated refund for a medical invoice"""
    txn = db.query(PatientTreatmentTransaction).filter(PatientTreatmentTransaction.id == transaction_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found.")
        
    if txn.payment_status != PaymentStatus.PAID:
        raise HTTPException(status_code=400, detail="Only paid transactions can be refunded.")
        
    refund_ref = req.refund_reference or f"REF-{generate_txn_ref('REFUND')}"
    
    txn.payment_status = PaymentStatus.REFUNDED
    txn.notes = (txn.notes or "") + f" | Refunded: {req.refund_reason} (Ref: {refund_ref})"
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="REFUND_TREATMENT_PAYMENT",
        resource_type="PatientTreatmentTransaction",
        resource_id=txn.id,
        details=f"Processed refund for invoice {txn.invoice_number} (₹{txn.net_amount_inr}, reason: {req.refund_reason})"
    ))
    db.commit()
    db.refresh(txn)
    
    return {
        "success": True,
        "message": f"Simulated refund of ₹{txn.net_amount_inr} processed.",
        "invoice_number": txn.invoice_number,
        "refund_reference": refund_ref,
        "payment_status": txn.payment_status,
        "is_simulated": True
    }
