'use client';

import React, { useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useDashboardData } from '@/components/providers/DataProvider';
import {
  Activity,
  LayoutDashboard,
  TableProperties,
  Radio,
  Server,
  AlertOctagon,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  Flame,
  ShieldCheck,
} from 'lucide-react';

interface AppSidebarProps {
  activeSection: string;
  setActiveSection: (sec: string) => void;
  onOpenAlerts: () => void;
  unreadAlertsCount?: number;
}

export default function AppSidebar({
  activeSection,
  setActiveSection,
  onOpenAlerts,
  unreadAlertsCount = 2,
}: AppSidebarProps) {
  const { user, logout } = useAuth();
  const { streamSettings, setStressTarget } = useDashboardData();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: 'Live',
    },
    {
      id: 'charts',
      label: 'Telemetry Grid',
      icon: Radio,
    },
    {
      id: 'ledger',
      label: 'Transactions & Ledger',
      icon: TableProperties,
    },
    {
      id: 'nodes',
      label: 'Cluster Shards',
      icon: Server,
      badge: '8/8',
    },
    {
      id: 'incidents',
      label: 'Incident Reports',
      icon: AlertOctagon,
      count: unreadAlertsCount,
    },
  ];

  return (
    <aside
      className={`relative z-40 flex flex-col border-r border-[#e2ecc9] bg-[#f8ffe5] text-[#111827] transition-all duration-300 ease-in-out select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* 1. Brand Header */}
      <div className="h-16 px-4 border-b border-[#e2ecc9] flex items-center justify-between">
        {!isCollapsed ? (
          <div className="flex items-center gap-3 truncate">
            {/* Brand Logo Icon */}
            <div className="h-8 w-8 rounded-full bg-[#111827] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Activity className="w-4 h-4 text-[#06d6a0]" />
            </div>
            <div className="truncate">
              <div className="text-base font-bold font-display tracking-tight text-[#111827] flex items-center gap-1.5">
                PULSE<span className="text-[#1b9aaa]">60</span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#111827] text-white font-medium">
                  PROD
                </span>
              </div>
              <div className="text-[10px] text-[#4b5563] font-sans font-medium">
                Real-Time Telemetrics
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto">
            <div className="h-8 w-8 rounded-full bg-[#111827] flex items-center justify-center shadow-sm">
              <Activity className="w-4 h-4 text-[#06d6a0]" />
            </div>
          </div>
        )}

        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          className="p-1.5 rounded-lg text-[#4b5563] hover:text-[#111827] hover:bg-[#ebf4d5] transition-colors"
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* 2. Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-2 pb-1">
          {!isCollapsed && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-sans">
              Main Menu
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'incidents') {
                  onOpenAlerts();
                } else {
                  setActiveSection(item.id);
                }
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-[#374151] hover:text-[#111827] hover:bg-[#eef8db]'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive ? 'text-[#06d6a0]' : 'text-[#374151]'
                }`}
              />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left font-sans">{item.label}</span>
              )}
              {!isCollapsed && item.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#06d6a0] text-[#05291f]'
                      : 'bg-[#111827]/10 text-[#111827]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
              {!isCollapsed && item.count && (
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#ef476f] text-white">
                  {item.count}
                </span>
              )}
            </button>
          );
        })}

        {/* Stress Mode Engine Presets in Sidebar */}
        {!isCollapsed && (
          <div className="pt-6 px-1 space-y-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b7280] font-sans flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-[#ef476f]" />
              <span>Stress Load Engine</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 bg-[#eef8db] p-1.5 rounded-xl border border-[#dfeabf] text-xs font-mono">
              {[
                { label: '10k', count: 10000 },
                { label: '50k', count: 50000 },
                { label: '100k', count: 100000 },
              ].map((p) => (
                <button
                  key={p.count}
                  onClick={() => setStressTarget(p.count)}
                  className={`py-1.5 rounded-lg font-bold transition-all ${
                    streamSettings.stressTarget === p.count
                      ? 'bg-[#111827] text-[#06d6a0] shadow-sm'
                      : 'text-[#4b5563] hover:text-[#111827] hover:bg-[#e2ecc9]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. System Status Indicator */}
      {!isCollapsed && (
        <div className="p-3 mx-3 mb-3 rounded-xl border border-[#dfeabf] bg-[#eef8db]/80">
          <div className="flex items-center justify-between text-xs font-semibold mb-1">
            <span className="flex items-center gap-1.5 text-[#111827]">
              <span className="h-2 w-2 rounded-full bg-[#06d6a0] animate-pulse" />
              SLA 99.99%
            </span>
            <span className="text-[#059669] font-mono text-[10px] uppercase font-bold">
              Nominal
            </span>
          </div>
          <div className="text-[10px] text-[#4b5563] font-mono">
            AWS us-east-1a • 10Hz stream
          </div>
        </div>
      )}

      {/* 4. User Footer Profile & Log Out */}
      <div className="p-3 border-t border-[#e2ecc9] flex items-center justify-between bg-[#f4fce0]">
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5 truncate">
            <div className="h-7 w-7 rounded-full bg-[#ef476f] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
              {user?.name?.[0] || 'A'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-[#111827] truncate font-sans">
                {user?.name || 'Alex Rivera'}
              </div>
              <div className="text-[10px] text-[#4b5563] font-mono truncate">
                {user?.role?.split(' ')[0] || 'Lead SRE'}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto h-7 w-7 rounded-full bg-[#ef476f] text-white font-bold text-xs flex items-center justify-center shadow-sm">
            {user?.name?.[0] || 'A'}
          </div>
        )}

        <button
          onClick={logout}
          title="Log out"
          className="flex items-center gap-1 p-1.5 rounded-lg text-[#4b5563] hover:text-[#ef476f] hover:bg-[#eef8db] transition-colors font-sans text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span className="text-[11px]">Log out</span>}
        </button>
      </div>
    </aside>
  );
}
