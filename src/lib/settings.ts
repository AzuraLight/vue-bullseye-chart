import type { BullseyeSettings, NodeStyle, NodeStyleContext, PlacedNode, RingLabelStyle, RingStyle, RingStyleContext, SectorStyle, SectorStyleContext } from './types';

export const defaultSettings: BullseyeSettings = {
  rings: 5,
  paddingRatio: 0.06,
  labelMaxChars: 18,
  clickThresholdPx: 4,
  jitterSeed: 42,
  jitterAmount: 0.18,
};

const RING_PALETTE = ['#1f6feb', '#3a8bff', '#6aa9ff', '#9fc5ff', '#d0e1ff'];

export function ringColor(ringIndex: number, rings: number): string {
  if (rings <= 0) return RING_PALETTE[0];
  const t = ringIndex / Math.max(1, rings - 1);
  const idx = Math.round(t * (RING_PALETTE.length - 1));
  return RING_PALETTE[idx] ?? RING_PALETTE[RING_PALETTE.length - 1];
}

/**
 * 기본 ring 외형 — 채우기 없음, 옅은 dashed 가이드 선만.
 * 업계 컨센서스: ring 자체가 의미 스케일일 때만 fill opt-in.
 */
export function defaultRingStyle(_ctx: RingStyleContext): RingStyle {
  return {
    fill: 'transparent',
    fillOpacity: 0,
    stroke: '#d1d5db',
    strokeWidth: 1,
    strokeDasharray: '2 4',
  };
}

/**
 * 기본 sector 외형 — 완전 투명. sectorize 모드에서 노드/구분선과 경쟁 피하기 위함.
 * 의미 있는 시각화 (group 별 옅은 tint 등) 는 `sector-style` resolver 로 opt-in.
 */
export function defaultSectorStyle(_ctx: SectorStyleContext): SectorStyle {
  return {
    fill: 'transparent',
    fillOpacity: 0,
    stroke: 'transparent',
    strokeWidth: 0,
  };
}

/**
 * 기본 ring 레이블 외형 — 옅은 회색, 600 굵기, 살짝 늘인 자간.
 */
export function defaultRingLabelStyle(_ctx: RingStyleContext): RingLabelStyle {
  return {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.06em',
  };
}

export function defaultNodeStyle(node: PlacedNode, ctx: NodeStyleContext): NodeStyle {
  const base = ringColor(node.ring, 5);
  return {
    radius: ctx.selected ? 11 : ctx.hovered ? 10 : 8,
    fill: base,
    stroke: '#ffffff',
    strokeWidth: ctx.selected ? 2.5 : ctx.hovered ? 2 : 1.5,
    labelText: node.label ?? node.id,
    labelDy: 22,
    fontSize: 11,
    fontWeight: ctx.highlighted ? 700 : 500,
    fontColor: ctx.dimmed ? '#9ca3af' : '#374151',
  };
}
