<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import { select, zoom, zoomIdentity, type ZoomBehavior } from 'd3';
import type {
  BullseyeNode,
  BullseyeSettings,
  FocusOptions,
  NodeStyle,
  NodeStyleResolver,
  PlacedNode,
  RenderNodeExtras,
  RingLabelPosition,
  RingLabelStyle,
  RingLabelStyleResolver,
  RingStyle,
  RingStyleResolver,
} from '../types';
import { defaultNodeStyle, defaultRingLabelStyle, defaultRingStyle, defaultSettings } from '../settings';
import { validateNodes } from '../graph/validate';
import { placeNodes } from '../layout/place';

interface Props {
  /**
   * 노드 배열. `{ id, value(0~1), label?, group? }`.
   * 중복 id 와 invalid value 는 자동 drop / clamp + dev `console.warn`.
   */
  nodes: BullseyeNode[];
  /**
   * 동심원(ring) 개수. 가독성상 3~5 권장 (업계 컨벤션).
   * @default 5
   */
  rings?: number;
  /**
   * SVG width(px). `autoResize` 활성 시 무시되고 부모 크기 추종.
   * @default 640
   */
  width?: number;
  /**
   * SVG height(px). `autoResize` 활성 시 무시되고 부모 크기 추종.
   * @default 640
   */
  height?: number;
  /**
   * 부모 컨테이너 크기에 자동 추종 (ResizeObserver 기반).
   * true 면 `width`/`height` prop 무시하고 wrapper `<div>` 의 관측 크기 사용.
   * bullseye 는 원형이라 `min(w,h)` 정사각으로 그림 → 컨테이너에 `width:100%`, `aspect-ratio:1/1` 등을 부여하면 됨.
   * @default true
   */
  autoResize?: boolean;
  /** 차트 동작 미세조정 — jitter/padding/label 길이 등. */
  settings?: Partial<BullseyeSettings>;
  /**
   * 노드 외형 resolver. `(node, ctx) => Partial<NodeStyle>`.
   * 일부 키만 반환해도 나머지는 default 적용.
   *
   * @example
   * :node-style="(n, ctx) => ({ fill: colorFor(n.group), radius: 6 + n.value*8 })"
   */
  nodeStyle?: NodeStyleResolver;
  /** 노드 `<g>` 에 임의 SVG 요소 append 하는 훅. 아이콘/배지/미니차트 용도. */
  renderNodeExtras?: RenderNodeExtras;
  /** 단일 강조 노드 id. ripple + halo 효과. @default null */
  selectedId?: string | null;
  /** 다중 강조 id 배열. 매치되지 않은 노드는 자동 dim. @default [] */
  highlightIds?: string[];
  /** 노드 클릭 시 자동으로 해당 노드로 focus zoom. @default false */
  focusOnClick?: boolean;
  /** 동심원 가이드(외곽선/채우기) 표시 여부. @default true */
  showRingGuides?: boolean;
  /**
   * ring(동심원) 외형 resolver. `(ctx) => Partial<RingStyle>`.
   *
   * 업계 권고: ring 이 *의미 스케일*일 때만 opt-in 으로 fill 부여, opacity ≤ 0.15.
   * 기본은 unfilled + 점선 가이드.
   *
   * @example
   * :ring-style="({ ringIndex }) => ({ fill: STATUS[ringIndex], fillOpacity: 0.1 })"
   */
  ringStyle?: RingStyleResolver;
  /**
   * ring zone 레이블. 중심부터 바깥으로의 배열.
   * 예: `['Core', 'Strong', 'Working', 'Familiar', 'Aware']`.
   * @default []
   */
  ringLabels?: string[];
  /** ring 레이블 배치 위치 (compass 8 방향). @default 'right' */
  ringLabelPosition?: RingLabelPosition;
  /**
   * ring 레이블 외형 resolver. `(ctx) => Partial<RingLabelStyle>`.
   * 일부 키만 반환해도 나머지는 default 적용. ring 별로 다른 강조 가능.
   *
   * @example
   * :ring-label-style="({ ringIndex }) => ringIndex === 0
   *   ? { color: '#111827', fontWeight: 800, fontSize: 12 }
   *   : {}"
   */
  ringLabelStyle?: RingLabelStyleResolver;
  /**
   * 중심점("bull") 마커 표시. bullseye 정체성의 핵심 시각 요소.
   * @default true
   */
  showCenterMarker?: boolean;
  /**
   * mount 시 ring 확장 + 노드 페이드인 리빌 애니메이션.
   * `prefers-reduced-motion` 활성 시 자동 비활성.
   * @default true
   */
  animateOnMount?: boolean;
  /**
   * `true` 이면 `node.group` 별로 sector(파이 조각) 자동 분할.
   * 같은 group 노드들이 한 호(arc)에 모여서 배치됨. pure bullseye 와 sector bullseye 토글.
   *
   * - group 미지정 노드는 단일 `_default` sector 로 묶임
   * - sectorize 활성 시 sector 구분선 + 레이블 자동 표시
   * - 업계 표준 분배: 균등(각 group 동일 크기). weighted 는 미지원
   *
   * @default false
   */
  sectorize?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  rings: 5,
  width: 640,
  height: 640,
  selectedId: null,
  highlightIds: () => [],
  focusOnClick: false,
  showRingGuides: true,
  ringLabels: () => [],
  ringLabelPosition: 'right',
  autoResize: true,
  showCenterMarker: true,
  animateOnMount: true,
  sectorize: false,
});

