/**
 * 사용자 입력 노드.
 *
 * @example
 * { id: 'ts', label: 'TypeScript', value: 0.95, group: 'lang' }
 */
export interface BullseyeNode {
  /** 고유 식별자. 중복 시 첫 번째만 사용되고 이후는 drop + dev warn. */
  id: string;
  /**
   * 0~1 의 값. 1 에 가까울수록 중심(ring 0), 0 에 가까울수록 가장 바깥 ring.
   * 범위를 벗어나면 자동 clamp.
   */
  value: number;
  /** 노드에 표시할 라벨. 미지정 시 `id` 사용. 자동 말줄임(기본 18자). */
  label?: string;
  /** 카테고리/그룹 식별자. `node-style` resolver 에서 색 매핑 등에 활용. */
  group?: string;
}

/**
 * 레이아웃 계산 후 내부에서 들고 다니는 노드.
 * `node-style`, `render-node-extras`, 이벤트 payload 의 형태.
 */
export interface PlacedNode extends BullseyeNode {
  /** 0=중심 ring. */
  ring: number;
  /** 라디안. 12시 방향 시작, 시계방향 증가. */
  angle: number;
  /** svg 좌표계 x. */
  x: number;
  /** svg 좌표계 y. */
  y: number;
}

/** `node-style` resolver 의 두 번째 인자. 현재 노드의 상호작용 상태. */
export interface NodeStyleContext {
  /** `:selected-id` 와 일치하는 노드. */
  selected: boolean;
  /** `:highlight-ids` 에 포함된 노드. */
  highlighted: boolean;
  /** highlight 가 활성인데 본인은 매치 안 된 노드(시각적으로 dim). */
  dimmed: boolean;
  /** 포인터 hover 중인 노드. */
  hovered: boolean;
}

/**
 * 노드 외형 9 키. `node-style` resolver 는 이 중 일부만 반환해도 됨(나머지는 default).
 */
export interface NodeStyle {
  /** 노드 원 반지름(px). @default 8 (selected: 11) */
  radius: number;
  /** 노드 채우기 색. @default ringColor(node.ring) */
  fill: string;
  /** 노드 테두리 색. @default '#ffffff' */
  stroke: string;
  /** 테두리 두께(px). @default 1.5 (selected: 2.5) */
  strokeWidth: number;
  /** 노드 아래 표시할 텍스트. `labelMaxChars` 자동 말줄임. @default node.label ?? node.id */
  labelText: string;
  /** 노드 중심에서 라벨 y 오프셋(px). @default 22 */
  labelDy: number;
  /** 라벨 폰트 크기(px). @default 11 */
  fontSize: number;
  /** 라벨 폰트 굵기. @default highlighted ? 700 : 500 */
  fontWeight: number | string;
  /** 라벨 색. @default '#374151' (dimmed 시 '#9ca3af') */
  fontColor: string;
}

/**
 * 노드 외형 resolver. ctx 로 상호작용 상태를 받아 일부 키만 override.
 *
 * @example
 * const nodeStyle: NodeStyleResolver = (node, ctx) => ({
 *   fill: ctx.selected ? '#4338ca' : colorForGroup(node.group),
 *   radius: 6 + node.value * 8,
 * });
 */
export type NodeStyleResolver = (node: PlacedNode, ctx: NodeStyleContext) => Partial<NodeStyle>;

/**
 * 노드 `<g>` 엘리먼트에 추가 SVG 요소를 직접 append 하는 훅.
 * 빌트인 표현으로 부족한 시각화(아이콘, 배지, 미니 차트 등)에 사용.
 *
 * @example
 * const renderNodeExtras: RenderNodeExtras = (g, node) => {
 *   const ns = 'http://www.w3.org/2000/svg';
 *   const star = document.createElementNS(ns, 'text');
 *   star.textContent = '⭐';
 *   g.appendChild(star);
 * };
 */
export type RenderNodeExtras = (group: SVGGElement, node: PlacedNode) => void;

/** `ring-style` resolver 의 인자. */
export interface RingStyleContext {
  /** 현재 ring 의 index. 0 = 중심(가장 안쪽 ring). */
  ringIndex: number;
  /** 전체 ring 개수. */
  rings: number;
}

/**
 * ring(동심원) 외형 5 키. `ring-style` resolver 는 일부만 반환해도 됨.
 *
 * 업계 컨벤션: ring 이 *공간 가이드*일 뿐이면 채우기 없이 점선만,
 * ring 자체가 *의미 스케일*일 때만 fill opt-in (권장 opacity ≤ 0.15).
 */
export interface RingStyle {
  /**
   * ring(annulus) 채우기 색.
   * @default 'transparent'
   * @example '#3fb950'  // status: good
   */
  fill: string;
  /**
   * 채우기 불투명도. 노드 색과 경쟁 피하기 위해 0.15 이하 권장.
   * @default 0
   */
  fillOpacity: number;
  /** ring 외곽선 색. @default '#d1d5db' */
  stroke: string;
  /** ring 외곽선 두께(px). @default 1 */
  strokeWidth: number;
  /**
   * 점선 패턴. SVG `stroke-dasharray` 와 동일 문법.
   * - `'0'` 또는 `'none'` → 실선
   * - `'2 4'` → 2px dash + 4px gap (기본, 가벼운 가이드)
   * - `'8 2'` → 강조 ring
   *
   * @default '2 4'
   */
  strokeDasharray: string;
}

