import { NextRequest, NextResponse } from 'next/server';
import { generateInitialDataset, createInitialState, generateNextPoint } from '@/lib/dataGenerator';

export const dynamic = 'force-dynamic';

/**
 * Next.js 14 Route Handler for Telemetry Data.
 * Supports:
 * - Direct batch retrieval: GET /api/data?count=5000
 * - Real-Time Server-Sent Events (SSE) stream: GET /api/data?stream=true
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isStream = searchParams.get('stream') === 'true';
  const count = parseInt(searchParams.get('count') || '1000', 10);

  if (!isStream) {
    const dataset = generateInitialDataset(Math.min(count, 50000));
    return NextResponse.json({
      success: true,
      count: dataset.length,
      data: dataset,
    });
  }

  // Real-time SSE streaming response (bonus feature)
  const encoder = new TextEncoder();
  const state = createInitialState(Date.now());

  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        try {
          const pt = generateNextPoint(state, 100);
          const chunk = `data: ${JSON.stringify(pt)}\n\n`;
          controller.enqueue(encoder.encode(chunk));
        } catch (err) {
          clearInterval(interval);
          controller.close();
        }
      }, 100);

      // Timeout after 60 seconds of SSE to release connections gracefully
      setTimeout(() => {
        clearInterval(interval);
        try {
          controller.close();
        } catch (_) {}
      }, 60000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
