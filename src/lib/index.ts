/**
 * @file vue-bullseye-chart 진입점.
 *
 * ```ts
 * import { BullseyeChart, defaultSettings } from 'vue-bullseye-chart';
 * ```
 */

export { default as BullseyeChart } from './components/BullseyeChart.vue';

export { defaultSettings, defaultNodeStyle, defaultRingStyle, defaultRingLabelStyle, defaultSectorStyle, ringColor } from './settings';
export { validateNodes, type ValidationResult } from './graph/validate';
export { valueToRingIndex } from './layout/ring';
export { placeNodes, type PlaceOptions, type PlaceResult } from './layout/place';
export { computeSectors, type Sector } from './layout/sector';

export type {
  BullseyeNode,
  PlacedNode,
  BullseyeSettings,
  NodeStyle,
  NodeStyleContext,
  NodeStyleResolver,
  RenderNodeExtras,
  FocusOptions,
  RingStyle,
  RingStyleContext,
  RingStyleResolver,
  RingLabelPosition,
  RingLabelStyle,
  RingLabelStyleResolver,
  SectorStyle,
  SectorStyleContext,
  SectorStyleResolver,
} from './types';
