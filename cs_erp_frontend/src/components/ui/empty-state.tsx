"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  message: string;
  description?: string;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  message,
  description,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-12 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-white p-3 shadow-sm">
        <Inbox className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-sm font-medium text-slate-700">{message}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
}
