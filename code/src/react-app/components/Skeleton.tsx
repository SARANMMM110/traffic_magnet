export function SkeletonText({ className = "" }: { className?: string }) {
  return (
    <div
      className={`h-4 rounded-md animate-shimmer ${className}`}
      style={{
        background:
          "linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-4">
      <SkeletonText className="w-3/4" />
      <SkeletonText className="w-full" />
      <SkeletonText className="w-5/6" />
      <div className="flex gap-2 mt-4">
        <SkeletonText className="w-20 h-8" />
        <SkeletonText className="w-20 h-8" />
      </div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg animate-shimmer flex-shrink-0"
        style={{
          background:
            "linear-gradient(90deg, var(--bg-elevated) 25%, var(--bg-overlay) 50%, var(--bg-elevated) 75%)",
          backgroundSize: "200% 100%",
        }}
      />
      <div className="flex-1 space-y-2">
        <SkeletonText className="w-1/3" />
        <SkeletonText className="w-2/3" />
      </div>
      <SkeletonText className="w-20 h-8" />
    </div>
  );
}

// CSS animation
const style = document.createElement("style");
style.textContent = `
  @keyframes shimmer {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }

  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
`;
document.head.appendChild(style);
