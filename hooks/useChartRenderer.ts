'use client';

import { useEffect, useRef, useCallback } from 'react';
import { setupCanvasDPI } from '@/lib/canvasUtils';

export interface RendererOptions {
  onFrame?: (frameDurationMs: number) => void;
  isDirty?: () => boolean;
}

export function useChartRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number) => void,
  options?: RendererOptions
) {
  const drawRef = useRef(draw);
  drawRef.current = draw;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let rafId = 0;
    let lastTime = performance.now();

    // Handle container resizing
    const updateSize = () => {
      const rect = canvas.getBoundingClientRect();
      const logicalWidth = Math.floor(rect.width);
      const logicalHeight = Math.floor(rect.height);

      if (logicalWidth > 0 && logicalHeight > 0) {
        const dims = setupCanvasDPI(canvas, ctx, logicalWidth, logicalHeight);
        sizeRef.current = dims;
      }
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const loop = (currentTime: number) => {
      const frameDelta = currentTime - lastTime;
      lastTime = currentTime;

      const shouldDraw = optionsRef.current?.isDirty ? optionsRef.current.isDirty() : true;

      if (shouldDraw && sizeRef.current.width > 0 && sizeRef.current.height > 0) {
        const { width, height, dpr } = sizeRef.current;
        drawRef.current(ctx, width, height, dpr);
      }

      optionsRef.current?.onFrame?.(frameDelta);
      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
    };
  }, [canvasRef]);
}
