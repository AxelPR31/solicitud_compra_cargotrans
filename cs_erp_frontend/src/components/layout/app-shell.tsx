"use client";

import { ReactNode, useState } from "react";
import { Sidebar, type NavTab } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  serverOnline: boolean;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string; breadcrumb?: string }> = {
  recipes: {
    subtitle: "Gestión de Recetas",
    title: "Recetas de Transformación",
  },
  factors: {
    subtitle: "Factores de Valuación",
    title: "Factores de Sobrantes",
  },
  extractor: {
    subtitle: "Registro de Producción",
    title: "Nueva Orden de Producción",
    breadcrumb: "Gestión de Recetas › Nueva Orden de Producción",
  },
  history: {
    subtitle: "Historial de Órdenes",
    title: "Órdenes de Producción",
    breadcrumb: "Historial de Órdenes",
  },
  transfers: {
    subtitle: "Gestión de Solicitudes a Casa Matriz",
    title: "Traslados Internos",
    breadcrumb: "Traslados Internos",
  },
  consecutivos: {
    subtitle: "Configuración de Máscaras y Consecutivos",
    title: "Administración de Consecutivos",
    breadcrumb: "Consecutivos",
  },
};

export function AppShell({
  activeTab,
  onTabChange,
  serverOnline,
  title,
  subtitle,
  children,
}: AppShellProps) {
  const pageMeta = tabTitles[activeTab];
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
      />
      <div
        className={cn(
          "transition-all duration-300 flex flex-col min-h-screen",
          isCollapsed ? "pl-20" : "pl-64"
        )}
      >
        <Header
          serverOnline={serverOnline}
          title={title || pageMeta.title}
          subtitle={subtitle || pageMeta.subtitle}
          breadcrumb={pageMeta.breadcrumb}
          onToggleSidebar={() => setIsCollapsed(!isCollapsed)}
        />
        <main className="flex-grow p-6 lg:p-8">{children}</main>
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 px-6 flex items-center justify-center gap-2 text-xs text-slate-500 font-sans shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
          <span>Copyright © 2026</span>
          <img src="/Corpsoft.svg" alt="Corpsoft" className="h-4 w-auto inline-block" />
          <span>- All Rights Reserved</span>
        </footer>
      </div>
    </div>
  );
}

export { type NavTab };
