interface GoalBadgeProps {
  goal: string;
  className?: string;
}

export function GoalBadge({ goal, className = "" }: GoalBadgeProps) {
  const getGoalStyle = () => {
    const normalized = goal.toLowerCase();
    
    if (normalized.includes("backlink")) {
      return {
        background: "#EDE9FE",
        color: "#7C3AED",
      };
    }
    
    if (normalized.includes("lead")) {
      return {
        background: "#DBEAFE",
        color: "#1E40AF",
      };
    }
    
    if (normalized.includes("traffic")) {
      return {
        background: "#D1FAE5",
        color: "#059669",
      };
    }
    
    if (normalized.includes("engagement")) {
      return {
        background: "#FEF3C7",
        color: "#92400E",
      };
    }
    
    // Default
    return {
      background: "#F3F4F6",
      color: "#6B7280",
    };
  };

  const style = getGoalStyle();

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${className}`}
      style={style}
    >
      {goal}
    </span>
  );
}
