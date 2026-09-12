'use client';

import React from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { ExtendedPerformanceMetrics } from '@/hooks/usePerformanceMonitor';
import { Activity, Cpu, HardDrive, Zap, Flame, ShieldCheck, Layers } from 'lucide-react';

export default function PerformanceMonitor({
  metrics,
}: {
  metrics: ExtendedPerformanceMetrics;
}) {
  const {
    stream,
    streamSettings,
    setStressTarget,
  } = useDashboardData();

  const totalPoints = stream.countRef.current;
  const fpsStatus =
    metrics.fps >= 58 ? 'optimal' : metrics.fps >= 35 ? 'moderate' : 'critical';

  const budgetRatio = Math.min(100, Math.round((metrics.renderTime / 16.6) * 100));

  return (
    <div className="relative rounded-2xl bg-white border border-slate-200/80 p-5 shadow-sm overflow-hidden select-none">
      {/* Header bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-2xl bg-[#111827] text-[#06d6a0] shadow-sm">
            <Activity className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#06d6a0]" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase">
                Telemetric Engine Diagnostics
              </h2>
              <span className="flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#06d6a0]/15 text-[#065f46] border border-[#06d6a0]/30">
                <ShieldCheck className="w-3 h-3" /> 60 FPS Target
              </span>
            </div>
            <p className="text-xs text-slate-500 font-sans">
              High-frequency frame budget & heap consumption monitor • Real-time 4Hz sampling
            </p>
          </div>
        </div>

        {/* Stress Mode Load Selector */}
        <div className="flex items-center gap-1.5 bg-[#f1f5f9] p-1.5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-700 px-2 flex items-center gap-1.5 font-sans">
            <Flame className="w-4 h-4 text-[#ef476f]" />
            <span>Stress Test:</span>
          </span>
          {[
            { label: '10,000 pts', count: 10_000 },
            { label: '50,000 pts', count: 50_000 },
            { label: '100,000 pts', count: 100_000 },
          ].map((preset) => {
            const active = streamSettings.stressTarget === preset.count;
            return (
              <button
                key={preset.count}
                onClick={() => setStressTarget(preset.count)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  active
                    ? 'bg-[#111827] text-[#06d6a0] shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200/80 hover:text-[#111827] hover:bg-slate-50'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Telemetric Metric Cards Grid */}
      <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
        {/* Card 1: Frame Rate */}
        <div className="rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3.5 flex flex-col justify-between hover:border-[#06d6a0] transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-700 font-sans">
              <Zap className="w-3.5 h-3.5 text-[#06d6a0]" /> Frame Rate
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                fpsStatus === 'optimal'
                  ? 'bg-[#06d6a0]/20 text-[#065f46]'
                  : fpsStatus === 'moderate'
                  ? 'bg-[#ffc43d]/20 text-[#854d0e]'
                  : 'bg-[#ef476f]/20 text-[#9f1239]'
              }`}
            >
              {fpsStatus}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display tracking-tight text-[#111827]">
              {metrics.fps}
            </span>
            <span className="text-xs font-mono font-medium text-slate-500">FPS / 60</span>
          </div>
          {/* Visual Sparkline */}
          <div className="h-7 flex items-end gap-[3px] mt-3 pt-1 border-t border-slate-200">
            {metrics.fpsHistory.map((val, i) => {
              const hPercent = Math.max(12, Math.min(100, (val / 60) * 100));
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm transition-all duration-300"
                  style={{
                    height: `${hPercent}%`,
                    backgroundColor:
                      val >= 55 ? '#06d6a0' : val >= 30 ? '#ffc43d' : '#ef476f',
                  }}
                  title={`${val} FPS`}
                />
              );
            })}
          </div>
        </div>

        {/* Card 2: JS Heap Memory */}
        <div className="rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3.5 flex flex-col justify-between hover:border-[#1b9aaa] transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-700 font-sans">
              <HardDrive className="w-3.5 h-3.5 text-[#1b9aaa]" /> JS Heap Memory
            </span>
            <span className="text-[10px] font-mono text-[#1b9aaa] font-bold">
              &lt; 1MB/hr
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display tracking-tight text-[#111827]">
              {metrics.memoryUsage}
            </span>
            <span className="text-xs font-mono font-medium text-slate-500">MB Used</span>
          </div>
          {/* Visual Sparkline */}
          <div className="h-7 flex items-end gap-[3px] mt-3 pt-1 border-t border-slate-200">
            {metrics.memoryHistory.map((val, i) => {
              const hPercent = Math.max(15, Math.min(100, (val / 100) * 100));
              return (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-[#1b9aaa]/70 transition-all duration-300"
                  style={{ height: `${hPercent}%` }}
                  title={`${val} MB`}
                />
              );
            })}
          </div>
        </div>

        {/* Card 3: Frame Budget Utilization */}
        <div className="rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3.5 flex flex-col justify-between hover:border-[#06d6a0] transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-700 font-sans">
              <Cpu className="w-3.5 h-3.5 text-[#06d6a0]" /> Frame Budget
            </span>
            <span className="text-[10px] font-mono text-[#065f46] font-bold">
              16.6ms Cap
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display tracking-tight text-[#065f46]">
              {metrics.renderTime}
            </span>
            <span className="text-xs font-mono font-medium text-slate-500">ms / frame</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 mb-1">
              <span>Budget Utilized</span>
              <span className="font-bold text-[#111827]">{budgetRatio}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  budgetRatio <= 40
                    ? 'bg-[#06d6a0]'
                    : budgetRatio <= 75
                    ? 'bg-[#ffc43d]'
                    : 'bg-[#ef476f]'
                }`}
                style={{ width: `${Math.max(4, budgetRatio)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 4: Ring Buffer & Live Throughput */}
        <div className="rounded-xl border border-slate-200/80 bg-[#f8fafc] p-3.5 flex flex-col justify-between hover:border-[#1b9aaa] transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs uppercase font-semibold tracking-wider flex items-center gap-1.5 text-slate-700 font-sans">
              <Layers className="w-3.5 h-3.5 text-[#1b9aaa]" /> Live Data Buffer
            </span>
            <span className="text-[10px] font-mono text-[#1b9aaa] font-bold">
              O(1) Ring
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold font-display tracking-tight text-[#111827]">
              {totalPoints.toLocaleString()}
            </span>
            <span className="text-xs font-mono font-medium text-slate-500">Points</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Cap: {streamSettings.capacity.toLocaleString()}</span>
            <span className="text-[#059669] font-bold">
              {streamSettings.intervalMs}ms Influx
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
