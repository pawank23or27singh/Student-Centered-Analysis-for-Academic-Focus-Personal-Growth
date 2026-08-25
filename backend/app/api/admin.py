from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.entities import Alert, Assessment, Feedback, Student, User, WeeklyMetric
from app.models.entities_admin import ActivityLog, SystemConfig
from app.schemas.admin import RiskConfig, SystemStats, UserCreate, UserResponse, UserUpdate
from app.schemas.admin_import import BulkImportResponse, StudentImport
from app.services.admin_service import AdminService
from app.utils.security import hash_password, verify_password

router = APIRouter()


def require_admin(db: Session, token: str) -> User:
    # Simplified admin check - in production use proper JWT verification
    user = db.scalars(select(User).where(User.username == "admin")).first()
    if not user:
        raise HTTPException(status_code=404, detail="Admin user not found")
    return user

def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("/stats", response_model=SystemStats)
def get_system_stats(db: Session = Depends(get_db)):
    total_students = db.scalar(select(func.count(Student.id)))
    total_faculty = db.scalar(select(func.count(User.id)).where(User.role == "faculty"))
    total_users = db.scalar(select(func.count(User.id)))
    at_risk_students = db.scalar(
        select(func.count(Student.id)).where(
            (Student.attendance_rate < 60) | (Student.engagement_score < 50)
        )
    )
    total_assessments = db.scalar(select(func.count(Assessment.id)))
    total_feedback = db.scalar(select(func.count(Feedback.id)))
    
    return SystemStats(
        total_students=total_students or 0,
        total_faculty=total_faculty or 0,
        total_users=total_users or 0,
        at_risk_students=at_risk_students or 0,
        total_assessments=total_assessments or 0,
        total_feedback=total_feedback or 0,
    )


@router.get("/users", response_model=list[UserResponse])
def list_users(db: Session = Depends(get_db)):
    users = db.scalars(select(User)).all()
    return users


