"""Follow-up Tasks, Care Rescue Monitoring, and In-App Notifications (Section 6 & 8)"""
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user, Role
from app.models.user import User
from app.models.case import CaseStatus
from app.models.care_rescue import FollowUpTask, TaskStatus, Notification
from app.state_machine.case_state_machine import case_state_machine
from app.schemas import CompleteTaskRequest, EscalateTaskRequest

router = APIRouter(prefix="/followup", tags=["Care Rescue & Follow-Up Tasks"])

@router.get("/tasks")
def list_tasks(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(FollowUpTask)

    if current_user.role == Role.COMMUNITY_WORKER:
        # Worker sees ONLY assigned tasks
        query = query.filter(FollowUpTask.assigned_worker_id == current_user.id)
    elif current_user.role == Role.PATIENT:
        query = query.filter(FollowUpTask.assigned_patient_id == current_user.id)
    # Clinicians and Admins see all tasks

    if status_filter:
        query = query.filter(FollowUpTask.status == status_filter)

    tasks = query.order_by(FollowUpTask.created_at.desc()).all()
    return [
        {
            "id": t.id,
            "case_id": t.case_id,
            "case_number": t.case.case_number if t.case else "",
            "patient_name": t.patient.full_name if t.patient else "Patient",
            "task_type": t.task_type,
            "description": t.description,
            "due_date": t.due_date,
            "status": t.status,
            "barrier_reported": t.barrier_reported,
            "worker_notes": t.worker_notes,
            "escalation_reason": t.escalation_reason,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None
        } for t in tasks
    ]

@router.post("/tasks/{task_id}/complete")
def complete_task(
    task_id: str,
    req: CompleteTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(FollowUpTask).filter(FollowUpTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.status = TaskStatus.COMPLETED
    task.worker_notes = req.worker_notes
    task.barrier_reported = req.barrier_reported
    task.completed_at = datetime.now(timezone.utc)
    db.commit()

    case = task.case
    # Check if all tasks for this case are completed
    pending_count = db.query(FollowUpTask).filter(
        FollowUpTask.case_id == case.id,
        FollowUpTask.status.in_([TaskStatus.PENDING, TaskStatus.IN_PROGRESS, TaskStatus.ESCALATED])
    ).count()

    if pending_count == 0 and case.current_state == CaseStatus.FOLLOW_UP_PENDING:
        case_state_machine.transition(
            case=case,
            to_state=CaseStatus.FOLLOW_UP_COMPLETED,
            actor_role=current_user.role,
            actor_user_id=current_user.id,
            transition_event="ALL_FOLLOW_UP_TASKS_COMPLETED",
            evidence_notes=f"Worker {current_user.full_name} completed final care follow-up checklist.",
            db=db
        )

    return {"message": "Task marked as completed.", "case_state": case.current_state}

@router.post("/tasks/{task_id}/escalate")
def escalate_task(
    task_id: str,
    req: EscalateTaskRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(FollowUpTask).filter(FollowUpTask.id == task_id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found.")

    task.status = TaskStatus.ESCALATED
    task.escalation_reason = req.escalation_reason
    db.commit()

    case = task.case
    if case.assigned_clinician_id:
        db.add(Notification(
            user_id=case.assigned_clinician_id,
            case_id=case.id,
            title="Task Escalation Alert",
            message=f"Community Worker escalated task for case {case.case_number}: {req.escalation_reason}",
            notification_type="URGENT"
        ))
        db.commit()

    return {"message": "Task escalated to supervisor and clinician.", "task_id": task.id}

@router.get("/notifications")
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).limit(20).all()

    return [
        {
            "id": n.id,
            "case_id": n.case_id,
            "title": n.title,
            "message": n.message,
            "notification_type": n.notification_type,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat()
        } for n in notifs
    ]
