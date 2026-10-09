import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NICARAGUA_TZ = "America/Managua";

/** Fecha local Nicaragua en formato YYYY-MM-DD (inputs type="date"). */
export function todayDateInNicaragua(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: NICARAGUA_TZ }).format(new Date());
}

export function toDateInputValueInNicaragua(value?: string | Date | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: NICARAGUA_TZ }).format(date);
}

export function formatCurrency(value: number, prefix = "C$") {
  return `${prefix} ${value.toLocaleString("es-NI", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
