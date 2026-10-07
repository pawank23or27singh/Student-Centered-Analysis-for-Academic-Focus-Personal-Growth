import { Users, TrendingUp, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";

export function DepartmentOverview({ department, statistics, isExpanded, onToggle }) {
  return (
    <div 
      onClick={onToggle}
      className="bg-gradient-to-br from-white to-surface rounded-2xl p-5 shadow-panel hover:shadow-lg transition-all duration-200 cursor-pointer border border-slate-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h4 className="font-display text-lg text-primary font-semibold">{department}</h4>
          <p className="text-sm text-slate-500 mt-1">
            {statistics.total_students} students
          </p>
        </div>
        {isExpanded ? (
          <ChevronDown className="h-5 w-5 text-primary" />
        ) : (
          <ChevronRight className="h-5 w-5 text-primary" />
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 bg-primary/5 rounded-xl">
          <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
          <p className="text-xl font-bold text-primary">{statistics.total_students}</p>
          <p className="text-xs text-slate-600">Students</p>
        </div>
        
        <div className="text-center p-3 bg-green-50 rounded-xl">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
          <p className="text-xl font-bold text-green-600">{statistics.average_attendance}%</p>
          <p className="text-xs text-slate-600">Attendance</p>
        </div>
        
        <div className="text-center p-3 bg-blue-50 rounded-xl">
          <Users className="h-5 w-5 mx-auto mb-1 text-blue-600" />
          <p className="text-xl font-bold text-blue-600">{statistics.average_engagement}%</p>
          <p className="text-xs text-slate-600">Engagement</p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex gap-4">
          <span className="flex items-center gap-1 text-green-600">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            {statistics.high_performers} high performers
          </span>
          <span className="flex items-center gap-1 text-red-600">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            {statistics.at_risk} at risk
          </span>
        </div>
      </div>
    </div>
  );
}