---
name: performance-dashboard-build
description: Build the "Performance-Critical Data Visualization Dashboard" take-home assignment — a real-time chart dashboard that renders 10,000+ live data points at 60fps using hand-rolled Canvas rendering (no D3/Chart.js), a simulated 100ms data stream, time-bucket aggregation, a virtualized data table, zoom/pan/filter controls, and an on-screen FPS/memory monitor. Consult this whenever building, extending, reviewing, or debugging this specific dashboard project — its chart rendering, its data pipeline, its memory/FPS behavior, its Next.js or Vue wiring, or its README/PERFORMANCE docs. Defaults to the Next.js 14+ App Router + TypeScript track (references/nextjs-implementation.md); the Vue 3 Composition API track is in references/vue-implementation.md.
---

# Performance-Critical Data Visualization Dashboard

## The mental model

This assignment is graded 35–40% on raw performance and only 15% on code
polish. Junior submissions start by scaffolding the framework, add a
chart-library-shaped abstraction, wire up React/Vue state for the
incoming data, and *then* discover at 3,000 points that the UI is
dropping frames — at which point there's no time left to fix the actual
bottleneck.

A senior engineer inverts that order. The hard technical risk here isn't
"can I build a Next.js app" — it's "can I keep a canvas redrawing at
60fps while 10,000+ points update every 100ms without the DOM/React layer
ever sitting in the hot path." Prove that in isolation first, then wrap
the framework around it. Framework code should never be upstream of a
performance decision — it's plumbing.

Two rules drive almost every choice below:

1. **The 60fps loop and the React/Vue render cycle are different clocks.**
   Data arrives at 10Hz (every 100ms), the canvas repaints at up to 60Hz,
   and the DOM (legends, table rows, axis labels, the FPS number) only
   needs to update at maybe 4–10Hz. Conflating these three cadences is
   the single most common way this assignment fails.
2. **You never draw 10,000 points.** You draw at most as many points as
   there are horizontal pixels in the chart. Everything above that is
   wasted CPU work the grader will notice as jank. Downsampling isn't a
   bonus optimization here — it's the core algorithm.

## Non-negotiable constraints

- Zero chart/viz libraries — no D3, Chart.js, visx, recharts, etc.
  Canvas (data) + a thin SVG or absolutely-positioned HTML layer (axes,
  labels, tooltips, hover targets) only.
