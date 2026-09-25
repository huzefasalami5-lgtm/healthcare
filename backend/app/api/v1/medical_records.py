"""Medical Records and Diagnostic Reports API Endpoints (Section 5 & 14)"""
import os
import uuid
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user, Role
from app.models.user import User, PatientProfile
from app.models.medical_records import MedicalRecord, MedicalRecordType
from app.models.case import ClinicalCase
from app.models.referral import Appointment
from app.models.audit import AuditLog
from app.schemas import MedicalRecordCreate

router = APIRouter(prefix="/medical-records", tags=["Medical Records & Documents"])

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
def list_patient_records(
    patient_id: str,
    record_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    
    query = db.query(MedicalRecord).filter(MedicalRecord.patient_id == profile.id)
    if record_type:
        query = query.filter(MedicalRecord.record_type == record_type)
        
    records = query.order_by(MedicalRecord.created_at.desc()).all()
    
    return [
        {
            "id": r.id,
            "patient_id": r.patient_id,
            "patient_identifier": profile.patient_identifier,
            "patient_name": profile.user.full_name if profile.user else "Patient",
            "case_id": r.case_id,
            "appointment_id": r.appointment_id,
            "record_type": r.record_type,
            "title": r.title,
            "description": r.description,
            "facility_name": r.facility_name,
            "file_name": r.file_name,
            "has_file": bool(r.file_name),
            "mime_type": r.mime_type,
            "file_size_bytes": r.file_size_bytes,
            "document_date": r.document_date or r.created_at.strftime("%Y-%m-%d"),
            "is_sensitive": r.is_sensitive,
            "recorder_name": r.recorder.full_name if r.recorder else "System Recorded",
            "created_at": r.created_at.isoformat()
        }
        for r in records
    ]

@router.post("/patient/{patient_id}")
def create_text_record(
    patient_id: str,
    req: MedicalRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = resolve_patient_profile(patient_id, current_user, db)
    
    record = MedicalRecord(
        patient_id=profile.id,
        case_id=req.case_id,
        appointment_id=req.appointment_id,
        recorded_by_user_id=current_user.id,
        record_type=req.record_type,
        title=req.title,
        description=req.description,
        facility_name=req.facility_name or "CuraReach Health Network",
        document_date=req.document_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        is_sensitive=req.is_sensitive
    )
    db.add(record)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="CREATE_MEDICAL_RECORD",
        resource_type="MedicalRecord",
        resource_id=record.id,
        details=f"Created {req.record_type}: '{req.title}' for patient {profile.patient_identifier}"
    ))
    db.commit()
    db.refresh(record)
    
    return {
        "success": True,
        "message": "Medical record created successfully",
        "record_id": record.id,
        "title": record.title
    }

@router.post("/patient/{patient_id}/upload")
async def upload_document(
    patient_id: str,
    file: UploadFile = File(...),
    title: str = Form(...),
    record_type: str = Form("LAB_REPORT"),
    description: Optional[str] = Form(None),
    facility_name: Optional[str] = Form("Apex Multi-Specialty Hospital"),
    case_id: Optional[str] = Form(None),
    appointment_id: Optional[str] = Form(None),
    document_date: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Secure document upload (PDF, PNG, JPG) with MIME check and audit trail"""
    profile = resolve_patient_profile(patient_id, current_user, db)
    
    content_type = file.content_type or "application/octet-stream"
    if content_type not in settings.ALLOWED_DOC_MIMES and "pdf" not in content_type and "image" not in content_type and "text" not in content_type:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{content_type}'. Allowed types: PDF, PNG, JPEG, WEBP, TXT."
        )
        
    content = await file.read()
    file_size = len(content)
    if file_size > settings.MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")
        
    # Generate secure stored filename
    original_name = file.filename or "medical_document"
    ext = os.path.splitext(original_name)[1]
    if not ext:
        ext = ".pdf" if "pdf" in content_type else ".jpg"
    stored_filename = f"doc_{uuid.uuid4()}{ext}"
    stored_path = os.path.join(settings.STORAGE_DIR, stored_filename)
    
    with open(stored_path, "wb") as f:
        f.write(content)
        
    record = MedicalRecord(
        patient_id=profile.id,
        case_id=case_id,
        appointment_id=appointment_id,
        recorded_by_user_id=current_user.id,
        record_type=record_type,
        title=title,
        description=description,
        facility_name=facility_name,
        file_name=original_name,
        file_path=stored_filename,
        mime_type=content_type,
        file_size_bytes=file_size,
        document_date=document_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        is_sensitive=False
    )
    db.add(record)
    
    db.add(AuditLog(
        user_id=current_user.id,
        action="UPLOAD_MEDICAL_RECORD",
        resource_type="MedicalRecord",
        resource_id=record.id,
        details=f"Uploaded {record_type} '{title}' ({file_size} bytes) for patient {profile.patient_identifier}"
    ))
    db.commit()
    db.refresh(record)
    
    return {
        "success": True,
        "message": f"Document '{title}' uploaded successfully",
        "record": {
            "id": record.id,
            "title": record.title,
            "record_type": record.record_type,
            "file_name": record.file_name,
            "file_size_bytes": record.file_size_bytes,
            "document_date": record.document_date
        }
    }

@router.get("/{record_id}/download")
def download_record_file(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record or not record.file_path:
        raise HTTPException(status_code=404, detail="Medical document file not found.")
        
    full_path = os.path.join(settings.STORAGE_DIR, record.file_path)
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on storage disk.")
        
    # Audit log access
    db.add(AuditLog(
        user_id=current_user.id,
        action="DOWNLOAD_MEDICAL_RECORD",
        resource_type="MedicalRecord",
        resource_id=record.id,
        details=f"Downloaded '{record.file_name}' by {current_user.full_name} ({current_user.role})"
    ))
    db.commit()
    
    return FileResponse(
        path=full_path,
        media_type=record.mime_type or "application/octet-stream",
        filename=record.file_name or "medical_record.pdf"
    )

@router.delete("/{record_id}")
def delete_medical_record(
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    record = db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found.")
        
    if record.file_path:
        full_path = os.path.join(settings.STORAGE_DIR, record.file_path)
        if os.path.exists(full_path):
            try:
                os.remove(full_path)
            except OSError:
                pass
                
    db.delete(record)
    db.commit()
    return {"success": True, "message": "Record deleted successfully."}