const emit = defineEmits<{
  /** 노드 클릭(click vs drag threshold 통과). payload = 클릭된 PlacedNode. */
  (e: 'node-click', node: PlacedNode): void;
  /** 노드 hover. enter 시 PlacedNode, leave 시 null. */
  (e: 'node-hover', node: PlacedNode | null): void;
  /** svg 빈 영역 클릭. selection 해제 등에 활용. */
  (e: 'background-click'): void;
}>();

const mergedSettings = computed<BullseyeSettings>(() => ({
  ...defaultSettings,
  ...props.settings,
  rings: props.rings,
}));

// 관측 크기(autoResize 시) — wrapper <div> 의 contentRect 추적.
const observedSize = ref<{ w: number; h: number }>({ w: props.width, h: props.height });
const renderSize = computed(() => {
  if (!props.autoResize) return { w: props.width, h: props.height };
  // bullseye 는 원형 → 정사각으로 그려서 padding 균등
  const s = Math.max(1, Math.min(observedSize.value.w, observedSize.value.h));
  return { w: s, h: s };
});

const validated = computed(() => validateNodes(props.nodes));
const layout = computed(() =>
  placeNodes(validated.value.nodes, {
    width: renderSize.value.w,
    height: renderSize.value.h,
    settings: mergedSettings.value,
    sectorize: props.sectorize,
  }),
);

const hoverId = ref<string | null>(null);
const highlightSet = computed(() => new Set(props.highlightIds));

// mount reveal — ring 0→1 scale, 노드 opacity 0→1
const mounted = ref(false);

/** prefers-reduced-motion 검사. SSR 안전(window 없는 환경에서도 false). */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/** default + 사용자 resolver override 를 병합. nodeStyle/ringStyle/ringLabelStyle 공통 패턴. */
function resolveStyle<TCtx, TStyle>(
  base: TStyle,
  resolver: ((ctx: TCtx) => Partial<TStyle>) | undefined,
  ctx: TCtx,
): TStyle {
  return resolver ? { ...base, ...resolver(ctx) } : base;
}

/**
 * ring 별 외형. 안쪽 ring 부터 그려야 바깥 ring 이 위에 안 덮음 →
 * 채우기는 *바깥 ring 부터* 그리고 안쪽 ring 으로 덮어쓰는 방식 (donut 효과).
 * 단순화를 위해 ring N 은 (N+1) 번째 동심원 둘레까지의 *외곽 경계*만 stroke 로,
 * fill 은 ring 별 annulus(도넛 링) 로 그린다.
 */
interface RingShape {
  ringIndex: number;
  innerR: number;
  outerR: number;
  style: RingStyle;
  labelText: string | null;
}

