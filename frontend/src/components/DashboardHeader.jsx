import { GraduationCap, Users, Shield, LayoutDashboard, Menu, X } from "lucide-react";
import { useState } from "react";

export function DashboardHeader({ view, setView }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const viewConfig = [
    { id: "faculty", label: "Faculty View", icon: GraduationCap },
    { id: "student", label: "Student View", icon: Users },
    { id: "admin", label: "Admin View", icon: Shield },
  ];

  return (
    <header className="border-b border-primary/10 bg-white/80 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2">
            <LayoutDashboard className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-primary/70">Academic Analytics</p>
            <h1 className="font-display text-xl sm:text-2xl text-primary">Student-Centered Analysis</h1>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-2 rounded-full bg-sand p-1">
          {viewConfig.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  view === item.id ? "bg-primary text-white shadow-md" : "text-primary hover:bg-white"
                }`}
                onClick={() => setView(item.id)}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden rounded-full p-2 hover:bg-sand transition"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6 text-primary" /> : <Menu className="h-6 w-6 text-primary" />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-primary/10 bg-white/95 px-4 py-4">
          <div className="flex flex-col gap-2">
            {viewConfig.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    view === item.id ? "bg-primary text-white" : "text-primary hover:bg-sand"
                  }`}
                  onClick={() => {
                    setView(item.id);
                    setMobileMenuOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
