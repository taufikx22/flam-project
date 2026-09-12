'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DashboardUIContextType {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  showDiagnostics: boolean;
  setShowDiagnostics: (val: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isAlertsOpen: boolean;
  setIsAlertsOpen: (open: boolean) => void;
  unreadAlertsCount: number;
  setUnreadAlertsCount: (count: number) => void;
}

const DashboardUIContext = createContext<DashboardUIContextType | null>(null);

export function DashboardUIProvider({ children }: { children: React.ReactNode }) {
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(true);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState<number>(2);

  // Global keyboard shortcut for ⌘K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <DashboardUIContext.Provider
      value={{
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
      }}
    >
      {children}
    </DashboardUIContext.Provider>
  );
}

export function useDashboardUI() {
  const context = useContext(DashboardUIContext);
  if (!context) {
    throw new Error('useDashboardUI must be used within a DashboardUIProvider');
  }
  return context;
}
