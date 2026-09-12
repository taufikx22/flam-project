export interface DataPoint {
  id: string;
  timestamp: number;
  value: number;
  category: string;
  metadata?: {
    latency?: number;
    server?: string;
    status?: 'ok' | 'warn' | 'error';
    load?: number;
    [key: string]: any;
  };
}

export type ChartType = 'line' | 'bar' | 'scatter' | 'heatmap';

export type TimeRange = '1m' | '5m' | '15m' | '1h' | 'all';

export type AggregationPeriod = 'raw' | '1min' | '5min' | '1hour';

export interface PerformanceMetrics {
  fps: number;
  memoryUsage: number; // in MB
  renderTime: number; // in ms
  dataProcessingTime: number; // in ms
  pointCount: number;
  downsampledCount: number;
}

export interface ChartConfig {
  type: ChartType;
  dataKey: string;
  color: string;
  visible: boolean;
  label?: string;
}

export interface FilterState {
  selectedCategories: string[];
  minValue: number | null;
  maxValue: number | null;
  selectedStatuses: string[];
  searchQuery: string;
}

export interface StreamSettings {
  intervalMs: number;
  batchSize: number;
  isRunning: boolean;
  capacity: number;
  stressMode: boolean;
  stressTarget: number;
  workerEnabled: boolean;
}

export interface AggregatedPoint {
  timestamp: number;
  avg: number;
  min: number;
  max: number;
  count: number;
  sum: number;
}

export interface ViewportTransform {
  zoom: number; // 1 = 100%, 2 = 200%, etc.
  panX: number; // offset in ms or pixels
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
}

export interface RawSeriesSnapshot {
  timestamps: Float64Array;
  values: Float64Array;
  categories: Uint8Array; // encoded category indices for ultra-fast storage
  latencies: Float32Array;
  count: number;
  startIndex: number;
}
