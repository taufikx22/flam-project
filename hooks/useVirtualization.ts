'use client';

import { useMemo } from 'react';

export interface VirtualizationResult {
  startIndex: number;
  endIndex: number;
  visibleCount: number;
  topSpacerPx: number;
  bottomSpacerPx: number;
  totalHeightPx: number;
}

export function useVirtualization(
  rowCount: number,
  rowHeight: number,
  viewportHeight: number,
  scrollTop: number,
  overscan = 5
): VirtualizationResult {
  return useMemo(() => {
    if (rowCount === 0 || viewportHeight === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        visibleCount: 0,
        topSpacerPx: 0,
        bottomSpacerPx: 0,
        totalHeightPx: 0,
      };
    }

    const totalHeightPx = rowCount * rowHeight;
    const rawStartIndex = Math.floor(scrollTop / rowHeight);
    const visibleCount = Math.ceil(viewportHeight / rowHeight);

    const startIndex = Math.max(0, rawStartIndex - overscan);
    const endIndex = Math.min(rowCount, rawStartIndex + visibleCount + overscan);

    const topSpacerPx = startIndex * rowHeight;
    const bottomSpacerPx = Math.max(0, (rowCount - endIndex) * rowHeight);

    return {
      startIndex,
      endIndex,
      visibleCount: endIndex - startIndex,
      topSpacerPx,
      bottomSpacerPx,
      totalHeightPx,
    };
  }, [rowCount, rowHeight, viewportHeight, scrollTop, overscan]);
}
