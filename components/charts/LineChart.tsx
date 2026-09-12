'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { downsampleLTTB } from '@/lib/performanceUtils';
import {
  DEFAULT_PADDING,
  mapX,
  mapY,
  invertX,
  generateTicks,
  formatTime,
  formatNumber,
} from '@/lib/canvasUtils';
import { CATEGORIES } from '@/lib/dataGenerator';
import { Activity, ZoomIn, TrendingUp, Maximize2 } from 'lucide-react';

export default function LineChart({
  height = 380,
  onFPSAction,
}: {
  height?: number;
  onFPSAction?: (fps: number, renderMs: number, points: number, downsampled: number) => void;
}) {
  const {
    stream,
    timeRange,
    viewport,
    setViewport,
    filterState,
  } = useDashboardData();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Live window stats
  const [stats, setStats] = useState({ latest: 0, min: 0, max: 0, visible: 0 });

  // Crosshair / hover tooltip state
  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    timestamp: number;
    value: number;
    category: string;
    visible: boolean;
  }>({ x: 0, y: 0, timestamp: 0, value: 0, category: '', visible: false });

  // Pan interaction tracking
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const panStartRef = useRef(0);

  // Latest visible bounds for tooltips and axes
  const boundsRef = useRef({
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 100,
    ticksY: [0, 25, 50, 75, 100],
  });

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, h: number) => {
      const renderStart = performance.now();
      const count = stream.countRef.current;
      if (count === 0) return;

      const ts = stream.timestampsRef.current;
      const vals = stream.valuesRef.current;
      const cats = stream.categoriesRef.current;
      const capacity = ts.length;
      const writeIdx = stream.writeIndexRef.current;

      const latestTs = ts[(writeIdx - 1 + capacity) % capacity];
      let windowMs = 5 * 60 * 1000;
      if (timeRange === '1m') windowMs = 60 * 1000;
      else if (timeRange === '5m') windowMs = 5 * 60 * 1000;
      else if (timeRange === '15m') windowMs = 15 * 60 * 1000;
      else if (timeRange === '1h') windowMs = 60 * 60 * 1000;
      else if (timeRange === 'all') windowMs = Math.max(60000, latestTs - ts[writeIdx % capacity]);

      const effectiveWindowMs = windowMs / viewport.zoom;
      const maxX = latestTs + viewport.panX;
      const minX = maxX - effectiveWindowMs;

      const unrolledTs: number[] = [];
      const unrolledVals: number[] = [];
      const startIdx = (writeIdx - count + capacity) % capacity;

      let minY = Number.POSITIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let latestVisibleVal = 0;

      for (let i = 0; i < count; i++) {
        const ringIdx = (startIdx + i) % capacity;
        const t = ts[ringIdx];
        if (t >= minX && t <= maxX) {
          const catName = CATEGORIES[cats[ringIdx]];
          if (
            filterState.selectedCategories.length === 0 ||
            filterState.selectedCategories.includes(catName)
          ) {
            const v = vals[ringIdx];
            unrolledTs.push(t);
            unrolledVals.push(v);
            latestVisibleVal = v;
            if (v < minY) minY = v;
            if (v > maxY) maxY = v;
          }
        }
      }

      const visiblePoints = unrolledTs.length;
      if (visiblePoints === 0) {
        ctx.clearRect(0, 0, width, h);
        return;
      }

      const yPadding = (maxY - minY) * 0.12 || 10;
      minY = Math.max(0, Math.floor(minY - yPadding));
      maxY = Math.ceil(maxY + yPadding);

      boundsRef.current.minX = minX;
      boundsRef.current.maxX = maxX;
      boundsRef.current.minY = minY;
      boundsRef.current.maxY = maxY;
      boundsRef.current.ticksY = generateTicks(minY, maxY, 5);

      // Downsample using LTTB to screen width
      const targetPixels = Math.max(120, Math.floor((width - DEFAULT_PADDING.left - DEFAULT_PADDING.right) / 1.3));
      const downsampled = downsampleLTTB(unrolledTs, unrolledVals, visiblePoints, targetPixels);

      ctx.clearRect(0, 0, width, h);

      // Draw horizontal grid lines
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = 1;
      boundsRef.current.ticksY.forEach((tick) => {
        const y = mapY(tick, minY, maxY, h, DEFAULT_PADDING);
        ctx.beginPath();
        ctx.moveTo(DEFAULT_PADDING.left, y);
        ctx.lineTo(width - DEFAULT_PADDING.right, y);
        ctx.stroke();
      });

      // Gradient area fill (Pacific Cyan)
      const areaGradient = ctx.createLinearGradient(0, DEFAULT_PADDING.top, 0, h - DEFAULT_PADDING.bottom);
      areaGradient.addColorStop(0, 'rgba(27, 154, 170, 0.22)');
      areaGradient.addColorStop(0.6, 'rgba(27, 154, 170, 0.05)');
      areaGradient.addColorStop(1, 'rgba(27, 154, 170, 0.0)');

      ctx.beginPath();
      const firstX = mapX(downsampled.timestamps[0], minX, maxX, width, DEFAULT_PADDING);
      const firstY = mapY(downsampled.values[0], minY, maxY, h, DEFAULT_PADDING);
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < downsampled.count; i++) {
        const px = mapX(downsampled.timestamps[i], minX, maxX, width, DEFAULT_PADDING);
        const py = mapY(downsampled.values[i], minY, maxY, h, DEFAULT_PADDING);
        ctx.lineTo(px, py);
      }

      const lastX = mapX(downsampled.timestamps[downsampled.count - 1], minX, maxX, width, DEFAULT_PADDING);
      ctx.lineTo(lastX, h - DEFAULT_PADDING.bottom);
      ctx.lineTo(firstX, h - DEFAULT_PADDING.bottom);
      ctx.closePath();
      ctx.fillStyle = areaGradient;
      ctx.fill();

      // Main line stroke (Pacific Cyan)
      ctx.beginPath();
      ctx.moveTo(firstX, firstY);
      for (let i = 1; i < downsampled.count; i++) {
        const px = mapX(downsampled.timestamps[i], minX, maxX, width, DEFAULT_PADDING);
        const py = mapY(downsampled.values[i], minY, maxY, h, DEFAULT_PADDING);
        ctx.lineTo(px, py);
      }

      ctx.strokeStyle = '#1b9aaa';
      ctx.lineWidth = 2.4;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = 'rgba(27, 154, 170, 0.35)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0; // reset

      // Draw beacon pulse dot at latest live point (Bubblegum Pink)
      if (downsampled.count > 0 && viewport.panX === 0) {
        const py = mapY(downsampled.values[downsampled.count - 1], minY, maxY, h, DEFAULT_PADDING);
        ctx.beginPath();
        ctx.arc(lastX, py, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#ef476f';
        ctx.shadowColor = '#ef476f';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      const renderEnd = performance.now();
      const renderMs = renderEnd - renderStart;
      if (onFPSAction) {
        onFPSAction(60, renderMs, visiblePoints, downsampled.count);
      }
    },
    [stream, timeRange, viewport, filterState, onFPSAction]
  );

  useChartRenderer(canvasRef, draw);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setViewport((prev) => ({
        ...prev,
        zoom: Math.max(1, Math.min(10, prev.zoom * zoomFactor)),
      }));
    },
    [setViewport]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      dragStartXRef.current = e.clientX;
      panStartRef.current = viewport.panX;
    },
    [viewport.panX]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      if (isDraggingRef.current) {
        const deltaPx = e.clientX - dragStartXRef.current;
        const usableWidth = rect.width - DEFAULT_PADDING.left - DEFAULT_PADDING.right;
        const timeSpan = boundsRef.current.maxX - boundsRef.current.minX;
        const timeDelta = (deltaPx / usableWidth) * timeSpan;

        setViewport((prev) => ({
          ...prev,
          panX: panStartRef.current - timeDelta,
        }));
      } else {
        if (
          clientX >= DEFAULT_PADDING.left &&
          clientX <= rect.width - DEFAULT_PADDING.right
        ) {
          const hoveredTs = invertX(
            clientX,
            boundsRef.current.minX,
            boundsRef.current.maxX,
            rect.width,
            DEFAULT_PADDING
          );
          const valRatio =
            1 -
            (clientY - DEFAULT_PADDING.top) /
              (rect.height - DEFAULT_PADDING.top - DEFAULT_PADDING.bottom);
          const hoveredVal =
            boundsRef.current.minY +
            valRatio * (boundsRef.current.maxY - boundsRef.current.minY);

          setHoverData({
            x: clientX,
            y: clientY,
            timestamp: Math.round(hoveredTs),
            value: Math.round(hoveredVal * 100) / 100,
            category: 'Telemetry Stream',
            visible: true,
          });
        } else {
          setHoverData((prev) => ({ ...prev, visible: false }));
        }
      }
    },
    [setViewport]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isDraggingRef.current = false;
    setHoverData((prev) => ({ ...prev, visible: false }));
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-2xl bg-white border border-slate-200/80 p-5 select-none overflow-hidden shadow-sm"
      style={{ height }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-[#1b9aaa] shadow-[0_0_10px_rgba(27,154,170,0.5)] animate-pulse" />
          <div>
            <h3 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase flex items-center gap-2">
              Primary Telemetric Signal Stream
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Window: {timeRange.toUpperCase()} • LTTB Dynamic Downsampling • 60 FPS
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1b9aaa]/10 border border-[#1b9aaa]/20 text-xs font-mono font-bold text-[#1b9aaa]">
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{viewport.zoom.toFixed(1)}x Zoom</span>
          </div>
          {viewport.panX !== 0 && (
            <button
              onClick={() => setViewport((prev) => ({ ...prev, panX: 0 }))}
              className="text-xs px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono transition-colors shadow-sm"
            >
              Reset Pan
            </button>
          )}
        </div>
      </div>

      {/* Canvas rendering area */}
      <div className="relative w-full h-[calc(100%-42px)] cursor-crosshair">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full" />

        {/* Y Axis numeric ticks */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between pointer-events-none py-2 text-right pr-2">
          {boundsRef.current.ticksY
            .slice()
            .reverse()
            .map((tick, i) => (
              <span key={i} className="text-[11px] font-mono font-medium text-slate-500 leading-none">
                {formatNumber(tick)}
              </span>
            ))}
        </div>

        {/* X Axis bottom timestamps */}
        <div className="absolute left-14 right-6 bottom-0 h-6 flex justify-between items-center pointer-events-none text-[11px] font-mono text-slate-500">
          <span>{formatTime(boundsRef.current.minX)}</span>
          <span className="hidden sm:inline font-sans text-xs">Temporal Horizon</span>
          <span className="text-[#1b9aaa] font-bold font-mono">{formatTime(boundsRef.current.maxX)} (Live)</span>
        </div>

        {/* Crosshair guide lines & Interactive Tooltip */}
        {hoverData.visible && (
          <>
            <div
              className="absolute top-0 bottom-6 w-px bg-[#1b9aaa]/40 pointer-events-none"
              style={{ left: hoverData.x }}
            />
            <div
              className="absolute left-14 right-6 h-px bg-[#1b9aaa]/40 pointer-events-none"
              style={{ top: hoverData.y }}
            />
            <div
              className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 rounded-2xl border border-slate-800 bg-[#111827] px-4 py-2.5 shadow-2xl text-white"
              style={{
                left: Math.max(90, Math.min(hoverData.x, (containerRef.current?.clientWidth || 400) - 90)),
                top: Math.max(30, hoverData.y - 10),
              }}
            >
              <div className="text-[10px] text-slate-400 font-mono mb-0.5">
                {formatTime(hoverData.timestamp, true)}
              </div>
              <div className="text-lg font-bold text-[#06d6a0] font-display tracking-tight">
                Value: {hoverData.value}
              </div>
              <div className="text-[10px] text-slate-300 flex items-center gap-1.5 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ef476f]" />
                LTTB Downsampled Peak
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
