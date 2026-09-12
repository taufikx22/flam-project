'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
  useTransition,
} from 'react';
import {
  DataPoint,
  TimeRange,
  AggregationPeriod,
  FilterState,
  StreamSettings,
  ViewportTransform,
} from '@/lib/types';
import { useDataStream, DataStreamControls } from '@/hooks/useDataStream';
import {
  createInitialState,
  generateNextPoint,
  CATEGORIES,
} from '@/lib/dataGenerator';

interface DataContextType {
  stream: DataStreamControls;
  streamSettings: StreamSettings;
  setStreamSettings: React.Dispatch<React.SetStateAction<StreamSettings>>;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
  aggregation: AggregationPeriod;
  setAggregation: (period: AggregationPeriod) => void;
  filterState: FilterState;
  setFilterState: React.Dispatch<React.SetStateAction<FilterState>>;
  viewport: ViewportTransform;
  setViewport: React.Dispatch<React.SetStateAction<ViewportTransform>>;
  resetViewport: () => void;
  toggleStream: () => void;
  setStressTarget: (count: number) => void;
  isPendingTransition: boolean;
  workerRef: React.MutableRefObject<Worker | null>;
  activeTab: 'charts' | 'table';
  setActiveTab: (tab: 'charts' | 'table') => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({
  children,
  initialData = [],
}: {
  children: React.ReactNode;
  initialData?: DataPoint[];
}) {
  const [isPendingTransition, startTransition] = useTransition();

  const [streamSettings, setStreamSettings] = useState<StreamSettings>({
    intervalMs: 100,
    batchSize: 1,
    isRunning: true,
    capacity: 100_000,
    stressMode: false,
    stressTarget: 10_000,
    workerEnabled: true,
  });

  const [timeRange, setTimeRangeState] = useState<TimeRange>('5m');
  const [aggregation, setAggregationState] = useState<AggregationPeriod>('raw');
  const [activeTab, setActiveTab] = useState<'charts' | 'table'>('charts');

  const [filterState, setFilterState] = useState<FilterState>({
    selectedCategories: [...CATEGORIES],
    minValue: null,
    maxValue: null,
    selectedStatuses: ['ok', 'warn', 'error'],
    searchQuery: '',
  });

  const [viewport, setViewport] = useState<ViewportTransform>({
    zoom: 1,
    panX: 0,
  });

  // Use transition for non-blocking UI changes
  const setTimeRange = useCallback((range: TimeRange) => {
    startTransition(() => {
      setTimeRangeState(range);
      setViewport({ zoom: 1, panX: 0 }); // reset pan on range change
    });
  }, []);

  const setAggregation = useCallback((period: AggregationPeriod) => {
    startTransition(() => {
      setAggregationState(period);
    });
  }, []);

  const resetViewport = useCallback(() => {
    setViewport({ zoom: 1, panX: 0 });
  }, []);

  const stream = useDataStream(streamSettings.capacity);

  // Initialize stream with SSR initialData
  const hasHydratedInitialData = useRef(false);
  useEffect(() => {
    if (!hasHydratedInitialData.current && initialData && initialData.length > 0) {
      stream.appendBatch(initialData);
      hasHydratedInitialData.current = true;
    }
  }, [initialData, stream]);

  // Generator simulation state
  const generatorStateRef = useRef(
    createInitialState(Date.now() - (initialData.length || 10000) * 100)
  );

  // Web Worker reference
  const workerRef = useRef<Worker | null>(null);
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Worker' in window) {
      try {
        const worker = new Worker('/workers/dataWorker.js');
        workerRef.current = worker;
        return () => worker.terminate();
      } catch (err) {
        console.warn('Web Worker not supported or blocked, falling back to main thread.', err);
      }
    }
  }, []);

  // Real-time generator loop (100ms cadence)
  useEffect(() => {
    if (!streamSettings.isRunning) return;

    const interval = setInterval(() => {
      const batchCount = streamSettings.batchSize;
      const gState = generatorStateRef.current;

      for (let i = 0; i < batchCount; i++) {
        const pt = generateNextPoint(gState, streamSettings.intervalMs);
        const catIdx = Math.max(0, CATEGORIES.indexOf(pt.category as any));
        stream.append(
          pt.value,
          pt.timestamp,
          catIdx,
          pt.metadata?.latency ?? 15
        );
      }
    }, streamSettings.intervalMs);

    return () => clearInterval(interval);
  }, [streamSettings.isRunning, streamSettings.intervalMs, streamSettings.batchSize, stream]);

  const toggleStream = useCallback(() => {
    setStreamSettings((prev) => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  const setStressTarget = useCallback(
    (targetCount: number) => {
      startTransition(() => {
        const currentCount = stream.countRef.current;
        if (targetCount > currentCount) {
          const needed = targetCount - currentCount;
          const gState = generatorStateRef.current;
          for (let i = 0; i < needed; i++) {
            gState.step++;
            gState.lastTimestamp += 50;
            const catIdx = gState.step % CATEGORIES.length;
            const catName = CATEGORIES[catIdx];
            let currentVal = gState.categoryValues[catName];
            let direction = gState.trendDirections[catName];
            const noise = (Math.random() - 0.49) * 4;
            const cycle = Math.sin(gState.step * 0.05) * 1.5;
            currentVal += noise + cycle + direction * 0.5;
            const minVal = 10;
            const maxVal = catName === 'Request Rate' ? 500 : 200;
            if (currentVal < minVal) {
              currentVal = minVal + Math.random() * 5;
              gState.trendDirections[catName] = 1;
            } else if (currentVal > maxVal) {
              currentVal = maxVal - Math.random() * 5;
              gState.trendDirections[catName] = -1;
            }
            gState.categoryValues[catName] = currentVal;
            const latency = 12 + Math.random() * 25;
            stream.append(currentVal, gState.lastTimestamp, catIdx, latency);
          }
        } else if (targetCount < currentCount) {
          stream.countRef.current = targetCount;
          stream.versionRef.current++;
        }

        setStreamSettings((prev) => ({
          ...prev,
          stressTarget: targetCount,
          stressMode: targetCount >= 50000,
          batchSize: targetCount >= 100000 ? 10 : targetCount >= 50000 ? 5 : 1,
        }));
      });
    },
    [stream]
  );

  return (
    <DataContext.Provider
      value={{
        stream,
        streamSettings,
        setStreamSettings,
        timeRange,
        setTimeRange,
        aggregation,
        setAggregation,
        filterState,
        setFilterState,
        viewport,
        setViewport,
        resetViewport,
        toggleStream,
        setStressTarget,
        isPendingTransition,
        workerRef,
        activeTab,
        setActiveTab,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDashboardData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDashboardData must be used within a DataProvider');
  }
  return context;
}
