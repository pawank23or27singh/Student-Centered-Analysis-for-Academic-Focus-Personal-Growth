import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import { Users, TrendingUp, Award, Activity, Download } from "lucide-react";

import { MetricCard } from "../components/MetricCard";
import { RecommendationPanel } from "../components/RecommendationPanel";
import { ExportButton } from "../components/ExportButton";

const COLORS = ["#124E66", "#F58B54", "#88A0A8"];

function objectToChartData(record) {
  return Object.entries(record || {}).map(([name, value]) => ({ name, value }));
}

export function FacultyDashboard({ overview, students, onSelectStudent }) {
  if (!overview) {
    return null;
  }

  const riskData = objectToChartData(overview.risk_distribution);
  const sentimentData = objectToChartData(overview.sentiment_distribution);

  return (
    <div className="space-y-8">
      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard 
          title="Students" 
          value={overview.total_students} 
          subtitle="Active learners under formative monitoring" 
          icon={Users}
          color="primary"
          trend={2.5}
        />
        <MetricCard 
          title="Attendance" 
          value={`${overview.average_attendance}%`} 
          subtitle="Average across weekly attendance records" 
          icon={Activity}
          color="success"
          trend={1.2}
        />
        <MetricCard 
          title="Marks" 
          value={`${overview.average_marks}%`} 
          subtitle="Continuous assessment performance" 
          icon={Award}
          color="purple"
          trend={3.8}
        />
        <MetricCard 
          title="Engagement" 
          value={`${overview.average_engagement}%`} 
          subtitle="Participation and LMS activity score" 
          icon={TrendingUp}
          color="warning"
          trend={-0.5}
        />
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Department trend</p>
              <h2 className="font-display text-2xl text-primary">Academic and engagement progression</h2>
            </div>
          </div>
          <div className="mt-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={overview.department_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dee2" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="marks" stroke="#124E66" strokeWidth={3} />
                <Line type="monotone" dataKey="attendance" stroke="#F58B54" strokeWidth={3} />
                <Line type="monotone" dataKey="engagement" stroke="#88A0A8" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <RecommendationPanel items={overview.top_recommendations} title="Faculty action queue" />
      </section>

      {/* Intervention Queue Section */}
      {overview.intervention_queue && overview.intervention_queue.length > 0 && (
        <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Intervention Queue</p>
              <h2 className="font-display text-2xl text-primary">Prioritized student support</h2>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {overview.intervention_queue.map((student) => (
              <div
                key={student.student_id}
                onClick={() => onSelectStudent(student.student_id)}
                className={`rounded-2xl border p-4 cursor-pointer transition hover:-translate-y-1 hover:shadow-lg ${
                  student.priority === 'urgent' ? 'border-red-300 bg-red-50' :
                  student.priority === 'high' ? 'border-amber-300 bg-amber-50' :
                  'border-primary/10 bg-surface'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-primary">{student.full_name}</p>
                  <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${
                    student.priority === 'urgent' ? 'bg-red-200 text-red-800' :
                    student.priority === 'high' ? 'bg-amber-200 text-amber-800' :
                    'bg-emerald-200 text-emerald-800'
                  }`}>
                    {student.priority}
                  </span>
                </div>
                <p className="text-sm text-slate-600">{student.roll_no}</p>
                <div className="mt-3 flex gap-4 text-xs">
                  <span className="text-slate-500">Score: {student.intervention_score}</span>
                  <span className="text-slate-500">Attendance: {student.attendance_rate}%</span>
                  <span className="text-slate-500">Marks: {student.average_marks}%</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Risk distribution</p>
          <h2 className="font-display text-2xl text-primary">Student risk segmentation</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d7dee2" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#124E66" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
          <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Feedback sentiment</p>
          <h2 className="font-display text-2xl text-primary">Emotional engagement snapshot</h2>
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sentimentData} dataKey="value" nameKey="name" outerRadius={95}>
                  {sentimentData.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Student directory</p>
            <h2 className="font-display text-2xl text-primary">Open an individual learner profile</h2>
          </div>
          <ExportButton data={students} filename="students" label="Export Students" />
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {students.slice(0, 9).map((student) => (
            <button
              key={student.id}
              onClick={() => onSelectStudent(student.id)}
              className="rounded-3xl border border-primary/10 bg-surface p-5 text-left transition hover:-translate-y-1 hover:border-accent hover:shadow-panel"
            >
              <p className="font-semibold text-primary">{student.full_name}</p>
              <p className="mt-1 text-sm text-slate-600">{student.roll_no}</p>
              <div className="mt-4 flex gap-4 text-xs uppercase tracking-[0.2em] text-primary/60">
                <span>{student.attendance_rate}% attendance</span>
                <span>{student.engagement_score}% engagement</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
