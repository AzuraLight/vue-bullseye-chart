import type { BullseyeNode } from '../types';

/**
 * 한 개의 sector(파이 조각) — sectorize 모드에서 group 별 각도 범위.
 * 12 시 방향(`-π/2`)부터 시계방향 순서.
 */
export interface Sector {
  /** sector 의 group 키 (node.group 값). */
  group: string;
  /** 시작 각도 (라디안). */
  startAngle: number;
  /** 끝 각도 (라디안). */
  endAngle: number;
  /** 중간 각도 — sector 레이블 배치 기준. */
  midAngle: number;
}

const DEFAULT_GROUP = '_default';

/**
 * 노드 배열에서 unique group 을 입력 순서대로 추출 + 360° 균등 분할.
 * group 미지정 노드는 `_default` 로 묶임.
 *
 * @returns sectors 배열. 노드가 group 을 안 가지면 빈 배열.
 */
export function computeSectors(nodes: BullseyeNode[]): Sector[] {
  const groups: string[] = [];
  const seen = new Set<string>();
  for (const n of nodes) {
    const g = n.group ?? DEFAULT_GROUP;
    if (!seen.has(g)) {
      seen.add(g);
      groups.push(g);
    }
  }
  if (groups.length === 0) return [];

  const step = (2 * Math.PI) / groups.length;
  const startAt = -Math.PI / 2; // 12시 방향
  return groups.map((group, i) => {
    const startAngle = startAt + i * step;
    const endAngle = startAt + (i + 1) * step;
    return {
      group,
      startAngle,
      endAngle,
      midAngle: (startAngle + endAngle) / 2,
    };
  });
}

/** group 키 추출 — node.group 또는 fallback. */
export function nodeGroupKey(node: BullseyeNode): string {
  return node.group ?? DEFAULT_GROUP;
}
