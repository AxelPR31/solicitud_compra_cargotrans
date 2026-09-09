"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepperStep {
  label: string;
}

interface StepperProps {
  steps: StepperStep[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <nav aria-label="Progreso del formulario" className={cn("w-full", className)}>
      <ol className="flex items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li
              key={step.label}
              className={cn(
                "flex items-center",
                index < steps.length - 1 ? "flex-1" : ""
              )}
            >
              <div className="flex min-w-0 flex-col items-center gap-2 sm:flex-row sm:gap-3">
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCompleted && "bg-brand text-white",
                    isActive && "bg-brand text-white ring-4 ring-brand/15",
                    !isCompleted && !isActive && "bg-slate-100 text-slate-500"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>
                <span
                  className={cn(
                    "max-w-[120px] text-center text-xs font-medium leading-tight sm:max-w-none sm:text-left sm:text-sm",
                    isActive ? "text-brand" : "text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-3 hidden h-px flex-1 sm:block",
                    isCompleted ? "bg-brand" : "bg-slate-200"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
