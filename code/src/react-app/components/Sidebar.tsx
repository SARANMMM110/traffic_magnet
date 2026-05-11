import { Link, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Plus,
  Magnet,
  FileText,
  Settings,
  Zap,
  LogOut,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@getmocha/users-service/react";

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

function SidebarLink({ to, icon, label }: SidebarLinkProps) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        isActive
          ? "text-white"
          : "hover:rounded-lg"
      }`}
      style={{
        background: isActive ? "var(--brand)" : "transparent",
        color: isActive ? "white" : "var(--text-secondary)",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--bg-overlay)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
        }
      }}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const getInitials = (email: string) => {
    return email.charAt(0).toUpperCase();
  };

  const closeMobile = () => {
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <Menu className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative h-screen flex flex-col z-50
          transition-transform duration-300
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "240px",
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
        }}
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeMobile}
          className="md:hidden absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <X className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>

        {/* Logo */}
        <div className="p-6">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--brand)" }}
            >
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold leading-tight" style={{ color: "var(--text-primary)" }}>Magnet Lab</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Asset Factory
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1" onClick={closeMobile}>
          <SidebarLink to="/start" icon={<Zap className="w-5 h-5" />} label="Start Here" />
          <SidebarLink
            to="/dashboard"
            icon={<LayoutDashboard className="w-5 h-5" />}
            label="Dashboard"
          />
          <SidebarLink to="/projects/new" icon={<Plus className="w-5 h-5" />} label="New Project" />
          <SidebarLink to="/magnets" icon={<Magnet className="w-5 h-5" />} label="My Magnets" />
          <SidebarLink
            to="/content"
            icon={<FileText className="w-5 h-5" />}
            label="Content Wrapper"
          />
          <SidebarLink to="/faq" icon={<HelpCircle className="w-5 h-5" />} label="Help & FAQ" />
          <SidebarLink to="/settings" icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        {/* User Footer */}
        <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ background: "var(--brand)" }}
              >
                {getInitials(user.google_user_data.email)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                  {user.google_user_data.name || "User"}
                </p>
                <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                  {user.google_user_data.email}
                </p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm font-medium transition-all hover:bg-red-500/10"
            style={{ color: "var(--text-secondary)" }}
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}