@router.post("/users", response_model=UserResponse)
def create_user(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing_user = db.scalars(
        select(User).where(User.username == user_data.username)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    new_user = User(
        username=user_data.username,
        full_name=user_data.full_name,
        role=user_data.role,
        hashed_password=hash_password(user_data.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Log activity
    admin_service = AdminService(db)
    admin_service.log_activity(
        username="admin",
        action="create_user",
        entity_type="user",
        entity_id=new_user.id,
        details=f"Created user {user_data.username} with role {user_data.role}",
        ip_address=get_client_ip(request),
    )
    
    return new_user


@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_data: UserUpdate, db: Session = Depends(get_db)):
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user_data.full_name is not None:
        user.full_name = user_data.full_name
    if user_data.role is not None:
        user.role = user_data.role
    if user_data.password is not None:
        user.hashed_password = hash_password(user_data.password)
    
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    user = db.scalars(select(User).where(User.id == user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin user")
    
    username = user.username
    db.delete(user)
    db.commit()
    
    # Log activity
    admin_service = AdminService(db)
    admin_service.log_activity(
        username="admin",
        action="delete_user",
        entity_type="user",
        entity_id=user_id,
        details=f"Deleted user {username}",
        ip_address=get_client_ip(request),
    )
    
    return {"message": "User deleted successfully"}


@router.get("/students/list")
def admin_list_students(db: Session = Depends(get_db)):
    students = db.scalars(select(Student)).all()
    return [
        {
            "id": s.id,
            "roll_no": s.roll_no,
            "full_name": s.full_name,
            "semester": s.semester,
            "department": s.department,
            "attendance_rate": s.attendance_rate,
            "engagement_score": s.engagement_score,
            "self_reflection_score": s.self_reflection_score,
        }
        for s in students
    ]


@router.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    student = db.scalars(select(Student).where(Student.id == student_id)).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete related records
    db.execute(delete(Alert).where(Alert.student_id == student_id))
    db.execute(delete(Assessment).where(Assessment.student_id == student_id))
    db.execute(delete(Feedback).where(Feedback.student_id == student_id))
    db.execute(delete(WeeklyMetric).where(WeeklyMetric.student_id == student_id))
    
    db.delete(student)
    db.commit()
    return {"message": "Student deleted successfully"}


@router.post("/reset-database")
def reset_database(db: Session = Depends(get_db)):
    # Delete all data except admin user
    db.execute(delete(WeeklyMetric))
    db.execute(delete(Feedback))
    db.execute(delete(Assessment))
    db.execute(delete(Alert))
    db.execute(delete(Student))
    db.execute(delete(User).where(User.username != "admin"))
    
    db.commit()
    return {"message": "Database reset successfully"}


@router.get("/risk-config", response_model=RiskConfig)
def get_risk_config(db: Session = Depends(get_db)):
    admin_service = AdminService(db)
    return RiskConfig(
        attendance_threshold=float(admin_service.get_config("risk.attendance_threshold") or "60"),
        engagement_threshold=float(admin_service.get_config("risk.engagement_threshold") or "50"),
        reflection_threshold=float(admin_service.get_config("risk.reflection_threshold") or "50"),
    )


@router.put("/risk-config")
def update_risk_config(config: RiskConfig, request: Request, db: Session = Depends(get_db)):
    admin_service = AdminService(db)
    admin_service.set_config("risk.attendance_threshold", str(config.attendance_threshold))
    admin_service.set_config("risk.engagement_threshold", str(config.engagement_threshold))
    admin_service.set_config("risk.reflection_threshold", str(config.reflection_threshold))
    
    # Log activity
    admin_service.log_activity(
        username="admin",
        action="update_config",
        entity_type="config",
        details=f"Updated risk thresholds: attendance={config.attendance_threshold}, engagement={config.engagement_threshold}",
        ip_address=get_client_ip(request),
    )
    
    return {"message": "Risk configuration updated successfully"}


@router.get("/activity-logs")
def get_activity_logs(
    limit: int = 100,
    username: str | None = None,
    entity_type: str | None = None,
    db: Session = Depends(get_db)
):
    admin_service = AdminService(db)
    logs = admin_service.get_activity_logs(limit=limit, username=username, entity_type=entity_type)
    return [
        {
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "entity_type": log.entity_type,
            "entity_id": log.entity_id,
            "details": log.details,
            "ip_address": log.ip_address,
            "timestamp": log.timestamp.isoformat(),
        }
        for log in logs
    ]


@router.get("/system-config")
def get_system_config(db: Session = Depends(get_db)):
    admin_service = AdminService(db)
    configs = admin_service.get_all_configs()
    return {config.key: config.value for config in configs}


@router.put("/system-config/{key}")
def update_system_config(key: str, value: str, request: Request, db: Session = Depends(get_db)):
    admin_service = AdminService(db)
    admin_service.set_config(key, value)
    
    # Log activity
    admin_service.log_activity(
        username="admin",
        action="update_config",
        entity_type="config",
        details=f"Updated config {key}",
        ip_address=get_client_ip(request),
    )
    
    return {"message": "Configuration updated successfully"}


@router.post("/students/bulk-import", response_model=BulkImportResponse)
def bulk_import_students(students: list[StudentImport], request: Request, db: Session = Depends(get_db)):
    success_count = 0
    failed_count = 0
    errors = []
    
    for student_data in students:
        try:
            # Check if roll number already exists
            existing = db.scalars(
                select(Student).where(Student.roll_no == student_data.roll_no)
            ).first()
            
            if existing:
                errors.append(f"Roll number {student_data.roll_no} already exists")
                failed_count += 1
                continue
            
            new_student = Student(
                roll_no=student_data.roll_no,
                full_name=student_data.full_name,
                semester=student_data.semester,
                department=student_data.department,
                attendance_rate=student_data.attendance_rate,
                engagement_score=student_data.engagement_score,
                self_reflection_score=student_data.self_reflection_score,
            )
            db.add(new_student)
            success_count += 1
            
        except Exception as e:
            errors.append(f"Error importing {student_data.roll_no}: {str(e)}")
            failed_count += 1
    
    db.commit()
    
    # Log activity
    admin_service = AdminService(db)
    admin_service.log_activity(
        username="admin",
        action="bulk_import",
        entity_type="student",
        details=f"Bulk imported {success_count} students, {failed_count} failed",
        ip_address=get_client_ip(request),
    )
    
    return BulkImportResponse(
        success_count=success_count,
        failed_count=failed_count,
        errors=errors
    )


@router.post("/backup")
def create_backup(request: Request, db: Session = Depends(get_db)):
    """Create a backup of all data as JSON."""
    import json
    from datetime import datetime
    
    # Get all data
    students = db.scalars(select(Student)).all()
    users = db.scalars(select(User)).all()
    assessments = db.scalars(select(Assessment)).all()
    feedback = db.scalars(select(Feedback)).all()
    weekly_metrics = db.scalars(select(WeeklyMetric)).all()
    alerts = db.scalars(select(Alert)).all()
    
    backup_data = {
        "timestamp": datetime.utcnow().isoformat(),
        "students": [
            {
                "id": s.id,
                "roll_no": s.roll_no,
                "full_name": s.full_name,
                "semester": s.semester,
                "department": s.department,
                "attendance_rate": s.attendance_rate,
                "engagement_score": s.engagement_score,
                "self_reflection_score": s.self_reflection_score,
                "created_at": s.created_at.isoformat() if s.created_at else None,
            }
            for s in students
        ],
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "full_name": u.full_name,
                "role": u.role,
                # Password not included for security
            }
            for u in users
        ],
        "assessments": [
            {
                "id": a.id,
                "student_id": a.student_id,
                "course_name": a.course_name,
                "assessment_type": a.assessment_type,
                "marks_obtained": a.marks_obtained,
                "max_marks": a.max_marks,
                "recorded_on": a.recorded_on.isoformat() if a.recorded_on else None,
            }
            for a in assessments
        ],
        "feedback": [
            {
                "id": f.id,
                "student_id": f.student_id,
                "feedback_text": f.feedback_text,
                "sentiment_label": f.sentiment_label,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in feedback
        ],
        "weekly_metrics": [
            {
                "id": w.id,
                "student_id": w.student_id,
                "week_label": w.week_label,
                "average_marks": w.average_marks,
                "attendance_rate": w.attendance_rate,
                "engagement_score": w.engagement_score,
                "assignment_completion_rate": w.assignment_completion_rate,
            }
            for w in weekly_metrics
        ],
        "alerts": [
            {
                "id": a.id,
                "student_id": a.student_id,
                "title": a.title,
                "message": a.message,
                "severity": a.severity,
                "resolved": a.resolved,
            }
            for a in alerts
        ],
    }
    
    # Log activity
    admin_service = AdminService(db)
    admin_service.log_activity(
        username="admin",
        action="backup",
        entity_type="system",
        details="Created system backup",
        ip_address=get_client_ip(request),
    )
    
    return {
        "backup": backup_data,
        "timestamp": datetime.utcnow().isoformat(),
        "record_counts": {
            "students": len(students),
            "users": len(users),
            "assessments": len(assessments),
            "feedback": len(feedback),
            "weekly_metrics": len(weekly_metrics),
            "alerts": len(alerts),
        }
    }