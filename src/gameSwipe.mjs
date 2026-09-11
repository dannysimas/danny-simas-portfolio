// A deliberate horizontal gesture, not a scroll, tap, or long press.
export function swipeDirection(dx, dy, elapsed) {
  if (elapsed > 1000 || Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
  return dx < 0 ? 1 : -1;
}