- No external state-management library — framework built-ins only
  (React hooks/Context, or Vue's reactivity system).
- Must survive hours of continuous running with flat memory (< 1MB/hour
  growth) — this is graded, not a suggestion.
- Must be verified against a **production build**, not just `next dev` /
  `vite dev`. Dev mode carries extra instrumentation overhead that both
  hides real bugs and makes things look artificially slow.

## Build order

Build in this order, and don't start Phase N+1 until Phase N is measured
holding target FPS with synthetic data. There's no point polishing a
chart component whose underlying render loop can't hit 60fps.

| Phase | What | Why this order |
|---|---|---|
| 0 | Types + project scaffold | Shared contracts (`DataPoint`, `ChartConfig`, `PerformanceMetrics`) so every later phase compiles against the same shapes |
| 1 | Data engine: ring buffer + simulated stream generator | Pure TS, no UI yet. Prove you can hold a sliding window of N points and append at 10Hz with O(1) cost and zero per-tick allocations |
| 2 | Canvas rendering core | Coordinate mapping, downsampling (LTTB), device-pixel-ratio handling — one shared draw primitive reused by every chart type |
| 3 | Chart components: line → bar → scatter → heatmap | Each is the Phase 2 primitive plus a chart-specific draw strategy. Line first — it proves out the RAF loop and downsampling; the rest are variations on it |
| 4 | Real-time loop wiring | Decouple the RAF draw loop from component state (see "Decoupling" below); confirm the FPS counter holds 60 with the stream running |
| 5 | Aggregation (1min / 5min / 1hour bucketing) | A pure function over a buffer snapshot, memoized, kept off the hot path |
| 6 | Virtualized data table (`useVirtualization`) | Hand-rolled windowed rendering — only visible rows ever touch the DOM |
| 7 | Controls: zoom / pan / filter / time range | Wire these through `useTransition` (or Vue's async patterns) so a filter change can't stall the canvas loop |
| 8 | Performance monitor overlay + stress-test mode | FPS readout, memory readout, a control to scale data volume up to 50k/100k for the stretch goals |
| 9 | Framework wiring (Server/Client split, or Vue app shell) | Deliberately late — see the framework-specific reference file |
| 10 | Responsive pass | Canvas resize handling (re-read `clientWidth/Height`, re-set backing store, redraw) — do this once the core loop is already solid |
| 11 | README.md + PERFORMANCE.md | Keep notes from Phase 1 onward; write the final drafts last |
| 12 (bonus) | Web Workers / OffscreenCanvas / streaming SSR / PWA | Only once the base 10k/60fps target is *measured and holding* — these are stretch goals, not prerequisites |

## Core performance patterns

### The ring buffer, not a growing array
Use a fixed-capacity typed array (`Float64Array` for values/timestamps)
as a circular buffer sized to the largest window you'll ever display
(e.g. 100k points). Appending is `buffer[writeIndex++ % capacity] =
value` — O(1), zero garbage. Never `array.push()` + `array.shift()` on a
plain array for the live series; `shift()` is O(n), and at 10
pushes/second with a large window it's a slow, GC-heavy bug waiting to be
found by the "runs for hours" test.

### Decoupling the draw loop from component state
Keep the live buffer in a ref (React `useRef` / Vue `shallowRef` — see
the Vue reference file for why `shallowRef` specifically matters there),
not in `useState`/`reactive`. A `requestAnimationFrame` loop reads
straight from that ref and draws imperatively — it never triggers a
React/Vue re-render. Only push to real component state for things that
must re-render the DOM (legend text, table rows, the FPS number), and
throttle that to a much lower cadence than the draw loop — e.g. update
DOM-visible numbers 4–10x/second even though the canvas repaints up to
60x/second. This single pattern is usually the difference between a
submission that holds 60fps and one that doesn't.

### Downsampling — draw pixels, not points
Before every redraw, reduce the visible window to roughly one point per
horizontal pixel using **Largest-Triangle-Three-Buckets (LTTB)**: bucket
the data into `canvasWidthPx` buckets, and from each bucket keep the
point that forms the largest triangle with the previously-selected point
and the next bucket's average. This preserves visual shape (peaks,
spikes) far better than naive "keep every Nth point" sampling, at the
same O(n) cost. Use it for line charts. For scatter/heatmap, bin into a
canvas-resolution grid instead (aggregate count/intensity per cell)
rather than iterating and drawing 10k individual shapes — for the
heatmap specifically, build one `ImageData` buffer per redraw and
`putImageData` once, rather than thousands of individual `fillRect`
calls.

### Canvas mechanics
- Size the backing store to `clientWidth * devicePixelRatio` /
  `clientHeight * devicePixelRatio`, set the CSS width/height to the
  logical size, and `ctx.scale(dpr, dpr)` — otherwise it's blurry on
  retina displays.
- One `<canvas>` per chart for the data itself. Axes, gridlines, and
  interactive hover targets go in a thin SVG or absolutely-positioned
  HTML overlay on top — those change rarely and benefit from being real
  DOM (accessibility, easy hit-testing for tooltips), whereas redrawing
  them on canvas every frame is wasted work.
- Track a dirty flag; the RAF loop always runs (so throttled state
  pushes stay on schedule) but the actual `clearRect` + redraw only
  fires when the buffer, viewport, or filter changed since the last
  paint — a chart nobody is panning/zooming shouldn't repaint 60
  identical frames a second.

### Memory discipline
Every `useEffect`/`onMounted` that starts a RAF loop, `setInterval`,
worker, or event listener needs a matching teardown
(`cancelAnimationFrame`, `clearInterval`, `worker.terminate()`,
`removeEventListener`). Audit this explicitly — "no memory leaks, runs
for hours" is graded, and it's the easiest thing to miss under time
pressure. Preallocate the ring buffer's typed arrays once at max
capacity; never resize or reallocate the live-data array during normal
operation.

### Memoization and re-renders — be judicious, not reflexive
Memoize the genuinely expensive things: the LTTB downsample result, the
aggregation bucket computation, anything O(n) over the full window.
Don't wrap trivial values in `useMemo` "just in case" — the interview
round explicitly includes a live profiling exercise, and
over-memoization reads as cargo-culting rather than understanding. Use
`React.memo` on chart wrapper components combined with stable prop
references (memoized data arrays, `useCallback`'d handlers) so the memo
boundary actually holds when a sibling control panel re-renders. Route
non-urgent state changes (filter selection, time-range change — anything
that reprocesses the full window or re-renders the table) through
`useTransition`/`startTransition` so they can't block the canvas's frame
budget or input responsiveness.

### Virtualization
Hand-roll `useVirtualization`: track scroll offset, compute the visible
row-index range from row height + container height, render only that
range plus a small overscan buffer, and use spacer elements (or a
`translateY` transform) to preserve correct scrollbar size. The spec's
file list calls this out as its own hook — don't reach for a table
virtualization library even though it isn't formally banned.

## What a senior dev's submission does NOT do
- Import D3/Chart.js/visx/recharts anywhere, including transitively
  through a "lightweight wrapper" package.
- Call `setState` / mutate `reactive` state inside the RAF loop on every
  frame.
- `push`/`shift` a plain array as the live buffer.
- Redraw canvas content that provably hasn't changed.
- Mark an entire route `'use client'` (Next.js) just because one leaf
  component touches the canvas.
- Leave a RAF loop, interval, or worker running past unmount.
- Benchmark against a dev-mode build.

## Validating you actually hit the targets
- Roll your own FPS counter: track `performance.now()` deltas between
  RAF callbacks, keep a rolling ~1s average, display it — this doubles
  as the required on-screen FPS counter.
- Sample `performance.memory.usedJSHeapSize` (Chromium) once a minute
  during a 10–15 minute soak test with the stream running; the slope
  should be flat, not climbing.
- Use the React DevTools Profiler / Vue devtools timeline to confirm
  chart re-renders aren't firing on every incoming data point — they
  should fire only on the throttled DOM-update cadence.
- Test at 10k, then use the stress-test control to push to 50k and 100k
  and confirm graceful degradation (30fps / 15fps+) rather than a cliff.
- Always do the final pass against a production build.

## Docs to keep updating as you go — don't leave them for the end
**README.md**: setup (`npm install && npm run dev`), how to run the
performance test / stress mode, browser compatibility notes, a feature
overview, and (Next.js track) which App Router features were used.

**PERFORMANCE.md**: actual FPS/memory numbers from your soak test (not
estimates), which optimization techniques you used and *why* — ring
buffer vs array, LTTB vs naive sampling, memo boundaries, Server/Client
split — a bottleneck you found and how you found it (profiler trace
description is fine), and how the design would scale further (Web
Workers, OffscreenCanvas, WebGL) if pushed past 100k points.

## For the live interview
Keep a short running decision log as you build (commit messages are
enough) covering *why*, not just *what*: why a ring buffer, why LTTB,
why the Server/Client boundary sits where it does. The interview
explicitly asks you to justify these choices and simulates a live
profiling exercise — if the reasoning is already written down, you're
explaining a decision you already made, not reconstructing one on the
spot.

## Framework-specific detail
This file covers everything framework-agnostic. For exact file layouts,
component/hook skeletons, and the genuinely framework-specific
performance decisions, read:
- `references/nextjs-implementation.md` — Next.js 14+ App Router track (default)
- `references/vue-implementation.md` — Vue 3 Composition API track
