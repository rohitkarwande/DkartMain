import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface WizardStep {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface WizardStepperProps {
  steps: WizardStep[];
  currentStep: number;
  className?: string;
}

export function WizardStepper({ steps, currentStep, className }: WizardStepperProps) {
  // Calculate percentage (e.g. 0%, 25%, 50%, 75%, 100%)
  const percentage = Math.round((currentStep / (steps.length - 1)) * 100);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Progress</h3>
          <p className="text-2xl font-bold text-slate-900">{percentage}% Complete</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-slate-500">Step {currentStep + 1} of {steps.length}</p>
          <p className="text-slate-900 font-semibold">{steps[currentStep]?.label}</p>
        </div>
      </div>

      <div className="relative flex items-center justify-between px-2 sm:px-6">
        {/* Progress bar background */}
        <div className="absolute top-1/2 left-0 w-full h-1.5 bg-slate-100 rounded-full -z-10 -translate-y-1/2" />
        
        {/* Active progress bar */}
        <div 
          className="absolute top-1/2 left-0 h-1.5 bg-emerald-500 rounded-full -z-10 -translate-y-1/2 transition-all duration-500 ease-in-out"
          style={{ width: `${percentage}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center gap-3 relative group">
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-full border-[3px] text-sm font-bold transition-all duration-300 bg-white",
                  isCompleted
                    ? "border-emerald-500 text-emerald-600 bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-110"
                    : isCurrent
                    ? "border-emerald-500 text-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-110"
                    : "border-slate-200 text-slate-400"
                )}
              >
                {isCompleted ? (
                  <Check className="h-6 w-6 animate-in zoom-in duration-300" strokeWidth={3} />
                ) : step.icon ? (
                  step.icon
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "text-xs font-semibold absolute -bottom-8 w-max text-center transition-colors duration-300 hidden sm:block",
                  isCurrent ? "text-emerald-700" : isCompleted ? "text-slate-700" : "text-slate-400"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
