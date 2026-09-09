"use client";

import { cn } from "@/lib/utils";
import {
  BookOpen,
  ClipboardList,
  Percent,
  History,
  ChevronLeft,
  ChevronRight,
  Truck,
  Hash
} from "lucide-react";

export type NavTab = "recipes" | "factors" | "extractor" | "history" | "transfers" | "consecutivos";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: {
  id: NavTab;
  label: string;
  icon: typeof BookOpen;
}[] = [
  { id: "recipes", label: "Gestión de Recetas", icon: BookOpen },
  { id: "factors", label: "Factores de Valuación", icon: Percent },
  { id: "extractor", label: "Registro de Producción", icon: ClipboardList },
  { id: "history", label: "Historial de Órdenes", icon: History },
  { id: "transfers", label: "Traslados Internos", icon: Truck },
  { id: "consecutivos", label: "Consecutivos", icon: Hash },
];

export function Sidebar({
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 flex flex-col border-r border-border bg-white transition-all duration-300",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      <div
        className="flex h-16 items-center justify-center border-b border-border transition-all duration-300 px-4"
      >
        {isCollapsed ? (
          <img src="/maxERP-logo.png" alt="maxERP" className="h-6 w-auto object-contain select-none" />
        ) : (
          <img src="/maxERP-logo.png" alt="maxERP" className="h-9 w-auto object-contain select-none" />
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 select-none">
            Módulo de Producción
          </p>
        )}
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center rounded-lg py-2.5 text-left text-sm font-medium transition-all duration-200 cursor-pointer outline-none",
                    isCollapsed ? "justify-center px-0" : "px-3 gap-3",
                    isActive
                      ? "bg-brand text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-80" />
                  {!isCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

    
      <div className="border-t border-border p-4 select-none">
        <p className="text-center text-[11px] text-slate-400 truncate">
          {isCollapsed ? "CS" : "© 2026 Corpsoft S.A"}
        </p>
      </div>
    </aside>
  );
}
