'use client';

import React from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { TimeRange, AggregationPeriod } from '@/lib/types';
import { Play, Pause, RotateCcw, ZoomIn, ZoomOut, Clock, BarChart2 } from 'lucide-react';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1m', value: '1m' },
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '1h', value: '1h' },
  { label: 'All', value: 'all' },
];

const AGGREGATION_PERIODS: { label: string; value: AggregationPeriod }[] = [
  { label: 'Raw', value: 'raw' },
  { label: '1m Agg', value: '1min' },
  { label: '5m Agg', value: '5min' },
  { label: '1h Agg', value: '1hour' },
];

export default function TimeRangeSelector() {
  const {
    timeRange,
    setTimeRange,
    aggregation,
    setAggregation,
    streamSettings,
    setStreamSettings,
    toggleStream,
    viewport,
    setViewport,
    resetViewport,
    isPendingTransition,
  } = useDashboardData();

  const handleZoomIn = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.min(10, prev.zoom * 1.25) }));
  };

  const handleZoomOut = () => {
    setViewport((prev) => ({ ...prev, zoom: Math.max(1, prev.zoom * 0.8) }));
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white border border-slate-200/80 px-4 py-2.5 shadow-sm">
      {/* Stream Play/Pause and Cadence */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleStream}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all duration-200 shadow-sm font-sans ${
            streamSettings.isRunning
              ? 'bg-[#06d6a0]/15 text-[#065f46] border border-[#06d6a0]/30 hover:bg-[#06d6a0]/25'
              : 'bg-[#ffc43d]/20 text-[#854d0e] border border-[#ffc43d]/40 hover:bg-[#ffc43d]/30'
          }`}
        >
          {streamSettings.isRunning ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#06d6a0] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#06d6a0]" />
              </span>
              <Pause className="w-3.5 h-3.5" />
              <span>Streaming 10Hz</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5" />
              <span>Stream Paused</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
          {[50, 100, 250].map((ms) => (
            <button
              key={ms}
              onClick={() =>
                setStreamSettings((prev) => ({ ...prev, intervalMs: ms }))
              }
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold transition-all ${
                streamSettings.intervalMs === ms
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-slate-500 hover:text-[#111827]'
              }`}
            >
              {ms}ms
            </button>
          ))}
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-bold flex items-center gap-1 hidden sm:inline-flex font-sans">
          <Clock className="w-3.5 h-3.5 text-[#1b9aaa]" /> Window:
        </span>
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setTimeRange(r.value)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all duration-150 font-sans ${
                timeRange === r.value
                  ? 'bg-[#111827] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#111827]'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aggregation Selector */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-slate-500 font-bold flex items-center gap-1 hidden sm:inline-flex font-sans">
          <BarChart2 className="w-3.5 h-3.5 text-[#ef476f]" /> Agg:
        </span>
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1 text-xs">
          {AGGREGATION_PERIODS.map((a) => (
            <button
              key={a.value}
              onClick={() => setAggregation(a.value)}
              className={`px-3 py-1 rounded-lg font-bold text-xs transition-all duration-150 font-sans ${
                aggregation === a.value
                  ? 'bg-[#ef476f] text-white shadow-sm'
                  : 'text-slate-600 hover:text-[#111827]'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Zoom / Pan Controls */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-1.5 rounded-lg text-slate-600 hover:text-[#111827] hover:bg-slate-200 transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 font-mono text-xs text-[#111827] min-w-[40px] text-center font-bold">
            {viewport.zoom.toFixed(1)}x
          </span>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-slate-600 hover:text-[#111827] hover:bg-slate-200 transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
        </div>

        {(viewport.zoom !== 1 || viewport.panX !== 0) && (
          <button
            onClick={resetViewport}
            title="Reset Zoom/Pan"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-100 hover:bg-slate-200 text-xs text-slate-700 font-bold transition-all shadow-sm font-sans"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}

        {isPendingTransition && (
          <span className="text-xs text-[#1b9aaa] font-mono animate-pulse ml-1 font-bold">
            Rendering...
          </span>
        )}
      </div>
    </div>
  );
}
