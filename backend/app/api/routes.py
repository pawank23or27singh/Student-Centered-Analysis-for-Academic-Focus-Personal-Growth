from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.entities import User
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.schemas.student import FacultyOverview, StudentAnalytics
from app.services.analytics import AnalyticsService
from app.services.analytics_export import AnalyticsExportService
from app.services.recommendations import RecommendationService
from app.utils.auth_middleware import create_access_token, create_refresh_token, verify_token
from app.utils.security import verify_password

router = APIRouter()


@router.get("/health")
def health_check():
    return {"status": "ok"}


@router.post("/auth/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.scalars(select(User).where(User.username == payload.username)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(subject=user.username, role=user.role)
    refresh_token = create_refresh_token(subject=user.username)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "role": user.role,
        "full_name": user.full_name,
    }


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh_token(payload: RefreshTokenRequest, db: Session = Depends(get_db)):
    """Refresh access token using refresh token."""
    try:
        refresh_payload = verify_token(payload.refresh_token)
        
        if refresh_payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        
        username = refresh_payload.get("sub")
        user = db.scalars(select(User).where(User.username == username)).first()
        
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        access_token = create_access_token(subject=user.username, role=user.role)
        new_refresh_token = create_refresh_token(subject=user.username)
        
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "role": user.role,
            "full_name": user.full_name,
        }
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


@router.get("/students")
def list_students(limit: int = 50, db: Session = Depends(get_db)):
    return AnalyticsService(db).list_students(limit=limit)


@router.get("/students/organized")
def get_organized_students(db: Session = Depends(get_db)):
    """Get students organized by department and semester hierarchy"""
    try:
        result = AnalyticsService(db).get_organized_students()
        return result
    except Exception as e:
        print(f"Error in get_organized_students: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@router.get("/students/{student_id}", response_model=StudentAnalytics)
def student_analytics(student_id: int, db: Session = Depends(get_db)):
    try:
        return AnalyticsService(db).get_student_analytics(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/faculty/overview", response_model=FacultyOverview)
def faculty_overview(db: Session = Depends(get_db)):
    return AnalyticsService(db).faculty_overview_simple()


@router.get("/insights/at-risk")
def at_risk_students(db: Session = Depends(get_db)):
    return AnalyticsService(db).at_risk_students()


@router.get("/export/student/{student_id}")
def export_student_report(student_id: int, format: str = "json", db: Session = Depends(get_db)):
    try:
        export_service = AnalyticsExportService(db)
        return export_service.export_student_report(student_id, format)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/export/class")
def export_class_analytics(department: str | None = None, format: str = "json", db: Session = Depends(get_db)):
    export_service = AnalyticsExportService(db)
    return export_service.export_class_analytics(department, format)


@router.get("/students/organized")
def get_organized_students(db: Session = Depends(get_db)):
    """Get students organized by department and semester hierarchy"""
    try:
        result = AnalyticsService(db).get_organized_students()
        return result
    except Exception as e:
        print(f"Error in get_organized_students: {e}")
        import traceback
        traceback.print_exc()
        return {"error": str(e)}


@router.get("/students/filter")
def filter_students(
    department: str | None = None,
    semester: int | None = None,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Filter students by department and/or semester"""
    return AnalyticsService(db).filter_students(department, semester, limit)


@router.get("/analytics/department/{department}")
def department_analytics(department: str, db: Session = Depends(get_db)):
    """Get analytics for specific department"""
    return AnalyticsService(db).get_department_analytics(department)


@router.get("/analytics/semester/{semester}")
def semester_analytics(semester: int, db: Session = Depends(get_db)):
    """Get analytics for specific semester"""
    return AnalyticsService(db).get_semester_analytics(semester)


@router.get("/recommendations/student/{student_id}")
def student_recommendations(student_id: int, db: Session = Depends(get_db)):
    """Get comprehensive recommendations for a specific student"""
    try:
        recommendation_service = RecommendationService(db)
        return recommendation_service.get_comprehensive_recommendations(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/recommendations/intervention-queue")
def intervention_queue(db: Session = Depends(get_db)):
    """Get prioritized intervention queue for faculty"""
    recommendation_service = RecommendationService(db)
    return recommendation_service.get_faculty_intervention_queue()


@router.get("/recommendations/peer-learning/{student_id}")
def peer_learning_recommendations(student_id: int, db: Session = Depends(get_db)):
    """Get peer learning recommendations for a specific student"""
    try:
        recommendation_service = RecommendationService(db)
        return recommendation_service.get_peer_learning_recommendations(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/recommendations/course-performance/{student_id}")
def course_performance(student_id: int, db: Session = Depends(get_db)):
    """Get course-wise performance analysis for a student"""
    try:
        recommendation_service = RecommendationService(db)
        return recommendation_service.get_course_performance(student_id)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
