import { useEffect, useState } from "react";

import { DashboardHeader } from "./components/DashboardHeader";
import { Sidebar } from "./components/Sidebar";
import { AdminDashboard } from "./pages/AdminDashboard";
import { FacultyDashboard } from "./pages/FacultyDashboard";
import { StudentDashboard } from "./pages/StudentDashboard";
import { getFacultyOverview, getStudentAnalytics, getStudents } from "./services/api";

export default function App() {
  const [view, setView] = useState("faculty");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(1);
  const [facultyOverview, setFacultyOverview] = useState(null);
  const [studentAnalytics, setStudentAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      setLoading(true);
      setError(null);
      try {
        const [studentRows, faculty] = await Promise.all([getStudents(), getFacultyOverview()]);
        setStudents(studentRows);
        setFacultyOverview(faculty);
        if (studentRows.length > 0) {
          const preferredId = studentRows[0].id;
          setSelectedStudentId(preferredId);
          const analytics = await getStudentAnalytics(preferredId);
          setStudentAnalytics(analytics);
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load data. Please check if the backend is running.");
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      return;
    }
    async function loadStudent() {
      try {
        const analytics = await getStudentAnalytics(selectedStudentId);
        setStudentAnalytics(analytics);
      } catch (err) {
        console.error("Failed to load student analytics:", err);
      }
    }
    loadStudent();
  }, [selectedStudentId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Application</h1>
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,139,84,0.18),_transparent_30%),linear-gradient(180deg,_#f8f4ec_0%,_#fffdf8_55%,_#eef6f8_100%)] text-ink">
      <Sidebar 
        currentView={view} 
        setView={setView} 
        isCollapsed={sidebarCollapsed} 
        setIsCollapsed={setSidebarCollapsed} 
      />
      <div className={`transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <DashboardHeader view={view} setView={setView} />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {loading ? (
            <div className="rounded-3xl bg-white/80 p-10 text-center shadow-panel">
              <p className="font-display text-2xl text-primary">Preparing analytics workspace...</p>
            </div>
          ) : view === "admin" ? (
            <AdminDashboard />
          ) : view === "faculty" ? (
            <FacultyDashboard overview={facultyOverview} students={students} onSelectStudent={setSelectedStudentId} />
          ) : (
            <StudentDashboard
              students={students}
              selectedStudentId={selectedStudentId}
              setSelectedStudentId={setSelectedStudentId}
              analytics={studentAnalytics}
            />
          )}
        </main>
      </div>
    </div>
  );
}
