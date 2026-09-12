'use client';

import { useRef, useCallback, useEffect } from 'react';
import { DataPoint } from '@/lib/types';
import { CATEGORIES } from '@/lib/dataGenerator';

export interface DataStreamControls {
  timestampsRef: React.MutableRefObject<Float64Array>;
  valuesRef: React.MutableRefObject<Float64Array>;
  categoriesRef: React.MutableRefObject<Uint8Array>;
  latenciesRef: React.MutableRefObject<Float32Array>;
  countRef: React.MutableRefObject<number>;
  writeIndexRef: React.MutableRefObject<number>;
  versionRef: React.MutableRefObject<number>;
  append: (value: number, timestamp: number, categoryIdx: number, latency: number) => void;
  appendBatch: (points: DataPoint[]) => void;
  getSnapshot: () => {
    timestamps: Float64Array;
    values: Float64Array;
    categories: Uint8Array;
    latencies: Float32Array;
    count: number;
    startIndex: number;
  };
  getRecentPoints: (limit?: number) => DataPoint[];
  reset: (newCapacity?: number) => void;
}

export function useDataStream(capacity = 100_000): DataStreamControls {
  const timestampsRef = useRef(new Float64Array(capacity));
  const valuesRef = useRef(new Float64Array(capacity));
  const categoriesRef = useRef(new Uint8Array(capacity));
  const latenciesRef = useRef(new Float32Array(capacity));
  const writeIndexRef = useRef(0);
  const countRef = useRef(0);
  const versionRef = useRef(0); // incremented on write for dirty checking

  const append = useCallback(
    (value: number, timestamp: number, categoryIdx: number, latency: number) => {
      const idx = writeIndexRef.current;
      timestampsRef.current[idx] = timestamp;
      valuesRef.current[idx] = value;
      categoriesRef.current[idx] = categoryIdx;
      latenciesRef.current[idx] = latency;

      writeIndexRef.current = (idx + 1) % capacity;
      if (countRef.current < capacity) {
        countRef.current++;
      }
      versionRef.current++;
    },
    [capacity]
  );

  const appendBatch = useCallback(
    (points: DataPoint[]) => {
      const len = points.length;
      if (len === 0) return;

      const ts = timestampsRef.current;
      const vals = valuesRef.current;
      const cats = categoriesRef.current;
      const lats = latenciesRef.current;

      let idx = writeIndexRef.current;
      for (let i = 0; i < len; i++) {
        const pt = points[i];
        ts[idx] = pt.timestamp;
        vals[idx] = pt.value;
        const catIdx = Math.max(0, CATEGORIES.indexOf(pt.category as any));
        cats[idx] = catIdx === -1 ? 0 : catIdx;
        lats[idx] = pt.metadata?.latency ?? 15;

        idx = (idx + 1) % capacity;
      }

      writeIndexRef.current = idx;
      countRef.current = Math.min(countRef.current + len, capacity);
      versionRef.current++;
    },
    [capacity]
  );

  const getSnapshot = useCallback(() => {
    const count = countRef.current;
    const writeIdx = writeIndexRef.current;
    const startIndex = count === capacity ? writeIdx : 0;

    return {
      timestamps: timestampsRef.current,
      values: valuesRef.current,
      categories: categoriesRef.current,
      latencies: latenciesRef.current,
      count,
      startIndex,
    };
  }, [capacity]);

  const getRecentPoints = useCallback(
    (limit = 100): DataPoint[] => {
      const count = countRef.current;
      const writeIdx = writeIndexRef.current;
      const actualLimit = Math.min(limit, count);
      const result: DataPoint[] = new Array(actualLimit);

      const ts = timestampsRef.current;
      const vals = valuesRef.current;
      const cats = categoriesRef.current;
      const lats = latenciesRef.current;

      for (let i = 0; i < actualLimit; i++) {
        // Read backwards from latest written element
        const ringIdx = (writeIdx - 1 - i + capacity) % capacity;
        const catName = CATEGORIES[cats[ringIdx]] || CATEGORIES[0];
        const val = vals[ringIdx];
        const lat = lats[ringIdx];
        const t = ts[ringIdx];

        result[i] = {
          id: `raw-${t}-${i}`,
          timestamp: t,
          value: Number(val.toFixed(2)),
          category: catName,
          metadata: {
            latency: Number(lat.toFixed(1)),
            server: `node-prod-${(ringIdx % 8) + 1}`,
            status: val > 180 ? 'error' : val > 140 ? 'warn' : 'ok',
            load: Math.min(100, Math.round((val / 250) * 100)),
          },
        };
      }

      return result;
    },
    [capacity]
  );

  const reset = useCallback(
    (newCapacity = capacity) => {
      timestampsRef.current = new Float64Array(newCapacity);
      valuesRef.current = new Float64Array(newCapacity);
      categoriesRef.current = new Uint8Array(newCapacity);
      latenciesRef.current = new Float32Array(newCapacity);
      writeIndexRef.current = 0;
      countRef.current = 0;
      versionRef.current++;
    },
    [capacity]
  );

  return {
    timestampsRef,
    valuesRef,
    categoriesRef,
    latenciesRef,
    countRef,
    writeIndexRef,
    versionRef,
    append,
    appendBatch,
    getSnapshot,
    getRecentPoints,
    reset,
  };
}
