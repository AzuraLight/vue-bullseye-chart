<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';
import { BullseyeChart } from '../lib';
import { sampleSkills, colorForGroup } from './sample-data';

/** 데이터에 등장하는 group 목록 (등장 순서 유지) */
const groups = Array.from(new Set(sampleSkills.map((n) => n.group ?? ''))).filter(Boolean);

const activeGroups = ref<Set<string>>(new Set());
function toggleGroup(g: string) {
  if (activeGroups.value.has(g)) activeGroups.value.delete(g);
  else activeGroups.value.add(g);
  // 새 Set 으로 갈아끼워 reactivity 확실히 트리거
  activeGroups.value = new Set(activeGroups.value);
}

const highlightIds = computed(() =>
  activeGroups.value.size === 0
    ? []
    : sampleSkills.filter((n) => n.group && activeGroups.value.has(n.group)).map((n) => n.id),
);

const chartRef = useTemplateRef<{ focusNode: (id: string) => void; resetZoom: () => void }>('chartRef');
const selectedId = ref<string | null>(null);
</script>

<template>
  <section class="view">
    <h2>Highlight + Focus</h2>
    <p class="lead">
      group 필터 칩 = <code>:highlight-ids</code> 동적 갱신. 매치 외 dim.
      노드 클릭 = <code>:selected-id</code> (ripple+halo) + <code>:focus-on-click</code> zoom.
    </p>

    <div class="filter-row">
      <span class="lead" style="margin-right:4px">강조 group:</span>
      <button
        v-for="g in groups"
        :key="g"
        class="chip"
        :class="{ active: activeGroups.has(g) }"
        :style="activeGroups.has(g) ? { background: colorForGroup(g), color: '#ffffff', borderColor: colorForGroup(g) } : {}"
        @click="toggleGroup(g)"
      >{{ g }}</button>
      <button class="chip ghost" @click="chartRef?.resetZoom()">reset zoom</button>
      <span class="lead">matched: {{ highlightIds.length }}</span>
    </div>

    <div class="chart-wrap">
      <BullseyeChart
        ref="chartRef"
        :nodes="sampleSkills"
        :highlight-ids="highlightIds"
        :selected-id="selectedId"
        :focus-on-click="true"
        @node-click="(n) => (selectedId = n.id)"
        @background-click="selectedId = null"
      />
    </div>
  </section>
</template>

<style scoped>
.filter-row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.chip {
  background: #ffffff;
  color: #374151;
  border: 1px solid #e5e7eb;
  border-radius: 999px;
  padding: 4px 12px;
  font-size: 12px;
  cursor: pointer;
  transition: background 120ms ease, border-color 120ms ease;
}
.chip:hover { background: #f3f4f6; }
.chip.ghost { color: #6b7280; }
</style>
