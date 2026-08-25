import { useState } from "react";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Shield, 
  Settings, 
  Activity,
  FileText,
  Database,
  Bell,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export function Sidebar({ currentView, setView, isCollapsed, setIsCollapsed }) {
  const menuItems = [
    { id: "faculty", label: "Faculty Dashboard", icon: GraduationCap },
    { id: "student", label: "Student Dashboard", icon: Users },
    { id: "admin", label: "Admin Panel", icon: Shield },
  ];

  const adminMenuItems = [
    { id: "admin-users", label: "User Management", icon: Users },
    { id: "admin-students", label: "Student Records", icon: GraduationCap },
    { id: "admin-analytics", label: "System Analytics", icon: Activity },
    { id: "admin-settings", label: "System Settings", icon: Settings },
    { id: "admin-backup", label: "Backup & Restore", icon: Database },
    { id: "admin-logs", label: "Activity Logs", icon: FileText },
  ];

  return (
    <aside 
      className={`fixed left-0 top-0 z-40 h-screen bg-white border-r border-primary/10 transition-all duration-300 ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex items-center justify-between border-b border-primary/10 p-4">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2">
                <LayoutDashboard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-primary">SCAS</p>
                <p className="text-[10px] text-slate-500">Admin Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="rounded-full p-2 hover:bg-sand transition"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5 text-primary" /> : <ChevronLeft className="h-5 w-5 text-primary" />}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          <div className="space-y-6">
            {/* Main Views */}
            <div>
              {!isCollapsed && (
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Main Views
                </p>
              )}
              <div className="space-y-1">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setView(item.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                        isActive 
                          ? "bg-primary text-white shadow-md" 
                          : "text-slate-600 hover:bg-sand hover:text-primary"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
                      {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Admin Menu (only when in admin view) */}
            {currentView === "admin" && (
              <div>
                {!isCollapsed && (
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Admin Tools
                  </p>
                )}
                <div className="space-y-1">
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                          "text-slate-600 hover:bg-sand hover:text-primary"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${isCollapsed ? "mx-auto" : ""}`} />
                        {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-primary/10 p-4">
          <button className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition ${
            isCollapsed ? "justify-center" : "text-slate-600 hover:bg-sand hover:text-primary"
          }`}>
            <Bell className="h-5 w-5" />
            {!isCollapsed && <span className="text-sm font-medium">Notifications</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}