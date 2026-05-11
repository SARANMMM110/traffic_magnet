import { ReactNode } from "react";
import { Link } from "react-router";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {/* Icon */}
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-3xl"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-strong)",
        }}
      >
        {icon}
      </div>

      {/* Title */}
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

      {/* Description */}
      <p
        className="text-sm max-w-md mb-6"
        style={{ color: "var(--text-secondary)" }}
      >
        {description}
      </p>

      {/* CTA */}
      {ctaLabel && (ctaHref || onCtaClick) && (
        <>
          {ctaHref ? (
            <Link to={ctaHref}>
              <button
                className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
                style={{
                  background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                  boxShadow: "0 0 20px var(--brand-glow)",
                }}
              >
                {ctaLabel}
              </button>
            </Link>
          ) : (
            <button
              onClick={onCtaClick}
              className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:brightness-110"
              style={{
                background: "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
                boxShadow: "0 0 20px var(--brand-glow)",
              }}
            >
              {ctaLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
