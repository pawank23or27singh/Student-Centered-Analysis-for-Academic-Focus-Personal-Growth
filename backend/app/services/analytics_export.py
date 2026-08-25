import json
from datetime import datetime
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Assessment, Feedback, Student, WeeklyMetric


class AnalyticsExportService:
    def __init__(self, db: Session):
        self.db = db

    def export_student_report(self, student_id: int, format: str = "json") -> dict:
        """Export comprehensive student report."""
        student = self.db.scalars(
            select(Student).where(Student.id == student_id)
        ).first()
        
        if not student:
            raise ValueError("Student not found")

        assessments = self.db.scalars(
            select(Assessment).where(Assessment.student_id == student_id)
        ).all()
        
        feedback = self.db.scalars(
            select(Feedback).where(Feedback.student_id == student_id)
        ).all()
        
        weekly_metrics = self.db.scalars(
            select(WeeklyMetric).where(WeeklyMetric.student_id == student_id)
            .order_by(WeeklyMetric.week_label)
        ).all()

        report = {
            "student": {
                "id": student.id,
                "roll_no": student.roll_no,
                "full_name": student.full_name,
                "semester": student.semester,
                "department": student.department,
                "attendance_rate": student.attendance_rate,
                "engagement_score": student.engagement_score,
                "self_reflection_score": student.self_reflection_score,
                "created_at": student.created_at.isoformat() if student.created_at else None,
            },
            "assessments": [
                {
                    "id": a.id,
                    "course_name": a.course_name,
                    "assessment_type": a.assessment_type,
                    "marks_obtained": a.marks_obtained,
                    "max_marks": a.max_marks,
                    "percentage": round((a.marks_obtained / a.max_marks) * 100, 2),
                    "recorded_on": a.recorded_on.isoformat() if a.recorded_on else None,
                }
                for a in assessments
            ],
            "feedback": [
                {
                    "id": f.id,
                    "feedback_text": f.feedback_text,
                    "sentiment_label": f.sentiment_label,
                    "created_at": f.created_at.isoformat() if f.created_at else None,
                }
                for f in feedback
            ],
            "weekly_metrics": [
                {
                    "id": w.id,
                    "week_label": w.week_label,
                    "average_marks": w.average_marks,
                    "attendance_rate": w.attendance_rate,
                    "engagement_score": w.engagement_score,
                    "assignment_completion_rate": w.assignment_completion_rate,
                }
                for w in weekly_metrics
            ],
            "generated_at": datetime.utcnow().isoformat(),
        }

        if format == "json":
            return report
        elif format == "csv":
            return self._convert_to_csv(report)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def export_class_analytics(self, department: Optional[str] = None, format: str = "json") -> dict:
        """Export class-wide analytics."""
        query = select(Student)
        if department:
            query = query.where(Student.department == department)
        
        students = self.db.scalars(query).all()

        analytics = {
            "department": department or "All Departments",
            "total_students": len(students),
            "students": [],
            "summary": {
                "average_attendance": round(
                    sum(s.attendance_rate for s in students) / len(students) if students else 0, 2
                ),
                "average_engagement": round(
                    sum(s.engagement_score for s in students) / len(students) if students else 0, 2
                ),
                "average_reflection": round(
                    sum(s.self_reflection_score for s in students) / len(students) if students else 0, 2
                ),
                "at_risk_count": sum(
                    1 for s in students if s.attendance_rate < 60 or s.engagement_score < 50
                ),
            },
            "generated_at": datetime.utcnow().isoformat(),
        }

        for student in students:
            student_data = {
                "id": student.id,
                "roll_no": student.roll_no,
                "full_name": student.full_name,
                "semester": student.semester,
                "department": student.department,
                "attendance_rate": student.attendance_rate,
                "engagement_score": student.engagement_score,
                "self_reflection_score": student.self_reflection_score,
                "risk_level": self._calculate_risk_level(student),
            }
            analytics["students"].append(student_data)

        if format == "json":
            return analytics
        elif format == "csv":
            return self._convert_to_csv(analytics)
        else:
            raise ValueError(f"Unsupported format: {format}")

    def _calculate_risk_level(self, student: Student) -> str:
        """Calculate risk level based on metrics."""
        if student.attendance_rate < 50 or student.engagement_score < 40:
            return "high"
        elif student.attendance_rate < 60 or student.engagement_score < 50:
            return "medium"
        else:
            return "low"

    def _convert_to_csv(self, data: dict) -> str:
        """Convert data to CSV format."""
        if "student" in data:
            # Single student report
            lines = ["Student Report"]
            lines.append(f"Name,{data['student']['full_name']}")
            lines.append(f"Roll No,{data['student']['roll_no']}")
            lines.append(f"Department,{data['student']['department']}")
            lines.append(f"Attendance,{data['student']['attendance_rate']}%")
            lines.append(f"Engagement,{data['student']['engagement_score']}%")
            lines.append("")
            lines.append("Assessments")
            lines.append("Course,Type,Marks,Max Marks,Percentage")
            for a in data["assessments"]:
                lines.append(f"{a['course_name']},{a['assessment_type']},{a['marks_obtained']},{a['max_marks']},{a['percentage']}%")
            return "\n".join(lines)
        else:
            # Class analytics
            lines = [f"Class Analytics - {data['department']}"]
            lines.append(f"Total Students,{data['total_students']}")
            lines.append(f"Average Attendance,{data['summary']['average_attendance']}%")
            lines.append(f"Average Engagement,{data['summary']['average_engagement']}%")
            lines.append(f"At-Risk Students,{data['summary']['at_risk_count']}")
            lines.append("")
            lines.append("Roll No,Name,Department,Attendance,Engagement,Risk Level")
            for s in data["students"]:
                lines.append(f"{s['roll_no']},{s['full_name']},{s['department']},{s['attendance_rate']}%,{s['engagement_score']}%,{s['risk_level']}")
            return "\n".join(lines)