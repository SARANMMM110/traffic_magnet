import { Link, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Sparkles,
  FolderKanban,
  FileText,
  Settings,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  TrendingUp,
  LogOut,
  Globe,
  Radar,
} from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";

interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Workspace",
    items: [
      { to: "/start", icon: Sparkles, label: "Getting Started" },
      { to: "/dashboard", icon: LayoutDashboard, label: "Overview" },
    ],
  },
  {
    title: "Build",
    items: [
      { to: "/projects/new", icon: Zap, label: "New Project" },
      { to: "/magnets", icon: FolderKanban, label: "My tools" },
      { to: "/content", icon: FileText, label: "Content Studio" },
    ],
  },
  {
    title: "Publish",
    items: [
      { to: "/audience-growth", icon: Radar, label: "Audience Engine", badge: "Core" },
      { to: "/customgpt", icon: Sparkles, label: "CustomGPT Builder" },
      { to: "/wordpress", icon: Globe, label: "WordPress Sites" },
    ],
  },
  {
    title: "Resources",
    items: [
      { to: "/faq", icon: HelpCircle, label: "Help Center" },
      { to: "/settings", icon: Settings, label: "Settings" },
    ],
  },
];

interface WorkspaceSidebarProps {
  className?: string;
}

export default function WorkspaceSidebar({ className = "" }: WorkspaceSidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const getInitials = (email: string) => {
    return email?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-5 left-5 z-50 w-11 h-11 rounded-xl bg-white/90 backdrop-blur-xl border border-slate-200/60 shadow-lg flex items-center justify-center hover:bg-white transition-all"
      >
        {isMobileOpen ? (
          <ChevronLeft className="w-5 h-5 text-slate-700" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-700" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative h-screen flex flex-col z-50 transition-all duration-300 ease-out
          ${isCollapsed ? "w-[80px]" : "w-[280px]"}
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${className}
        `}
        style={{
          background: "linear-gradient(to bottom, #FAFBFF 0%, #F7F9FC 100%)",
        }}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 p-5 ${isCollapsed ? "justify-center" : ""}`}>
          {!isCollapsed ? (
            <img 
              src="/ai-auto-traffic-logo.png" 
              alt="Ai Auto Traffic" 
              className="h-10 w-auto object-contain"
            />
          ) : (
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl blur-md opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-11 h-11 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.title}>
              {!isCollapsed && (
                <div className="px-3 mb-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {group.title}
                  </p>
                </div>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.to);

                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setIsMobileOpen(false)}
                      className={`
                        group relative flex items-center gap-3 rounded-xl transition-all duration-200
                        ${isCollapsed ? "justify-center p-3" : "px-3 py-2.5"}
                        ${
                          active
                            ? "bg-white shadow-md shadow-indigo-100/50"
                            : "hover:bg-white/60 hover:shadow-sm"
                        }
                      `}
                    >
                      {/* Active Indicator */}
                      {active && !isCollapsed && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-7 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-r-full" />
                      )}

                      {/* Icon */}
                      <div
                        className={`
                        relative flex items-center justify-center w-9 h-9 rounded-lg transition-all
                        ${
                          active
                            ? "bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200"
                            : "bg-slate-100 group-hover:bg-slate-200"
                        }
                      `}
                      >
                        <Icon
                          className={`w-4.5 h-4.5 ${active ? "text-white" : "text-slate-600"}`}
                        />
                      </div>

                      {/* Label */}
                      {!isCollapsed && (
                        <span
                          className={`flex-1 font-semibold text-sm ${
                            active ? "text-slate-900" : "text-slate-600 group-hover:text-slate-900"
                          }`}
                        >
                          {item.label}
                        </span>
                      )}

                      {/* Badge */}
                      {!isCollapsed && item.badge && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-indigo-100 text-indigo-700 rounded-md">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 border-t border-slate-200/60">
          {user && (
            <div
              className={`
              flex items-center gap-3 p-3 rounded-xl bg-white/70 backdrop-blur-sm border border-slate-200/60 mb-2
              ${isCollapsed ? "justify-center" : ""}
            `}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center font-bold text-white shadow-md">
                  {getInitials(user.google_user_data.email)}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full" />
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {user.google_user_data.name || "User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {user.google_user_data.email}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions Row */}
          <div className={`flex gap-2 ${isCollapsed ? "flex-col" : ""}`}>
            <button
              onClick={logout}
              className={`
                flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold
                text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all
                ${isCollapsed ? "w-full" : "flex-1"}
              `}
            >
              <LogOut className="w-4 h-4" />
              {!isCollapsed && <span>Sign Out</span>}
            </button>

            {/* Collapse Toggle (Desktop Only) */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex items-center justify-center w-10 h-10 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
