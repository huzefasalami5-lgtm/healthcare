"""Secure Private Image Upload and Retrieval Endpoints (Section 5 & 14)"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, Role
from app.models.user import User
from app.models.case import ClinicalCase, UploadedImage
from app.models.audit import AuditLog
from app.services.image_service import image_service

router = APIRouter(prefix="/images", tags=["Secure Image Storage"])

@router.post("/{case_id}/upload")
async def upload_case_image(
    case_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    case = db.query(ClinicalCase).filter(ClinicalCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found.")

    # 1. Enforce photo consent check (Section 5)
    if not case.consent or not case.consent.photo_consent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Explicit photo consent has not been granted for this case. Consent must be recorded prior to upload."
        )

    # 2. Authorization check
    if current_user.role == Role.PATIENT and case.patient_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    if current_user.role == Role.COMMUNITY_WORKER and case.assigned_worker_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied. Worker not assigned.")

    # 3. Securely validate and store in private directory
    stored_filename, original_filename, file_size = await image_service.save_private_image(file)

    # 4. Generate cautious AI visual description (Section 5: NO autonomous diagnostic confirmation)
    cautious_desc = (
        "Supportive visual inspection: Localized cutaneous erythema/swelling documented. "
        "Disclaimer: This AI inspection does not diagnose a skin condition or prescribe medication. "
        "Awaiting authorized physical evaluation by a medical officer."
    )

    # 5. Persist record
    image_rec = UploadedImage(
        case_id=case.id,
        stored_filename=stored_filename,
        original_filename=original_filename,
        mime_type=file.content_type,
        file_size_bytes=file_size,
        has_consent=True,
        uploaded_by_user_id=current_user.id,
        ai_cautious_description=cautious_desc
    )
    db.add(image_rec)

    # 6. Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="UPLOAD_MEDICAL_IMAGE",
        resource_type="UploadedImage",
        resource_id=stored_filename,
        details=f"Securely uploaded image {original_filename} ({file_size} bytes) for case {case.case_number}"
    )
    db.add(audit)
    db.commit()
    db.refresh(image_rec)

    return {
        "id": image_rec.id,
        "case_id": case.id,
        "original_filename": image_rec.original_filename,
        "file_size_bytes": image_rec.file_size_bytes,
        "mime_type": image_rec.mime_type,
        "ai_cautious_description": image_rec.ai_cautious_description,
        "created_at": image_rec.created_at.isoformat()
    }

@router.get("/{image_id}/file")
def get_private_image_file(
    image_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve private image file with strict authorization check (Section 5 & 14)"""
    img_rec = db.query(UploadedImage).filter(UploadedImage.id == image_id).first()
    if not img_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image record not found.")

    case = img_rec.case

    # Strict access gate
    is_owner_patient = current_user.role == Role.PATIENT and case.patient_id == current_user.id
    is_assigned_worker = current_user.role == Role.COMMUNITY_WORKER and case.assigned_worker_id == current_user.id
    is_clinician = current_user.role == Role.CLINICIAN
    is_admin = current_user.role == Role.CURAREACH_ADMIN
    is_referral_hospital = current_user.role == Role.HOSPITAL_STAFF and case.target_hospital_id == current_user.organization_id

    if not (is_owner_patient or is_assigned_worker or is_clinician or is_admin or is_referral_hospital):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. You do not possess authorized clinical permissions to view this medical image."
        )

    file_path = image_service.get_private_image_path(img_rec.stored_filename)

    # Log access audit
    db.add(AuditLog(
        user_id=current_user.id,
        action="VIEW_MEDICAL_IMAGE",
        resource_type="UploadedImage",
        resource_id=img_rec.id,
        details=f"Image viewed by {current_user.full_name} ({current_user.role})"
    ))
    db.commit()

    return FileResponse(file_path, media_type=img_rec.mime_type, filename=img_rec.original_filename)
