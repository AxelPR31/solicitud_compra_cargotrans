"use client";

import { Bell, ChevronDown, LogOut, Menu, Beef } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

interface HeaderProps {
  serverOnline: boolean;
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  onToggleSidebar?: () => void;
}

const getInitials = (name?: string) => {
  if (!name) return "US";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

export function Header({
  serverOnline,
  title,
  subtitle,
  breadcrumb,
  onToggleSidebar,
}: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-white/95 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors cursor-pointer outline-none shrink-0 border border-border bg-white shadow-sm"
              aria-label="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            {breadcrumb && (
              <p className="truncate text-xs text-slate-400">{breadcrumb}</p>
            )}
            {!breadcrumb && subtitle && (
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {subtitle}
              </p>
            )}
            <h1 className="truncate font-serif text-xl font-normal text-brand leading-none">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-4 mr-1 select-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
              <Beef className="h-4.5 w-4.5" />
            </div>
            <div className="text-left leading-none">
              <p className="text-xs font-bold text-brand uppercase tracking-wider">Eskimo S.A</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Softland</p>
            </div>
          </div>

          <button
            type="button"
            className="relative rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 pointer-events-none opacity-50"
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
              0
            </span>
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-3 rounded-lg border border-border px-3 py-1.5 transition-colors hover:bg-slate-50 cursor-pointer outline-none"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white shadow-sm">
                  {getInitials(user?.nombre || user?.usuario)}
                </div>
                <div className="hidden text-left lg:block">
                  <p className="text-sm font-medium text-slate-900 leading-tight">
                    {user?.nombre || user?.usuario || "Usuario"}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">
                    {user?.tipoUsuario || "Usuario"}
                  </p>
                </div>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56 rounded-xl p-2 shadow-xl border border-border/80 bg-white">
              <div className="px-3 py-2 border-b border-border/50">
                <p className="text-sm font-semibold text-slate-800 truncate">
                  {user?.nombre || user?.usuario || "Usuario"}
                </p>
                <p className="text-xs text-slate-400 truncate">
                  {user?.usuario}
                </p>
              </div>
              <div className="p-1 mt-1">
                <button
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-destructive hover:bg-destructive/5 hover:text-destructive transition-colors cursor-pointer outline-none"
                >
                  <LogOut className="h-4 w-4" />
                  Cerrar Sesión
                </button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
