<script setup lang="ts">
import { ref } from 'vue';
import { BullseyeChart } from '../lib';
import type { PlacedNode } from '../lib/types';
import { sampleSkills } from './sample-data';

const lastClicked = ref<string | null>(null);
const hovered = ref<string | null>(null);
function onClick(n: PlacedNode) { lastClicked.value = n.id; }
function onHover(n: PlacedNode | null) { hovered.value = n?.id ?? null; }
</script>

<template>
  <section class="view">
    <h2>Basic</h2>
    <p class="lead">
      <code>value(0~1)</code> → ring index 자동 매핑. node-style 미지정 = defaults.
      중심 마커 + mount reveal + hover micro-interaction 모두 빌트인.
    </p>
    <div class="chart-wrap">
      <BullseyeChart :nodes="sampleSkills" @node-click="onClick" @node-hover="onHover" />
    </div>
    <p class="lead" style="margin-top:12px">last click: <b>{{ lastClicked ?? '—' }}</b> · hover: <b>{{ hovered ?? '—' }}</b></p>
  </section>
</template>
