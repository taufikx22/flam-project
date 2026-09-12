'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { DEFAULT_PADDING, formatTime } from '@/lib/canvasUtils';
import { CATEGORIES } from '@/lib/dataGenerator';

function getThermalColor(norm: number): [number, number, number] {
  const t = Math.max(0, Math.min(1, norm));
  if (t < 0.25) {
    const k = t / 0.25;
    // Dusk Blue [38, 84, 124] to Pacific Cyan [27, 154, 170]
    return [
      Math.round(38 + k * (27 - 38)),
      Math.round(84 + k * (154 - 84)),
      Math.round(124 + k * (170 - 124)),
    ];
  } else if (t < 0.5) {
    const k = (t - 0.25) / 0.25;
    // Pacific Cyan [27, 154, 170] to Emerald [6, 214, 160]
    return [
      Math.round(27 + k * (6 - 27)),
      Math.round(154 + k * (214 - 154)),
      Math.round(170 + k * (160 - 170)),
    ];
  } else if (t < 0.75) {
    const k = (t - 0.5) / 0.25;
    // Emerald [6, 214, 160] to Amber Gold [255, 196, 61]
    return [
      Math.round(6 + k * (255 - 6)),
      Math.round(214 + k * (196 - 214)),
      Math.round(160 + k * (61 - 160)),
    ];
  } else {
    const k = (t - 0.75) / 0.25;
    // Amber Gold [255, 196, 61] to Bubblegum Pink [239, 71, 111]
    return [
      Math.round(255 + k * (239 - 255)),
      Math.round(196 + k * (71 - 196)),
      Math.round(61 + k * (111 - 61)),
    ];
  }
}

