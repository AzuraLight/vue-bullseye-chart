/**
 * value(0~1) → ring index (0=중심).
 * value 1.0 은 ring 0, value 0.0 은 가장 바깥 ring.
 * 균등 구간으로 매핑.
 */
export function valueToRingIndex(value: number, rings: number): number {
  if (rings <= 1) return 0;
  const clamped = Math.max(0, Math.min(1, value));
  const inverted = 1 - clamped; // 1→0(중심), 0→1(바깥)
  const idx = Math.floor(inverted * rings);
  return Math.min(rings - 1, idx);
}
