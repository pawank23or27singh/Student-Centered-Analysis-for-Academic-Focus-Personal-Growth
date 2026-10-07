const API_BASE = "http://127.0.0.1:8080/api";

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Request failed for ${path}: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout for ${path}. Backend may be slow or unresponsive.`);
    }
    
    console.error('API Request Error:', error);
    throw error;
  }
}

export function getStudents() {
  return request("/students");
}

export function getStudentAnalytics(studentId) {
  return request(`/students/${studentId}`);
}

export function getFacultyOverview() {
  return request("/faculty/overview");
}

export function getStudentRecommendations(studentId) {
  return request(`/recommendations/student/${studentId}`);
}

export function getInterventionQueue() {
  return request("/recommendations/intervention-queue");
}

export function getPeerLearningRecommendations(studentId) {
  return request(`/recommendations/peer-learning/${studentId}`);
}

export function getCoursePerformance(studentId) {
  return request(`/recommendations/course-performance/${studentId}`);
}

export function getOrganizedStudents() {
  return request("/students/organized").then(response => {
    // Handle the new simple format
    if (response.students) {
      // Group students by department and semester on the client side
      const organized = {};
      response.students.forEach(student => {
        const dept = student.department;
        const sem = `Semester ${student.semester}`;
        
        if (!organized[dept]) {
          organized[dept] = {
            semesters: {},
            department_statistics: {
              total_students: 0,
              average_attendance: 0,
              average_engagement: 0,
              high_performers: 0,
              at_risk: 0
            }
          };
        }
        
        if (!organized[dept].semesters[sem]) {
          organized[dept].semesters[sem] = {
            students: [],
            statistics: {
              total_students: 0,
              average_attendance: 0,
              average_engagement: 0,
              high_performers: 0,
              at_risk: 0
            }
          };
        }
        
        organized[dept].semesters[sem].students.push(student);
        organized[dept].department_statistics.total_students++;
        organized[dept].semesters[sem].statistics.total_students++;
      });
      
      // Calculate statistics
      Object.values(organized).forEach(dept => {
        const allStudents = Object.values(dept.semesters).flatMap(s => s.students);
        dept.department_statistics.average_attendance = Math.round(
          allStudents.reduce((sum, s) => sum + s.attendance_rate, 0) / allStudents.length
        );
        dept.department_statistics.average_engagement = Math.round(
          allStudents.reduce((sum, s) => sum + s.engagement_score, 0) / allStudents.length
        );
        dept.department_statistics.high_performers = allStudents.filter(
          s => s.attendance_rate > 75 && s.engagement_score > 70
        ).length;
        dept.department_statistics.at_risk = allStudents.filter(
          s => s.attendance_rate < 60 || s.engagement_score < 50
        ).length;
        
        Object.values(dept.semesters).forEach(sem => {
          sem.statistics.average_attendance = Math.round(
            sem.students.reduce((sum, s) => sum + s.attendance_rate, 0) / sem.students.length
          );
          sem.statistics.average_engagement = Math.round(
            sem.students.reduce((sum, s) => sum + s.engagement_score, 0) / sem.students.length
          );
          sem.statistics.high_performers = sem.students.filter(
            s => s.attendance_rate > 75 && s.engagement_score > 70
          ).length;
          sem.statistics.at_risk = sem.students.filter(
            s => s.attendance_rate < 60 || s.engagement_score < 50
          ).length;
        });
      });
      
      return organized;
    }
    if (response.error) {
      throw new Error(response.error);
    }
    return response;
  });
}

export function getFilteredStudents(department, semester) {
  const params = new URLSearchParams();
  if (department) params.append('department', department);
  if (semester) params.append('semester', semester);
  
  return request(`/students/filter?${params.toString()}`);
}

export function getDepartmentAnalytics(department) {
  return request(`/analytics/department/${department}`);
}

export function getSemesterAnalytics(semester) {
  return request(`/analytics/semester/${semester}`);
}
