from pydantic import BaseModel


class StudentSummary(BaseModel):
    id: int
    roll_no: str
    full_name: str
    semester: int
    department: str
    attendance_rate: float
    engagement_score: float
    self_reflection_score: float


class RecommendationItem(BaseModel):
    title: str
    detail: str


class StudentAnalytics(BaseModel):
    student: StudentSummary
    average_marks: float
    predicted_risk: str
    confidence: float
    sentiment: str
    forecast_gpa: float
    strengths: list[str]
    improvement_areas: list[str]
    recommendations: list[RecommendationItem]
    weekly_trend: list[dict]


class FacultyOverview(BaseModel):
    total_students: int
    average_attendance: float
    average_marks: float
    average_engagement: float
    risk_distribution: dict[str, int]
    sentiment_distribution: dict[str, int]
    top_recommendations: list[str]
    department_trend: list[dict]
