from collections import Counter

import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression, LinearRegression
from sklearn.naive_bayes import MultinomialNB
from sklearn.tree import DecisionTreeClassifier
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Alert, Assessment, Feedback, Student, WeeklyMetric
from app.services.recommendations import RecommendationService


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def _student_dataset(self):
        students = self.db.scalars(select(Student)).all()
        rows = []
        labels = []
        for student in students:
            avg_marks = self._average_marks(student.id)
            rows.append(
                [
                    student.attendance_rate,
                    student.engagement_score,
                    student.self_reflection_score,
                    avg_marks,
                ]
            )
            if student.attendance_rate < 55 or avg_marks < 50:
                labels.append("High Risk")
            elif student.attendance_rate < 72 or avg_marks < 65:
                labels.append("Medium Risk")
            else:
                labels.append("Low Risk")
        return students, np.array(rows), np.array(labels)

    def _average_marks(self, student_id: int) -> float:
        value = self.db.scalar(
            select(func.avg(Assessment.marks_obtained)).where(Assessment.student_id == student_id)
        )
        return round(float(value or 0.0), 2)

    def _latest_feedback(self, student_id: int) -> Feedback | None:
        return self.db.scalars(
            select(Feedback).where(Feedback.student_id == student_id).order_by(Feedback.created_at.desc())
        ).first()

    def _weekly_trend(self, student_id: int) -> list[dict]:
        metrics = self.db.scalars(
            select(WeeklyMetric).where(WeeklyMetric.student_id == student_id).order_by(WeeklyMetric.id.asc())
        ).all()
        return [
            {
                "week": metric.week_label,
                "marks": metric.average_marks,
                "attendance": metric.attendance_rate,
                "engagement": metric.engagement_score,
                "completion": metric.assignment_completion_rate,
            }
            for metric in metrics
        ]

    def _train_risk_models(self):
        students, features, labels = self._student_dataset()
        logistic = LogisticRegression(max_iter=500)
        logistic.fit(features, labels)
        decision_tree = DecisionTreeClassifier(max_depth=4, random_state=42)
        decision_tree.fit(features, labels)
        return students, features, labels, logistic, decision_tree

    def _train_sentiment_model(self):
        feedback_list = self.db.scalars(select(Feedback)).all()
        texts = [item.feedback_text for item in feedback_list]
        labels = [item.sentiment_label for item in feedback_list]
        vectorizer = CountVectorizer(stop_words="english")
        x = vectorizer.fit_transform(texts)
        model = MultinomialNB()
        model.fit(x, labels)
        return vectorizer, model

    def _forecast_gpa(self, student_id: int) -> float:
        trend = self._weekly_trend(student_id)
        if not trend:
            return 0.0
        x = np.arange(len(trend)).reshape(-1, 1)
        y = np.array([point["marks"] for point in trend], dtype=float)
        model = LinearRegression()
        model.fit(x, y)
        prediction = float(model.predict([[len(trend)]])[0])
        return round(max(4.0, min(10.0, prediction / 10)), 2)

    def get_student_analytics(self, student_id: int) -> dict:
        student = self.db.get(Student, student_id)
        if not student:
            raise ValueError("Student not found")

        _, features, _, logistic, decision_tree = self._train_risk_models()
        all_students = self.db.scalars(select(Student).order_by(Student.id.asc())).all()
        student_index = next(i for i, item in enumerate(all_students) if item.id == student_id)
        student_features = features[student_index].reshape(1, -1)
        predicted_risk = logistic.predict(student_features)[0]
        confidence = float(np.max(logistic.predict_proba(student_features)[0]))
        tree_prediction = decision_tree.predict(student_features)[0]

        vectorizer, sentiment_model = self._train_sentiment_model()
        feedback = self._latest_feedback(student_id)
        feedback_text = feedback.feedback_text if feedback else ""
        sentiment = sentiment_model.predict(vectorizer.transform([feedback_text]))[0]

        avg_marks = self._average_marks(student_id)
        trend = self._weekly_trend(student_id)
        strengths = []
        improvement_areas = []

        if student.attendance_rate >= 75:
            strengths.append("Consistent attendance across formative activities")
        else:
            improvement_areas.append("Attendance needs close monitoring")
        if student.engagement_score >= 70:
            strengths.append("Strong classroom and LMS engagement")
        else:
            improvement_areas.append("Participation and LMS engagement are below target")
        if avg_marks >= 70:
            strengths.append("Solid academic performance in continuous assessment")
        else:
            improvement_areas.append("Assessment performance needs improvement")

        # Get enhanced recommendations
        recommendation_service = RecommendationService(self.db)
        enhanced_recommendations = recommendation_service.get_comprehensive_recommendations(student_id)
        
        # Combine traditional and enhanced recommendations
        recommendations = [
            {
                "title": "Weekly revision plan",
                "detail": "Block 3 focused revision slots per week for low-scoring courses.",
            },
            {
                "title": "Faculty mentoring",
                "detail": "Schedule a mentoring review if attendance or marks stay below target for 2 weeks.",
            },
            {
                "title": "Reflective learning journal",
                "detail": "Capture one strength and one challenge after each quiz or assignment.",
            },
        ]
        
        # Add enhanced learning path recommendations
        for learning_path in enhanced_recommendations["learning_paths"]:
            recommendations.append({
                "title": learning_path["title"],
                "detail": learning_path["detail"],
                "icon": learning_path.get("icon", "info"),
                "action": learning_path.get("action", "")
            })
        
        # Add engagement optimization recommendations
        for engagement_rec in enhanced_recommendations["engagement_optimization"][:2]:
            recommendations.append({
                "title": engagement_rec["title"],
                "detail": engagement_rec["detail"],
                "icon": engagement_rec.get("icon", "info"),
                "action": engagement_rec.get("action", "")
            })
        
        if predicted_risk == "High Risk" or tree_prediction == "High Risk":
            recommendations.insert(
                0,
                {
                    "title": "Immediate early-warning intervention",
                    "detail": "Prioritize attendance recovery and remedial assignments this week.",
                    "icon": "alert"
                },
            )

        return {
            "student": {
                "id": student.id,
                "roll_no": student.roll_no,
                "full_name": student.full_name,
                "semester": student.semester,
                "department": student.department,
                "attendance_rate": student.attendance_rate,
                "engagement_score": student.engagement_score,
                "self_reflection_score": student.self_reflection_score,
            },
            "average_marks": avg_marks,
            "predicted_risk": predicted_risk,
            "confidence": round(confidence, 2),
            "sentiment": sentiment,
            "forecast_gpa": self._forecast_gpa(student_id),
            "strengths": strengths,
            "improvement_areas": improvement_areas,
            "recommendations": recommendations,
            "weekly_trend": trend,
            "enhanced_recommendations": enhanced_recommendations,
        }

    def list_students(self, limit: int = 50) -> list[dict]:
        students = self.db.scalars(select(Student).order_by(Student.id.asc()).limit(limit)).all()
        return [
            {
                "id": student.id,
                "roll_no": student.roll_no,
                "full_name": student.full_name,
                "semester": student.semester,
                "department": student.department,
                "attendance_rate": student.attendance_rate,
                "engagement_score": student.engagement_score,
                "self_reflection_score": student.self_reflection_score,
            }
            for student in students
        ]

    def faculty_overview(self) -> dict:
        students = self.db.scalars(select(Student)).all()
        analytics = [self.get_student_analytics(student.id) for student in students]
        total_students = len(students)
        sentiment_distribution = Counter(item["sentiment"] for item in analytics)
        risk_distribution = Counter(item["predicted_risk"] for item in analytics)
        avg_attendance = round(sum(student.attendance_rate for student in students) / total_students, 2)
        avg_engagement = round(sum(student.engagement_score for student in students) / total_students, 2)
        avg_marks = round(sum(item["average_marks"] for item in analytics) / total_students, 2)

        weekly = self.db.scalars(select(WeeklyMetric).order_by(WeeklyMetric.id.asc())).all()
        week_map: dict[str, list[WeeklyMetric]] = {}
        for item in weekly:
            week_map.setdefault(item.week_label, []).append(item)

        department_trend = []
        for week, values in week_map.items():
            department_trend.append(
                {
                    "week": week,
                    "marks": round(sum(v.average_marks for v in values) / len(values), 2),
                    "attendance": round(sum(v.attendance_rate for v in values) / len(values), 2),
                    "engagement": round(sum(v.engagement_score for v in values) / len(values), 2),
                }
            )

        alerts = self.db.scalars(select(Alert).where(Alert.resolved.is_(False))).all()
        top_recommendations = [
            "Launch a faculty intervention cycle for high-risk learners.",
            "Increase attendance follow-ups for students below 60 percent.",
            f"{len(alerts)} active alert(s) need review this week.",
        ]
        return {
            "total_students": total_students,
            "average_attendance": avg_attendance,
            "average_marks": avg_marks,
            "average_engagement": avg_engagement,
            "risk_distribution": dict(risk_distribution),
            "sentiment_distribution": dict(sentiment_distribution),
            "top_recommendations": top_recommendations,
            "department_trend": department_trend,
        }

    def faculty_overview_simple(self) -> dict:
        """Fast version without full student analytics"""
        students = self.db.scalars(select(Student)).all()
        total_students = len(students)
        
        # Simple averages without full analytics
        avg_attendance = round(sum(student.attendance_rate for student in students) / total_students, 2)
        avg_engagement = round(sum(student.engagement_score for student in students) / total_students, 2)
        avg_reflection = round(sum(student.self_reflection_score for student in students) / total_students, 2)
        
        # Simple risk assessment based on attendance and engagement
        at_risk_count = sum(1 for student in students if student.attendance_rate < 60 or student.engagement_score < 50)
        medium_risk_count = sum(1 for student in students if 60 <= student.attendance_rate < 75 or 50 <= student.engagement_score < 70)
        low_risk_count = total_students - at_risk_count - medium_risk_count
        
        # Simple sentiment from feedback
        feedback_list = self.db.scalars(select(Feedback)).all()
        sentiment_distribution = {"positive": 0, "neutral": 0, "negative": 0}
        for feedback in feedback_list:
            sentiment_distribution[feedback.sentiment_label] += 1
        
        # Weekly trend (simplified)
        weekly = self.db.scalars(select(WeeklyMetric).order_by(WeeklyMetric.id.asc())).all()
        week_map: dict[str, list[WeeklyMetric]] = {}
        for item in weekly:
            week_map.setdefault(item.week_label, []).append(item)

        department_trend = []
        for week, values in week_map.items():
            department_trend.append(
                {
                    "week": week,
                    "marks": round(sum(v.average_marks for v in values) / len(values), 2),
                    "attendance": round(sum(v.attendance_rate for v in values) / len(values), 2),
                    "engagement": round(sum(v.engagement_score for v in values) / len(values), 2),
                }
            )

        alerts = self.db.scalars(select(Alert).where(Alert.resolved.is_(False))).all()
        
        # Get enhanced intervention queue
        recommendation_service = RecommendationService(self.db)
        intervention_queue = recommendation_service.get_faculty_intervention_queue()
        
        # Generate top recommendations based on intervention queue
        enhanced_recommendations = []
        urgent_students = [s for s in intervention_queue if s["priority"] == "urgent"]
        high_priority_students = [s for s in intervention_queue if s["priority"] == "high"]
        
        if urgent_students:
            enhanced_recommendations.append(f"URGENT: {len(urgent_students)} student(s) require immediate intervention")
        if high_priority_students:
            enhanced_recommendations.append(f"HIGH: {len(high_priority_students)} student(s) need priority attention this week")
        enhanced_recommendations.append(f"{len(alerts)} active alert(s) need review this week.")
        
        result = {
            "total_students": total_students,
            "average_attendance": avg_attendance,
            "average_marks": avg_reflection,  # Using reflection as proxy for marks
            "average_engagement": avg_engagement,
            "risk_distribution": {
                "High Risk": at_risk_count,
                "Medium Risk": medium_risk_count,
                "Low Risk": low_risk_count
            },
            "sentiment_distribution": dict(sentiment_distribution),
            "top_recommendations": enhanced_recommendations,
            "department_trend": department_trend,
            "intervention_queue": intervention_queue[:5] if intervention_queue else [],  # Top 5 for dashboard
        }
        print(f"Faculty overview intervention_queue: {len(result['intervention_queue'])} items")
        return result

    def at_risk_students(self) -> list[dict]:
        students = self.db.scalars(select(Student)).all()
        items = []
        for student in students:
            analytics = self.get_student_analytics(student.id)
            if analytics["predicted_risk"] != "Low Risk":
                items.append(
                    {
                        "student_id": student.id,
                        "full_name": student.full_name,
                        "roll_no": student.roll_no,
                        "predicted_risk": analytics["predicted_risk"],
                        "attendance_rate": student.attendance_rate,
                        "average_marks": analytics["average_marks"],
                        "sentiment": analytics["sentiment"],
                    }
                )
        return items

    def get_organized_students(self) -> dict:
        """Organize students by department and semester hierarchy with statistics"""
        students = self.db.scalars(select(Student)).all()
        
        # Simple organization - just return student list with department info
        organized = []
        
        for student in students:
            avg_marks = self._average_marks(student.id)
            if student.attendance_rate < 55 or avg_marks < 50:
                risk_level = "High Risk"
            elif student.attendance_rate < 72 or avg_marks < 65:
                risk_level = "Medium Risk"
            else:
                risk_level = "Low Risk"
            
            student_data = {
                "id": int(student.id),
                "name": str(student.full_name),
                "roll_no": str(student.roll_no),
                "department": str(student.department),
                "semester": int(student.semester),
                "attendance_rate": round(float(student.attendance_rate), 2),
                "engagement_score": round(float(student.engagement_score), 2),
                "self_reflection_score": round(float(student.self_reflection_score), 2),
                "risk_level": str(risk_level),
                "average_marks": round(float(avg_marks), 2)
            }
            organized.append(student_data)
        
        return {"students": organized}

    def _calculate_department_stats(self, students: list) -> dict:
        """Calculate aggregate statistics for a department"""
        if not students:
            return {
                "total_students": 0,
                "average_attendance": 0.0,
                "average_engagement": 0.0,
                "average_marks": 0.0,
                "risk_distribution": {"High Risk": 0, "Medium Risk": 0, "Low Risk": 0},
                "high_performers": 0,
                "at_risk": 0
            }
        
        total_students = len(students)
        avg_attendance = round(float(sum(s["attendance_rate"] for s in students) / total_students), 2)
        avg_engagement = round(float(sum(s["engagement_score"] for s in students) / total_students), 2)
        avg_marks = round(float(sum(s.get("average_marks", 0) for s in students) / total_students), 2)
        
        risk_distribution = {"High Risk": 0, "Medium Risk": 0, "Low Risk": 0}
        for student in students:
            risk = student.get("risk_level", "Low Risk")
            if risk in risk_distribution:
                risk_distribution[risk] += 1
        
        high_performers = sum(1 for s in students if s["attendance_rate"] > 75 and s["engagement_score"] > 70)
        at_risk = sum(1 for s in students if s["attendance_rate"] < 60 or s["engagement_score"] < 50)
        
        return {
            "total_students": total_students,
            "average_attendance": avg_attendance,
            "average_engagement": avg_engagement,
            "average_marks": avg_marks,
            "risk_distribution": risk_distribution,
            "high_performers": high_performers,
            "at_risk": at_risk
        }

    def _calculate_semester_stats(self, students: list) -> dict:
        """Calculate aggregate statistics for a semester"""
        if not students:
            return {
                "total_students": 0,
                "average_attendance": 0.0,
                "average_engagement": 0.0,
                "average_marks": 0.0,
                "high_performers": 0,
                "at_risk": 0
            }
        
        total_students = len(students)
        avg_attendance = round(float(sum(s["attendance_rate"] for s in students) / total_students), 2)
        avg_engagement = round(float(sum(s["engagement_score"] for s in students) / total_students), 2)
        
        high_performers = sum(1 for s in students if s["attendance_rate"] > 75 and s["engagement_score"] > 70)
        at_risk = sum(1 for s in students if s["attendance_rate"] < 60 or s["engagement_score"] < 50)
        
        return {
            "total_students": total_students,
            "average_attendance": avg_attendance,
            "average_engagement": avg_engagement,
            "high_performers": high_performers,
            "at_risk": at_risk
        }

    def filter_students(self, department: str | None = None, semester: int | None = None, limit: int = 50) -> list[dict]:
        """Filter students by department and/or semester"""
        query = select(Student)
        
        if department:
            query = query.where(Student.department == department)
        if semester:
            query = query.where(Student.semester == semester)
        
        students = self.db.scalars(query.order_by(Student.id.asc()).limit(limit)).all()
        
        return [
            {
                "id": student.id,
                "roll_no": student.roll_no,
                "full_name": student.full_name,
                "semester": student.semester,
                "department": student.department,
                "attendance_rate": student.attendance_rate,
                "engagement_score": student.engagement_score,
                "self_reflection_score": student.self_reflection_score,
            }
            for student in students
        ]

    def get_department_analytics(self, department: str) -> dict:
        """Get aggregated analytics for a specific department"""
        students = self.db.scalars(
            select(Student).where(Student.department == department)
        ).all()
        
        student_data = []
        for student in students:
            try:
                analytics = self.get_student_analytics(student.id)
                student_data.append({
                    "attendance_rate": student.attendance_rate,
                    "engagement_score": student.engagement_score,
                    "risk_level": analytics["predicted_risk"],
                    "average_marks": analytics["average_marks"]
                })
            except Exception:
                student_data.append({
                    "attendance_rate": student.attendance_rate,
                    "engagement_score": student.engagement_score,
                    "risk_level": "Unknown",
                    "average_marks": self._average_marks(student.id)
                })
        
        return {
            "department": department,
            "total_students": len(students),
            "semester_distribution": self._get_semester_distribution(students),
            **self._calculate_department_stats(student_data)
        }

    def get_semester_analytics(self, semester: int) -> dict:
        """Get aggregated analytics for a specific semester"""
        students = self.db.scalars(
            select(Student).where(Student.semester == semester)
        ).all()
        
        student_data = []
        for student in students:
            try:
                analytics = self.get_student_analytics(student.id)
                student_data.append({
                    "attendance_rate": student.attendance_rate,
                    "engagement_score": student.engagement_score,
                    "risk_level": analytics["predicted_risk"],
                    "average_marks": analytics["average_marks"]
                })
            except Exception:
                student_data.append({
                    "attendance_rate": student.attendance_rate,
                    "engagement_score": student.engagement_score,
                    "risk_level": "Unknown",
                    "average_marks": self._average_marks(student.id)
                })
        
        return {
            "semester": semester,
            "total_students": len(students),
            "department_distribution": self._get_department_distribution(students),
            **self._calculate_department_stats(student_data)
        }

    def _get_semester_distribution(self, students: list) -> dict:
        """Get distribution of students across semesters"""
        semesters = {}
        for student in students:
            sem = f"Semester {student.semester}"
            semesters[sem] = semesters.get(sem, 0) + 1
        return semesters

    def _get_department_distribution(self, students: list) -> dict:
        """Get distribution of students across departments"""
        departments = {}
        for student in students:
            dept = student.department
            departments[dept] = departments.get(dept, 0) + 1
        return departments
