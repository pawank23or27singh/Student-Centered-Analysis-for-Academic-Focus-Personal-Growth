import { useState, useEffect } from "react";
import { Users, UserCheck, AlertTriangle, FileText, Shield, Database, Download, Upload, History, Settings, Activity } from "lucide-react";
import { MetricCard } from "../components/MetricCard";

export function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [students, setStudents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [systemConfig, setSystemConfig] = useState({});
  const [riskConfig, setRiskConfig] = useState({ attendance_threshold: 60, engagement_threshold: 50, reflection_threshold: 50 });
  const [loading, setLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [newUser, setNewUser] = useState({ username: "", full_name: "", role: "student", password: "" });
  const [bulkImportData, setBulkImportData] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [importMethod, setImportMethod] = useState("file");

  useEffect(() => {
    loadAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === "logs") {
      loadActivityLogs();
    }
    if (activeTab === "settings") {
      loadSystemConfig();
      loadRiskConfig();
    }
  }, [activeTab]);

  async function loadAdminData() {
    setLoading(true);
    try {
      const [statsRes, usersRes, studentsRes] = await Promise.all([
        fetch("http://127.0.0.1:8080/api/admin/stats"),
        fetch("http://127.0.0.1:8080/api/admin/users"),
        fetch("http://127.0.0.1:8080/api/admin/students/list"),
      ]);
      
      const statsData = await statsRes.json();
      const usersData = await usersRes.json();
      const studentsData = await studentsRes.json();
      
      setStats(statsData);
      setUsers(usersData);
      setStudents(studentsData);
    } catch (error) {
      console.error("Failed to load admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadActivityLogs() {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/activity-logs?limit=50");
      const logs = await response.json();
      setActivityLogs(logs);
    } catch (error) {
      console.error("Failed to load activity logs:", error);
    }
  }

  async function loadSystemConfig() {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/system-config");
      const config = await response.json();
      setSystemConfig(config);
    } catch (error) {
      console.error("Failed to load system config:", error);
    }
  }

  async function loadRiskConfig() {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/risk-config");
      const config = await response.json();
      setRiskConfig(config);
    } catch (error) {
      console.error("Failed to load risk config:", error);
    }
  }

  async function handleCreateUser(e) {
    e.preventDefault();
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      
      if (response.ok) {
        setShowUserModal(false);
        setNewUser({ username: "", full_name: "", role: "student", password: "" });
        loadAdminData();
      }
    } catch (error) {
      console.error("Failed to create user:", error);
    }
  }

  async function handleDeleteUser(userId) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        loadAdminData();
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  }

  async function handleDeleteStudent(studentId) {
    if (!confirm("Are you sure you want to delete this student and all their data?")) return;
    
    try {
      const response = await fetch(`http://127.0.0.1:8080/api/admin/students/${studentId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        loadAdminData();
      }
    } catch (error) {
      console.error("Failed to delete student:", error);
    }
  }

  async function handleResetDatabase() {
    if (!confirm("⚠️ WARNING: This will delete ALL data except the admin user. This action cannot be undone. Continue?")) return;
    
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/reset-database", {
        method: "POST",
      });
      
      if (response.ok) {
        alert("Database reset successfully. Please refresh the page.");
        loadAdminData();
      }
    } catch (error) {
      console.error("Failed to reset database:", error);
    }
  }

  async function handleBulkImport(e) {
    e.preventDefault();
    try {
      let students = [];
      
      if (importMethod === "file" && csvFile) {
        // Parse CSV file with better error handling
        const text = await csvFile.text();
        console.log("CSV File Content (first 500 chars):", text.substring(0, 500)); // Debug log
        
        const lines = text.trim().split('\n');
        console.log("Number of lines:", lines.length); // Debug log
        
        // Skip header row if it exists
        const startIndex = lines[0].toLowerCase().includes('roll_no') ? 1 : 0;
        
        students = lines.slice(startIndex).map((line, index) => {
          const parts = line.split(',');
          console.log(`Line ${index + 1}:`, parts); // Debug log
          
          if (parts.length < 7) {
            console.error(`Line ${index + 1} has insufficient columns:`, parts);
            return null;
          }
          
          const [roll_no, full_name, semester, department, attendance, engagement, reflection] = parts;
          
          // Validate data
          const parsedSemester = parseInt(semester.trim());
          const parsedAttendance = parseFloat(attendance.trim());
          const parsedEngagement = parseFloat(engagement.trim());
          const parsedReflection = parseFloat(reflection.trim());
          
          if (isNaN(parsedSemester) || isNaN(parsedAttendance) || isNaN(parsedEngagement) || isNaN(parsedReflection)) {
            console.error(`Line ${index + 1} has invalid numeric data`);
            return null;
          }
          
          return {
            roll_no: roll_no.trim(),
            full_name: full_name.trim(),
            semester: parsedSemester,
            department: department.trim(),
            attendance_rate: parsedAttendance,
            engagement_score: parsedEngagement,
            self_reflection_score: parsedReflection,
          };
        }).filter(student => student !== null); // Remove failed parses
        
        console.log("Successfully parsed students:", students.length); // Debug log
      } else {
        // Parse text input
        const lines = bulkImportData.trim().split('\n');
        const startIndex = lines[0].toLowerCase().includes('roll_no') ? 1 : 0;
        
        students = lines.slice(startIndex).map(line => {
          const [roll_no, full_name, semester, department, attendance, engagement, reflection] = line.split(',');
          return {
            roll_no: roll_no.trim(),
            full_name: full_name.trim(),
            semester: parseInt(semester),
            department: department.trim(),
            attendance_rate: parseFloat(attendance) || 0,
            engagement_score: parseFloat(engagement) || 0,
            self_reflection_score: parseFloat(reflection) || 0,
          };
        });
      }

      if (students.length === 0) {
        alert("No valid student data found. Please check your CSV format.\n\nExpected format: roll_no,full_name,semester,department,attendance,engagement,reflection");
        return;
      }

      console.log("Sending students to backend:", students.length); // Debug log
      console.log("Sample student data:", students[0]); // Debug log

      const response = await fetch("http://127.0.0.1:8080/api/admin/students/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(students),
      });
      
      const result = await response.json();
      console.log("Backend response:", result); // Debug log
      
      if (response.ok) {
        alert(`✅ Import completed successfully!\n\n📊 Results:\n✓ ${result.success_count} students imported\n✗ ${result.failed_count} students failed`);
        if (result.errors.length > 0) {
          console.error("Import errors:", result.errors);
        }
        setShowBulkImportModal(false);
        setBulkImportData("");
        setCsvFile(null);
        setImportMethod("file");
        loadAdminData();
      } else {
        console.error("Backend error:", result);
        alert("❌ Import failed: " + (result.detail || JSON.stringify(result)));
      }
    } catch (error) {
      console.error("Failed to bulk import:", error);
      alert("❌ Failed to import students: " + error.message);
    }
  }

  async function handleBackup() {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/backup", {
        method: "POST",
      });
      
      const backupData = await response.json();
      
      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Backup downloaded successfully");
    } catch (error) {
      console.error("Failed to create backup:", error);
    }
  }

  async function handleUpdateRiskConfig() {
    try {
      const response = await fetch("http://127.0.0.1:8080/api/admin/risk-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(riskConfig),
      });
      
      if (response.ok) {
        alert("Risk configuration updated successfully");
      }
    } catch (error) {
      console.error("Failed to update risk config:", error);
    }
  }

  if (loading) {
    return (
      <div className="rounded-3xl bg-white/80 p-10 text-center shadow-panel">
        <p className="font-display text-2xl text-primary">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 rounded-xl bg-white/90 p-2 shadow-panel">
        {[
          { id: "overview", label: "Overview", icon: Shield },
          { id: "users", label: "Users", icon: Users },
          { id: "students", label: "Students", icon: UserCheck },
          { id: "logs", label: "Activity Logs", icon: History },
          { id: "settings", label: "Settings", icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id ? "bg-primary text-white" : "text-slate-600 hover:bg-sand"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard 
              title="Total Students" 
              value={stats.total_students} 
              subtitle="Active enrolled students" 
              icon={Users}
              color="primary"
            />
            <MetricCard 
              title="Total Faculty" 
              value={stats.total_faculty} 
              subtitle="Teaching staff members" 
              icon={UserCheck}
              color="success"
            />
            <MetricCard 
              title="At-Risk Students" 
              value={stats.at_risk_students} 
              subtitle="Students requiring intervention" 
              icon={AlertTriangle}
              color="danger"
            />
            <MetricCard 
              title="Total Assessments" 
              value={stats.total_assessments} 
              subtitle="Recorded evaluations" 
              icon={FileText}
              color="purple"
            />
          </section>

          <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Quick Actions</p>
                <h2 className="font-display text-2xl text-primary">System Management</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <button
                onClick={handleBackup}
                className="flex items-center gap-3 rounded-xl border border-primary/20 bg-surface/50 p-4 hover:border-accent hover:bg-accent/5 transition"
              >
                <Download className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-primary">Download Backup</p>
                  <p className="text-sm text-slate-600">Export all system data as JSON</p>
                </div>
              </button>
              <button
                onClick={() => setShowBulkImportModal(true)}
                className="flex items-center gap-3 rounded-xl border border-primary/20 bg-surface/50 p-4 hover:border-accent hover:bg-accent/5 transition"
              >
                <Upload className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <p className="font-semibold text-primary">Bulk Import Students</p>
                  <p className="text-sm text-slate-600">Import multiple students at once</p>
                </div>
              </button>
            </div>
          </section>

          <section className="rounded-[2rem] bg-red-50/90 p-6 shadow-panel border border-red-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-red-600/60">Danger Zone</p>
                <h2 className="font-display text-2xl text-red-700">System Reset</h2>
                <p className="mt-2 text-sm text-red-600/80">
                  This will permanently delete all students, assessments, feedback, and users except the admin account.
                </p>
              </div>
              <button
                onClick={handleResetDatabase}
                className="rounded-full bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700 transition"
              >
                Reset Database
              </button>
            </div>
          </section>
        </>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">User Management</p>
              <h2 className="font-display text-2xl text-primary">System Users</h2>
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 transition"
            >
              + Add User
            </button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Username</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Full Name</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Role</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-primary/5 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-primary">{user.username}</td>
                    <td className="px-4 py-3 text-slate-700">{user.full_name}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        user.role === "admin" ? "bg-red-100 text-red-700" :
                        user.role === "faculty" ? "bg-blue-100 text-blue-700" :
                        "bg-green-100 text-green-700"
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {user.username !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 transition"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Student Management</p>
              <h2 className="font-display text-2xl text-primary">Enrolled Students</h2>
            </div>
            <button
              onClick={() => setShowBulkImportModal(true)}
              className="rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 transition"
            >
              + Bulk Import
            </button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Roll No</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Name</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Department</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Attendance</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Engagement</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id} className="border-b border-primary/5 hover:bg-surface/50">
                    <td className="px-4 py-3 font-medium text-primary">{student.roll_no}</td>
                    <td className="px-4 py-3 text-slate-700">{student.full_name}</td>
                    <td className="px-4 py-3 text-slate-600">{student.department}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        student.attendance_rate < 60 ? "text-red-600" : "text-green-600"
                      }`}>
                        {student.attendance_rate}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${
                        student.engagement_score < 50 ? "text-red-600" : "text-green-600"
                      }`}>
                        {student.engagement_score}%
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-800 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Activity Logs Tab */}
      {activeTab === "logs" && (
        <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">System Monitoring</p>
              <h2 className="font-display text-2xl text-primary">Activity Logs</h2>
            </div>
            <button
              onClick={loadActivityLogs}
              className="rounded-full bg-primary px-6 py-3 font-semibold text-white hover:bg-primary/90 transition"
            >
              Refresh
            </button>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-primary/10">
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">User</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Action</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">Details</th>
                  <th className="px-4 py-3 text-left text-sm uppercase tracking-[0.2em] text-primary/60">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                      No activity logs found
                    </td>
                  </tr>
                ) : (
                  activityLogs.map((log) => (
                    <tr key={log.id} className="border-b border-primary/5 hover:bg-surface/50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-primary">{log.username}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{log.details || "-"}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{log.ip_address || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Settings Tab */}
      {activeTab === "settings" && (
        <div className="space-y-6">
          <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Risk Configuration</p>
              <h2 className="font-display text-2xl text-primary">Risk Thresholds</h2>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Attendance Threshold (%)</label>
                <input
                  type="number"
                  value={riskConfig.attendance_threshold}
                  onChange={(e) => setRiskConfig({...riskConfig, attendance_threshold: parseFloat(e.target.value)})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Engagement Threshold (%)</label>
                <input
                  type="number"
                  value={riskConfig.engagement_threshold}
                  onChange={(e) => setRiskConfig({...riskConfig, engagement_threshold: parseFloat(e.target.value)})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Reflection Threshold (%)</label>
                <input
                  type="number"
                  value={riskConfig.reflection_threshold}
                  onChange={(e) => setRiskConfig({...riskConfig, reflection_threshold: parseFloat(e.target.value)})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                />
              </div>
            </div>
            <button
              onClick={handleUpdateRiskConfig}
              className="mt-6 rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 transition"
            >
              Update Risk Configuration
            </button>
          </section>

          <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">System Configuration</p>
              <h2 className="font-display text-2xl text-primary">Current Settings</h2>
            </div>
            <div className="mt-6 space-y-3">
              {Object.entries(systemConfig).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between rounded-xl bg-surface/50 p-4">
                  <div>
                    <p className="font-medium text-primary">{key}</p>
                    <p className="text-sm text-slate-600">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* User Creation Modal */}
      {showUserModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="rounded-[2rem] bg-white p-8 shadow-panel max-w-md w-full mx-4">
            <h3 className="font-display text-2xl text-primary mb-6">Add New User</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Full Name</label>
                <input
                  type="text"
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="faculty">Faculty</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none"
                  required
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="flex-1 rounded-full border border-primary/30 px-6 py-3 font-semibold text-primary hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showBulkImportModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="rounded-[2rem] bg-white p-8 shadow-panel max-w-2xl w-full mx-4">
            <h3 className="font-display text-2xl text-primary mb-6">Bulk Import Students</h3>
            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-2">Import Method</label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setImportMethod("file")}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                      importMethod === "file" 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-primary/20 text-slate-600 hover:border-primary/40"
                    }`}
                  >
                    📁 Upload CSV File
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportMethod("text")}
                    className={`flex-1 rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                      importMethod === "text" 
                        ? "border-accent bg-accent/10 text-accent" 
                        : "border-primary/20 text-slate-600 hover:border-primary/40"
                    }`}
                  >
                    📝 Paste CSV Data
                  </button>
                </div>
              </div>

              {importMethod === "file" ? (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Upload CSV File (format: roll_no,full_name,semester,department,attendance,engagement,reflection)
                  </label>
                  <div className="rounded-xl border-2 border-dashed border-primary/30 p-8 text-center hover:border-accent transition">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent file:text-white hover:file:bg-accent/90"
                      required
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Supported format: CSV with columns - roll_no, full_name, semester, department, attendance, engagement, reflection
                    </p>
                  </div>
                  {csvFile && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                      <span>✓</span>
                      <span>{csvFile.name}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-primary mb-2">
                    Student Data (CSV format: roll_no,full_name,semester,department,attendance,engagement,reflection)
                  </label>
                  <textarea
                    value={bulkImportData}
                    onChange={(e) => setBulkImportData(e.target.value)}
                    className="w-full rounded-xl border border-primary/20 px-4 py-3 focus:border-accent focus:outline-none h-48 font-mono text-sm"
                    placeholder="CSE2026001,John Doe,6,Computer Science,85,75,80&#10;CSE2026002,Jane Smith,6,Computer Science,90,85,88"
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBulkImportModal(false);
                    setCsvFile(null);
                    setBulkImportData("");
                    setImportMethod("file");
                  }}
                  className="flex-1 rounded-full border border-primary/30 px-6 py-3 font-semibold text-primary hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-full bg-accent px-6 py-3 font-semibold text-white hover:bg-accent/90 transition"
                >
                  Import Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}