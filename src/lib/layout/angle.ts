import type { Sector } from './sector';
import { nodeGroupKey } from './sector';
import type { BullseyeNode } from '../types';

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

type RingNode<T> = T & { id: string; ring: number };

function sortById<T extends { id: string }>(list: T[]): void {
  list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/**
 * 같은 ring 노드들을 [startAngle, endAngle] 범위에 균등 분배 + 결정적 jitter.
 * 양 끝에 약간의 margin 을 둬 sector 경계선과 노드가 겹치지 않음.
 */
function spreadAngles<T>(
  list: RingNode<T>[],
  startAngle: number,
  endAngle: number,
  rng: () => number,
  jitterAmount: number,
): Array<RingNode<T> & { angle: number }> {
  sortById(list);
  const range = endAngle - startAngle;
  // 10% margin (양 끝 5%씩) → sector 경계 가독성
  const margin = range * 0.05;
  const usable = range - margin * 2;
  const step = list.length > 0 ? usable / list.length : 0;
  return list.map((node, i) => {
    const base = startAngle + margin + (i + 0.5) * step;
    const jitter = (rng() - 0.5) * step * jitterAmount;
    return { ...node, angle: base + jitter };
  });
}

/**
 * ring 별 노드 묶음에 angle(라디안) 부여.
 * 같은 ring 안에서 360° 균등 분배 + 결정적 jitter.
 */
export function assignAngles<T extends BullseyeNode>(
  nodes: RingNode<T>[],
  jitterSeed: number,
  jitterAmount: number,
): Array<RingNode<T> & { angle: number }> {
  const byRing = new Map<number, RingNode<T>[]>();
  for (const n of nodes) {
    const list = byRing.get(n.ring) ?? [];
    list.push(n);
    byRing.set(n.ring, list);
  }

  const rng = mulberry32(jitterSeed);
  const out: Array<RingNode<T> & { angle: number }> = [];
  for (const [, list] of byRing) {
    // 12시 방향 시작, 시계방향. 단순 균등 분배라 spreadAngles 로 위임.
    sortById(list);
    const step = (2 * Math.PI) / Math.max(1, list.length);
    list.forEach((node, i) => {
      const base = i * step - Math.PI / 2;
      const jitter = (rng() - 0.5) * step * jitterAmount;
      out.push({ ...node, angle: base + jitter });
    });
  }
  return out;
}

/**
 * sectorize 모드 — 노드의 group 별 sector 안에서 ring 별 균등 분배.
 * 같은 ring + 같은 group 노드들이 해당 sector 의 호 안에 정렬됨.
 */
export function assignAnglesInSectors<T extends BullseyeNode>(
  nodes: RingNode<T>[],
  sectors: Sector[],
  jitterSeed: number,
  jitterAmount: number,
): Array<RingNode<T> & { angle: number }> {
  const sectorByGroup = new Map<string, Sector>();
  for (const s of sectors) sectorByGroup.set(s.group, s);

  // (ring, group) 키 별로 묶기
  const buckets = new Map<string, RingNode<T>[]>();
  for (const n of nodes) {
    const key = `${n.ring}__${nodeGroupKey(n)}`;
    const list = buckets.get(key) ?? [];
    list.push(n);
    buckets.set(key, list);
  }

  const rng = mulberry32(jitterSeed);
  const out: Array<RingNode<T> & { angle: number }> = [];
  for (const [key, list] of buckets) {
    const group = key.slice(key.indexOf('__') + 2);
    const sector = sectorByGroup.get(group);
    if (!sector) continue;
    out.push(...spreadAngles(list, sector.startAngle, sector.endAngle, rng, jitterAmount));
  }
  return out;
}
