import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description = "Are you sure? This cannot be undone.",
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998] animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          className="glass-card p-6 w-full max-w-md animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{
              background:
                confirmVariant === "danger"
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(124, 92, 252, 0.1)",
            }}
          >
            <AlertTriangle
              className="w-6 h-6"
              style={{
                color: confirmVariant === "danger" ? "#EF4444" : "#7C5CFC",
              }}
            />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>

          {/* Description */}
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium transition-all disabled:opacity-50"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-strong)",
                color: "var(--text-primary)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white transition-all hover:brightness-110 disabled:opacity-50"
              style={{
                background:
                  confirmVariant === "danger"
                    ? "#EF4444"
                    : "linear-gradient(135deg, #7C5CFC, #5A3FD4)",
              }}
            >
              {loading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-fade-in {
    animation: fadeIn 200ms ease-out;
  }

  .animate-scale-in {
    animation: scaleIn 200ms ease-out;
  }
`;
document.head.appendChild(style);
