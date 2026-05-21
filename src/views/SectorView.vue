<script setup lang="ts">
import { ref } from 'vue';
import { BullseyeChart } from '../lib';
import type { NodeStyleResolver, SectorStyleResolver } from '../lib/types';
import { sampleSkills, colorForGroup } from './sample-data';

const sectorize = ref(true);

// sector 모드와 시너지: group 별 색상이 sector 단위로 모여서 시각적으로 명확
const nodeStyle: NodeStyleResolver = (node, ctx) => ({
  fill: colorForGroup(node.group),
  radius: ctx.selected ? 13 : 6 + node.value * 8,
});

// sector 배경 — 노드 색과 시너지, opacity 0.15 (업계 권고 상한)
const sectorStyle: SectorStyleResolver = ({ group }) => ({
  fill: colorForGroup(group),
  fillOpacity: 0.15,
});
</script>

<template>
  <section class="view">
    <h2>Sector (pie + bullseye 하이브리드)</h2>
    <p class="lead">
      <code>:sectorize="true"</code> — <code>node.group</code> 별 sector 자동 분할.
      pure bullseye 와 sector bullseye 토글로 비교.
    </p>

    <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
      <label style="display:flex; gap:6px; align-items:center; font-size:13px; color:#374151;">
        <input type="checkbox" v-model="sectorize" />
        sectorize
      </label>
      <span class="lead">
        ring = value (적합도) · sector = group (카테고리)
      </span>
    </div>

    <div class="chart-wrap">
      <BullseyeChart :nodes="sampleSkills" :sectorize="sectorize" :node-style="nodeStyle"
        :sector-style="sectorStyle" />
    </div>

    <p class="lead" style="margin-top:12px">
      industry 표준 시각: 옅은 dashed 구분선 + sector 레이블만. 배경 색은 도메인 의미가 명확할 때만 opt-in.
    </p>
  </section>
</template>
