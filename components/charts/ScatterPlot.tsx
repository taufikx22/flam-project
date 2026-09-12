'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { DEFAULT_PADDING, mapX, mapY, generateTicks } from '@/lib/canvasUtils';
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/dataGenerator';

export default function ScatterPlot({ height = 320 }: { height?: number }) {
  const { stream, timeRange, filterState, viewport } = useDashboardData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverPoint, setHoverPoint] = useState<{
    x: number;
    y: number;
    value: number;
    latency: number;
    category: string;
    visible: boolean;
  }>({ x: 0, y: 0, value: 0, latency: 0, category: '', visible: false });

  const boundsRef = useRef({
    minX: 0,
    maxX: 250,
    minY: 0,
    maxY: 80,
    ticksY: [0, 20, 40, 60, 80],
  });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, h: number) => {
      const count = stream.countRef.current;
      if (count === 0) return;

      const ts = stream.timestampsRef.current;
      const vals = stream.valuesRef.current;
      const cats = stream.categoriesRef.current;
      const lats = stream.latenciesRef.current;
      const capacity = ts.length;
      const writeIdx = stream.writeIndexRef.current;

      const minVal = 0;
      const maxVal = 250;
      const minLat = 0;
      const maxLat = 80;

      boundsRef.current = {
        minX: minVal,
        maxX: maxVal,
        minY: minLat,
        maxY: maxLat,
        ticksY: generateTicks(minLat, maxLat, 4),
      };

      ctx.clearRect(0, 0, width, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = 1;
      boundsRef.current.ticksY.forEach((tick) => {
        const y = mapY(tick, minLat, maxLat, h, DEFAULT_PADDING);
        ctx.beginPath();
        ctx.moveTo(DEFAULT_PADDING.left, y);
        ctx.lineTo(width - DEFAULT_PADDING.right, y);
        ctx.stroke();
      });

      // Spatial binning grid
      const usableW = Math.floor(width - DEFAULT_PADDING.left - DEFAULT_PADDING.right);
      const usableH = Math.floor(h - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom);
      const cellSize = 6;
      const gridCols = Math.ceil(usableW / cellSize);
      const gridRows = Math.ceil(usableH / cellSize);
      const totalCells = gridCols * gridRows;

      const cellDensity = new Uint16Array(totalCells);
      const cellCategory = new Uint8Array(totalCells);

      const sampleLimit = Math.min(count, 15000);
      for (let i = 0; i < sampleLimit; i++) {
        const ringIdx = (writeIdx - 1 - i + capacity) % capacity;
        const catIdx = cats[ringIdx];
        const catName = CATEGORIES[catIdx];

        if (
          filterState.selectedCategories.length === 0 ||
          filterState.selectedCategories.includes(catName)
        ) {
          const v = vals[ringIdx];
          const lat = lats[ringIdx];

          const px = mapX(v, minVal, maxVal, width, DEFAULT_PADDING) - DEFAULT_PADDING.left;
          const py = mapY(lat, minLat, maxLat, h, DEFAULT_PADDING) - DEFAULT_PADDING.top;

          if (px >= 0 && px < usableW && py >= 0 && py < usableH) {
            const col = Math.floor(px / cellSize);
            const row = Math.floor(py / cellSize);
            const cellIdx = row * gridCols + col;

            cellDensity[cellIdx] = Math.min(65535, cellDensity[cellIdx] + 1);
            cellCategory[cellIdx] = catIdx;
          }
        }
      }

      for (let cellIdx = 0; cellIdx < totalCells; cellIdx++) {
        const density = cellDensity[cellIdx];
        if (density === 0) continue;

        const col = cellIdx % gridCols;
        const row = Math.floor(cellIdx / gridCols);

        const screenX = DEFAULT_PADDING.left + col * cellSize + cellSize / 2;
        const screenY = DEFAULT_PADDING.top + row * cellSize + cellSize / 2;

        const catIdx = cellCategory[cellIdx];
        const color = CATEGORY_COLORS[CATEGORIES[catIdx]] || '#a855f7';

        const radius = Math.min(cellSize * 1.5, 2.2 + Math.log2(density + 1) * 1.6);
        const alpha = Math.min(0.95, 0.45 + density * 0.05);

        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = alpha;
        ctx.fill();

        if (density > 6) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 1.0;
    },
    [stream, timeRange, filterState, viewport]
  );

  useChartRenderer(canvasRef, draw);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    if (
      clientX >= DEFAULT_PADDING.left &&
      clientX <= rect.width - DEFAULT_PADDING.right &&
      clientY >= DEFAULT_PADDING.top &&
      clientY <= rect.height - DEFAULT_PADDING.bottom
    ) {
      const { minX, maxX, minY, maxY } = boundsRef.current;
      const usableW = rect.width - DEFAULT_PADDING.left - DEFAULT_PADDING.right;
      const usableH = rect.height - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom;

      const val = minX + ((clientX - DEFAULT_PADDING.left) / usableW) * (maxX - minX);
      const lat = maxY - ((clientY - DEFAULT_PADDING.top) / usableH) * (maxY - minY);

      setHoverPoint({
        x: clientX,
        y: clientY,
        value: Math.round(val * 10) / 10,
        latency: Math.round(lat * 10) / 10,
        category: 'Density Cluster',
        visible: true,
      });
    } else {
      setHoverPoint((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverPoint((prev) => ({ ...prev, visible: false }));
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
          <div className="h-2.5 w-2.5 rounded-full bg-[#ef476f] shadow-[0_0_8px_rgba(239,71,111,0.5)]" />
          <h3 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase">
            Value vs Latency (Scatter)
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          Spatial LOD (15k pts)
        </span>
      </div>

      <div className="relative w-full h-[calc(100%-42px)] cursor-crosshair">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

        {/* Y Axis numeric ticks */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between pointer-events-none py-2 text-right pr-2">
          {boundsRef.current.ticksY
            .slice()
            .reverse()
            .map((tick, i) => (
              <span key={i} className="text-[11px] font-mono font-medium text-slate-500 leading-none">
                {tick}ms
              </span>
            ))}
        </div>

        {/* X Axis bottom labels */}
        <div className="absolute left-14 right-6 bottom-0 h-6 flex justify-between items-center pointer-events-none text-[11px] font-mono text-slate-500">
          <span>0 (Val)</span>
          <span>125</span>
          <span>250+</span>
        </div>

        {/* Hover Tooltip */}
        {hoverPoint.visible && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 rounded-2xl border border-slate-800 bg-[#111827] px-4 py-2.5 shadow-2xl text-white"
            style={{
              left: Math.max(90, Math.min(hoverPoint.x, (containerRef.current?.clientWidth || 400) - 90)),
              top: Math.max(20, hoverPoint.y - 8),
            }}
          >
            <div className="font-bold text-[#ef476f] text-xs mb-0.5">Spatial Cluster</div>
            <div className="font-mono text-white text-xs">
              Metric: <span className="text-[#06d6a0] font-bold">{hoverPoint.value}</span>
            </div>
            <div className="font-mono text-white text-xs">
              Latency: <span className="text-[#ffc43d] font-bold">{hoverPoint.latency} ms</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
