"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "brand";
  className?: string;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  className,
}: KpiCardProps) {
  const valueColors = {
    default: "text-slate-900",
    success: "text-emerald-700",
    warning: "text-amber-700",
    brand: "text-brand-dark",
  };

  const containerVariants = {
    default: "bg-white",
    success: "bg-white",
    warning: "bg-white",
    brand: "bg-brand-muted border-brand-light/50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "rounded-xl border border-border p-5 shadow-[var(--shadow-card)]",
        containerVariants[variant],
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </p>
        {Icon && (
          <div className="rounded-lg bg-brand-muted p-2">
            <Icon className="h-4 w-4 text-brand" />
          </div>
        )}
      </div>
      <p
        className={cn(
          "mt-3 font-mono text-2xl font-semibold tracking-tight",
          valueColors[variant]
        )}
      >
        {value}
      </p>
    </motion.div>
  );
}
