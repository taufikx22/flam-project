import React from 'react';

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Monitor Skeleton */}
      <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 h-36">
        <div className="flex justify-between items-center pb-3 border-b border-white/5">
          <div className="h-5 w-48 bg-slate-800 rounded" />
          <div className="h-6 w-32 bg-slate-800 rounded" />
        </div>
        <div className="grid grid-cols-4 gap-3 pt-4">
          <div className="h-16 bg-slate-800/60 rounded-lg" />
          <div className="h-16 bg-slate-800/60 rounded-lg" />
          <div className="h-16 bg-slate-800/60 rounded-lg" />
          <div className="h-16 bg-slate-800/60 rounded-lg" />
        </div>
      </div>

      {/* Controls Skeleton */}
      <div className="h-12 bg-slate-900/60 rounded-xl border border-white/10" />

      {/* Main Chart Skeleton */}
      <div className="h-96 bg-slate-900/60 rounded-xl border border-white/10" />

      {/* Bottom Grid Skeletons */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="h-72 bg-slate-900/60 rounded-xl border border-white/10" />
        <div className="h-72 bg-slate-900/60 rounded-xl border border-white/10" />
        <div className="h-72 bg-slate-900/60 rounded-xl border border-white/10" />
      </div>
    </div>
  );
}
