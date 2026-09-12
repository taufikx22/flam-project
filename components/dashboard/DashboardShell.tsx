'use client';

import React from 'react';
import AppSidebar from '@/components/layout/AppSidebar';
import AppHeader from '@/components/layout/AppHeader';
import CommandPalette from '@/components/ui/CommandPalette';
import AlertsDrawer from '@/components/ui/AlertsDrawer';
import { useDashboardUI } from '@/components/providers/DashboardUIProvider';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const {
    activeSection,
    setActiveSection,
    showDiagnostics,
    setShowDiagnostics,
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    isAlertsOpen,
    setIsAlertsOpen,
    unreadAlertsCount,
    setUnreadAlertsCount,
  } = useDashboardUI();

  return (
    <div className="min-h-screen flex bg-[#f0f2f5] text-[#111827] font-sans selection:bg-[#06d6a0] selection:text-black">
      {/* 1. Collapsible Enterprise Sidebar */}
      <AppSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        unreadAlertsCount={unreadAlertsCount}
      />

      {/* 2. Main Work Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f0f2f5]">
        {/* Top Command Bar */}
        <AppHeader
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          unreadAlertsCount={unreadAlertsCount}
          showDiagnostics={showDiagnostics}
          setShowDiagnostics={setShowDiagnostics}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1680px] w-full mx-auto">
          {children}
        </main>

        {/* Fresh Footer */}
        <footer className="border-t border-[#e5e7eb] bg-[#ffffff] px-6 py-4">
          <div className="max-w-[1680px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-[#059669] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#06d6a0] animate-pulse" />
                Cluster Healthy
              </span>
              <span>•</span>
              <span className="font-sans">PULSE60 Platform</span>
              <span>•</span>
              <span className="hidden md:inline">TypedArray Ring Buffer (100k cap)</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-slate-600 font-sans">
                Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">⌘K</kbd> for
                Command Menu
              </span>
              <span className="text-[#1b9aaa] font-bold">Decoupled RAF • Steady 60 FPS</span>
            </div>
          </div>
        </footer>
      </div>

      {/* 3. Command Palette Modal (⌘K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={(section) => {
          setActiveSection(section);
          setIsCommandPaletteOpen(false);
        }}
        onToggleDiagnostics={() => setShowDiagnostics(!showDiagnostics)}
      />

      {/* 4. Slide-over Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        onAlertCountChange={setUnreadAlertsCount}
      />
    </div>
  );
}