const ringShapes = computed<RingShape[]>(() => {
  const { rings } = mergedSettings.value;
  const { maxRadius } = layout.value;
  const shapes: RingShape[] = [];
  for (let i = 0; i < rings; i++) {
    const innerR = (i / rings) * maxRadius;
    const outerR = ((i + 1) / rings) * maxRadius;
    const ctx = { ringIndex: i, rings };
    shapes.push({
      ringIndex: i,
      innerR,
      outerR,
      style: resolveStyle(defaultRingStyle(ctx), props.ringStyle, ctx),
      labelText: props.ringLabels[i] ?? null,
    });
  }
  return shapes;
});

/** 원 하나를 SVG path 로. sweep flag 로 방향(외곽=0, 내부 구멍=1) 제어. */
function circlePath(cx: number, cy: number, r: number, sweep: 0 | 1): string {
  const d = r * 2;
  return `M ${cx - r},${cy} a ${r},${r} 0 1,${sweep} ${d},0 a ${r},${r} 0 1,${sweep} ${-d},0 Z`;
}

/** annulus(도넛 링). inner=0 이면 꽉 찬 원. evenodd fill-rule 로 안쪽 구멍 뚫음. */
function annulusPath(cx: number, cy: number, inner: number, outer: number): string {
  const outerRing = circlePath(cx, cy, outer, 0);
  if (inner <= 0) return outerRing;
  return `${outerRing} ${circlePath(cx, cy, inner, 1)}`;
}

interface RingLabelPlacement {
  ringIndex: number;
  text: string;
  x: number;
  y: number;
  anchor: 'start' | 'middle' | 'end';
  style: RingLabelStyle;
}

/** compass 방향 → SVG 라디안 (0=3시, +90°=6시). */
const POSITION_ANGLE: Record<RingLabelPosition, number> = {
  'right':         0,
  'bottom-right':  Math.PI / 4,
  'bottom':        Math.PI / 2,
  'bottom-left':   3 * Math.PI / 4,
  'left':          Math.PI,
  'top-left':     -3 * Math.PI / 4,
  'top':          -Math.PI / 2,
  'top-right':    -Math.PI / 4,
};

/** sector 시각화 — 구분선 끝점 + 레이블 위치. */
interface SectorVisual {
  group: string;
  /** 구분선 끝점 (시작 각도 기준, 중심→바깥) */
  dividerX: number;
  dividerY: number;
  /** 레이블 좌표 — sector midAngle, maxRadius 살짝 안쪽 */
  labelX: number;
  labelY: number;
}

const sectorVisuals = computed<SectorVisual[]>(() => {
  const { cx, cy, maxRadius, sectors } = layout.value;
  // 레이블은 바깥 ring 보다 살짝 안쪽(95%) — padding 없는 컨테이너에서도 잘림 방지
  const labelR = maxRadius * 0.95;
  return sectors.map((s) => ({
    group: s.group,
    dividerX: cx + maxRadius * Math.cos(s.startAngle),
    dividerY: cy + maxRadius * Math.sin(s.startAngle),
    labelX: cx + labelR * Math.cos(s.midAngle),
    labelY: cy + labelR * Math.sin(s.midAngle),
  }));
});

const ringLabelPlacements = computed<RingLabelPlacement[]>(() => {
  const { cx, cy } = layout.value;
  const angle = POSITION_ANGLE[props.ringLabelPosition];
  const { rings } = mergedSettings.value;
  const out: RingLabelPlacement[] = [];
  for (const r of ringShapes.value) {
    if (!r.labelText) continue;
    const mid = (r.innerR + r.outerR) / 2;
    const x = cx + mid * Math.cos(angle);
    // baseline 보정으로 살짝 위로 — 수직/대각선에서도 자연스러움
    const y = cy + mid * Math.sin(angle) - 4;
    const ctx = { ringIndex: r.ringIndex, rings };
    out.push({
      ringIndex: r.ringIndex,
      text: r.labelText,
      x, y,
      anchor: 'middle',
      style: resolveStyle(defaultRingLabelStyle(ctx), props.ringLabelStyle, ctx),
    });
  }
  return out;
});

