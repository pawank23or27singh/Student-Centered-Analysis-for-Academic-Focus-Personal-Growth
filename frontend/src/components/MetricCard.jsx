export function MetricCard({ title, value, subtitle, icon: Icon, trend, color = "primary" }) {
  const colorClasses = {
    primary: "bg-blue-50 text-blue-600",
    success: "bg-green-50 text-green-600",
    warning: "bg-orange-50 text-orange-600",
    danger: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-3xl bg-white/90 p-6 shadow-panel hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm uppercase tracking-[0.28em] text-primary/60">{title}</p>
          <p className="mt-4 font-display text-4xl text-primary">{value}</p>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
          {trend && (
            <div className={`mt-3 flex items-center gap-1 text-sm font-medium ${
              trend > 0 ? "text-green-600" : "text-red-600"
            }`}>
              {trend > 0 ? "↑" : "↓"} {Math.abs(trend)}%
            </div>
          )}
        </div>
        {Icon && (
          <div className={`rounded-2xl p-3 ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </div>
  );
}
