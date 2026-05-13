import { LucideIcon } from "lucide-react";
import { Link } from "react-router";

interface QuickActionProps {
  to: string;
  icon: LucideIcon;
  title: string;
  description: string;
  color: string;
  iconBg: string;
}

export function QuickAction({
  to,
  icon: Icon,
  title,
  description,
  color,
  iconBg,
}: QuickActionProps) {
  return (
    <Link to={to}>
      <div className="group premium-card p-6 hover:scale-[1.02] transition-all duration-300">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
          style={{ background: iconBg }}
        >
          <Icon className="w-7 h-7" style={{ color }} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {description}
        </p>
      </div>
    </Link>
  );
}
