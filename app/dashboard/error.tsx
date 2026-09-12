'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Dashboard runtime error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center">
      <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 mb-4 shadow-xl">
        <AlertTriangle className="w-10 h-10" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">
        Telemetry Stream Encountered An Interruption
      </h2>
      <p className="text-sm text-slate-400 max-w-md mb-6 font-mono">
        {error.message || 'An unexpected rendering anomaly occurred.'}
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-semibold hover:bg-cyan-400 transition-colors shadow-lg"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Re-initialize Canvas Pipeline</span>
      </button>
    </div>
  );
}
