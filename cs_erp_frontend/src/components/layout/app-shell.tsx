"use client";

import { ReactNode } from "react";
import { TopNav, type NavTab } from "./top-nav";
import { Header } from "./header";

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-background to-slate-100/80">
      <div className="sticky top-0 z-30 px-4 pt-3 pb-2 sm:px-6 sm:pt-4 lg:px-8 xl:px-10">
        <TopNav activeTab={activeTab} onTabChange={onTabChange} serverOnline={serverOnline} />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-7rem)] w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:px-8 xl:px-10">
        <Header
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          breadcrumb={pageMeta.breadcrumb}
        />
        <main className="min-w-0 flex-grow pb-6 pt-2 sm:pb-8 sm:pt-4">{children}</main>
        <footer className="mt-auto flex flex-wrap items-center justify-center gap-2 border-t border-slate-200/80 py-4 text-center text-xs text-slate-500">
          <span>Copyright © 2026</span>
          <img src="/Corpsoft.svg" alt="Corpsoft" className="inline-block h-4 w-auto" />
          <span>- All Rights Reserved</span>
        </footer>
      </div>
    </div>
  );
}

export { type NavTab };