const svgRef = useTemplateRef<SVGSVGElement>('svgRef');
const viewportRef = useTemplateRef<SVGGElement>('viewportRef');
const wrapperRef = useTemplateRef<HTMLDivElement>('wrapperRef');

let zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> | null = null;
let resizeObserver: ResizeObserver | null = null;

function ellipsize(text: string, max: number): string {
  return text.length > max ? text.slice(0, max - 1) + '…' : text;
}

function styleFor(node: PlacedNode): NodeStyle {
  const ctx = {
    selected: props.selectedId === node.id,
    highlighted: highlightSet.value.has(node.id),
    dimmed: highlightSet.value.size > 0 && !highlightSet.value.has(node.id) && props.selectedId !== node.id,
    hovered: hoverId.value === node.id,
  };
  const resolverForNode = props.nodeStyle
    ? (c: typeof ctx) => props.nodeStyle!(node, c)
    : undefined;
  const merged = resolveStyle(defaultNodeStyle(node, ctx), resolverForNode, ctx);
  return { ...merged, labelText: ellipsize(merged.labelText, mergedSettings.value.labelMaxChars) };
}

function nodeOpacity(node: PlacedNode): number {
  if (highlightSet.value.size === 0) return 1;
  if (highlightSet.value.has(node.id) || props.selectedId === node.id) return 1;
  return 0.25;
}

// click vs drag
let pressedAt: { x: number; y: number } | null = null;
function onNodePointerDown(e: PointerEvent) {
  pressedAt = { x: e.clientX, y: e.clientY };
}
function onNodePointerUp(node: PlacedNode, e: PointerEvent) {
  if (!pressedAt) return;
  const dx = e.clientX - pressedAt.x;
  const dy = e.clientY - pressedAt.y;
  pressedAt = null;
  if (Math.hypot(dx, dy) > mergedSettings.value.clickThresholdPx) return;
  emit('node-click', node);
  if (props.focusOnClick) focusNode(node.id);
}

function onBackgroundClick(e: MouseEvent) {
  if (e.target === svgRef.value) emit('background-click');
}

// extras hook
const extrasGroups = ref<Map<string, SVGGElement>>(new Map());
function bindExtras(el: SVGGElement | null, node: PlacedNode) {
  if (!el) return;
  extrasGroups.value.set(node.id, el);
  if (props.renderNodeExtras) {
    while (el.firstChild) el.removeChild(el.firstChild);
    props.renderNodeExtras(el, node);
  }
}

// zoom / focus + resize observer
onMounted(() => {
  if (!svgRef.value || !viewportRef.value) return;
  const svg = select(svgRef.value);
  const viewport = select(viewportRef.value);
  zoomBehavior = zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.4, 4])
    .on('zoom', (event) => {
      viewport.attr('transform', event.transform.toString());
    });
  svg.call(zoomBehavior);

  if (props.autoResize && wrapperRef.value) {
    resizeObserver = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) observedSize.value = { w: cr.width, h: cr.height };
    });
    resizeObserver.observe(wrapperRef.value);
    // 초기 크기 즉시 반영 (ResizeObserver 첫 콜백은 microtask 뒤)
    const rect = wrapperRef.value.getBoundingClientRect();
    observedSize.value = { w: rect.width, h: rect.height };
  }

  // mount reveal: 한 프레임 뒤에 토글 → CSS transition 트리거
  if (props.animateOnMount && !prefersReducedMotion()) {
    requestAnimationFrame(() => { mounted.value = true; });
  } else {
    mounted.value = true;
  }
});

onBeforeUnmount(() => {
  if (svgRef.value && zoomBehavior) select(svgRef.value).on('.zoom', null);
  resizeObserver?.disconnect();
  resizeObserver = null;
});

/**
 * 지정한 노드를 화면 중앙으로 zoom-pan.
 * `prefers-reduced-motion` 활성 시 즉시 이동(트랜지션 없음).
 *
 * @param id  대상 노드 id. 없는 id 면 무시.
 * @param opts.scale       확대 배율 (기본 1.8)
 * @param opts.durationMs  트랜지션 시간 ms (기본 450)
 */
