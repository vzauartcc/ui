<script setup lang="ts">
import SplitMap from '@/components/split/SplitMap.vue';
import { splitService } from '@/services/split/split.service';
import type { IOwnershipResponse } from '@/services/split/split.types';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Live Split Map');

const ownershipData = ref<IOwnershipResponse | null>(null);

onMounted(async () => {
  try {
    const data = await splitService.getOwnership();

    ownershipData.value = data;
  } catch (e) {
    console.error('error getting split data', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!ownershipData" />
  <Card v-else>
    <template #content>
      <SplitMap
        :ownershipData="ownershipData.ownership"
        :positionsData="ownershipData.positions" />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
