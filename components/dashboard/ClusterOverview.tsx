'use client';

import React from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import {
  Activity,
  Server,
  ShieldCheck,
  Zap,
  ArrowUpRight,
} from 'lucide-react';

export default function ClusterOverview() {
  const { streamSettings } = useDashboardData();

  const totalPoints = streamSettings.stressTarget;
  const formattedPoints = totalPoints >= 1000 ? `${(totalPoints / 1000).toFixed(0)}k` : totalPoints;

  const isPaused = !streamSettings.isRunning;

  const kpis = [
    {
      id: 'ingestion',
      title: 'Active Ring Buffer',
      value: `${formattedPoints}`,
      unit: 'pts',
      subtitle: `${streamSettings.intervalMs}ms tick • 10 Hz`,
      badge: isPaused ? 'PAUSED' : 'STREAMING',
      bgClass: 'bg-[#06d6a0] text-[#05291f]',
      badgeClass: 'bg-[#05291f]/15 text-[#05291f]',
      iconClass: 'text-[#05291f]',
      icon: Activity,
      trend: '+100% throughput',
    },
    {
      id: 'nodes',
      title: 'Ingestion Shards',
      value: '8 / 8',
      unit: 'online',
      subtitle: 'Zero dropped packets (us-east-1)',
      badge: 'ALL HEALTHY',
      bgClass: 'bg-[#1b9aaa] text-white',
      badgeClass: 'bg-white/20 text-white',
      iconClass: 'text-white',
      icon: Server,
      trend: '100% quorum',
    },
    {
      id: 'sla',
      title: 'Active SLO Target',
      value: '99.99%',
      unit: 'SLA',
      subtitle: 'Remaining error budget: 4h 12m',
      badge: 'TIER-1',
      bgClass: 'bg-[#ef476f] text-white',
      badgeClass: 'bg-white/20 text-white',
      iconClass: 'text-white',
      icon: ShieldCheck,
      trend: '+0.002% mtd',
    },
    {
      id: 'latency',
      title: 'Latency (p95)',
      value: '14.2',
      unit: 'ms',
      subtitle: 'Within SLO threshold (< 50ms)',
      badge: 'SUB-FRAME',
      bgClass: 'bg-[#ffc43d] text-[#2d2004]',
      badgeClass: 'bg-[#2d2004]/15 text-[#2d2004]',
      iconClass: 'text-[#2d2004]',
      icon: Zap,
      trend: '-2.4ms vs p99',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className={`relative rounded-2xl p-5 transition-all duration-200 hover:-translate-y-0.5 shadow-sm hover:shadow-md ${kpi.bgClass}`}
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-90 font-sans">
                {kpi.title}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${kpi.badgeClass}`}
                >
                  {kpi.badge}
                </span>
                <div className={`p-1.5 rounded-xl bg-black/5 ${kpi.iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Metric Value */}
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-3xl font-bold font-display tracking-tight leading-none">
                {kpi.value}
              </span>
              {kpi.unit && (
                <span className="text-sm font-semibold opacity-85 font-display">
                  {kpi.unit}
                </span>
              )}
            </div>

            {/* Subtitle & Trend */}
            <div className="flex items-center justify-between text-xs font-medium opacity-90 pt-1 border-t border-black/10">
              <span className="text-[11px] truncate font-sans">{kpi.subtitle}</span>
              <span className="flex items-center text-[10px] font-bold shrink-0 ml-1">
                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                {kpi.trend}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
