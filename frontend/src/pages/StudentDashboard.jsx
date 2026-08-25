import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MetricCard } from "../components/MetricCard";
import { RecommendationPanel } from "../components/RecommendationPanel";
import { StudentSelector } from "../components/StudentSelector";

export function StudentDashboard({ students, selectedStudentId, setSelectedStudentId, analytics }) {
  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-8 xl:grid-cols-[320px_1fr]">
        <StudentSelector
          students={students}
          selectedStudentId={selectedStudentId}
          setSelectedStudentId={setSelectedStudentId}
        />
        <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Student profile</p>
          <h2 className="mt-2 font-display text-3xl text-primary">{analytics.student.full_name}</h2>
          <p className="mt-2 text-slate-600">
            {analytics.student.roll_no} • Semester {analytics.student.semester} • {analytics.student.department}
          </p>
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Risk level" value={analytics.predicted_risk} subtitle={`Confidence ${analytics.confidence}`} />
            <MetricCard title="Average marks" value={`${analytics.average_marks}%`} subtitle="Across quizzes, assignments, and internals" />
            <MetricCard title="Sentiment" value={analytics.sentiment} subtitle="Latest reflective feedback classification" />
            <MetricCard title="Forecast GPA" value={analytics.forecast_gpa} subtitle="Forward-looking academic projection" />
          </div>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Weekly trend</p>
          <h2 className="font-display text-2xl text-primary">Marks and attendance momentum</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.weekly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dee2" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="marks" stroke="#124E66" strokeWidth={3} />
                <Line type="monotone" dataKey="attendance" stroke="#F58B54" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <RecommendationPanel items={analytics.recommendations} />
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Engagement pulse</p>
          <h2 className="font-display text-2xl text-primary">Participation and completion</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.weekly_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dee2" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="engagement" fill="#124E66" stroke="#124E66" fillOpacity={0.2} />
                <Area type="monotone" dataKey="completion" fill="#F58B54" stroke="#F58B54" fillOpacity={0.16} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid gap-8">
          <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Strengths</p>
            <h2 className="font-display text-2xl text-primary">What is going well</h2>
            <div className="mt-5 space-y-3">
              {analytics.strengths.map((item) => (
                <div key={item} className="rounded-2xl bg-emerald-50 p-4 text-emerald-900">
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Improvement areas</p>
            <h2 className="font-display text-2xl text-primary">What to work on next</h2>
            <div className="mt-5 space-y-3">
              {analytics.improvement_areas.map((item) => (
                <div key={item} className="rounded-2xl bg-amber-50 p-4 text-amber-900">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
