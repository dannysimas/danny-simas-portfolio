const overlaps = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// Stable, section-specific arrangements rather than a different random layout on every visit.
// Obstacles use section-local coordinates. Reserve the whole diagonal swept by a rotating cross.
export function chooseAccentPositions({width, height, obstacles, preferred = [], count = 1, size = 24, gap = 12, seed = 0}) {
  const radius = size * Math.SQRT2 / 2 + gap;
  if (width < radius * 2 || height < radius * 2) return [];
  const candidates = [...preferred];
  const columns = [.22, .38, .54, .70, .82];
  const rows = [.18, .34, .50, .66, .82, .92];
  const fallback = rows.flatMap((y, row) => columns.map((x, column) => [
    x + (((seed + row * 3 + column) % 5) - 2) * .012,
    y + (((seed + column * 2 + row) % 3) - 1) * .008
  ]));
  const offset = Math.abs(seed) % fallback.length;
  candidates.push(...fallback.slice(offset), ...fallback.slice(0, offset));
  const occupied = [...obstacles], positions = [];
  for (const [x, y] of candidates) {
    if (positions.length >= count) break;
    const cx = x * width, cy = y * height;
    const bounds = {left: cx - radius, right: cx + radius, top: cy - radius, bottom: cy + radius};
    if (bounds.left < gap || bounds.right > width - gap || bounds.top < gap || bounds.bottom > height - gap) continue;
    if (occupied.some(rect => overlaps(bounds, rect))) continue;
    positions.push({left: cx - size / 2, top: cy - size / 2});
    occupied.push(bounds);
  }
  return positions;
}
