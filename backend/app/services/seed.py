import random
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import Alert, Assessment, Feedback, Student, User, WeeklyMetric
from app.models.entities_admin import Permission, RolePermission, SystemConfig
from app.services.admin_service import AdminService
from app.utils.security import hash_password


COURSES = [
    "Data Structures",
    "Database Systems",
    "Operating Systems",
    "Computer Networks",
    "Software Engineering",
]

FEEDBACK_BANK = {
    "positive": [
        "The weekly quizzes helped me stay focused and I feel more confident.",
        "I am improving steadily and the dashboard makes my progress clear.",
        "The assignments were challenging but useful for understanding concepts.",
    ],
    "neutral": [
        "The course is going fine and I am managing the workload.",
        "I attend classes regularly and complete most of the tasks on time.",
        "My progress is average and I need a clearer revision plan.",
    ],
    "negative": [
        "I am struggling to keep up and I feel lost before assessments.",
        "My attendance dropped and I am not confident about the next exam.",
        "The workload feels heavy and I need extra support to improve.",
    ],
}


def _risk_profile(index: int) -> tuple[float, float, float]:
    if index % 5 == 0:
        return random.uniform(45, 65), random.uniform(35, 55), random.uniform(30, 50)
    if index % 3 == 0:
        return random.uniform(60, 75), random.uniform(50, 70), random.uniform(45, 65)
    return random.uniform(75, 96), random.uniform(68, 92), random.uniform(65, 90)


def seed_database(db: Session) -> None:
    if db.scalar(select(Student.id).limit(1)):
        return

    db.add_all(
        [
            User(
                username="admin",
                full_name="System Administrator",
                role="admin",
                hashed_password=hash_password("admin123"),
            ),
            User(
                username="faculty",
                full_name="Prof. Soumali Roy",
                role="faculty",
                hashed_password=hash_password("faculty123"),
            ),
            User(
                username="student",
                full_name="Pawan Kumar",
                role="student",
                hashed_password=hash_password("student123"),
            ),
        ]
    )

    students: list[Student] = []
    base_date = date.today() - timedelta(days=70)
    for index in range(1, 31):
        attendance, engagement, reflection = _risk_profile(index)
        student = Student(
            roll_no=f"CSE2026{index:03d}",
            full_name=f"Student {index}",
            semester=6,
            department="Computer Science & Engineering",
            attendance_rate=round(attendance, 2),
            engagement_score=round(engagement, 2),
            self_reflection_score=round(reflection, 2),
        )
        students.append(student)
        db.add(student)

    db.flush()

    for idx, student in enumerate(students, start=1):
        sentiment_label = "positive" if idx % 4 else "negative" if idx % 5 == 0 else "neutral"
        for course in COURSES:
            for step, assessment_type in enumerate(["Quiz", "Assignment", "Internal"]):
                marks = max(30.0, min(98.0, random.gauss(student.engagement_score, 10)))
                db.add(
                    Assessment(
                        student_id=student.id,
                        course_name=course,
                        assessment_type=assessment_type,
                        marks_obtained=round(marks, 2),
                        max_marks=100,
                        recorded_on=base_date + timedelta(days=(step * 8) + idx),
                    )
                )

        for week in range(1, 9):
            drift = random.uniform(-5, 5)
            db.add(
                WeeklyMetric(
                    student_id=student.id,
                    week_label=f"W{week}",
                    average_marks=round(max(35, min(96, student.engagement_score + 10 + drift)), 2),
                    attendance_rate=round(max(40, min(100, student.attendance_rate + drift)), 2),
                    engagement_score=round(max(25, min(100, student.engagement_score + drift)), 2),
                    assignment_completion_rate=round(max(35, min(100, student.self_reflection_score + 20 + drift)), 2),
                )
            )

        db.add(
            Feedback(
                student_id=student.id,
                feedback_text=random.choice(FEEDBACK_BANK[sentiment_label]),
                sentiment_label=sentiment_label,
            )
        )

        if student.attendance_rate < 60 or student.engagement_score < 50:
            db.add(
                Alert(
                    student_id=student.id,
                    title="Early warning",
                    message="Attendance or engagement has fallen below the recommended threshold.",
                    severity="high" if student.attendance_rate < 55 else "medium",
                )
            )

    # Seed permissions
    if db.scalar(select(Permission.id).limit(1)) is None:
        permissions = [
            # User permissions
            ("users.create", "users", "create", "Create new users"),
            ("users.read", "users", "read", "View user information"),
            ("users.update", "users", "update", "Update user information"),
            ("users.delete", "users", "delete", "Delete users"),
            
            # Student permissions
            ("students.create", "students", "create", "Create new students"),
            ("students.read", "students", "read", "View student information"),
            ("students.update", "students", "update", "Update student information"),
            ("students.delete", "students", "delete", "Delete students"),
            
            # Analytics permissions
            ("analytics.read", "analytics", "read", "View analytics data"),
            ("analytics.export", "analytics", "export", "Export analytics data"),
            
            # System permissions
            ("system.config", "system", "config", "Modify system configuration"),
            ("system.backup", "system", "backup", "Perform system backup"),
            ("system.logs", "system", "logs", "View system logs"),
        ]
        
        for name, resource, action, description in permissions:
            db.add(Permission(name=name, resource=resource, action=action, description=description))
        
        # Assign permissions to roles
        db.flush()
        
        # Admin gets all permissions
        all_permissions = db.scalars(select(Permission)).all()
        for perm in all_permissions:
            db.add(RolePermission(role="admin", permission_id=perm.id))
        
        # Faculty gets limited permissions
        faculty_permissions = db.scalars(
            select(Permission).where(
                Permission.resource.in_(["students", "analytics"]),
                Permission.action.in_(["read", "export"])
            )
        ).all()
        for perm in faculty_permissions:
            db.add(RolePermission(role="faculty", permission_id=perm.id))
        
        # Student gets very limited permissions
        student_permissions = db.scalars(
            select(Permission).where(
                Permission.resource == "students",
                Permission.action == "read"
            )
        ).all()
        for perm in student_permissions:
            db.add(RolePermission(role="student", permission_id=perm.id))

    # Seed system configuration
    if db.scalar(select(SystemConfig.id).limit(1)) is None:
        configs = [
            ("risk.attendance_threshold", "60", "Minimum attendance percentage for low risk"),
            ("risk.engagement_threshold", "50", "Minimum engagement score for low risk"),
            ("risk.reflection_threshold", "50", "Minimum reflection score for low risk"),
            ("system.maintenance_mode", "false", "Enable maintenance mode"),
            ("system.max_upload_size", "10485760", "Maximum file upload size in bytes"),
            ("system.session_timeout", "3600", "Session timeout in seconds"),
            ("email.enabled", "false", "Enable email notifications"),
            ("email.smtp_host", "", "SMTP server host"),
            ("email.smtp_port", "587", "SMTP server port"),
        ]
        
        for key, value, description in configs:
            db.add(SystemConfig(key=key, value=value, description=description))

    db.commit()