function focusNode(id: string, opts: FocusOptions = {}) {
  const node = layout.value.placed.find((n) => n.id === id);
  if (!node || !svgRef.value || !zoomBehavior) return;
  const scale = opts.scale ?? 1.8;
  const duration = opts.durationMs ?? 450;
  const t = zoomIdentity
    .translate(renderSize.value.w / 2 - node.x * scale, renderSize.value.h / 2 - node.y * scale)
    .scale(scale);
  const dur = prefersReducedMotion() ? 0 : duration;
  select(svgRef.value).transition().duration(dur).call(zoomBehavior.transform, t);
}

/**
 * zoom/pan 을 초기 상태(identity)로 복원.
 * @param durationMs 트랜지션 시간 ms (기본 350)
 */
function resetZoom(durationMs = 350) {
  if (!svgRef.value || !zoomBehavior) return;
  const dur = prefersReducedMotion() ? 0 : durationMs;
  select(svgRef.value).transition().duration(dur).call(zoomBehavior.transform, zoomIdentity);
}

defineExpose({ focusNode, resetZoom });

// re-render extras on layout changes
watch(layout, () => {
  for (const node of layout.value.placed) {
    const el = extrasGroups.value.get(node.id);
    if (el && props.renderNodeExtras) {
      while (el.firstChild) el.removeChild(el.firstChild);
      props.renderNodeExtras(el, node);
    }
  }
});
</script>

<template>
  <div ref="wrapperRef" class="bullseye-wrapper" :style="props.autoResize
    ? { width: '100%', aspectRatio: '1 / 1' }
    : { width: `${props.width}px`, height: `${props.height}px` }">
  <svg ref="svgRef" :class="['bullseye-svg', { mounted }]" :width="renderSize.w" :height="renderSize.h"
    :viewBox="`0 0 ${renderSize.w} ${renderSize.h}`" role="img" aria-label="bullseye chart" @click="onBackgroundClick">
    <g ref="viewportRef">
      <!-- ring fills + guides (바깥 ring 부터 그려 안쪽이 위에 올라옴) -->
      <g v-if="props.showRingGuides" class="ring-guides"
         :style="{ transformOrigin: `${layout.cx}px ${layout.cy}px` }">
        <path v-for="r in [...ringShapes].reverse()" :key="`ring-${r.ringIndex}`"
          :d="annulusPath(layout.cx, layout.cy, r.innerR, r.outerR)" :fill="r.style.fill"
          :fill-opacity="r.style.fillOpacity" :stroke="r.style.stroke" :stroke-width="r.style.strokeWidth"
          :stroke-dasharray="r.style.strokeDasharray" fill-rule="evenodd" pointer-events="none" />
      </g>

      <!-- ring labels -->
      <g class="ring-labels" pointer-events="none">
        <text v-for="p in ringLabelPlacements" :key="`ring-label-${p.ringIndex}`" :x="p.x" :y="p.y"
          :text-anchor="p.anchor" :font-size="p.style.fontSize" :font-weight="p.style.fontWeight"
          :fill="p.style.color" :letter-spacing="p.style.letterSpacing" :font-family="p.style.fontFamily">{{ p.text
          }}</text>
      </g>

      <!-- sector dividers + labels (sectorize 모드) -->
      <g v-if="layout.sectors.length > 0" class="sectors" pointer-events="none">
        <line v-for="s in sectorVisuals" :key="`sector-div-${s.group}`"
          :x1="layout.cx" :y1="layout.cy" :x2="s.dividerX" :y2="s.dividerY"
          stroke="#e5e7eb" stroke-width="1" stroke-dasharray="3 5" />
        <text v-for="s in sectorVisuals" :key="`sector-lbl-${s.group}`"
          :x="s.labelX" :y="s.labelY" text-anchor="middle" dominant-baseline="middle"
          font-size="11" font-weight="700" fill="#374151" letter-spacing="0.04em">{{ s.group }}</text>
      </g>

      <!-- center marker (the bull) -->
      <g v-if="props.showCenterMarker" class="center-marker" pointer-events="none">
        <circle :cx="layout.cx" :cy="layout.cy" r="3" fill="#4338ca" />
        <circle :cx="layout.cx" :cy="layout.cy" r="6" fill="none" stroke="#4338ca" stroke-opacity="0.25"
          stroke-width="1" />
      </g>

      <!-- nodes -->
      <g v-for="node in layout.placed" :key="node.id"
        :class="['node', { hovered: hoverId === node.id, selected: props.selectedId === node.id }]"
        :transform="`translate(${node.x},${node.y})`"
        :opacity="nodeOpacity(node)" role="button" tabindex="0" :aria-label="styleFor(node).labelText"
        @pointerdown="onNodePointerDown" @pointerup="onNodePointerUp(node, $event)"
        @pointerenter="hoverId = node.id; emit('node-hover', node)"
        @pointerleave="hoverId = null; emit('node-hover', null)" @keydown.enter.prevent="emit('node-click', node)"
        @keydown.space.prevent="emit('node-click', node)">
        <circle v-if="props.selectedId === node.id" class="halo" :r="styleFor(node).radius + 6" fill="none"
          stroke="#4338ca" stroke-opacity="0.5" stroke-width="2" />
        <circle :r="styleFor(node).radius" :fill="styleFor(node).fill" :stroke="styleFor(node).stroke"
          :stroke-width="styleFor(node).strokeWidth" />
        <g :ref="(el) => bindExtras(el as SVGGElement | null, node)" class="extras" />
        <text :dy="styleFor(node).labelDy" text-anchor="middle" :font-size="styleFor(node).fontSize"
          :font-weight="styleFor(node).fontWeight" :fill="styleFor(node).fontColor">{{ styleFor(node).labelText
          }}</text>
      </g>
    </g>
  </svg>
  </div>
