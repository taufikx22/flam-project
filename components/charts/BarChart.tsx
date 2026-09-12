'use client';

import React, { useRef, useState, useCallback } from 'react';
import { useDashboardData } from '@/components/providers/DataProvider';
import { useChartRenderer } from '@/hooks/useChartRenderer';
import { DEFAULT_PADDING, mapY, generateTicks, formatNumber } from '@/lib/canvasUtils';
import { CATEGORIES, CATEGORY_COLORS } from '@/lib/dataGenerator';
import { BarChart3 } from 'lucide-react';

export default function BarChart({ height = 320 }: { height?: number }) {
  const { stream, filterState, aggregation } = useDashboardData();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoverBar, setHoverBar] = useState<{
    x: number;
    y: number;
    label: string;
    value: number;
    count: number;
    visible: boolean;
  }>({ x: 0, y: 0, label: '', value: 0, count: 0, visible: false });

  const barsDataRef = useRef<
    { x: number; y: number; width: number; height: number; label: string; value: number; count: number; color: string }[]
  >([]);

  const ticksYRef = useRef<number[]>([0, 50, 100, 150, 200]);

  const draw = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, h: number) => {
      const count = stream.countRef.current;
      if (count === 0) return;

      const vals = stream.valuesRef.current;
      const cats = stream.categoriesRef.current;
      const capacity = vals.length;
      const writeIdx = stream.writeIndexRef.current;

      const stats: Record<string, { sum: number; count: number; min: number; max: number }> = {};
      CATEGORIES.forEach((cat) => {
        if (filterState.selectedCategories.length === 0 || filterState.selectedCategories.includes(cat)) {
          stats[cat] = { sum: 0, count: 0, min: Infinity, max: -Infinity };
        }
      });

      const sampleLimit = Math.min(count, 10000);
      for (let i = 0; i < sampleLimit; i++) {
        const ringIdx = (writeIdx - 1 - i + capacity) % capacity;
        const cat = CATEGORIES[cats[ringIdx]];
        if (stats[cat]) {
          const v = vals[ringIdx];
          stats[cat].sum += v;
          stats[cat].count++;
          if (v < stats[cat].min) stats[cat].min = v;
          if (v > stats[cat].max) stats[cat].max = v;
        }
      }

      const activeCatList = Object.keys(stats);
      if (activeCatList.length === 0) {
        ctx.clearRect(0, 0, width, h);
        return;
      }

      let maxVal = 0;
      const barItems = activeCatList.map((cat) => {
        const s = stats[cat];
        const avg = s.count > 0 ? Math.round((s.sum / s.count) * 10) / 10 : 0;
        if (avg > maxVal) maxVal = avg;
        return {
          category: cat,
          avg,
          count: s.count,
          color: CATEGORY_COLORS[cat] || '#10b981',
        };
      });

      maxVal = Math.ceil(maxVal * 1.22) || 100;
      ticksYRef.current = generateTicks(0, maxVal, 4);

      ctx.clearRect(0, 0, width, h);

      // Grid lines
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.06)';
      ctx.lineWidth = 1;
      ticksYRef.current.forEach((tick) => {
        const y = mapY(tick, 0, maxVal, h, DEFAULT_PADDING);
        ctx.beginPath();
        ctx.moveTo(DEFAULT_PADDING.left, y);
        ctx.lineTo(width - DEFAULT_PADDING.right, y);
        ctx.stroke();
      });

      // Bars
      const usableWidth = width - DEFAULT_PADDING.left - DEFAULT_PADDING.right;
      const barGroupWidth = usableWidth / barItems.length;
      const barWidth = Math.min(56, barGroupWidth * 0.54);

      const renderedBars: typeof barsDataRef.current = [];

      barItems.forEach((item, idx) => {
        const centerX = DEFAULT_PADDING.left + idx * barGroupWidth + barGroupWidth / 2;
        const x = centerX - barWidth / 2;
        const y = mapY(item.avg, 0, maxVal, h, DEFAULT_PADDING);
        const barH = Math.max(3, h - DEFAULT_PADDING.bottom - y);

        const gradient = ctx.createLinearGradient(0, y, 0, h - DEFAULT_PADDING.bottom);
        gradient.addColorStop(0, item.color);
        gradient.addColorStop(0.85, `${item.color}33`);
        gradient.addColorStop(1, `${item.color}05`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        const radius = Math.min(6, barWidth / 2);
        ctx.roundRect(x, y, barWidth, barH, [radius, radius, 0, 0]);
        ctx.fill();

        // Neon border on top
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        renderedBars.push({
          x,
          y,
          width: barWidth,
          height: barH,
          label: item.category,
          value: item.avg,
          count: item.count,
          color: item.color,
        });
      });

      barsDataRef.current = renderedBars;
    },
    [stream, filterState, aggregation]
  );

  useChartRenderer(canvasRef, draw);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const hit = barsDataRef.current.find(
      (b) =>
        clientX >= b.x &&
        clientX <= b.x + b.width &&
        clientY >= b.y &&
        clientY <= b.y + b.height
    );

    if (hit) {
      setHoverBar({
        x: hit.x + hit.width / 2,
        y: hit.y,
        label: hit.label,
        value: hit.value,
        count: hit.count,
        visible: true,
      });
    } else {
      setHoverBar((prev) => ({ ...prev, visible: false }));
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoverBar((prev) => ({ ...prev, visible: false }));
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
          <div className="h-2.5 w-2.5 rounded-full bg-[#06d6a0] shadow-[0_0_8px_rgba(6,214,160,0.5)]" />
          <h3 className="text-sm font-bold tracking-tight text-[#111827] font-display uppercase">
            Mean Value by Signal
          </h3>
        </div>
        <span className="text-xs font-mono text-slate-500">
          In-Place Bucket Aggregation
        </span>
      </div>

      <div className="relative w-full h-[calc(100%-42px)]">
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full cursor-pointer" />

        {/* Y Axis numeric ticks */}
        <div className="absolute left-0 top-0 bottom-8 w-12 flex flex-col justify-between pointer-events-none py-2 text-right pr-2">
          {ticksYRef.current
            .slice()
            .reverse()
            .map((tick, i) => (
              <span key={i} className="text-[11px] font-mono font-medium text-slate-500 leading-none">
                {formatNumber(tick)}
              </span>
            ))}
        </div>

        {/* Category labels on bottom */}
        <div className="absolute left-14 right-6 bottom-0 h-6 flex justify-around items-center pointer-events-none text-xs font-bold">
          {barsDataRef.current.map((bar, idx) => (
            <span key={idx} className="truncate max-w-[90px] text-center font-mono text-[11px]" style={{ color: bar.color }}>
              {bar.label.split(' ')[0]}
            </span>
          ))}
        </div>

        {/* Hover Tooltip */}
        {hoverBar.visible && (
          <div
            className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 rounded-2xl border border-slate-800 bg-[#111827] px-4 py-2.5 shadow-2xl text-white"
            style={{
              left: hoverBar.x,
              top: Math.max(20, hoverBar.y - 8),
            }}
          >
            <div className="font-bold text-[#06d6a0] text-xs mb-0.5">{hoverBar.label}</div>
            <div className="text-base font-bold font-display text-white">
              Mean: {hoverBar.value}
            </div>
            <div className="text-[10px] text-slate-300 font-mono">
              Sampled: {hoverBar.count.toLocaleString()} pts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
