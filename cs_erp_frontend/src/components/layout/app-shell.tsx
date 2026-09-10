"use client";

import { ReactNode, useEffect, useState } from "react";
import { Sidebar, type NavTab } from "./sidebar";
import { Header } from "./header";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-media-query";

interface AppShellProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  serverOnline: boolean;
  children: ReactNode;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string; breadcrumb?: string }> = {
  "solicitud-nueva": {
    subtitle: "Módulo de Compras",
    title: "Nueva Solicitud de Compra",
    breadcrumb: "Nueva Solicitud",
  },
  "solicitud-historial": {
    subtitle: "Módulo de Compras",
    title: "Historial de Solicitudes",
    breadcrumb: "Historial",
  },
};

export function AppShell({
  activeTab,
  onTabChange,
  serverOnline,
  children,
}: AppShellProps) {
  const pageMeta = tabTitles[activeTab];
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  const handleTabChange = (tab: NavTab) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  const handleToggleSidebar = () => {
    if (isMobile) {
      setMobileMenuOpen(prev => !prev);
      return;
    }
    setIsCollapsed(prev => !prev);
  };

  useEffect(() => {
    if (!isMobile || !mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobile, mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50">
      {isMobile && mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(prev => !prev)}
        mobileOpen={mobileMenuOpen}
        isMobile={isMobile}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-all duration-300",
          isMobile ? "pl-0" : isCollapsed ? "pl-20" : "pl-64",
        )}
      >
        <Header
          serverOnline={serverOnline}
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          breadcrumb={pageMeta.breadcrumb}
          onToggleSidebar={handleToggleSidebar}
          sidebarOpen={mobileMenuOpen}
        />
        <main className="min-w-0 flex-grow p-4 sm:p-6 lg:p-8">{children}</main>
        <footer className="mt-auto flex flex-wrap items-center justify-center gap-2 border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500 shadow-[0_-1px_3px_rgba(0,0,0,0.02)]">
          <span>Copyright © 2026</span>
          <img src="/Corpsoft.svg" alt="Corpsoft" className="inline-block h-4 w-auto" />
          <span>- All Rights Reserved</span>
        </footer>
      </div>
    </div>
  );
}

export { type NavTab };
