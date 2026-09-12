'use client';

import React, { useRef, useState, useMemo, useEffect } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useVirtualization } from '@/hooks/useVirtualization';
import { formatTime } from '@/lib/canvasUtils';
import { CATEGORY_COLORS } from '@/lib/dataGenerator';
import { DataPoint } from '@/lib/types';
import { ArrowUpDown, Table as TableIcon, Server, Clock, Activity, Download, Layers } from 'lucide-react';

const ROW_HEIGHT = 44;
const VIEWPORT_HEIGHT = 480;

export default function DataTable() {
  const { stream, filterState } = useDashboardData();
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const [tableData, setTableData] = useState<DataPoint[]>([]);
  const [sortField, setSortField] = useState<'timestamp' | 'value' | 'latency'>('timestamp');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    const updateRows = () => {
      const recent = stream.getRecentPoints(1000);
      setTableData(recent);
    };

    updateRows();
    const interval = setInterval(updateRows, 500);
    return () => clearInterval(interval);
  }, [stream]);

  const processedRows = useMemo(() => {
    let filtered = tableData;

    if (filterState.selectedCategories.length < 4) {
      filtered = filtered.filter((r) =>
        filterState.selectedCategories.includes(r.category)
      );
    }

    if (filterState.selectedStatuses.length < 3) {
      filtered = filtered.filter(
        (r) => r.metadata?.status && filterState.selectedStatuses.includes(r.metadata.status)
      );
    }

    if (filterState.searchQuery.trim() !== '') {
      const q = filterState.searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.category.toLowerCase().includes(q) ||
          r.metadata?.server?.toLowerCase().includes(q)
      );
    }

    return filtered.slice().sort((a, b) => {
      let valA = 0;
      let valB = 0;
      if (sortField === 'timestamp') {
        valA = a.timestamp;
        valB = b.timestamp;
      } else if (sortField === 'value') {
        valA = a.value;
        valB = b.value;
      } else if (sortField === 'latency') {
        valA = a.metadata?.latency ?? 0;
        valB = b.metadata?.latency ?? 0;
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [tableData, filterState, sortField, sortAsc]);

  const virtualization = useVirtualization(
    processedRows.length,
    ROW_HEIGHT,
    VIEWPORT_HEIGHT,
    scrollTop,
    6
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  const handleSort = (field: 'timestamp' | 'value' | 'latency') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const visibleRows = processedRows.slice(
    virtualization.startIndex,
    virtualization.endIndex + 1
  );

  const exportCSV = () => {
    if (processedRows.length === 0) return;
    const header = 'Timestamp,Time,Category,Value,LatencyMs,Server,Status\n';
    const rows = processedRows
      .map(
        (r) =>
          `${r.timestamp},${formatTime(r.timestamp, true)},"${r.category}",${r.value},${r.metadata?.latency || 0},"${r.metadata?.server || ''}","${r.metadata?.status || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `telemetry-data-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm overflow-hidden select-none">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between p-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#111827] text-[#06d6a0]">
            <TableIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase flex items-center gap-2">
              Virtualized Telemetry Ledger
              <span className="text-xs font-mono font-bold text-[#065f46] px-2.5 py-0.5 rounded-full bg-[#06d6a0]/15 border border-[#06d6a0]/30">
                {processedRows.length.toLocaleString()} matching
              </span>
            </h3>
            <span className="text-xs text-slate-500 font-sans">
              Windowed virtual scroll: only {virtualization.visibleCount} DOM elements rendered
            </span>
          </div>
        </div>

        <button
          onClick={exportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#111827] hover:bg-black text-xs font-bold text-white transition-all shadow-sm font-sans"
        >
          <Download className="w-3.5 h-3.5 text-[#06d6a0]" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Column Titles */}
      <div className="grid grid-cols-12 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider select-none font-sans">
        <div
          onClick={() => handleSort('timestamp')}
          className="col-span-3 flex items-center gap-1.5 cursor-pointer hover:text-[#111827] transition-colors"
        >
          <Clock className="w-3.5 h-3.5 text-[#1b9aaa]" />
          <span>Timestamp</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
        <div className="col-span-3 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#ef476f]" />
          <span>Signal Stream</span>
        </div>
        <div
          onClick={() => handleSort('value')}
          className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-[#111827] transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-[#06d6a0]" />
          <span>Metric Value</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
        <div
          onClick={() => handleSort('latency')}
          className="col-span-2 flex items-center gap-1.5 cursor-pointer hover:text-[#111827] transition-colors"
        >
          <span>Latency</span>
          <ArrowUpDown className="w-3 h-3 text-slate-400" />
        </div>
        <div className="col-span-2 flex items-center gap-1.5">
          <Server className="w-3.5 h-3.5 text-[#ffc43d]" />
          <span>Node / State</span>
        </div>
      </div>

      {/* Virtual Scrolling Window */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="overflow-y-auto relative font-mono text-xs"
        style={{ height: VIEWPORT_HEIGHT }}
      >
        <div style={{ height: virtualization.topSpacerPx }} />

        {visibleRows.map((row) => {
          const catColor = CATEGORY_COLORS[row.category] || '#1b9aaa';
          const status = row.metadata?.status || 'ok';
          return (
            <div
              key={row.id}
              className="grid grid-cols-12 items-center px-5 border-b border-slate-100 hover:bg-slate-50 transition-colors"
              style={{ height: ROW_HEIGHT }}
            >
              {/* Timestamp */}
              <div className="col-span-3 text-slate-600 font-medium">
                {formatTime(row.timestamp, true)}
              </div>

              {/* Category */}
              <div className="col-span-3 flex items-center gap-2 truncate pr-2">
                <span
                  className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: catColor }}
                />
                <span className="truncate text-[#111827] font-bold font-sans">{row.category}</span>
              </div>

              {/* Value */}
              <div className="col-span-2 font-bold text-[#111827] text-sm font-display">
                {row.value}
              </div>

              {/* Latency */}
              <div className="col-span-2 text-slate-600">
                {row.metadata?.latency ?? 12} ms
              </div>

              {/* Node / Status */}
              <div className="col-span-2 flex items-center gap-2">
                <span className="text-xs text-slate-500 truncate">
                  {row.metadata?.server || 'node-prod'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 font-sans ${
                    status === 'ok'
                      ? 'bg-[#06d6a0]/15 text-[#065f46] border border-[#06d6a0]/30'
                      : status === 'warn'
                      ? 'bg-[#ffc43d]/20 text-[#854d0e] border border-[#ffc43d]/40'
                      : 'bg-[#ef476f]/15 text-[#9f1239] border border-[#ef476f]/30'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      status === 'ok'
                        ? 'bg-[#06d6a0]'
                        : status === 'warn'
                        ? 'bg-[#ffc43d]'
                        : 'bg-[#ef476f] animate-pulse'
                    }`}
                  />
                  {status}
                </span>
              </div>
            </div>
          );
        })}

        <div style={{ height: virtualization.bottomSpacerPx }} />

        {processedRows.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 py-12">
            <p>No telemetry records match the active filter criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}
