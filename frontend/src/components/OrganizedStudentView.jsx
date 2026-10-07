import { useState } from "react";
import { ChevronDown, ChevronRight, Users, TrendingUp, AlertTriangle } from "lucide-react";

import { DepartmentSection } from "./DepartmentSection";
import { StudentSearch } from "./StudentSearch";
import { DepartmentOverview } from "./DepartmentOverview";

export function OrganizedStudentView({ organizedData, onSelectStudent, selectedStudentId }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState(new Set());
  const [expandedSemesters, setExpandedSemesters] = useState(new Set());
  const [viewAll, setViewAll] = useState(false);

  const toggleDepartment = (department) => {
    setExpandedDepartments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(department)) {
        newSet.delete(department);
      } else {
        newSet.add(department);
      }
      return newSet;
    });
  };

  const toggleSemester = (semester) => {
    setExpandedSemesters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(semester)) {
        newSet.delete(semester);
      } else {
        newSet.add(semester);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allDepartments = Object.keys(organizedData);
    setExpandedDepartments(new Set(allDepartments));
    setExpandedSemesters(new Set());
  };

  const collapseAll = () => {
    setExpandedDepartments(new Set());
    setExpandedSemesters(new Set());
  };

  // Filter data based on search term
  const filteredData = searchTerm ? filterOrganizedData(organizedData, searchTerm) : organizedData;

  const totalStudents = Object.values(organizedData).reduce((sum, dept) => sum + dept.department_statistics.total_students, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-primary">Department-wise Student Overview</h2>
          <p className="text-slate-600 mt-1">
            {Object.keys(organizedData).length} departments • {totalStudents} total students
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-4 py-2 bg-surface text-slate-700 rounded-lg hover:bg-surface/80 transition"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <StudentSearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {/* Department Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(organizedData).map(([department, data]) => (
          <DepartmentOverview
            key={department}
            department={department}
            statistics={data.department_statistics}
            isExpanded={expandedDepartments.has(department)}
            onToggle={() => toggleDepartment(department)}
          />
        ))}
      </div>

      {/* Organized Student List */}
      <div className="space-y-4">
        {Object.entries(filteredData).map(([department, data]) => (
          <DepartmentSection
            key={department}
            department={department}
            data={data}
            isExpanded={expandedDepartments.has(department)}
            expandedSemesters={expandedSemesters}
            onDepartmentToggle={() => toggleDepartment(department)}
            onSemesterToggle={toggleSemester}
            onSelectStudent={onSelectStudent}
            selectedStudentId={selectedStudentId}
          />
        ))}
      </div>

      {Object.keys(filteredData).length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>No students found matching "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}

function filterOrganizedData(organizedData, searchTerm) {
  const term = searchTerm.toLowerCase();
  const filtered = {};

  for (const [department, data] of Object.entries(organizedData)) {
    const filteredSemesters = {};
    
    for (const [semester, semesterData] of Object.entries(data.semesters)) {
      const matchingStudents = semesterData.students.filter(student =>
        student.name.toLowerCase().includes(term) ||
        student.roll_no.toLowerCase().includes(term)
      );

      if (matchingStudents.length > 0) {
        filteredSemesters[semester] = {
          ...semesterData,
          students: matchingStudents,
          statistics: calculateSemesterStats(matchingStudents)
        };
      }
    }

    if (Object.keys(filteredSemesters).length > 0) {
      filtered[department] = {
        ...data,
        semesters: filteredSemesters,
        department_statistics: calculateDepartmentStats(
          Object.values(filteredSemesters).flatMap(s => s.students)
        )
      };
    }
  }

  return filtered;
}

function calculateSemesterStats(students) {
  if (!students.length) return { total_students: 0, average_attendance: 0, average_engagement: 0 };
  
  return {
    total_students: students.length,
    average_attendance: Math.round(students.reduce((sum, s) => sum + s.attendance_rate, 0) / students.length),
    average_engagement: Math.round(students.reduce((sum, s) => sum + s.engagement_score, 0) / students.length),
    high_performers: students.filter(s => s.attendance_rate > 75 && s.engagement_score > 70).length,
    at_risk: students.filter(s => s.attendance_rate < 60 || s.engagement_score < 50).length
  };
}

function calculateDepartmentStats(students) {
  return calculateSemesterStats(students);
}