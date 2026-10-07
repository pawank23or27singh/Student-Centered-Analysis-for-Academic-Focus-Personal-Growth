export function StudentCard({ student, isSelected, onClick }) {
  const getPerformanceColor = (value) => {
    if (value > 75) return "bg-green-500";
    if (value >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case "High Risk": return "bg-red-100 text-red-800";
      case "Medium Risk": return "bg-yellow-100 text-yellow-800";
      case "Low Risk": return "bg-green-100 text-green-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const attendanceRate = Number(student.attendance_rate) || 0;
  const engagementScore = Number(student.engagement_score) || 0;
  const averageMarks = Number(student.average_marks) || 0;
  const reflectionScore = Number(student.self_reflection_score) || 0;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl transition-all duration-200 ${
        isSelected 
          ? "bg-primary text-white shadow-lg" 
          : "bg-surface hover:bg-primary/5 hover:shadow-md"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className={`font-semibold ${isSelected ? "text-white" : "text-primary"}`}>
              {student.name}
            </p>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isSelected ? "bg-white/20 text-white" : getRiskBadgeColor(student.risk_level)
            }`}>
              {student.risk_level}
            </span>
          </div>
          <p className={`text-sm mt-1 ${isSelected ? "text-white/80" : "text-slate-500"}`}>
            {student.roll_no}
          </p>
        </div>
        <div className="text-right text-xs space-y-1">
          <div className="flex items-center gap-2">
            <span className={isSelected ? "text-white/80" : "text-slate-600"}>Attendance:</span>
            <span className={`font-semibold ${isSelected ? "text-white" : "text-green-600"}`}>
              {attendanceRate}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={isSelected ? "text-white/80" : "text-slate-600"}>Engagement:</span>
            <span className={`font-semibold ${isSelected ? "text-white" : "text-blue-600"}`}>
              {engagementScore}%
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isSelected ? "bg-white" : getPerformanceColor(attendanceRate)}`}
              style={{ width: `${Math.min(100, attendanceRate)}%` }}
            />
          </div>
          <span className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}>
            {attendanceRate}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-slate-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${isSelected ? "bg-white" : getPerformanceColor(engagementScore)}`}
              style={{ width: `${Math.min(100, engagementScore)}%` }}
            />
          </div>
          <span className={`text-xs ${isSelected ? "text-white/80" : "text-slate-500"}`}>
            {engagementScore}%
          </span>
        </div>
      </div>

      {/* Hover effect for additional metrics */}
      <div className={`mt-3 pt-3 border-t ${isSelected ? "border-white/20" : "border-slate-200"} text-xs`}>
        <div className="flex justify-between">
          <span className={isSelected ? "text-white/80" : "text-slate-600"}>
            Marks: {averageMarks.toFixed(1)}%
          </span>
          <span className={isSelected ? "text-white/80" : "text-slate-600"}>
            Reflection: {reflectionScore.toFixed(1)}%
          </span>
        </div>
      </div>
    </button>
  );
}