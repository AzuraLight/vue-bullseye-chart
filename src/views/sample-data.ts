import type { BullseyeNode } from '../lib/types';

export const sampleSkills: BullseyeNode[] = [
  { id: 'ts', label: 'TypeScript', value: 0.95, group: 'lang' },
  { id: 'vue', label: 'Vue 3', value: 0.92, group: 'framework' },
  { id: 'd3', label: 'D3.js', value: 0.78, group: 'lib' },
  { id: 'rxjs', label: 'RxJS', value: 0.72, group: 'lib' },
  { id: 'a11y', label: 'A11y', value: 0.7, group: 'topic' },
  { id: 'svg', label: 'SVG', value: 0.65, group: 'topic' },
  { id: 'webgl', label: 'WebGL', value: 0.42, group: 'topic' },
  { id: 'rust', label: 'Rust', value: 0.35, group: 'lang' },
  { id: 'graphql', label: 'GraphQL', value: 0.55, group: 'lib' },
  { id: 'k8s', label: 'Kubernetes', value: 0.28, group: 'infra' },
  { id: 'figma', label: 'Figma', value: 0.6, group: 'tool' },
  { id: 'sketch', label: 'Sketch', value: 0.18, group: 'tool' },
  { id: 'css', label: 'CSS', value: 0.88, group: 'lang' },
  { id: 'html', label: 'HTML', value: 0.9, group: 'lang' },
  { id: 'svelte', label: 'Svelte', value: 0.5, group: 'framework' },
  { id: 'react', label: 'React', value: 0.6, group: 'framework' },
  { id: 'three', label: 'three.js', value: 0.4, group: 'lib' },
  { id: 'wasm', label: 'WebAssembly', value: 0.32, group: 'topic' },
];

// 6개 group 시각 구분 명확화 — Tailwind 500 계열, 색상환에서 균등 간격.
// rose / emerald / blue / purple / amber / cyan — 인접 색 충돌 없음.
const GROUP_COLORS: Record<string, string> = {
  lang:      '#f43f5e', // rose
  framework: '#10b981', // emerald
  lib:       '#3b82f6', // blue
  topic:     '#a855f7', // purple
  infra:     '#f59e0b', // amber
  tool:      '#06b6d4', // cyan
};

export function colorForGroup(group: string | undefined): string {
  return GROUP_COLORS[group ?? ''] ?? '#8b949e';
}
