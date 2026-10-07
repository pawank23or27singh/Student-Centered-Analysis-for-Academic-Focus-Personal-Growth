from collections import defaultdict
from typing import Any

import numpy as np
from sklearn.cluster import KMeans
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Assessment, Student, WeeklyMetric


class RecommendationService:
    def __init__(self, db: Session):
        self.db = db

    def get_course_performance(self, student_id: int) -> dict[str, dict]:
        """Analyze student performance by course/subject"""
        assessments = self.db.scalars(
            select(Assessment).where(Assessment.student_id == student_id)
        ).all()
        
        course_performance = defaultdict(lambda: {"total_marks": 0, "obtained_marks": 0, "count": 0})
        
        for assessment in assessments:
            course_performance[assessment.course_name]["total_marks"] += assessment.max_marks
            course_performance[assessment.course_name]["obtained_marks"] += assessment.marks_obtained
            course_performance[assessment.course_name]["count"] += 1
        
        results = {}
        for course, data in course_performance.items():
            results[course] = {
                "average_percentage": round((data["obtained_marks"] / data["total_marks"]) * 100, 2) if data["total_marks"] > 0 else 0,
                "assessment_count": data["count"],
                "total_obtained": round(data["obtained_marks"], 2),
                "total_max": round(data["total_marks"], 2)
            }
        
        return results

    def get_personalized_learning_paths(self, student_id: int) -> list[dict[str, Any]]:
        """Generate personalized learning path recommendations based on course performance"""
        course_performance = self.get_course_performance(student_id)
        student = self.db.get(Student, student_id)
        
        if not student:
            return []
        
        recommendations = []
        
        # Identify weak areas (courses below 70%)
        weak_courses = [
            (course, data) for course, data in course_performance.items() 
            if data["average_percentage"] < 70
        ]
        
        # Sort by performance (weakest first)
        weak_courses.sort(key=lambda x: x[1]["average_percentage"])
        
        for course, data in weak_courses:
            recommendations.append({
                "type": "learning_path",
                "priority": "high" if data["average_percentage"] < 50 else "medium",
                "title": f"Focus on {course}",
                "detail": f"Current performance: {data['average_percentage']}%. Prioritize revision and practice.",
                "action": "Schedule dedicated study sessions",
                "icon": "alert" if data["average_percentage"] < 50 else "warning"
            })
        
        # Identify strong areas for reinforcement
        strong_courses = [
            (course, data) for course, data in course_performance.items() 
            if data["average_percentage"] >= 75
        ]
        
        for course, data in strong_courses:
            recommendations.append({
                "type": "learning_path",
                "priority": "low",
                "title": f"Maintain excellence in {course}",
                "detail": f"Current performance: {data['average_percentage']}%. Continue current approach.",
                "action": "Share knowledge with peers",
                "icon": "success"
            })
        
        return recommendations

    def get_intervention_score(self, student_id: int) -> dict[str, Any]:
        """Calculate dynamic intervention score for faculty prioritization"""
        student = self.db.get(Student, student_id)
        if not student:
            return {"score": 0, "priority": "low", "factors": {}}
        
        score = 0
        factors = {}
        
        # Attendance factor (weight: 25%)
        attendance_factor = max(0, (75 - student.attendance_rate) / 75) * 25
        factors["attendance"] = {
            "value": student.attendance_rate,
            "weight": 25,
            "score": round(attendance_factor, 2)
        }
        score += attendance_factor
        
        # Engagement factor (weight: 20%)
        engagement_factor = max(0, (70 - student.engagement_score) / 70) * 20
        factors["engagement"] = {
            "value": student.engagement_score,
            "weight": 20,
            "score": round(engagement_factor, 2)
        }
        score += engagement_factor
        
        # Performance factor (weight: 30%)
        avg_marks = self._get_average_marks(student_id)
        performance_factor = max(0, (65 - avg_marks) / 65) * 30
        factors["performance"] = {
            "value": avg_marks,
            "weight": 30,
            "score": round(performance_factor, 2)
        }
        score += performance_factor
        
        # Trend factor (weight: 15%)
        trend_score = self._get_trend_score(student_id)
        factors["trend"] = {
            "value": trend_score,
            "weight": 15,
            "score": round(trend_score, 2)
        }
        score += trend_score
        
        # Reflection factor (weight: 10%)
        reflection_factor = max(0, (60 - student.self_reflection_score) / 60) * 10
        factors["reflection"] = {
            "value": student.self_reflection_score,
            "weight": 10,
            "score": round(reflection_factor, 2)
        }
        score += reflection_factor
        
        # Determine priority
        if score >= 60:
            priority = "urgent"
        elif score >= 40:
            priority = "high"
        elif score >= 20:
            priority = "medium"
        else:
            priority = "low"
        
        return {
            "score": round(score, 2),
            "priority": priority,
            "factors": factors
        }

    def _get_average_marks(self, student_id: int) -> float:
        """Get average marks for a student"""
        value = self.db.scalar(
            select(func.avg(Assessment.marks_obtained)).where(Assessment.student_id == student_id)
        )
        return round(float(value or 0.0), 2)

    def _get_trend_score(self, student_id: int) -> float:
        """Calculate trend score based on weekly performance changes"""
        metrics = self.db.scalars(
            select(WeeklyMetric).where(WeeklyMetric.student_id == student_id)
            .order_by(WeeklyMetric.id.asc())
        ).all()
        
        if len(metrics) < 2:
            return 0.0
        
        # Calculate trend direction (negative trend = higher intervention score)
        recent_metrics = metrics[-3:] if len(metrics) >= 3 else metrics
        marks_trend = recent_metrics[-1].average_marks - recent_metrics[0].average_marks
        attendance_trend = recent_metrics[-1].attendance_rate - recent_metrics[0].attendance_rate
        
        # Score based on negative trends
        trend_score = 0
        if marks_trend < -5:
            trend_score += 7.5
        if attendance_trend < -5:
            trend_score += 7.5
        
        return round(trend_score, 2)

    def get_peer_learning_recommendations(self, student_id: int) -> list[dict[str, Any]]:
        """Generate peer learning recommendations using clustering"""
        students = self.db.scalars(select(Student)).all()
        
        if len(students) < 3:
            return []
        
        # Prepare clustering data
        student_data = []
        student_ids = []
        
        for student in students:
            avg_marks = self._get_average_marks(student.id)
            student_data.append([
                student.attendance_rate,
                student.engagement_score,
                student.self_reflection_score,
                avg_marks
            ])
            student_ids.append(student.id)
        
        # Perform clustering
        X = np.array(student_data)
        n_clusters = min(3, len(students))
        kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
        clusters = kmeans.fit_predict(X)
        
        # Find student's cluster
        current_student = self.db.get(Student, student_id)
        if not current_student:
            return []
        
        current_avg_marks = self._get_average_marks(student_id)
        current_features = np.array([
            [current_student.attendance_rate, current_student.engagement_score, 
             current_student.self_reflection_score, current_avg_marks]
        ])
        current_cluster = kmeans.predict(current_features)[0]
        
        # Find peers in same cluster (excluding current student)
        peer_indices = [i for i, cluster in enumerate(clusters) if cluster == current_cluster and student_ids[i] != student_id]
        
        recommendations = []
        
        if peer_indices:
            # Suggest study partners
            peer_count = min(3, len(peer_indices))
            for i in range(peer_count):
                peer_idx = peer_indices[i]
                peer_student = students[peer_idx]
                peer_avg_marks = self._get_average_marks(peer_student.id)
                
                recommendations.append({
                    "type": "peer_learning",
                    "priority": "medium",
                    "title": f"Study with {peer_student.full_name}",
                    "detail": f"Similar learning pattern. Their avg marks: {peer_avg_marks}%, attendance: {peer_student.attendance_rate}%.",
                    "action": "Form study group",
                    "icon": "user"
                })
        
        # Find complementary peers (strong in areas where current student is weak)
        course_performance = self.get_course_performance(student_id)
        weak_courses = [course for course, data in course_performance.items() if data["average_percentage"] < 70]
        
        if weak_courses:
            for peer_idx in range(len(students)):
                if student_ids[peer_idx] == student_id:
                    continue
                
                peer_course_performance = self.get_course_performance(student_ids[peer_idx])
                peer_strengths = [
                    course for course, data in peer_course_performance.items() 
                    if data["average_percentage"] >= 75 and course in weak_courses
                ]
                
                if peer_strengths:
                    peer_student = students[peer_idx]
                    recommendations.append({
                        "type": "peer_learning",
                        "priority": "medium",
                        "title": f"Learn {peer_strengths[0]} from {peer_student.full_name}",
                        "detail": f"They excel in {peer_strengths[0]} ({peer_course_performance[peer_strengths[0]]['average_percentage']}%).",
                        "action": "Request peer tutoring",
                        "icon": "trend"
                    })
                    break  # Just one complementary recommendation
        
        return recommendations

    def get_engagement_optimization(self, student_id: int) -> list[dict[str, Any]]:
        """Generate engagement optimization recommendations"""
        student = self.db.get(Student, student_id)
        if not student:
            return []
        
        recommendations = []
        
        # Analyze weekly engagement patterns
        metrics = self.db.scalars(
            select(WeeklyMetric).where(WeeklyMetric.student_id == student_id)
            .order_by(WeeklyMetric.id.asc())
        ).all()
        
        if metrics:
            recent_metrics = metrics[-4:] if len(metrics) >= 4 else metrics
            avg_engagement = sum(m.engagement_score for m in recent_metrics) / len(recent_metrics)
            avg_completion = sum(m.assignment_completion_rate for m in recent_metrics) / len(recent_metrics)
            
            if avg_engagement < 60:
                recommendations.append({
                    "type": "engagement",
                    "priority": "high",
                    "title": "Boost classroom participation",
                    "detail": f"Recent engagement: {avg_engagement:.1f}%. Try asking questions and participating in discussions.",
                    "action": "Set weekly participation goals",
                    "icon": "alert"
                })
            
            if avg_completion < 70:
                recommendations.append({
                    "type": "engagement",
                    "priority": "high",
                    "title": "Improve assignment completion",
                    "detail": f"Recent completion rate: {avg_completion:.1f}%. Focus on meeting deadlines.",
                    "action": "Create assignment calendar",
                    "icon": "warning"
                })
        
        # Specific engagement strategies based on score ranges
        if student.engagement_score < 50:
            recommendations.append({
                "type": "engagement",
                "priority": "urgent",
                "title": "Active engagement restart needed",
                "detail": "Current engagement is critical. Start with small, achievable participation goals.",
                "action": "Meet with faculty advisor",
                "icon": "alert"
            })
        elif student.engagement_score < 70:
            recommendations.append({
                "type": "engagement",
                "priority": "medium",
                "title": "Gradual engagement improvement",
                "detail": "Good foundation. Increase participation by 10% each week.",
                "action": "Track engagement milestones",
                "icon": "info"
            })
        else:
            recommendations.append({
                "type": "engagement",
                "priority": "low",
                "title": "Maintain strong engagement",
                "detail": "Excellent engagement levels. Consider leadership roles in class activities.",
                "action": "Momentum maintenance plan",
                "icon": "success"
            })
        
        return recommendations

    def get_study_schedule_recommendations(self, student_id: int) -> list[dict[str, Any]]:
        """Generate personalized study schedule recommendations"""
        course_performance = self.get_course_performance(student_id)
        student = self.db.get(Student, student_id)
        
        if not student:
            return []
        
        recommendations = []
        
        # Analyze weekly patterns
        metrics = self.db.scalars(
            select(WeeklyMetric).where(WeeklyMetric.student_id == student_id)
            .order_by(WeeklyMetric.id.asc())
        ).all()
        
        if metrics:
            # Find best performing weeks
            best_week = max(metrics, key=lambda m: m.average_marks)
            worst_week = min(metrics, key=lambda m: m.average_marks)
            
            recommendations.append({
                "type": "schedule",
                "priority": "medium",
                "title": "Replicate successful patterns",
                "detail": f"Best performance in {best_week.week_label} ({best_week.average_marks}%). Analyze what worked then.",
                "action": "Document successful strategies",
                "icon": "success"
            })
            
            if worst_week.average_marks < best_week.average_marks - 10:
                recommendations.append({
                    "type": "schedule",
                    "priority": "high",
                    "title": "Address performance dips",
                    "detail": f"Lowest performance in {worst_week.week_label} ({worst_week.average_marks}%). Identify barriers.",
                    "action": "Create barrier mitigation plan",
                    "icon": "warning"
                })
        
        # Time allocation based on course difficulty
        total_study_hours = 20  # Assume 20 hours/week for study
        weak_courses = [(course, data) for course, data in course_performance.items() if data["average_percentage"] < 70]
        
        if weak_courses:
            weak_courses.sort(key=lambda x: x[1]["average_percentage"])
            hours_per_course = max(2, total_study_hours // len(weak_courses))
            
            schedule_detail = f"Allocate {hours_per_course}h/week to: {', '.join([c[0] for c in weak_courses[:3]])}"
            recommendations.append({
                "type": "schedule",
                "priority": "high",
                "title": "Prioritized time allocation",
                "detail": schedule_detail,
                "action": "Create weekly study timetable",
                "icon": "info"
            })
        
        return recommendations

    def get_comprehensive_recommendations(self, student_id: int) -> dict[str, Any]:
        """Get all types of recommendations for a student"""
        return {
            "learning_paths": self.get_personalized_learning_paths(student_id),
            "peer_learning": self.get_peer_learning_recommendations(student_id),
            "engagement_optimization": self.get_engagement_optimization(student_id),
            "study_schedule": self.get_study_schedule_recommendations(student_id),
            "intervention_score": self.get_intervention_score(student_id)
        }

    def get_faculty_intervention_queue(self) -> list[dict[str, Any]]:
        """Get prioritized intervention queue for faculty"""
        students = self.db.scalars(select(Student)).all()
        
        intervention_queue = []
        for student in students:
            intervention_data = self.get_intervention_score(student.id)
            avg_marks = self._get_average_marks(student.id)
            
            intervention_queue.append({
                "student_id": student.id,
                "full_name": student.full_name,
                "roll_no": student.roll_no,
                "intervention_score": intervention_data["score"],
                "priority": intervention_data["priority"],
                "attendance_rate": student.attendance_rate,
                "engagement_score": student.engagement_score,
                "average_marks": avg_marks,
                "factors": intervention_data["factors"]
            })
        
        # Sort by intervention score (highest first)
        intervention_queue.sort(key=lambda x: x["intervention_score"], reverse=True)
        
        return intervention_queue