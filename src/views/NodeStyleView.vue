<script setup lang="ts">
import { BullseyeChart } from '../lib';
import type { NodeStyleResolver } from '../lib/types';
import { sampleSkills, colorForGroup } from './sample-data';

const nodeStyle: NodeStyleResolver = (node, ctx) => ({
  fill: colorForGroup(node.group),
  radius: ctx.selected ? 13 : 6 + node.value * 8, // value 클수록 크게
  fontWeight: node.value > 0.7 ? 700 : 500,
});
</script>

<template>
  <section class="view">
    <h2>Node Style</h2>
    <p class="lead">
      <code>:node-style</code> resolver — group 별 색 + value 비례 반지름.
      일부 키만 반환해도 default 가 나머지 채움.
    </p>
    <div class="chart-wrap">
      <BullseyeChart :nodes="sampleSkills" :node-style="nodeStyle" />
    </div>
  </section>
</template>
