export interface CanvasDimensions {
  width: number;
  height: number;
  dpr: number;
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_PADDING: ChartPadding = {
  top: 20,
  right: 24,
  bottom: 36,
  left: 54,
};

/**
 * Configure Canvas for High-DPI (Retina) displays.
 * Prevents blurry lines and text by scaling backing buffer by devicePixelRatio.
 */
export function setupCanvasDPI(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  logicalWidth: number,
  logicalHeight: number
): CanvasDimensions {
  const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;

  canvas.width = Math.floor(logicalWidth * dpr);
  canvas.height = Math.floor(logicalHeight * dpr);
  canvas.style.width = `${logicalWidth}px`;
  canvas.style.height = `${logicalHeight}px`;

  ctx.resetTransform();
  ctx.scale(dpr, dpr);

  return { width: logicalWidth, height: logicalHeight, dpr };
}

/**
 * Map domain value to screen pixel coordinate along X axis.
 */
export function mapX(
  val: number,
  minX: number,
  maxX: number,
  width: number,
  padding = DEFAULT_PADDING
): number {
  if (maxX === minX) return padding.left;
  const usableWidth = width - padding.left - padding.right;
  return padding.left + ((val - minX) / (maxX - minX)) * usableWidth;
}

/**
 * Map domain value to screen pixel coordinate along Y axis (inverted for canvas).
 */
export function mapY(
  val: number,
  minY: number,
  maxY: number,
  height: number,
  padding = DEFAULT_PADDING
): number {
  if (maxY === minY) return height - padding.bottom;
  const usableHeight = height - padding.top - padding.bottom;
  return height - padding.bottom - ((val - minY) / (maxY - minY)) * usableHeight;
}

/**
 * Inverse screen pixel coordinate to domain value along X axis.
 */
export function invertX(
  pixelX: number,
  minX: number,
  maxX: number,
  width: number,
  padding = DEFAULT_PADDING
): number {
  const usableWidth = width - padding.left - padding.right;
  const ratio = Math.max(0, Math.min(1, (pixelX - padding.left) / usableWidth));
  return minX + ratio * (maxX - minX);
}

/**
 * Compute clean human-friendly ticks for Y axis.
 */
export function generateTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const span = max - min;
  const rawStep = span / count;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalizedStep = rawStep / magnitude;

  let step = magnitude;
  if (normalizedStep > 5) step = 10 * magnitude;
  else if (normalizedStep > 2) step = 5 * magnitude;
  else if (normalizedStep > 1) step = 2 * magnitude;

  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let val = start; val <= max; val += step) {
    ticks.push(Number(val.toFixed(4)));
  }
  return ticks;
}

/**
 * Format timestamp to short readable label (e.g. "14:23:05").
 */
export function formatTime(ts: number, includeMs = false): string {
  const d = new Date(ts);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  if (includeMs) {
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    return `${h}:${m}:${s}.${ms}`;
  }
  return `${h}:${m}:${s}`;
}

/**
 * Format number nicely for axis (e.g. 1.2K, 500, 2.4M).
 */
export function formatNumber(val: number): string {
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  if (Math.abs(val) < 1 && Math.abs(val) > 0) return val.toFixed(2);
  return Number.isInteger(val) ? val.toString() : val.toFixed(1);
}
