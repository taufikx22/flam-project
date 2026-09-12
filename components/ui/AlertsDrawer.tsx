'use client';

import React, { useState } from 'react';
import {
  X,
  AlertOctagon,
  CheckCircle2,
  Server,
} from 'lucide-react';

export interface IncidentAlert {
  id: string;
  title: string;
  severity: 'p1' | 'p2' | 'p3';
  service: string;
  node: string;
  timestamp: string;
  description: string;
  status: 'active' | 'acknowledged' | 'resolved';
}

const INITIAL_ALERTS: IncidentAlert[] = [
  {
    id: 'inc-9041',
    title: 'High Memory Pressure Exceeded 85% Threshold',
    severity: 'p1',
    service: 'Core Telemetry Engine',
    node: 'node-prod-4',
    timestamp: '2 mins ago',
    description: 'Kernel reported memory allocation saturation. Automatic garbage reclamation and ring buffer backpressure activated.',
    status: 'active',
  },
  {
    id: 'inc-9038',
    title: 'Elevated Latency Spike on Network I/O',
    severity: 'p2',
    service: 'Ingestion Gateway',
    node: 'node-prod-7',
    timestamp: '14 mins ago',
    description: 'Round-trip packet latency reached 48.2ms (p99 threshold is 35ms). Cross-region connection re-routed.',
    status: 'active',
  },
  {
    id: 'inc-8992',
    title: 'Cluster Edge Partition Rebalance Completed',
    severity: 'p3',
    service: 'Consensus Coordinator',
    node: 'node-prod-1',
    timestamp: '1 hour ago',
    description: 'Partition hash slots redistributed across 8 worker instances with zero frame drops.',
    status: 'resolved',
  },
];

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onAlertCountChange?: (count: number) => void;
}

export default function AlertsDrawer({
  isOpen,
  onClose,
  onAlertCountChange,
}: AlertsDrawerProps) {
  const [alerts, setAlerts] = useState<IncidentAlert[]>(INITIAL_ALERTS);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'p1' | 'p2' | 'p3'>('all');

  const acknowledgeAlert = (id: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, status: 'acknowledged' as const } : a
      );
      const activeCount = next.filter((a) => a.status === 'active').length;
      onAlertCountChange?.(activeCount);
      return next;
    });
  };

  const resolveAlert = (id: string) => {
    setAlerts((prev) => {
      const next = prev.map((a) =>
        a.id === id ? { ...a, status: 'resolved' as const } : a
      );
      const activeCount = next.filter((a) => a.status === 'active').length;
      onAlertCountChange?.(activeCount);
      return next;
    });
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  const activeCount = alerts.filter((a) => a.status === 'active').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm select-none animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#ef476f]/15 text-[#ef476f]">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#111827] font-display tracking-tight flex items-center gap-2">
                  Incidents & Alerts Feed
                  {activeCount > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#ef476f] text-white font-bold">
                      {activeCount} Active
                    </span>
                  )}
                </h3>
                <p className="text-[11px] text-slate-500 font-sans">
                  SRE triage feed with automated diagnostics
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#111827] hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Severity Filter Tabs */}
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center gap-1.5 text-xs">
            {(['all', 'p1', 'p2', 'p3'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1 rounded-lg font-bold uppercase text-[11px] transition-all font-sans ${
                  filterSeverity === sev
                    ? 'bg-[#111827] text-white shadow-sm'
                    : 'text-slate-600 hover:text-[#111827]'
                }`}
              >
                {sev === 'all' ? 'All Alerts' : sev.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Incident List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredAlerts.map((alert) => {
              const isP1 = alert.severity === 'p1';
              const isP2 = alert.severity === 'p2';
              return (
                <div
                  key={alert.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    alert.status === 'resolved'
                      ? 'border-slate-200 bg-slate-50 opacity-60'
                      : isP1
                      ? 'border-[#ef476f]/30 bg-[#ef476f]/5'
                      : isP2
                      ? 'border-[#ffc43d]/40 bg-[#ffc43d]/10'
                      : 'border-[#1b9aaa]/30 bg-[#1b9aaa]/5'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          isP1
                            ? 'bg-[#ef476f] text-white'
                            : isP2
                            ? 'bg-[#ffc43d] text-[#2d2004]'
                            : 'bg-[#1b9aaa] text-white'
                        }`}
                      >
                        {alert.severity.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {alert.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {alert.status === 'resolved' ? (
                        <span className="text-[10px] text-[#059669] font-mono font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Resolved
                        </span>
                      ) : alert.status === 'acknowledged' ? (
                        <span className="text-[10px] text-[#1b9aaa] font-mono font-bold">
                          Acked
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-[#111827] font-sans mb-1 leading-snug">
                    {alert.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 font-sans leading-relaxed mb-3">
                    {alert.description}
                  </p>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-200/60 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 font-semibold text-slate-700">
                      <Server className="w-3 h-3 text-[#1b9aaa]" />
                      {alert.node}
                    </span>

                    {alert.status !== 'resolved' && (
                      <div className="flex items-center gap-1.5 font-sans">
                        {alert.status === 'active' && (
                          <button
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                          >
                            Acknowledge
                          </button>
                        )}
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#06d6a0] text-[#05291f] font-bold hover:bg-[#05be8e] transition-colors shadow-sm"
                        >
                          Resolve
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredAlerts.length === 0 && (
              <div className="text-center py-12 text-slate-500 font-sans text-xs">
                No incidents found for this filter.
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs font-mono text-slate-500">
            <span>Automated SRE Engine Active</span>
            <span className="text-[#1b9aaa] font-bold">PULSE60</span>
          </div>
        </div>
      </div>
    </div>
  );
}
