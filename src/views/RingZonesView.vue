<script setup lang="ts">
import { BullseyeChart } from '../lib';
import type { RingLabelStyleResolver, RingStyleResolver } from '../lib/types';
import { sampleSkills } from './sample-data';

const ringLabels = ['Core', 'Strong', 'Working', 'Familiar', 'Aware'];

// 업계 KPI 차트 컨벤션: 중심=좋음(녹) → 바깥=주의(적). 모두 옅게.
const STATUS_FILL = ['#3fb950', '#7ec96f', '#d4c062', '#e09b4d', '#d6504a'];

const ringStyle: RingStyleResolver = ({ ringIndex }) => ({
  fill: STATUS_FILL[ringIndex] ?? '#30363d',
  fillOpacity: 0.1,
  stroke: '#30363d',
  strokeDasharray: '0',
});

// Core ring(중심)만 진하게/크게 강조 — 나머지는 default
const ringLabelStyle: RingLabelStyleResolver = ({ ringIndex }) =>
  ringIndex === 0 ? { color: '#111827', fontWeight: 800, fontSize: 12 } : {};
</script>

<template>
  <section class="view">
    <h2>Ring Zones</h2>
    <p class="lead">
      <code>:ring-labels</code> + <code>:ring-style</code> + <code>:ring-label-style</code> resolver.
      8방향 label position (이 예시는 <code>top-right</code>). Core ring 만 label-style 로 진하게 강조.
    </p>
    <div class="chart-wrap">
      <BullseyeChart :nodes="sampleSkills" :rings="5" :ring-labels="ringLabels" ring-label-position="top-right"
        :ring-style="ringStyle" :ring-label-style="ringLabelStyle" />
    </div>
    <p class="lead" style="margin-top:12px">
      ring fill opacity 0.1 — 업계 권고 (≤15%). 노드 색과 경쟁 피함.
    </p>
  </section>
</template>