</template>

<style scoped>
/* ── layout ───────────────────────────── */
.bullseye-wrapper { display: block; }
svg { display: block; background: transparent; cursor: grab; max-width: 100%; height: auto; }
svg:active { cursor: grabbing; }

/* ── node: 기본 + hover/focus ─────────── */
.node {
  cursor: pointer;
  outline: none;
  opacity: 0;
  transition: opacity 350ms ease 300ms;
}
.node > circle:nth-of-type(1) {
  transition: r 120ms ease-out, stroke-width 120ms ease-out;
}
.node:focus-visible > circle:nth-of-type(1) {
  stroke: #4338ca;
  stroke-width: 2.5;
}

/* ── center marker: 펄스 ──────────────── */
.center-marker {
  opacity: 0;
  transition: opacity 400ms ease 250ms;
}
.center-marker > circle:nth-of-type(2) {
  transform-origin: center;
  animation: center-pulse 2.4s ease-out infinite;
}
@keyframes center-pulse {
  0%   { stroke-opacity: 0.35; r: 6; }
  70%  { stroke-opacity: 0; r: 14; }
  100% { stroke-opacity: 0; r: 14; }
}

/* ── ring guides: mount reveal ────────── */
.ring-guides {
  transform: scale(0.6);
  opacity: 0;
  transition: transform 500ms cubic-bezier(.2,.7,.2,1), opacity 400ms ease;
}
.bullseye-svg.mounted .ring-guides { transform: scale(1); opacity: 1; }
.bullseye-svg.mounted .center-marker { opacity: 1; }
.bullseye-svg.mounted .node { opacity: 1; }

/* ── selected: halo ripple ────────────── */
.halo { animation: ripple 1.4s ease-out infinite; }
@keyframes ripple {
  0%   { stroke-opacity: 0.6; }
  100% { stroke-opacity: 0; }
}

/* ── reduced motion: 모든 모션 비활성 ── */
@media (prefers-reduced-motion: reduce) {
  .ring-guides, .center-marker, .node {
    transition: none;
    transform: none;
    opacity: 1;
  }
  .node > circle:nth-of-type(1),
  .center-marker > circle:nth-of-type(2),
  .halo {
    animation: none;
    transition: none;
  }
}
</style>
