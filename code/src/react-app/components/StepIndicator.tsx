import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
  description: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                {/* Step Circle */}
                <div
                  className={`
                    w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm
                    transition-all duration-300 mb-3
                    ${
                      isComplete
                        ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg"
                        : isCurrent
                        ? "bg-gradient-to-br from-[var(--brand)] to-[var(--brand-dim)] text-white shadow-lg scale-110"
                        : "bg-white border-2 border-[var(--border)] text-[var(--text-muted)]"
                    }
                  `}
                >
                  {isComplete ? <Check className="w-6 h-6" /> : step.id}
                </div>

                {/* Step Label */}
                <div className="text-center">
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      isCurrent ? "text-[var(--brand)]" : isComplete ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 -mt-16">
                  <div
                    className="h-full transition-all duration-500"
                    style={{
                      background: isComplete
                        ? "linear-gradient(90deg, #10B981, #059669)"
                        : "var(--border)",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
