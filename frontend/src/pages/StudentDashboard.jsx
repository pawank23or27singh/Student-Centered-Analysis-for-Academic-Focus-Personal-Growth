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

import { useState, useEffect } from "react";

import { MetricCard } from "../components/MetricCard";
import { RecommendationPanel } from "../components/RecommendationPanel";
import { StudentSelector } from "../components/StudentSelector";
import { OrganizedStudentView } from "../components/OrganizedStudentView";
import { getOrganizedStudents } from "../services/api";

export function StudentDashboard({ students, selectedStudentId, setSelectedStudentId, analytics }) {
  const [organizedData, setOrganizedData] = useState(null);
  const [viewMode, setViewMode] = useState("organized"); // "organized" or "individual"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (viewMode === "organized") {
      loadOrganizedData();
    }
  }, [viewMode]);

  const loadOrganizedData = async () => {
    setLoading(true);
    try {
      const data = await getOrganizedStudents();
      console.log("Organized data loaded:", data);
      setOrganizedData(data);
    } catch (error) {
      console.error("Failed to load organized students:", error);
      setOrganizedData({});
    } finally {
      setLoading(false);
    }
  };

  if (!analytics) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("organized")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "organized"
                ? "bg-primary text-white"
                : "bg-surface text-slate-700 hover:bg-surface/80"
            }`}
          >
            Department View
          </button>
          <button
            onClick={() => setViewMode("individual")}
            className={`px-4 py-2 rounded-lg transition ${
              viewMode === "individual"
                ? "bg-primary text-white"
                : "bg-surface text-slate-700 hover:bg-surface/80"
            }`}
          >
            Individual View
          </button>
        </div>
      </div>

      {viewMode === "organized" ? (
        /* Organized Department View */
        <div>
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading students...</div>
          ) : organizedData && Object.keys(organizedData).length > 0 ? (
            <OrganizedStudentView
              organizedData={organizedData}
              onSelectStudent={setSelectedStudentId}
              selectedStudentId={selectedStudentId}
            />
          ) : (
            <div className="text-center py-8 text-slate-500">No student data available</div>
          )}
        </div>
      ) : (
        /* Individual Student View */
        <>
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
              <div className="mt-4 flex gap-2">
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  {analytics.student.department}
                </span>
                <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium">
                  Semester {analytics.student.semester}
                </span>
              </div>
              <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard title="Risk level" value={analytics.predicted_risk} subtitle={`Confidence ${analytics.confidence}`} />
                <MetricCard title="Average marks" value={`${analytics.average_marks}%`} subtitle="Across quizzes, assignments, and internals" />
                <MetricCard title="Sentiment" value={analytics.sentiment} subtitle="Latest reflective feedback classification" />
                <MetricCard title="Forecast GPA" value={analytics.forecast_gpa} subtitle="Forward-looking academic projection" />
              </div>
            </div>
          </section>

        </>
      )}

      {/* Show individual analytics only in individual view */}
      {viewMode === "individual" && (
        <>
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

      {/* Enhanced Recommendations Section */}
      {analytics.enhanced_recommendations && (
        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Personalized Learning Paths</p>
            <h2 className="font-display text-2xl text-primary">Course-specific focus areas</h2>
            <div className="mt-5 space-y-3">
              {analytics.enhanced_recommendations.learning_paths?.map((item, index) => (
                <div 
                  key={`learning-${index}`} 
                  className={`rounded-2xl p-4 ${
                    item.priority === 'high' ? 'bg-red-50 text-red-900' :
                    item.priority === 'medium' ? 'bg-amber-50 text-amber-900' :
                    'bg-emerald-50 text-emerald-900'
                  }`}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                  {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Peer Learning</p>
            <h2 className="font-display text-2xl text-primary">Collaborative learning opportunities</h2>
            <div className="mt-5 space-y-3">
              {analytics.enhanced_recommendations.peer_learning?.map((item, index) => (
                <div 
                  key={`peer-${index}`} 
                  className="rounded-2xl bg-blue-50 p-4 text-blue-900"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                  {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                </div>
              ))}
              {(!analytics.enhanced_recommendations.peer_learning || analytics.enhanced_recommendations.peer_learning.length === 0) && (
                <div className="rounded-2xl bg-slate-50 p-4 text-slate-600">
                  <p>No peer learning recommendations available at this time.</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Engagement Optimization</p>
            <h2 className="font-display text-2xl text-primary">Strategies to improve participation</h2>
            <div className="mt-5 space-y-3">
              {analytics.enhanced_recommendations.engagement_optimization?.map((item, index) => (
                <div 
                  key={`engagement-${index}`} 
                  className={`rounded-2xl p-4 ${
                    item.priority === 'urgent' ? 'bg-red-50 text-red-900' :
                    item.priority === 'high' ? 'bg-amber-50 text-amber-900' :
                    'bg-purple-50 text-purple-900'
                  }`}
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                  {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
            <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Study Schedule</p>
            <h2 className="font-display text-2xl text-primary">Personalized time management</h2>
            <div className="mt-5 space-y-3">
              {analytics.enhanced_recommendations.study_schedule?.map((item, index) => (
                <div 
                  key={`schedule-${index}`} 
                  className="rounded-2xl bg-teal-50 p-4 text-teal-900"
                >
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                  {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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

          {/* Enhanced Recommendations Section */}
          {analytics.enhanced_recommendations && (
            <section className="grid gap-8 lg:grid-cols-2">
              <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
                <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Personalized Learning Paths</p>
                <h2 className="font-display text-2xl text-primary">Course-specific focus areas</h2>
                <div className="mt-5 space-y-3">
                  {analytics.enhanced_recommendations.learning_paths?.map((item, index) => (
                    <div 
                      key={`learning-${index}`} 
                      className={`rounded-2xl p-4 ${
                        item.priority === 'high' ? 'bg-red-50 text-red-900' :
                        item.priority === 'medium' ? 'bg-amber-50 text-amber-900' :
                        'bg-emerald-50 text-emerald-900'
                      }`}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                      {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
                <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Peer Learning</p>
                <h2 className="font-display text-2xl text-primary">Collaborative learning opportunities</h2>
                <div className="mt-5 space-y-3">
                  {analytics.enhanced_recommendations.peer_learning?.map((item, index) => (
                    <div 
                      key={`peer-${index}`} 
                      className="rounded-2xl bg-blue-50 p-4 text-blue-900"
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                      {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                    </div>
                  ))}
                  {(!analytics.enhanced_recommendations.peer_learning || analytics.enhanced_recommendations.peer_learning.length === 0) && (
                    <div className="rounded-2xl bg-slate-50 p-4 text-slate-600">
                      <p>No peer learning recommendations available at this time.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
                <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Engagement Optimization</p>
                <h2 className="font-display text-2xl text-primary">Strategies to improve participation</h2>
                <div className="mt-5 space-y-3">
                  {analytics.enhanced_recommendations.engagement_optimization?.map((item, index) => (
                    <div 
                      key={`engagement-${index}`} 
                      className={`rounded-2xl p-4 ${
                        item.priority === 'urgent' ? 'bg-red-50 text-red-900' :
                        item.priority === 'high' ? 'bg-amber-50 text-amber-900' :
                        'bg-purple-50 text-purple-900'
                      }`}
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                      {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] bg-white/90 p-6 shadow-panel">
                <p className="text-sm uppercase tracking-[0.28em] text-primary/60">Study Schedule</p>
                <h2 className="font-display text-2xl text-primary">Personalized time management</h2>
                <div className="mt-5 space-y-3">
                  {analytics.enhanced_recommendations.study_schedule?.map((item, index) => (
                    <div 
                      key={`schedule-${index}`} 
                      className="rounded-2xl bg-teal-50 p-4 text-teal-900"
                    >
                      <p className="font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm opacity-80">{item.detail}</p>
                      {item.action && <p className="mt-2 text-xs font-medium opacity-70">→ {item.action}</p>}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
