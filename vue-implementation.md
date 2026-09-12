# Vue 3 Composition API Implementation Reference

Alternate track — use this if you're building the Vue variant of the
assignment instead of the Next.js default. Read the root `SKILL.md`
first for build order and framework-agnostic performance patterns; this
file covers only what's genuinely different in Vue.

## File structure

```
performance-dashboard/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── LineChart.vue
│   │   │   ├── BarChart.vue
│   │   │   ├── ScatterPlot.vue
│   │   │   └── Heatmap.vue
│   │   ├── controls/
│   │   │   ├── FilterPanel.vue
│   │   │   └── TimeRangeSelector.vue
│   │   └── DataTable.vue
│   ├── composables/
│   │   ├── useDataStream.ts
│   │   ├── useChartRenderer.ts
│   │   └── usePerformanceMonitor.ts
│   ├── utils/
│   │   ├── dataGenerator.ts
│   │   ├── performanceUtils.ts   # LTTB downsampling, FPS math
│   │   └── canvasUtils.ts        # dpr scaling, coordinate mapping
│   ├── types/dashboard.types.ts
│   ├── App.vue
│   └── main.ts
├── vite.config.ts / package.json
└── README.md / PERFORMANCE.md
```

## The one Vue-specific performance trap: deep reactivity
Vue 3's `reactive()` wraps objects/arrays in a Proxy and tracks access
*recursively*. For a 100k-element typed array read 60 times a second by
a canvas draw loop, that's real overhead you don't want. Use
`shallowRef` for the live data buffer — never `ref` or `reactive`:

```ts
// composables/useDataStream.ts
import { shallowRef } from 'vue';

export function useDataStream(capacity = 100_000) {
  const buffer = shallowRef(new Float64Array(capacity));      // no proxy-per-element
  const timestamps = shallowRef(new Float64Array(capacity));
  let writeIndex = 0;
  let count = 0;

  function append(value: number, ts: number) {
    buffer.value[writeIndex] = value;   // mutate in place — shallowRef won't react to this
    timestamps.value[writeIndex] = ts;
    writeIndex = (writeIndex + 1) % capacity;
    count = Math.min(count + 1, capacity);
    // deliberately no triggerRef() on every tick — the draw loop reads
    // buffer.value directly and imperatively. Only call triggerRef()
    // when a DOM-facing computed genuinely needs to re-run, throttled
    // the same way as usePerformanceMonitor below.
  }

  return { buffer, timestamps, append, count: () => count };
}
```

## `ref` vs `reactive` vs `shallowRef` — the rule of thumb
- `ref` / `reactive`: small, UI-facing state (filter selection, time
  range, chart-type toggle) — fine to be fully reactive, it's cheap at
  that size.
- `shallowRef`: the live data buffer and anything the canvas reads every
  frame — reactivity tracking here is pure overhead.
- `markRaw`: large static config objects that never change and don't
  need reactivity at all (e.g. a chart's static style config).

## `computed` for aggregation, `watch` over `watchEffect` for the stream
Time-bucket aggregation (1min/5min/1hour) is a pure derivation — a
`computed` over a `shallowRef`'d snapshot, recomputed only when you
explicitly bump a version/trigger, not on every tick. For reacting to
filter/time-range changes, prefer an explicit `watch(source, callback)`
over `watchEffect`: `watchEffect` auto-tracks every reactive value it
touches during its run, which makes it easy to accidentally subscribe to
something you didn't mean to. `watch` makes the dependency list
explicit — important here, since the data buffer is deliberately *not*
meant to trigger re-runs.

## Draw loop (composable)
Same shape as the React version conceptually — an imperative RAF loop
with no Vue reactivity in the hot path:

```ts
// composables/useChartRenderer.ts
import { onMounted, onUnmounted, type Ref } from 'vue';

export function useChartRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  draw: (ctx: CanvasRenderingContext2D) => void,
) {
  let raf = 0;
  onMounted(() => {
    const ctx = canvasRef.value?.getContext('2d');
    if (!ctx) return;
    const loop = () => {
      draw(ctx);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  });
  onUnmounted(() => cancelAnimationFrame(raf)); // cleanup — don't skip
}
```

## `package.json` — deps
Core: `vue`, `typescript`, `vite`, `@vitejs/plugin-vue`. Nothing
chart/viz-related, and no Pinia/Vuex needed at this scope — Composition
API + composables cover the state-management requirement on their own.

## Deploy
Vercel or Netlify, per the spec — `vite build` then deploy the `dist/`
output.
