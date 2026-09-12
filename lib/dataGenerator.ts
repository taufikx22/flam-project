import { DataPoint } from './types';

export const CATEGORIES = ['System Load', 'Network I/O', 'Memory Pressure', 'Request Rate'] as const;
export type CategoryName = typeof CATEGORIES[number];

export const CATEGORY_COLORS: Record<string, string> = {
  'System Load': '#1b9aaa',      // Pacific Cyan
  'Network I/O': '#06d6a0',      // Emerald
  'Memory Pressure': '#ef476f',  // Bubblegum Pink
  'Request Rate': '#ffc43d',     // Amber Gold
};

export interface GeneratorState {
  lastTimestamp: number;
  categoryValues: Record<string, number>;
  trendDirections: Record<string, number>;
  step: number;
}

export function createInitialState(baseTimestamp = Date.now() - 10000 * 100): GeneratorState {
  return {
    lastTimestamp: baseTimestamp,
    categoryValues: {
      'System Load': 45,
      'Network I/O': 120,
      'Memory Pressure': 65,
      'Request Rate': 250,
    },
    trendDirections: {
      'System Load': 1,
      'Network I/O': -1,
      'Memory Pressure': 1,
      'Request Rate': 1,
    },
    step: 0,
  };
}

/**
 * Generates a realistic single data point.
 */
export function generateNextPoint(state: GeneratorState, intervalMs = 100): DataPoint {
  state.step++;
  state.lastTimestamp += intervalMs;

  // Cycle through categories
  const catIndex = state.step % CATEGORIES.length;
  const category = CATEGORIES[catIndex];

  let currentVal = state.categoryValues[category];
  let direction = state.trendDirections[category];

  // Random walk with mean reversion
  const noise = (Math.random() - 0.49) * 4;
  const cycle = Math.sin(state.step * 0.05) * 1.5;

  currentVal += noise + cycle + direction * 0.5;

  // Bound within realistic ranges
  const minVal = 10;
  const maxVal = category === 'Request Rate' ? 500 : 200;

  if (currentVal < minVal) {
    currentVal = minVal + Math.random() * 5;
    state.trendDirections[category] = 1;
  } else if (currentVal > maxVal) {
    currentVal = maxVal - Math.random() * 5;
    state.trendDirections[category] = -1;
  }

  // Occasional random anomaly spike (1% chance)
  if (Math.random() < 0.01) {
    currentVal += (Math.random() > 0.5 ? 1 : -1) * (20 + Math.random() * 30);
  }

  state.categoryValues[category] = currentVal;

  const latency = 12 + Math.random() * 25 + (currentVal > 150 ? 40 : 0);
  const status: 'ok' | 'warn' | 'error' = currentVal > 180 ? 'error' : currentVal > 140 ? 'warn' : 'ok';

  return {
    id: `pt-${state.lastTimestamp}-${state.step}`,
    timestamp: state.lastTimestamp,
    value: Math.round(currentVal * 100) / 100,
    category,
    metadata: {
      latency: Math.round(latency * 10) / 10,
      server: `node-prod-${(state.step % 8) + 1}`,
      status,
      load: Math.round((currentVal / maxVal) * 100),
    },
  };
}

/**
 * Generate initial bulk dataset for Server Component SSR / initial client hydration.
 */
export function generateInitialDataset(count = 10000, intervalMs = 100): DataPoint[] {
  // Use fixed baseline anchor so server rendering and client hydration match deterministically
  const baseTime = 1726000000000;
  const startTime = baseTime - count * intervalMs;
  const state = createInitialState(startTime);

  const dataset: DataPoint[] = new Array(count);
  for (let i = 0; i < count; i++) {
    dataset[i] = generateNextPoint(state, intervalMs);
  }
  return dataset;
}
