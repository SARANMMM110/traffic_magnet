import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  showToast: (options: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
};

interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [progress, setProgress] = useState(100);

  const getIcon = () => {
    switch (toast.type) {
      case "success":
        return <CheckCircle className="w-5 h-5" style={{ color: "#10B981" }} />;
      case "error":
        return <XCircle className="w-5 h-5" style={{ color: "#EF4444" }} />;
      case "warning":
        return <AlertTriangle className="w-5 h-5" style={{ color: "#F59E0B" }} />;
      case "info":
        return <Info className="w-5 h-5" style={{ color: "#3B82F6" }} />;
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case "success":
        return "#10B981";
      case "error":
        return "#EF4444";
      case "warning":
        return "#F59E0B";
      case "info":
        return "#3B82F6";
    }
  };

  // Auto-dismiss after 4 seconds
  useState(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev - 2.5; // 100 / 40 = 2.5 per 100ms
        if (next <= 0) {
          clearInterval(interval);
          setTimeout(onClose, 200); // Wait for animation
          return 0;
        }
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  });

  return (
    <div
      className="glass-card p-4 w-80 relative overflow-hidden animate-slide-in"
      style={{
        animation: "slideInRight 200ms ease-out",
      }}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-900 text-sm mb-0.5">{toast.title}</p>
          {toast.message && (
            <p className="text-xs text-slate-600">
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 hover:bg-slate-100 rounded transition-colors"
        >
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-100"
        style={{
          width: `${progress}%`,
          background: getProgressColor(),
        }}
      />
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((options: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...options, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// CSS animation
const style = document.createElement("style");
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
