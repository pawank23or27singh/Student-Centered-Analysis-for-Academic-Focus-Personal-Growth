# Student-Centered Analysis for Academic Focus & Personal Growth

This project implements a full-stack final-year project prototype based on the requirements extracted from `Project report.pdf`. It focuses on formative assessment, student risk prediction, performance analytics, reflective feedback, early-warning intervention, enhanced recommendation system, and dashboard-based decision support for both students and faculty.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, scikit-learn
- Frontend: React, Tailwind CSS, Recharts, Vite
- Analytics: Logistic Regression, Decision Tree, Naive Bayes, trend-based GPA forecasting
- Additional: JWT Authentication, Bcrypt Password Hashing

## Features

- Student and faculty dashboards
- Seeded academic dataset for 2000+ students
- Risk prediction using attendance, engagement, reflection, and marks
- Sentiment analysis for reflective student feedback
- Weekly trend analytics for attendance, marks, engagement, and completion
- Early-warning recommendations and intervention guidance
- **Enhanced Recommendation System**:
  - Personalized learning paths based on course performance
  - Dynamic faculty intervention scoring with priority queues
  - Peer-learning recommendations using ML clustering
  - Engagement optimization strategies
  - Study schedule recommendations
- **Department-wise Student Organization**:
  - Hierarchical view by department and semester
  - Real-time search and filtering
  - Department and semester statistics
  - Color-coded performance indicators
- Clean API layer for future LMS integration

## Project Structure

```text
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
    services/
    utils/
  tests/
frontend/
  src/
    components/
    pages/
    services/
    styles/
data/
docs/
```

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or pnpm

## Environment Setup

### 1. Clone the Repository

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\Student-Centered-Analysis-Project"
```

### 2. Backend Setup

#### Install Python Dependencies

```powershell
cd backend
pip install -r requirements.txt
```

Or if you prefer using a virtual environment:

```powershell
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### Backend Dependencies (requirements.txt includes):
- fastapi
- uvicorn
- sqlalchemy
- scikit-learn
- pandas
- numpy
- python-jose
- passlib
- bcrypt

### 3. Frontend Setup

#### Install Node Dependencies

```powershell
cd frontend
npm install
```

Or using pnpm:

```powershell
cd frontend
pnpm install
```

#### Frontend Dependencies (package.json includes):
- react
- vite
- tailwindcss
- recharts
- lucide-react
- axios

## Run Project

### Start Backend Server

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\Student-Centered-Analysis-Project\backend"
python run_backend.py
```

Backend URLs:

- API root: `http://127.0.0.1:8080/api`
- Swagger docs: `http://127.0.0.1:8080/docs`
- Health check: `http://127.0.0.1:8080/api/health`

### Start Frontend Server

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\Student-Centered-Analysis-Project\frontend"
npm run dev
```

Or using pnpm:

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\Student-Centered-Analysis-Project\frontend"
pnpm dev
```

Frontend URL:

- Application: `http://localhost:5173`

### Alternative: Using Bundled Runtime

If you prefer the bundled runtime:

```powershell
# Backend
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\backend"
C:\Users\pawan\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe run_backend.py

# Frontend
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\frontend"
C:\Users\pawan\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install
C:\Users\pawan\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd dev
```

## Demo Login Accounts

| Role       | Username | Password |
|------------|----------|----------|
| Admin      | admin    | admin123 |
| Faculty    | faculty  | faculty123 |
| Student    | student  | student123 |

## Key Endpoints

### Authentication
- `POST /api/auth/login` - User login with JWT token
- `POST /api/auth/refresh` - Refresh access token

### Student Endpoints
- `GET /api/students` - List all students
- `GET /api/students/{id}` - Get student analytics
- `GET /api/students/organized` - Get students organized by department and semester
- `GET /api/students/filter` - Filter students by department and semester

### Faculty Endpoints
- `GET /api/faculty/overview` - Faculty dashboard overview
- `GET /api/insights/at-risk` - Get at-risk students

### Recommendation Endpoints
- `GET /api/recommendations/student/{student_id}` - Comprehensive student recommendations
- `GET /api/recommendations/intervention-queue` - Prioritized faculty intervention queue
- `GET /api/recommendations/peer-learning/{student_id}` - Peer learning suggestions
- `GET /api/recommendations/course-performance/{student_id}` - Course-wise performance analysis

### Admin Endpoints
- `GET /admin/stats` - System statistics
- `GET /admin/users` - List all users
- `POST /admin/users` - Create new user
- `POST /admin/students/bulk-import` - Bulk import students
- `POST /admin/backup` - Create database backup

### Export Endpoints
- `GET /api/export/student/{student_id}` - Export student report
- `GET /api/export/class` - Export class analytics

## Environment Variables

Create a `.env` file in the `backend` directory (optional - default values are used if not provided):

```env
# Database
DB_PATH=data/student_centered_analysis.db

# JWT Configuration
JWT_SECRET=student-centered-analysis-secret
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480

# Server Configuration
HOST=127.0.0.1
PORT=8080
```

## Notes

- The report requested LSTM forecasting, but the delivered MVP uses a lightweight trend forecasting module so the project stays runnable without TensorFlow.
- The architecture is modular, so TensorFlow or a true LSTM pipeline can be added later inside `backend/app/services/analytics.py`.
- Python dependencies can be installed into `backend/.vendor` and the included `run_backend.py` will automatically load them from there.
- The database is automatically seeded with demo data on first run if it doesn't exist.
- SQLite is used for simplicity in development. For production, consider PostgreSQL or MySQL.