export default function Heatmap({ height = 320 }: { height?: number }) {
  const { stream, timeRange, filterState } = useDashboardData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [hoverCell, setHoverCell] = useState<{
    x: number;
    y: number;
    category: string;
    intensity: number;
    timeLabel: string;
    visible: boolean;
  }>({ x: 0, y: 0, category: '', intensity: 0, timeLabel: '', visible: false });

  const gridInfoRef = useRef({
    cols: 64,
    rows: 4,
    minTime: 0,
    maxTime: 0,
    matrix: new Float32Array(64 * 4),
  });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, h: number) => {
      const count = stream.countRef.current;
      if (count === 0) return;

      const ts = stream.timestampsRef.current;
      const vals = stream.valuesRef.current;
      const cats = stream.categoriesRef.current;
      const capacity = ts.length;
      const writeIdx = stream.writeIndexRef.current;

      const cols = 64;
      const rows = CATEGORIES.length;

      const latestTs = ts[(writeIdx - 1 + capacity) % capacity];
      let windowMs = 5 * 60 * 1000;
      if (timeRange === '1m') windowMs = 60 * 1000;
      else if (timeRange === '5m') windowMs = 5 * 60 * 1000;
      else if (timeRange === '15m') windowMs = 15 * 60 * 1000;
      else if (timeRange === '1h') windowMs = 60 * 60 * 1000;

      const minTime = latestTs - windowMs;
      const maxTime = latestTs;
      const timeSliceMs = windowMs / cols;

      const sums = new Float32Array(cols * rows);
      const counts = new Uint16Array(cols * rows);

      const sampleLimit = Math.min(count, 15000);
      for (let i = 0; i < sampleLimit; i++) {
        const ringIdx = (writeIdx - 1 - i + capacity) % capacity;
        const t = ts[ringIdx];
        if (t >= minTime && t <= maxTime) {
          const catIdx = cats[ringIdx];
          const colIdx = Math.max(0, Math.min(cols - 1, Math.floor((t - minTime) / timeSliceMs)));
          const cellIdx = catIdx * cols + colIdx;

          sums[cellIdx] += vals[ringIdx];
          counts[cellIdx]++;
        }
      }

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      const offscreen = offscreenCanvasRef.current;
      if (offscreen.width !== cols || offscreen.height !== rows) {
        offscreen.width = cols;
        offscreen.height = rows;
      }
      const offCtx = offscreen.getContext('2d');
      if (!offCtx) return;

      const imgData = offCtx.createImageData(cols, rows);
      const data = imgData.data;
      const matrix = new Float32Array(cols * rows);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          const avg = counts[idx] > 0 ? sums[idx] / counts[idx] : 0;
          matrix[idx] = avg;

          const norm = Math.min(1, avg / 200);
          const [red, green, blue] = getThermalColor(norm);

          const pixelIdx = idx * 4;
          data[pixelIdx] = red;
          data[pixelIdx + 1] = green;
          data[pixelIdx + 2] = blue;
          data[pixelIdx + 3] = counts[idx] > 0 ? 235 : 45;
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      gridInfoRef.current = {
        cols,
        rows,
        minTime,
        maxTime,
        matrix,
      };

      ctx.clearRect(0, 0, width, h);

      const usableW = width - DEFAULT_PADDING.left - DEFAULT_PADDING.right;
      const usableH = h - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(
        offscreen,
        0,
        0,
        cols,
        rows,
        DEFAULT_PADDING.left,
        DEFAULT_PADDING.top,
        usableW,
        usableH
      );

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.lineWidth = 1;
      const rowHeight = usableH / rows;
      for (let r = 1; r < rows; r++) {
        const y = DEFAULT_PADDING.top + r * rowHeight;
        ctx.beginPath();
        ctx.moveTo(DEFAULT_PADDING.left, y);
        ctx.lineTo(width - DEFAULT_PADDING.right, y);
        ctx.stroke();
      }
    },
    [stream, timeRange, filterState]
  );

  useChartRenderer(canvasRef, draw);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const usableW = rect.width - DEFAULT_PADDING.left - DEFAULT_PADDING.right;
    const usableH = rect.height - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;

    if (
      clientX >= DEFAULT_PADDING.left &&
      clientX <= rect.width - DEFAULT_PADDING.right &&
      clientY >= DEFAULT_PADDING.top &&
      clientY <= rect.height - DEFAULT_PADDING.bottom
    ) {
      const { cols, rows, minTime, maxTime, matrix } = gridInfoRef.current;
      const col = Math.floor(((clientX - DEFAULT_PADDING.left) / usableW) * cols);
      const row = Math.floor(((clientY - DEFAULT_PADDING.top) / usableH) * rows);

      const boundedCol = Math.max(0, Math.min(cols - 1, col));
      const boundedRow = Math.max(0, Math.min(rows - 1, row));

      const val = matrix[boundedRow * cols + boundedCol];
      const sliceTime = minTime + (boundedCol / cols) * (maxTime - minTime);

      setHoverCell({
        x: clientX,
        y: clientY,
        category: CATEGORIES[boundedRow] || 'Metric',
        intensity: Math.round(val * 10) / 10,
        timeLabel: formatTime(sliceTime),
        visible: true,
      });
    } else {
      setHoverCell((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverCell((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-white border border-slate-200/80 p-5 select-none overflow-hidden shadow-sm"
      style={{ height }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-2.5 w-2.5 rounded-full bg-[#ffc43d] shadow-[0_0_8px_rgba(255,196,61,0.5)]" />
          <h3 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase">
            Thermal Intensity (Heatmap)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          64 Slices • ImageData Blit
        </span>
      </div>

      <div className="relative w-full h-[calc(100%-42px)] cursor-pointer">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

        {/* Row Labels (Left) */}
        <div className="absolute left-0 top-5 bottom-9 w-12 flex flex-col justify-around pointer-events-none text-right pr-2">
          {CATEGORIES.map((cat, i) => (
            <span key={i} className="text-[11px] font-mono font-medium text-slate-500 truncate leading-none">
              {cat.split(' ')[0]}
            </span>
          ))}
        </div>

        {/* Time Labels (Bottom) */}
        <div className="absolute left-14 right-6 bottom-0 h-6 flex justify-between items-center pointer-events-none text-[11px] font-mono text-slate-500">
          <span>{formatTime(gridInfoRef.current.minTime)}</span>
          <span className="text-[#1b9aaa] font-semibold font-sans text-xs">Thermal Flux</span>
          <span className="text-[#1b9aaa] font-bold">{formatTime(gridInfoRef.current.maxTime)} (Live)</span>
        </div>

        {/* Hover Tooltip */}
        {hoverCell.visible && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 rounded-2xl border border-slate-800 bg-[#111827] px-4 py-2.5 shadow-2xl text-white"
            style={{
              left: Math.max(90, Math.min(hoverCell.x, (containerRef.current?.clientWidth || 400) - 90)),
              top: Math.max(20, hoverCell.y - 8),
            }}
          >
            <div className="font-bold text-[#ffc43d] text-xs mb-0.5">{hoverCell.category}</div>
            <div className="font-mono text-white text-xs">
              Thermal Index: <span className="font-bold text-[#ef476f]">{hoverCell.intensity}</span>
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Timestamp: {hoverCell.timeLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
