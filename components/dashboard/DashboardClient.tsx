'use client';

import React, { useCallback, useEffect } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useDashboardUI } from '@/components/providers/DashboardUIProvider';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import PerformanceMonitor from '@/components/ui/PerformanceMonitor';
import TimeRangeSelector from '@/components/controls/TimeRangeSelector';
import FilterPanel from '@/components/controls/FilterPanel';
import LineChart from '@/components/charts/LineChart';
import BarChart from '@/components/charts/BarChart';
import ScatterPlot from '@/components/charts/ScatterPlot';
import Heatmap from '@/components/charts/Heatmap';
import DataTable from '@/components/ui/DataTable';
import ClusterOverview from '@/components/dashboard/ClusterOverview';
import ClusterNodesView from '@/components/dashboard/ClusterNodesView';
import { LayoutGrid, TableProperties, AlertOctagon, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

export default function DashboardClient() {
  const { activeTab, setActiveTab, stream } = useDashboardData();
  const { activeSection, setActiveSection, showDiagnostics, setIsAlertsOpen } = useDashboardUI();
  const { metrics, recordFrame } = usePerformanceMonitor(4);

  const handleChartFrame = useCallback(
    (fps: number, renderMs: number, visiblePoints: number, downsampledCount: number) => {
      recordFrame(renderMs, stream.countRef.current, downsampledCount, 0.6);
    },
    [recordFrame, stream]
  );

  // If activeSection changes from sidebar, sync with activeTab when appropriate
  useEffect(() => {
    if (activeSection === 'ledger') {
      setActiveTab('table');
    } else if (activeSection === 'charts') {
      setActiveTab('charts');
    } else if (activeSection === 'incidents') {
      setIsAlertsOpen(true);
    }
  }, [activeSection, setActiveTab, setIsAlertsOpen]);

  // Render view depending on activeSection from sidebar
  const renderMainSection = () => {
    switch (activeSection) {
      case 'nodes':
        return <ClusterNodesView />;

      case 'ledger':
        return <DataTable />;

      case 'incidents':
        return (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white border border-slate-200/80 p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#ffc43d]/20 text-[#854d0e]">
                  <AlertOctagon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#111827] font-display">
                    Incident Triage & SLO Alert Feeds
                  </h3>
                  <p className="text-xs text-slate-500 font-sans">
                    Real-time threshold violation detection across all 8 ingestion worker nodes.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAlertsOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#111827] hover:bg-black text-white font-bold text-xs transition-colors shadow-sm font-sans"
              >
                <span>Open Incident Drawer</span>
                <ArrowRight className="w-4 h-4 text-[#06d6a0]" />
              </button>
            </div>
            <DataTable />
          </div>
        );

      case 'charts':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <TimeRangeSelector />
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => {
                    setActiveTab('charts');
                    setActiveSection('charts');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans ${
                    activeTab === 'charts'
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#06d6a0]" />
                  <span>Telemetry Grid</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('table');
                    setActiveSection('ledger');
                  }}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans ${
                    activeTab === 'table'
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  <TableProperties className="w-3.5 h-3.5 text-[#ef476f]" />
                  <span>Virtualized Ledger</span>
                </button>
              </div>
            </div>

            <FilterPanel />

            <div className="space-y-6">
              <LineChart height={420} onFPSAction={handleChartFrame} />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <BarChart height={340} />
                <ScatterPlot height={340} />
                <Heatmap height={340} />
              </div>
            </div>
          </div>
        );

      case 'overview':
      default:
        return (
          <div className="space-y-6">
            {/* Top Cluster Health & Ingestion Rate KPI Strip */}
            <ClusterOverview />

            {/* Visualizer Controls */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <TimeRangeSelector />
              <div className="flex items-center rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  onClick={() => setActiveTab('charts')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans ${
                    activeTab === 'charts'
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-[#06d6a0]" />
                  <span>Telemetry Grid</span>
                </button>
                <button
                  onClick={() => setActiveTab('table')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all font-sans ${
                    activeTab === 'table'
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'text-slate-600 hover:text-[#111827]'
                  }`}
                >
                  <TableProperties className="w-3.5 h-3.5 text-[#ef476f]" />
                  <span>Virtualized Ledger</span>
                </button>
              </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel />

            {/* Charts View or Virtualized Table View */}
            {activeTab === 'charts' ? (
              <div className="space-y-6">
                {/* 60 FPS Canvas Line Chart */}
                <LineChart height={390} onFPSAction={handleChartFrame} />

                {/* Tri-Chart Grid: Bar, Scatter, Heatmap */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <BarChart height={330} />
                  <ScatterPlot height={330} />
                  <Heatmap height={330} />
                </div>
              </div>
            ) : (
              <DataTable />
            )}
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Real-Time Diagnostics HUD (Toggleable from Header or Cmd+K) */}
      {showDiagnostics && <PerformanceMonitor metrics={metrics} />}

      {/* 2. Main Selected View */}
      {renderMainSection()}
    </div>
  );
}
