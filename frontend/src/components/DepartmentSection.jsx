import { ChevronDown, ChevronRight } from "lucide-react";

import { SemesterSection } from "./SemesterSection";

export function DepartmentSection({ 
  department, 
  data, 
  isExpanded, 
  expandedSemesters, 
  onDepartmentToggle, 
  onSemesterToggle,
  onSelectStudent,
  selectedStudentId 
}) {
  const stats = data.department_statistics;

  return (
    <div className="rounded-2xl bg-white/90 p-6 shadow-panel">
      <button
        onClick={onDepartmentToggle}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-primary" />
          ) : (
            <ChevronRight className="h-5 w-5 text-primary" />
          )}
          <div>
            <h3 className="font-display text-xl text-primary">{department}</h3>
            <p className="text-sm text-slate-500">
              {stats.total_students} students • {stats.average_attendance}% avg attendance
            </p>
          </div>
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <p className="font-semibold text-green-600">{stats.high_performers}</p>
            <p className="text-xs text-slate-500">High performers</p>
          </div>
          <div className="text-center">
            <p className="font-semibold text-red-600">{stats.at_risk}</p>
            <p className="text-xs text-slate-500">At risk</p>
          </div>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-3 ml-8">
          {Object.entries(data.semesters).map(([semester, semesterData]) => (
            <SemesterSection
              key={semester}
              semester={semester}
              data={semesterData}
              isExpanded={expandedSemesters.has(`${department}-${semester}`)}
              onToggle={() => onSemesterToggle(`${department}-${semester}`)}
              onSelectStudent={onSelectStudent}
              selectedStudentId={selectedStudentId}
            />
          ))}
        </div>
      )}
    </div>
  );
}