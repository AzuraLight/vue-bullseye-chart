# vue-bullseye-chart

**한 줄**: `value(0~1)` 만 주면 중심으로 모이는 동심원(bullseye) 차트를 그리는 Vue 3 컴포넌트.

`vue-force-network-map` 의 형제 라이브러리 — 동일한 톤·표면 철학(resolver 패턴, props/emit only, SVG 강점 유지) 을 공유합니다.

## When to use (vs Chart.js / ECharts)

bullseye 는 메이저 차트 라이브러리에 빌트인 차트 타입으로 *없습니다*. 모두 polar/scatter 변형으로 흉내 내야 함.

| 상황 | 추천 |
| --- | --- |
| bullseye 가 페이지의 *주인공* (스킬맵, 우선순위 매트릭스, 적합도 차트) | **vue-bullseye-chart** — `<BullseyeChart :nodes>` 한 줄 |
| 대시보드에 bar/line/pie 가 같이 있고 bullseye 는 곁다리 | Chart.js scatter polar + 직접 계산 (~100줄) |
| Vue 3 + a11y 키보드/ARIA 빌트인이 필요 | **vue-bullseye-chart** |
| 시계열·멀티시리즈·legend 등 풀 차트 기능 필요 | Chart.js / ECharts |

## Install

```bash
npm i vue-bullseye-chart
# peer: vue ^3.4, d3 ^7
```

## 기본 사용

```vue
<script setup lang="ts">
import { BullseyeChart, type BullseyeNode } from 'vue-bullseye-chart';

const nodes: BullseyeNode[] = [
  { id: 'ts',  label: 'TypeScript', value: 0.95 },
  { id: 'd3',  label: 'D3.js',      value: 0.78 },
  { id: 'k8s', label: 'Kubernetes', value: 0.28 },
];
</script>

<template>
  <BullseyeChart :nodes="nodes" :rings="5" />
</template>
```

`value` 가 1 에 가까울수록 중심(ring 0), 0 에 가까울수록 가장 바깥 ring 에 배치됩니다. 부모 컨테이너 크기에 자동으로 추종(`autoResize` 기본 `true`).

## 사용자 표면

### Props

| prop | 타입 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `nodes` | `BullseyeNode[]` | (필수) | `{ id, value, label?, group? }` — value 0~1, 자동 clamp |
| `rings` | `number` | `5` | 동심원 개수. 3~5 권장(가독성) |
| `width` / `height` | `number` | `640` | svg 크기. `autoResize` 활성 시 무시 |
| `auto-resize` | `boolean` | `true` | 부모 크기 추종(ResizeObserver). `aspect-ratio:1/1` 자동 |
| `settings` | `Partial<BullseyeSettings>` | — | jitter/padding/label 길이 등 미세조정 |
| `node-style` | `(node, ctx) => Partial<NodeStyle>` | — | 9 키 resolver |
| `render-node-extras` | `(g, node) => void` | — | 노드 `<g>` 에 SVG append (아이콘/배지/미니차트) |
| `selected-id` | `string \| null` | `null` | 단일 강조 (ripple + halo) |
| `highlight-ids` | `string[]` | `[]` | 다중 강조, 외 dim |
| `focus-on-click` | `boolean` | `false` | 클릭 시 focus zoom |
| `show-ring-guides` | `boolean` | `true` | 동심원 가이드/채움 표시 |
| `ring-style` | `(ctx) => Partial<RingStyle>` | — | ring 별 fill/opacity/stroke resolver. 기본 unfilled dashed. ring 이 *의미 스케일*일 때만 opt-in 권장(opacity ≤ 0.15) |
| `ring-labels` | `string[]` | `[]` | 중심부터 바깥으로의 zone 이름 (`['Core','Adjacent',…]`) |
| `ring-label-position` | compass 8방향 | `'right'` | `right` / `top-right` / `top` / `top-left` / `left` / `bottom-left` / `bottom` / `bottom-right` |
| `ring-label-style` | `(ctx) => Partial<RingLabelStyle>` | — | 라벨 5 키 resolver(color, fontSize, fontWeight, letterSpacing, fontFamily) |
| `show-center-marker` | `boolean` | `true` | 중심점("bull") 마커 + 펄스 |
| `animate-on-mount` | `boolean` | `true` | mount reveal (ring 확장 + 노드 페이드인). reduced-motion 시 자동 비활성 |
| `sectorize` | `boolean` | `false` | `node.group` 별 sector(파이 조각) 자동 분할. pure bullseye 와 sector bullseye(pie + bullseye 하이브리드) 토글 |
| `sector-style` | `(ctx) => Partial<SectorStyle>` | — | sector 배경 외형 resolver(fill, fillOpacity, stroke, strokeWidth). sectorize 모드 전용. group 별 옅은 tint(opacity ≤0.1) 권장 |

### Events

- `@node-click(node)` — click vs drag threshold 통과 시
- `@node-hover(node | null)` — enter/leave
- `@background-click` — svg 빈 영역

### Imperative (ref)

- `focusNode(id, { scale?, durationMs? })`
- `resetZoom(durationMs?)`

## 자동 처리

- `validateNodes`: 중복 id drop, value 범위 clamp, dev `console.warn`
- 라벨 18자 자동 말줄임
- click vs drag 4px threshold
- 결정적 jitter seed (재배치 안정)
- `prefers-reduced-motion` 존중 (mount reveal, hover, halo, focus zoom 모두)
- WAI-ARIA `role=button` + `tabindex` + Enter/Space activate + focus-visible
- ResizeObserver 기반 반응형(`autoResize`)

## 개발

```bash
npm install
npm run dev        # http://localhost:5182
npm run typecheck
npm run build
```
