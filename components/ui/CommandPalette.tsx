'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  Search,
  LayoutDashboard,
  TableProperties,
  Radio,
  Server,
  Flame,
  Play,
  Pause,
  Clock,
  Gauge,
  LogOut,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
  onToggleDiagnostics: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onNavigate,
  onToggleDiagnostics,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { setStressTarget, toggleStream, streamSettings, setTimeRange } = useDashboardData();
  const { logout } = useAuth();

  // Listen for global Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        onClose(); // toggle
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const commands = useMemo(() => [
    {
      category: 'Navigation',
      id: 'nav-overview',
      title: 'Go to Telemetry Overview',
      subtitle: 'Command dashboard with key performance signals',
      icon: LayoutDashboard,
      action: () => onNavigate('overview'),
    },
    {
      category: 'Navigation',
      id: 'nav-charts',
      title: 'Go to Signal Visualizer',
      subtitle: 'Deep-dive 60fps line, bar, scatter, and heatmap view',
      icon: Radio,
      action: () => onNavigate('charts'),
    },
    {
      category: 'Navigation',
      id: 'nav-ledger',
      title: 'Go to Virtualized Ledger',
      subtitle: 'Windowed data table with 10k+ matching points',
      icon: TableProperties,
      action: () => onNavigate('ledger'),
    },
    {
      category: 'Navigation',
      id: 'nav-nodes',
      title: 'Go to Cluster Nodes',
      subtitle: 'View health of all 8 production edge clusters',
      icon: Server,
      action: () => onNavigate('nodes'),
    },
    {
      category: 'Stress Testing',
      id: 'stress-10k',
      title: 'Run 10,000 Points Stress Test (Nominal)',
      subtitle: 'Standard 60 FPS real-time baseline',
      icon: Flame,
      action: () => setStressTarget(10000),
    },
    {
      category: 'Stress Testing',
      id: 'stress-50k',
      title: 'Run 50,000 Points Stress Test (High Load)',
      subtitle: 'Simulate high telemetry influx at 60 FPS',
      icon: Flame,
      action: () => setStressTarget(50000),
    },
    {
      category: 'Stress Testing',
      id: 'stress-100k',
      title: 'Run 100,000 Points Stress Test (Extreme)',
      subtitle: 'Maximum ring buffer saturation test',
      icon: Flame,
      action: () => setStressTarget(100000),
    },
    {
      category: 'Stream Controls',
      id: 'stream-toggle',
      title: streamSettings.isRunning ? 'Pause Telemetry Stream' : 'Resume Telemetry Stream',
      subtitle: 'Control real-time synthetic data influx',
      icon: streamSettings.isRunning ? Pause : Play,
      action: () => toggleStream(),
    },
    {
      category: 'Time Range',
      id: 'time-1m',
      title: 'Set Horizon: 1 Minute',
      subtitle: 'High frequency real-time view',
      icon: Clock,
      action: () => setTimeRange('1m'),
    },
    {
      category: 'Time Range',
      id: 'time-5m',
      title: 'Set Horizon: 5 Minutes',
      subtitle: 'Default operational window',
      icon: Clock,
      action: () => setTimeRange('5m'),
    },
    {
      category: 'Time Range',
      id: 'time-15m',
      title: 'Set Horizon: 15 Minutes',
      subtitle: 'Extended trend analysis window',
      icon: Clock,
      action: () => setTimeRange('15m'),
    },
    {
      category: 'System Diagnostics',
      id: 'diag-toggle',
      title: 'Toggle Telemetry Diagnostics HUD',
      subtitle: 'Show or hide 60fps frame budget & memory gauges',
      icon: Gauge,
      action: () => onToggleDiagnostics(),
    },
    {
      category: 'Session',
      id: 'user-logout',
      title: 'Sign Out of Workspace',
      subtitle: 'End current session and return to login',
      icon: LogOut,
      action: () => logout(),
    },
  ], [onNavigate, setStressTarget, streamSettings.isRunning, toggleStream, setTimeRange, onToggleDiagnostics, logout]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredCommands[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-md select-none animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 gap-3">
          <Search className="w-4 h-4 text-[#1b9aaa]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search metrics (e.g. 50k, ledger, pause)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-[#111827] placeholder-slate-400 focus:outline-none font-sans font-medium"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-[#111827] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Items List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredCommands.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.id}
                onClick={() => {
                  cmd.action();
                  onClose();
                }}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl transition-all font-sans ${
                  isSelected
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected
                        ? 'bg-[#06d6a0] text-[#05291f]'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <div className="text-xs font-bold truncate">
                      {cmd.title}
                    </div>
                    <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                      {cmd.subtitle}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {cmd.category}
                  </span>
                  {isSelected && <ArrowRight className="w-3.5 h-3.5 text-[#06d6a0]" />}
                </div>
              </button>
            );
          })}

          {filteredCommands.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-500 font-sans">
              No actions match "{query}"
            </div>
          )}
        </div>

        {/* Footer Shortcut Hints */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <span>Navigate</span>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span className="ml-2">Select</span>
            <kbd>↵</kbd>
          </div>
          <div>
            <span>Dismiss</span>
            <kbd className="ml-1">ESC</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
