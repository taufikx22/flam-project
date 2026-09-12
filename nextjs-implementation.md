# Next.js 14+ App Router Implementation Reference

Default track. Read the root `SKILL.md` first for build order and
framework-agnostic performance patterns — this file covers only what's
genuinely Next.js-specific.

## File structure

```
performance-dashboard/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Server Component — initial data
│   │   ├── layout.tsx
│   │   ├── loading.tsx           # don't skip — explicitly graded
│   │   └── error.tsx
│   ├── api/
│   │   └── data/route.ts         # only needed for the streaming bonus
│   ├── globals.css
│   └── layout.tsx
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx         # 'use client'
│   │   ├── BarChart.tsx          # 'use client'
│   │   ├── ScatterPlot.tsx       # 'use client'
│   │   └── Heatmap.tsx           # 'use client'
│   ├── controls/
│   │   ├── FilterPanel.tsx
│   │   └── TimeRangeSelector.tsx
│   ├── ui/
│   │   ├── DataTable.tsx
│   │   └── PerformanceMonitor.tsx
│   └── providers/
│       └── DataProvider.tsx      # 'use client' — owns the live ring buffer
├── hooks/
│   ├── useDataStream.ts
│   ├── useChartRenderer.ts
│   ├── usePerformanceMonitor.ts
│   └── useVirtualization.ts
├── lib/
│   ├── dataGenerator.ts
│   ├── performanceUtils.ts       # LTTB downsampling, FPS math
│   ├── canvasUtils.ts            # dpr scaling, coordinate mapping
│   └── types.ts
├── package.json / next.config.js / tsconfig.json
└── README.md / PERFORMANCE.md
```

## Server vs Client — the actual decision, not the default
Server Components by default; `'use client'` only at the leaves that
genuinely need the browser.

- `app/dashboard/page.tsx` stays a **Server Component**. It can generate
  or fetch the *initial* static dataset/config server-side (zero client
  JS for that step), then hand it down as props/initial state to a
  client boundary.
- Anything touching `canvas`, `requestAnimationFrame`,
  `window`/`performance.memory`, or state updating 10x/sec must be
  `'use client'` — but scope the boundary to the smallest component
  that needs it (`LineChart.tsx`, not the whole `dashboard/` tree).
  `DataProvider` is a natural client boundary since it owns the live
  ring buffer.
- Don't mark `layout.tsx` client unless it genuinely needs
  interactivity — losing the RSC boundary for no reason is exactly the
  "poor App Router usage" the rubric penalizes.

## `app/api/data/route.ts`
The spec says the 100ms stream is *simulated*, so a client-side interval
or worker generating synthetic points is the simplest, fully defensible
approach and doesn't need a route handler at all. Only build a route
handler (and reach for Server-Sent Events or similar) if you're going
for the Suspense/streaming bonus — in that case, keep it a thin
passthrough over the same generator function `lib/dataGenerator.ts`
exports, so the client-only and streaming modes share one source of
truth for the data shape.

## Hook skeletons

```ts
// hooks/useDataStream.ts — ring buffer + imperative append, no React state per tick
export function useDataStream(capacity = 100_000) {
  const bufferRef = useRef(new Float64Array(capacity));
  const timestampsRef = useRef(new Float64Array(capacity));
  const writeIndexRef = useRef(0);
  const countRef = useRef(0);

  const append = useCallback((value: number, ts: number) => {
    const i = writeIndexRef.current;
    bufferRef.current[i] = value;
    timestampsRef.current[i] = ts;
    writeIndexRef.current = (i + 1) % capacity;
    countRef.current = Math.min(countRef.current + 1, capacity);
  }, [capacity]);

  return { bufferRef, timestampsRef, countRef, append };
}
```

```ts
// hooks/useChartRenderer.ts — RAF loop decoupled from component state
export function useChartRenderer(
  canvasRef: RefObject<HTMLCanvasElement>,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let raf = 0;

    const loop = () => {
      draw(ctx);                       // imperative — reads refs, not props/state
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(raf);   // cleanup — don't skip
  }, [canvasRef, draw]);
}
```

```ts
// hooks/usePerformanceMonitor.ts — throttled, DOM-visible metrics
export function usePerformanceMonitor(sampleHz = 4) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>();
  const lastFrame = useRef(performance.now());
  const frames = useRef(0);
  const lastSample = useRef(performance.now());

  const tick = useCallback(() => {
    frames.current++;
    const now = performance.now();
    if (now - lastSample.current >= 1000 / sampleHz) {
      const fps = (frames.current * 1000) / (now - lastSample.current);
      setMetrics({
        fps: Math.round(fps),
        memoryUsage: (performance as any).memory?.usedJSHeapSize ?? 0,
        renderTime: now - lastFrame.current,
        dataProcessingTime: 0, // fill in from your aggregation pass
      });
      frames.current = 0;
      lastSample.current = now;
    }
    lastFrame.current = now;
  }, [sampleHz]);

  return { metrics, tick }; // call tick() once per RAF frame from the draw loop
}
```

```ts
// hooks/useVirtualization.ts — windowed row rendering for DataTable
export function useVirtualization(
  rowCount: number,
  rowHeight: number,
  viewportHeight: number,
  scrollTop: number,
  overscan = 5,
) {
  const first = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscan * 2;
  const last = Math.min(rowCount, first + visibleCount);
  return {
    first,
    last,
    topSpacerPx: first * rowHeight,
    bottomSpacerPx: (rowCount - last) * rowHeight,
  };
}
```

## `package.json` — deps to actually include
Core: `next`, `react`, `react-dom`, `typescript`, `@types/react`,
`@types/node`. Nothing chart/viz-related. If attempting the Web Worker
bonus, no extra deps are needed — Workers are a browser API.

## Deploy
Vercel is the path of least resistance for a Next.js App Router project
and is what the spec recommends — `vercel deploy` after confirming
`next build` passes locally with no warnings.
