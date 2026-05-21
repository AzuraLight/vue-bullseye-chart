/**
 * 결정적 PRNG (mulberry32). 같은 seed 면 같은 jitter.
 */
function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * ring 별 노드 묶음에 angle(라디안) 부여.
 * 같은 ring 안에서 균등 분배 + 결정적 jitter.
 */
export function assignAngles<T extends { id: string; ring: number }>(
  nodes: T[],
  jitterSeed: number,
  jitterAmount: number,
): Array<T & { angle: number }> {
  const byRing = new Map<number, T[]>();
  for (const n of nodes) {
    const list = byRing.get(n.ring) ?? [];
    list.push(n);
    byRing.set(n.ring, list);
  }

  const rng = mulberry32(jitterSeed);
  const out: Array<T & { angle: number }> = [];

  for (const [, list] of byRing) {
    // id 정렬로 입력 순서 흔들림 영향 제거 → 결정적 결과
    list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const step = (2 * Math.PI) / Math.max(1, list.length);
    list.forEach((node, i) => {
      const base = i * step - Math.PI / 2; // 12시 방향부터 시계방향
      const jitter = (rng() - 0.5) * step * jitterAmount;
      out.push({ ...node, angle: base + jitter });
    });
  }
  return out;
}
