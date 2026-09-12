'use client';

import React from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useDashboardData } from '@/components/providers/DataProvider';
import {
  Search,
  Bell,
  Radio,
  Sliders,
  Gauge,
  Globe,
  User,
} from 'lucide-react';

interface AppHeaderProps {
  onOpenCommandPalette: () => void;
  onOpenAlerts: () => void;
  unreadAlertsCount?: number;
  showDiagnostics: boolean;
  setShowDiagnostics: (val: boolean) => void;
}

export default function AppHeader({
  onOpenCommandPalette,
  onOpenAlerts,
  unreadAlertsCount = 2,
  showDiagnostics,
  setShowDiagnostics,
}: AppHeaderProps) {
  const { user } = useAuth();
  const { streamSettings } = useDashboardData();

  return (
    <header className="h-16 px-4 sm:px-6 border-b border-[#e5e7eb] bg-[#ffffff] flex items-center justify-between gap-4 select-none sticky top-0 z-30 shadow-sm">
      {/* 1. Header Title & Global Search Trigger */}
      <div className="flex items-center gap-6 max-w-xl w-full">
        <h1 className="text-xl font-bold font-display tracking-tight text-[#111827] hidden sm:block">
          Dashboard
        </h1>

        {/* NexaVerse-style dark pill search bar */}
        <button
          onClick={onOpenCommandPalette}
          className="flex-1 flex items-center justify-between px-4 py-2 rounded-full bg-[#111827] text-xs text-white/70 hover:text-white transition-all shadow-sm group"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-3.5 h-3.5 text-white/50 group-hover:text-[#06d6a0] transition-colors" />
            <span className="truncate font-sans">
              Search metrics, shards, or trigger stress...
            </span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-mono text-white/50">
            <kbd className="bg-white/10 text-white px-1.5 py-0.5 rounded border border-white/15">
              ⌘K
            </kbd>
          </div>
        </button>
      </div>

      {/* 2. Status & Controls */}
      <div className="flex items-center gap-3">
        {/* Cluster Region Tag */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#e5e7eb] bg-[#f8fafc] text-xs font-mono text-[#475569]">
          <Globe className="w-3.5 h-3.5 text-[#1b9aaa]" />
          <span>us-east-1</span>
        </div>

        {/* Live Stream 10Hz Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#06d6a0]/15 text-[#065f46] text-xs font-mono font-bold border border-[#06d6a0]/30">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06d6a0]" />
          </span>
          <Radio className="w-3.5 h-3.5 text-[#059669]" />
          <span>LIVE 10Hz</span>
        </div>

        {/* Diagnostics HUD Toggle Button */}
        <button
          onClick={() => setShowDiagnostics(!showDiagnostics)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold font-sans transition-all ${
            showDiagnostics
              ? 'bg-[#111827] text-[#06d6a0] shadow-sm'
              : 'bg-[#f1f5f9] text-[#64748b] hover:text-[#111827]'
          }`}
          title="Toggle Hardware Diagnostics HUD"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">HUD</span>
        </button>

        {/* Alerts & Incidents Bell */}
        <button
          onClick={onOpenAlerts}
          className="relative p-2 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] transition-colors"
          title="Open Incident Drawer"
        >
          <Bell className="w-4 h-4" />
          {unreadAlertsCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#ef476f] text-[9px] font-bold text-white font-mono shadow-sm">
              {unreadAlertsCount}
            </span>
          )}
        </button>

        {/* Popping Pink Avatar (like in reference screenshot) */}
        <div
          onClick={onOpenCommandPalette}
          className="cursor-pointer h-9 w-9 rounded-full bg-[#ef476f] flex items-center justify-center text-white font-bold text-sm shadow-sm transition-transform hover:scale-105"
          title={`${user?.name || 'User'} (${user?.role || 'SRE'})`}
        >
          <User className="w-4 h-4" />
        </div>
      </div>
    </header>
  );
}
