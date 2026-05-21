import type { BullseyeNode, BullseyeSettings, PlacedNode } from '../types';
import { valueToRingIndex } from './ring';
import { assignAngles, assignAnglesInSectors } from './angle';
import { computeSectors, type Sector } from './sector';

export interface PlaceOptions {
  width: number;
  height: number;
  settings: BullseyeSettings;
  /**
   * `true` 이면 node.group 으로 sector(파이 조각) 자동 분할.
   * group 미지정 노드는 단일 `_default` sector 에 들어감.
   * @default false
   */
  sectorize?: boolean;
}

export interface PlaceResult {
  placed: PlacedNode[];
  /** ring 별 반지름(px). ring 0 부터 바깥 ring 까지. */
  ringRadii: number[];
  cx: number;
  cy: number;
  maxRadius: number;
  /** sectorize 시에만 채워짐. 그렇지 않으면 빈 배열. */
  sectors: Sector[];
}

export function placeNodes(nodes: BullseyeNode[], opts: PlaceOptions): PlaceResult {
  const { width, height, settings, sectorize = false } = opts;
  const cx = width / 2;
  const cy = height / 2;
  const maxRadius = Math.min(width, height) / 2 * (1 - settings.paddingRatio);
  const { rings } = settings;

  // ring N 의 노드는 ring N 의 중심선(=(N+0.5)/rings) 반지름 위에 놓는다.
  const ringRadii: number[] = [];
  for (let i = 0; i < rings; i++) {
    ringRadii.push(((i + 0.5) / rings) * maxRadius);
  }

  const withRing = nodes.map((n) => ({ ...n, ring: valueToRingIndex(n.value, rings) }));

  const sectors = sectorize ? computeSectors(nodes) : [];
  const withAngle = sectorize && sectors.length > 0
    ? assignAnglesInSectors(withRing, sectors, settings.jitterSeed, settings.jitterAmount)
    : assignAngles(withRing, settings.jitterSeed, settings.jitterAmount);

  const placed: PlacedNode[] = withAngle.map((n) => {
    const r = ringRadii[n.ring] ?? ringRadii[ringRadii.length - 1] ?? 0;
    return {
      ...n,
      x: cx + r * Math.cos(n.angle),
      y: cy + r * Math.sin(n.angle),
    };
  });

  return { placed, ringRadii, cx, cy, maxRadius, sectors };
}
