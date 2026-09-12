import { AggregatedPoint, AggregationPeriod } from './types';

/**
 * Largest-Triangle-Three-Buckets (LTTB) Downsampling Algorithm.
 * Optimized for time-series data to retain visual peaks, valleys, and trends
 * while reducing 10k-100k points to ~screen-width pixels for 60fps rendering.
 */
export function downsampleLTTB(
  timestamps: Float64Array | number[],
  values: Float64Array | number[],
  count: number,
  targetPoints: number
): { timestamps: Float64Array; values: Float64Array; count: number } {
  if (targetPoints >= count || targetPoints === 0 || count <= 2) {
    const outTs = new Float64Array(count);
    const outVal = new Float64Array(count);
    for (let i = 0; i < count; i++) {
      outTs[i] = timestamps[i];
      outVal[i] = values[i];
    }
    return { timestamps: outTs, values: outVal, count };
  }

  const outTimestamps = new Float64Array(targetPoints);
  const outValues = new Float64Array(targetPoints);

  // Bucket size. Leave room for start and end data points
  const every = (count - 2) / (targetPoints - 2);

  let a = 0;
  outTimestamps[0] = timestamps[a];
  outValues[0] = values[a];

  let outIndex = 1;

  for (let i = 0; i < targetPoints - 2; i++) {
    // Calculate point average for next bucket (bucket c)
    let avgX = 0;
    let avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * every) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * every) + 1, count);
    const avgRangeLength = avgRangeEnd - avgRangeStart;

    if (avgRangeLength > 0) {
      for (let j = avgRangeStart; j < avgRangeEnd; j++) {
        avgX += timestamps[j];
        avgY += values[j];
      }
      avgX /= avgRangeLength;
      avgY /= avgRangeLength;
    } else {
      const idx = Math.min(avgRangeStart, count - 1);
      avgX = timestamps[idx];
      avgY = values[idx];
    }

    // Get the range for this bucket (bucket b)
    const rangeBStart = Math.floor(i * every) + 1;
    const rangeBEnd = Math.min(Math.floor((i + 1) * every) + 1, count);

    // Point a
    const pointAX = timestamps[a];
    const pointAY = values[a];

    let maxArea = -1;
    let maxAreaIndex = rangeBStart;

    for (let j = rangeBStart; j < rangeBEnd; j++) {
      // Calculate triangle area over points a, point[j], and avg(c)
      const area = Math.abs(
        (pointAX - avgX) * (values[j] - pointAY) -
        (pointAX - timestamps[j]) * (avgY - pointAY)
      ) * 0.5;

      if (area > maxArea) {
        maxArea = area;
        maxAreaIndex = j;
      }
    }

    outTimestamps[outIndex] = timestamps[maxAreaIndex];
    outValues[outIndex] = values[maxAreaIndex];
    outIndex++;

    a = maxAreaIndex; // Next point a is the chosen point from bucket b
  }

  // Always include the last point
  outTimestamps[outIndex] = timestamps[count - 1];
  outValues[outIndex] = values[count - 1];
  outIndex++;

  return { timestamps: outTimestamps, values: outValues, count: outIndex };
}

/**
 * Fast binary search to find the lower bound index for timestamp in sorted array.
 */
export function binarySearchLower(timestamps: Float64Array | number[], count: number, target: number): number {
  let low = 0;
  let high = count - 1;
  let result = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (timestamps[mid] >= target) {
      result = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }
  return result;
}

/**
 * Aggregate time-series into fixed bucket windows (1min, 5min, 1hour).
 */
export function aggregateData(
  timestamps: Float64Array | number[],
  values: Float64Array | number[],
  count: number,
  period: AggregationPeriod
): AggregatedPoint[] {
  if (period === 'raw' || count === 0) return [];

  let bucketMs = 60 * 1000; // 1min
  if (period === '5min') bucketMs = 5 * 60 * 1000;
  if (period === '1hour') bucketMs = 60 * 60 * 1000;

  const buckets: Map<number, { sum: number; min: number; max: number; count: number }> = new Map();

  for (let i = 0; i < count; i++) {
    const ts = timestamps[i];
    const val = values[i];
    const bucketKey = Math.floor(ts / bucketMs) * bucketMs;

    const existing = buckets.get(bucketKey);
    if (!existing) {
      buckets.set(bucketKey, { sum: val, min: val, max: val, count: 1 });
    } else {
      existing.sum += val;
      if (val < existing.min) existing.min = val;
      if (val > existing.max) existing.max = val;
      existing.count += 1;
    }
  }

  const result: AggregatedPoint[] = [];
  buckets.forEach((b, bucketTs) => {
    result.push({
      timestamp: bucketTs,
      avg: b.sum / b.count,
      min: b.min,
      max: b.max,
      count: b.count,
      sum: b.sum,
    });
  });

  return result.sort((a, b) => a.timestamp - b.timestamp);
}
