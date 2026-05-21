import type { BullseyeNode } from '../types';

export interface ValidationResult {
  nodes: BullseyeNode[];
  warnings: string[];
}

/**
 * 중복 id drop + value 범위 검증.
 * dev 모드에서 console.warn 으로 알림.
 */
export function validateNodes(input: BullseyeNode[]): ValidationResult {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const out: BullseyeNode[] = [];

  for (const n of input) {
    if (!n || typeof n.id !== 'string' || n.id.length === 0) {
      warnings.push('node with empty/invalid id was dropped');
      continue;
    }
    if (seen.has(n.id)) {
      warnings.push(`duplicate id "${n.id}" — dropped subsequent entry`);
      continue;
    }
    if (typeof n.value !== 'number' || Number.isNaN(n.value)) {
      warnings.push(`node "${n.id}" has invalid value — treated as 0`);
      seen.add(n.id);
      out.push({ ...n, value: 0 });
      continue;
    }
    if (n.value < 0 || n.value > 1) {
      warnings.push(`node "${n.id}" value=${n.value} out of [0,1] — clamped`);
    }
    seen.add(n.id);
    out.push({ ...n, value: Math.max(0, Math.min(1, n.value)) });
  }

  if (import.meta.env?.DEV) {
    for (const w of warnings) console.warn('[vue-bullseye-chart]', w);
  }
  return { nodes: out, warnings };
}
