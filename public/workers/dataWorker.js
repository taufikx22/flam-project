/**
 * Dedicated Web Worker for off-thread heavy data processing,
 * aggregation, and LTTB downsampling for 10k-100k data points.
 */

self.onmessage = function (e) {
  const { type, payload, id } = e.data;
  const startTime = performance.now();

  switch (type) {
    case 'AGGREGATE': {
      const { timestamps, values, count, period } = payload;
      let bucketMs = 60 * 1000;
      if (period === '5min') bucketMs = 5 * 60 * 1000;
      if (period === '1hour') bucketMs = 60 * 60 * 1000;

      const buckets = new Map();

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

      const result = [];
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

      result.sort((a, b) => a.timestamp - b.timestamp);

      self.postMessage({
        type: 'AGGREGATE_RESULT',
        id,
        result,
        durationMs: performance.now() - startTime,
      });
      break;
    }

    case 'DOWNSAMPLE_LTTB': {
      const { timestamps, values, count, targetPoints } = payload;
      if (targetPoints >= count || targetPoints === 0 || count <= 2) {
        self.postMessage({
          type: 'DOWNSAMPLE_RESULT',
          id,
          timestamps,
          values,
          count,
          durationMs: performance.now() - startTime,
        });
        return;
      }

      const outTimestamps = new Float64Array(targetPoints);
      const outValues = new Float64Array(targetPoints);
      const every = (count - 2) / (targetPoints - 2);

      let a = 0;
      outTimestamps[0] = timestamps[a];
      outValues[0] = values[a];
      let outIndex = 1;

      for (let i = 0; i < targetPoints - 2; i++) {
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

        const rangeBStart = Math.floor(i * every) + 1;
        const rangeBEnd = Math.min(Math.floor((i + 1) * every) + 1, count);
        const pointAX = timestamps[a];
        const pointAY = values[a];

        let maxArea = -1;
        let maxAreaIndex = rangeBStart;

        for (let j = rangeBStart; j < rangeBEnd; j++) {
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
        a = maxAreaIndex;
      }

      outTimestamps[outIndex] = timestamps[count - 1];
      outValues[outIndex] = values[count - 1];
      outIndex++;

      self.postMessage(
        {
          type: 'DOWNSAMPLE_RESULT',
          id,
          timestamps: outTimestamps,
          values: outValues,
          count: outIndex,
          durationMs: performance.now() - startTime,
        },
        [outTimestamps.buffer, outValues.buffer]
      );
      break;
    }

    default:
      break;
  }
};
