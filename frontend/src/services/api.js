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
