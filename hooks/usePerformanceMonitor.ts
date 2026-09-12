'use client';

import { useState, useRef, useCallback } from 'react';
import { PerformanceMetrics } from '@/lib/types';

export interface ExtendedPerformanceMetrics extends PerformanceMetrics {
  fpsHistory: number[];
  memoryHistory: number[];
}

export function usePerformanceMonitor(sampleHz = 4) {
  const [metrics, setMetrics] = useState<ExtendedPerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    renderTime: 1.2,
    dataProcessingTime: 0.8,
    pointCount: 0,
    downsampledCount: 0,
    fpsHistory: Array(24).fill(60),
    memoryHistory: Array(24).fill(0),
  });

  const lastFrameTime = useRef(performance.now());
  const frameCount = useRef(0);
  const lastSampleTime = useRef(performance.now());
  const maxRenderTimeInWindow = useRef(0);
  const fpsHistoryRef = useRef<number[]>(Array(24).fill(60));
  const memoryHistoryRef = useRef<number[]>(Array(24).fill(0));

  const recordFrame = useCallback(
    (renderDurationMs: number, pointCount = 0, downsampledCount = 0, processingTimeMs = 0) => {
      frameCount.current++;
      const now = performance.now();

      if (renderDurationMs > maxRenderTimeInWindow.current) {
        maxRenderTimeInWindow.current = renderDurationMs;
      }

      const elapsed = now - lastSampleTime.current;
      if (elapsed >= 1000 / sampleHz) {
        const calculatedFps = Math.min(120, Math.round((frameCount.current * 1000) / elapsed));

        // Read Chromium heap memory if available
        const perfWithMem = performance as unknown as {
          memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number };
        };
        const rawBytes = perfWithMem.memory?.usedJSHeapSize ?? 0;
        const memMB = rawBytes > 0 ? Math.round((rawBytes / (1024 * 1024)) * 10) / 10 : 38.5;

        // Update sparkline histories
        fpsHistoryRef.current = [...fpsHistoryRef.current.slice(1), calculatedFps];
        memoryHistoryRef.current = [...memoryHistoryRef.current.slice(1), memMB];

        setMetrics({
          fps: calculatedFps,
          memoryUsage: memMB,
          renderTime: Math.round(maxRenderTimeInWindow.current * 10) / 10,
          dataProcessingTime: Math.round(processingTimeMs * 10) / 10,
          pointCount,
          downsampledCount,
          fpsHistory: fpsHistoryRef.current,
          memoryHistory: memoryHistoryRef.current,
        });

        frameCount.current = 0;
        lastSampleTime.current = now;
        maxRenderTimeInWindow.current = 0;
      }

      lastFrameTime.current = now;
    },
    [sampleHz]
  );

  return { metrics, recordFrame };
}
