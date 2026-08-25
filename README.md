# Student-Centered Analysis for Academic Focus & Personal Growth

This project implements a full-stack final-year project prototype based on the requirements extracted from `Project report.pdf`. It focuses on formative assessment, student risk prediction, performance analytics, reflective feedback, and dashboard-based decision support for both students and faculty.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite, scikit-learn
- Frontend: React, Tailwind CSS, Recharts, Vite
- Analytics: Logistic Regression, Decision Tree, Naive Bayes, trend-based GPA forecasting

## Features

- Student and faculty dashboards
- Seeded academic dataset for 30 students
- Risk prediction using attendance, engagement, reflection, and marks
- Sentiment analysis for reflective student feedback
- Weekly trend analytics for attendance, marks, engagement, and completion
- Early-warning recommendations and intervention guidance
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

## Run Backend

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\backend"
C:\Users\pawan\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe run_backend.py
```

Backend URLs:

- API root: `http://127.0.0.1:8000/`
- Swagger docs: `http://127.0.0.1:8000/docs`

Demo login accounts:

- Admin: `admin / admin123`
- Faculty: `faculty / faculty123`
- Student: `student / student123`

## Run Frontend

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\frontend"
npm install
npm run dev
```

If you prefer the bundled runtime:

```powershell
cd "C:\Users\pawan\Desktop\Final Year project\phase 2\frontend"
C:\Users\pawan\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd install
C:\Users\pawan\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd dev
```

## Key Endpoints

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/students`
- `GET /api/students/{id}`
- `GET /api/faculty/overview`
- `GET /api/insights/at-risk`

## Notes

- The report requested LSTM forecasting, but the delivered MVP uses a lightweight trend forecasting module so the project stays runnable without TensorFlow.
- The architecture is modular, so TensorFlow or a true LSTM pipeline can be added later inside `backend/app/services/analytics.py`.
- Python dependencies can be installed into `backend/.vendor` and the included `run_backend.py` will automatically load them from there.
