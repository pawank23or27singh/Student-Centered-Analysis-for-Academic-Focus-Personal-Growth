import { ChevronDown, ChevronRight } from "lucide-react";

import { StudentCard } from "./StudentCard";

export function SemesterSection({ 
  semester, 
  data, 
  isExpanded, 
  onToggle, 
  onSelectStudent,
  selectedStudentId 
}) {
  const stats = data.statistics;

  return (
    <div className="border-l-2 border-primary/20 pl-4">
      <button
        onClick={onToggle}
        className="flex items-center gap-2 text-primary font-medium hover:text-primary/80 transition"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <span>{semester}</span>
        <span className="text-slate-500">({stats.total_students} students)</span>
        <span className="text-green-600 text-sm">• {stats.average_attendance}% avg</span>
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          {data.students.map(student => (
            <StudentCard
              key={student.id}
              student={student}
              isSelected={selectedStudentId === student.id}
              onClick={() => onSelectStudent(student.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}