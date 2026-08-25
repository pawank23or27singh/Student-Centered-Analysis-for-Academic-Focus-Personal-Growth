import { AlertCircle, CheckCircle, Info, TrendingUp, UserCheck, AlertTriangle } from "lucide-react";

const iconMap = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Info,
  trend: TrendingUp,
  user: UserCheck,
  alert: AlertCircle,
};

export function RecommendationPanel({ items, title = "Recommendations" }) {
  return (
    <div className="rounded-3xl bg-white/90 p-6 shadow-panel">
      <h3 className="font-display text-2xl text-primary">{title}</h3>
      <div className="mt-5 space-y-4">
        {items.map((item, index) => {
          const Icon = item.icon ? iconMap[item.icon] : iconMap.info;
          const colorClass = item.color || "text-primary";
          
          return (
            <div 
              key={`${item.title}-${index}`} 
              className="rounded-2xl border border-primary/10 bg-sand/60 p-4 hover:border-accent/30 transition-all duration-200"
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-primary">{item.title || item}</p>
                  {item.detail ? <p className="mt-1 text-sm text-slate-700">{item.detail}</p> : null}
                  {item.action ? (
                    <button className="mt-2 text-sm font-medium text-accent hover:text-accent/80 transition">
                      {item.action}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
