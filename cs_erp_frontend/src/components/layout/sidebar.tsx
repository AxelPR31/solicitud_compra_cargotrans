"use client";

import { cn } from "@/lib/utils";
import { ShoppingCart, ChevronLeft, ChevronRight } from "lucide-react";

export type NavTab = "solicitud-compra";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems: {
  id: NavTab;
  label: string;
  icon: typeof ShoppingCart;
}[] = [
  { id: "solicitud-compra", label: "Solicitud de Compra", icon: ShoppingCart },
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
      <div className="flex h-16 items-center justify-center border-b border-border transition-all duration-300 px-4">
        <img src="/maxERP-logo.png" alt="maxERP" className={cn("w-auto object-contain select-none", isCollapsed ? "h-6" : "h-9")} />
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5">
        {!isCollapsed && (
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400 select-none">
            Módulo de Compras
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
                    isActive ? "bg-brand text-white shadow-sm" : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
