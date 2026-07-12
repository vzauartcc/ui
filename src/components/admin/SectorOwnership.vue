<script setup lang="ts">
import type { IGeojsonFeature } from '@/services/split/split.types';
import Select from 'primevue/select';

interface IPosition {
  id: string;
  name: string;
}

const props = defineProps<{
  geojson: IGeojsonFeature[];
  activePositions: IPosition[];
  ownership: Record<string, string>;
  allPositions: IPosition[];
}>();

const compilePosition = (data?: IPosition) => {
  if (!data) return '';
  return `${data.name} (${data.id})`;
};
</script>

<template>
  <div class="grid grid-cols-2 gap-5">
    <b>Sector</b>
    <b>Owner</b>
  </div>
  <div
    class="grid grid-cols-2 gap-5 my-2.5 items-center"
    v-for="sector of props.geojson"
    :key="sector.properties.name">
    <span>{{ sector.properties.name }}</span>
    <Select
      :options="props.activePositions"
      :modelValue="props.ownership[sector.properties.id]"
      filter
      :filterFields="['name', 'id']"
      optionValue="id"
      optionLabel="name">
      <template #value="slotProps">
        {{
          compilePosition(
            props.allPositions.find((p) => p.id === slotProps.value),
          )
        }}
      </template>
      <template #option="slotProps">
        {{ slotProps.option.name }} ({{ slotProps.option.id }})
      </template>
    </Select>
  </div>
</template>

<style lang="css" scoped></style>