/**
 * ring 외형 resolver. ring 자체가 의미 스케일일 때만 opt-in 사용 권장.
 *
 * @example
 * const ringStyle: RingStyleResolver = ({ ringIndex }) => ({
 *   fill: ['#3fb950','#d4c062','#d6504a'][ringIndex] ?? '#e5e7eb',
 *   fillOpacity: 0.1,
 *   strokeDasharray: '0',
 * });
 */
export type RingStyleResolver = (ctx: RingStyleContext) => Partial<RingStyle>;

/**
 * ring 레이블(zone 이름) 텍스트 외형 5 키.
 * `ring-label-style` resolver 는 일부만 반환해도 됨.
 */
export interface RingLabelStyle {
  /** 라벨 텍스트 색. @default '#6b7280' */
  color: string;
  /** 폰트 크기(px). @default 10 */
  fontSize: number;
  /** 폰트 굵기. number 또는 'bold' 등. @default 600 */
  fontWeight: number | string;
  /** letter-spacing CSS 값. @default '0.06em' */
  letterSpacing: string;
  /**
   * 폰트 패밀리. 미지정 시 body 폰트 상속.
   * @default undefined
   * @example "'JetBrains Mono', monospace"
   */
  fontFamily?: string;
}

/**
 * ring 레이블 외형 resolver. ring 별 다른 강조(예: Core ring 만 굵게) 가능.
 *
 * @example
 * :ring-label-style="({ ringIndex }) => ringIndex === 0
 *   ? { color: '#111827', fontWeight: 800, fontSize: 12 }
 *   : {}"
 */
export type RingLabelStyleResolver = (ctx: RingStyleContext) => Partial<RingLabelStyle>;

/** `sector-style` resolver 의 인자. sectorize 모드에서만 호출됨. */
export interface SectorStyleContext {
  /** sector 의 group 키 (node.group 값). */
  group: string;
  /** 0부터 시작하는 sector index (12시 방향부터 시계방향). */
  index: number;
  /** 전체 sector 개수. */
  total: number;
}

/**
 * sector(파이 조각) 배경 외형 4 키. `sector-style` resolver 는 일부만 반환해도 됨.
 *
 * 업계 컨벤션: sectorize 모드에서 같은 group 노드가 모이는 공간이라 *옅은 tint*
 * (opacity ≤ 0.1) 가 시인성에 도움. 단 노드 색과 경쟁하지 않도록 채도/투명도 절제.
 */
export interface SectorStyle {
  /**
   * sector 배경 채우기 색.
   * @default 'transparent'
   * @example colorForGroup(group)  // 노드 색과 시너지
   */
  fill: string;
  /**
   * 채우기 불투명도. 0.06~0.1 권장.
   * @default 0
   */
  fillOpacity: number;
  /** sector 외곽(원호) stroke. 기본 없음. @default 'transparent' */
  stroke: string;
  /** stroke 두께. @default 0 */
  strokeWidth: number;
}

/**
 * sector 외형 resolver. sectorize 모드에서만 사용.
 *
 * @example
 * :sector-style="({ group }) => ({ fill: colorForGroup(group), fillOpacity: 0.08 })"
 */
export type SectorStyleResolver = (ctx: SectorStyleContext) => Partial<SectorStyle>;

/**
 * ring 레이블 배치 위치 (compass 8 방향).
 * 중심에서 해당 방향으로 뻗는 축을 따라 각 ring 의 중간에 레이블 배치.
 *
 * 수평/수직 4방향 + 대각선 4방향:
 * - `'right'` (기본, 3시), `'top'` (12시), `'left'` (9시), `'bottom'` (6시)
 * - `'top-right'` (1시 30분), `'top-left'` (10시 30분),
 *   `'bottom-right'` (4시 30분), `'bottom-left'` (7시 30분)
 */
export type RingLabelPosition =
  | 'right'
  | 'top-right'
  | 'top'
  | 'top-left'
  | 'left'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

/** 차트 동작 설정 (자주 만질 일 없음 — `settings` prop 으로 일부 override). */
export interface BullseyeSettings {
  /** 동심원 개수. 가독성 한계상 3~5 권장(업계 컨벤션). @default 5 */
  rings: number;
  /** 차트 최대 반지름 = min(width,height)/2 × (1 - paddingRatio). @default 0.06 */
  paddingRatio: number;
  /** 라벨 자동 말줄임 글자 수. 초과 시 '…'. @default 18 */
  labelMaxChars: number;
  /** click vs drag 판정 임계 거리(px). 이보다 작게 이동하면 click. @default 4 */
  clickThresholdPx: number;
  /** 결정적 jitter PRNG 시드. 같은 시드 = 같은 배치. @default 42 */
  jitterSeed: number;
  /** ring 내 균등 분배 + 이 비율만큼 jitter(0=완전 정렬, 1=대폭 흔들기). @default 0.18 */
  jitterAmount: number;
}

/** `focusNode(id, opts)` 옵션. */
export interface FocusOptions {
  /** 확대 배율. @default 1.8 */
  scale?: number;
  /** 트랜지션 지속 시간(ms). `prefers-reduced-motion` 시 0 으로 강제. @default 450 */
  durationMs?: number;
}
