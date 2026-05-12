import { Link, useLocation } from "react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Plus,
  Magnet,
  FileText,
  Settings,
  Sparkles,
  LogOut,
  HelpCircle,
  Menu,
  X,
  WandSparkles,
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
      className={`group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
        isActive
          ? "bg-[var(--brand-soft)] text-[var(--brand)] shadow-sm"
          : "text-[var(--text-secondary)] hover:bg-white hover:text-[var(--text-primary)] hover:shadow-sm"
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          isActive
            ? "border-white bg-white text-[var(--brand)] shadow-sm"
            : "border-transparent bg-[var(--bg-overlay)] text-[var(--text-muted)] group-hover:border-[var(--border)] group-hover:bg-white group-hover:text-[var(--brand)]"
        }`}
      >
        {icon}
      </span>
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
        className="md:hidden fixed top-4 left-4 z-40 w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
        style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)" }}
      >
        <Menu className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-slate-950/35 backdrop-blur-sm z-40"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:relative h-screen md:h-[calc(100vh-2rem)] flex flex-col z-50
          transition-transform duration-300
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        style={{
          width: "276px",
          background: "rgba(255, 255, 255, 0.76)",
          border: "1px solid var(--glass-border)",
          borderRadius: "28px",
          boxShadow: "var(--shadow-md)",
          backdropFilter: "blur(18px)",
        }}
      >
        {/* Mobile Close Button */}
        <button
          onClick={closeMobile}
          className="md:hidden absolute top-4 right-4 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "var(--bg-elevated)" }}
        >
          <X className="w-4 h-4" style={{ color: "var(--text-primary)" }} />
        </button>

        {/* Logo */}
        <div className="p-5 pb-4">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={closeMobile}>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
              style={{ background: "linear-gradient(135deg, #111827, #635BFF)" }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold leading-tight" style={{ color: "var(--text-primary)" }}>Traffic Magnet</h1>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                AI growth studio
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5" onClick={closeMobile}>
          <SidebarLink to="/start" icon={<WandSparkles className="w-4 h-4" />} label="Start Here" />
          <SidebarLink
            to="/dashboard"
            icon={<LayoutDashboard className="w-4 h-4" />}
            label="Dashboard"
          />
          <SidebarLink to="/projects/new" icon={<Plus className="w-4 h-4" />} label="New Project" />
          <SidebarLink to="/magnets" icon={<Magnet className="w-4 h-4" />} label="My Magnets" />
          <SidebarLink
            to="/content"
            icon={<FileText className="w-4 h-4" />}
            label="Content Wrapper"
          />
          <SidebarLink to="/faq" icon={<HelpCircle className="w-4 h-4" />} label="Help & FAQ" />
          <SidebarLink to="/settings" icon={<Settings className="w-4 h-4" />} label="Settings" />
        </nav>

        {/* User Footer */}
        <div className="p-4">
          {user && (
            <div className="flex items-center gap-3 mb-3 rounded-2xl border border-[var(--border)] bg-white/70 p-3">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center font-semibold text-white shadow-sm"
                style={{ background: "linear-gradient(135deg, var(--brand), var(--accent-cyan))" }}
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
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all hover:bg-red-50 hover:text-red-600"
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
