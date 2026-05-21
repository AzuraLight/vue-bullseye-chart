<script setup lang="ts">
import { ref } from 'vue';
import BasicView from './views/BasicView.vue';
import NodeStyleView from './views/NodeStyleView.vue';
import HighlightView from './views/HighlightView.vue';
import RingZonesView from './views/RingZonesView.vue';

const tabs = [
  { id: 'basic', label: 'Basic', comp: BasicView },
  { id: 'style', label: 'Node Style', comp: NodeStyleView },
  { id: 'rings', label: 'Ring Zones', comp: RingZonesView },
  { id: 'highlight', label: 'Highlight + Focus', comp: HighlightView },
] as const;

type TabId = (typeof tabs)[number]['id'];
const active = ref<TabId>('basic');
</script>

<template>
  <div class="app-shell">
    <aside class="app-nav">
      <h1>vue-bullseye-chart</h1>
      <button
        v-for="t in tabs"
        :key="t.id"
        :class="{ active: active === t.id }"
        @click="active = t.id"
      >{{ t.label }}</button>
    </aside>
    <main>
      <component :is="tabs.find((t) => t.id === active)!.comp" />
    </main>
  </div>
</template>
