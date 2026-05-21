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

const GROUP_COLORS: Record<string, string> = {
  lang: '#f78166',
  framework: '#3fb950',
  lib: '#58a6ff',
  topic: '#d2a8ff',
  infra: '#f0883e',
  tool: '#79c0ff',
};

export function colorForGroup(group: string | undefined): string {
  return GROUP_COLORS[group ?? ''] ?? '#8b949e';
}
