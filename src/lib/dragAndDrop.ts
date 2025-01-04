interface DragItem {
  id: string;
  type: string;
  index: number;
}

export function reorder<T>(list: T[], startIndex: number, endIndex: number): T[] {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export function getTimeFromPosition(
  clientX: number,
  containerRect: DOMRect,
  totalDuration: number
): number {
  const relativeX = clientX - containerRect.left;
  const percentage = Math.max(0, Math.min(1, relativeX / containerRect.width));
  return percentage * totalDuration;
}

export function snapToGrid(time: number, gridSize: number): number {
  return Math.round(time / gridSize) * gridSize;
}

export function calculateOverlap(
  trackA: { startTime: number; duration: number },
  trackB: { startTime: number; duration: number }
): number {
  const aStart = trackA.startTime;
  const aEnd = aStart + trackA.duration;
  const bStart = trackB.startTime;
  const bEnd = bStart + trackB.duration;

  if (aEnd <= bStart || bEnd <= aStart) {
    return 0;
  }

  return Math.min(aEnd, bEnd) - Math.max(aStart, bStart);
} 