"use client";

import { cn } from "@/lib/utils";
import { FileText, History, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

export type NavTab = "solicitud-nueva" | "solicitud-historial";

interface TopNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  serverOnline: boolean;
}

const navItems: {
  id: NavTab;
  label: string;
  shortLabel: string;
  icon: typeof FileText;
}[] = [
  { id: "solicitud-nueva", label: "Nueva Solicitud", shortLabel: "Nueva", icon: FileText },
  { id: "solicitud-historial", label: "Historial", shortLabel: "Historial", icon: History },
];

const getInitials = (name?: string) => {
  if (!name) return "US";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export function TopNav({ activeTab, onTabChange, serverOnline }: TopNavProps) {
  const { user, logout } = useAuth();

  return (
    <nav
      className={cn(
        "mx-auto flex w-full max-w-[1600px] flex-col gap-3 rounded-2xl border border-white/60 bg-white/90 px-3 py-3 shadow-elevated backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-4 sm:py-2.5",
        "ring-1 ring-brand/5",
      )}
      aria-label="Navegación principal"
    >
      <div className="flex min-w-0 items-center justify-between gap-3 sm:justify-start">
        <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-muted ring-1 ring-brand/10">
            <img src="/cargotrans.ico" alt="Cargotrans" className="h-7 w-7 object-contain" />
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-bold uppercase tracking-wide text-brand">Cargotrans</p>
            <p className="truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Solicitud de compra
            </p>
          </div>
        </div>

        <div
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide sm:hidden",
            serverOnline ? "bg-success-muted text-success" : "bg-warning-muted text-warning",
          )}
          title={serverOnline ? "Servidor conectado" : "Servidor no disponible"}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              serverOnline ? "bg-success" : "bg-warning animate-pulse",
            )}
          />
          {serverOnline ? "Online" : "Offline"}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:flex-1 sm:justify-center">
        <p className="hidden text-[10px] font-semibold uppercase tracking-widest text-slate-400 lg:block select-none">
          Módulo de Compras
        </p>
        <ul className="flex w-full flex-1 flex-wrap gap-1.5 sm:w-auto sm:justify-center">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id} className="flex-1 sm:flex-initial">
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer outline-none sm:px-4",
                    isActive
                      ? "bg-brand text-white shadow-sm ring-1 ring-inset ring-brand-light/30"
                      : "text-slate-600 hover:bg-accent hover:text-brand",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="sm:hidden">{item.shortLabel}</span>
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
            serverOnline ? "bg-success-muted text-success" : "bg-warning-muted text-warning",
          )}
        >
          <span
            className={cn("h-1.5 w-1.5 rounded-full", serverOnline ? "bg-success" : "bg-warning")}
          />
          {serverOnline ? "Conectado" : "Sin conexión"}
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border bg-white px-2.5 py-1.5 transition-colors hover:bg-slate-50 cursor-pointer outline-none"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white shadow-sm">
                {getInitials(user?.nombre || user?.usuario)}
              </div>
              <div className="hidden text-left md:block max-w-[140px]">
                <p className="truncate text-sm font-medium text-slate-900 leading-tight">
                  {user?.nombre || user?.usuario || "Usuario"}
                </p>
                <p className="truncate text-[10px] text-slate-500 font-medium">
                  {user?.tipoUsuario || "Usuario"}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 rounded-xl p-2 shadow-xl border border-border/80 bg-white">
            <div className="px-3 py-2 border-b border-border/50">
              <p className="text-sm font-semibold text-slate-800 truncate">
                {user?.nombre || user?.usuario || "Usuario"}
              </p>
              <p className="text-xs text-slate-400 truncate">{user?.usuario}</p>
            </div>
            <div className="p-1 mt-1">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors cursor-pointer outline-none"
              >
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center justify-end border-t border-border/60 pt-2 sm:hidden">
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-white px-3 py-2 transition-colors hover:bg-slate-50 cursor-pointer outline-none"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">
                  {getInitials(user?.nombre || user?.usuario)}
                </div>
                <div className="min-w-0 text-left">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user?.nombre || user?.usuario || "Usuario"}
                  </p>
                  <p className="truncate text-[10px] text-slate-500">{user?.tipoUsuario || "Usuario"}</p>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[min(100vw-1.5rem,16rem)] rounded-xl p-2 shadow-xl border border-border/80 bg-white">
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-destructive hover:bg-destructive/5 cursor-pointer outline-none"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </nav>
  );
}
