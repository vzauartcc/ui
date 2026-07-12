<script setup lang="ts">
import { onlineService } from '@/services/online/online.service';
import type { ITopControllers } from '@/services/online/online.types';
import { secToHHMMSS } from '@/utils/text';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

const data = ref<ITopControllers | null>(null);

onMounted(async () => {
  try {
    const top = await onlineService.getTop();

    data.value = top;
  } catch (e) {
    console.error('error getting top controllers', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!data" />
  <template v-else>
    <DataTable :value="data.controllers" stripedRows size="small">
      <template #header><span class="text-xl">Top Controllers</span></template>
      <template #empty
        ><p>
          There is no one on the leader board yet. Go control already!
        </p></template
      >
      <Column field="name" />
      <Column field="len" bodyClass="text-right">
        <template #body="{ data }">
          {{ secToHHMMSS(data.len) }}
        </template>
      </Column>
    </DataTable>

    <DataTable
      :value="data.positions"
      v-if="data.positions.length > 0"
      stripedRows
      size="small"
      class="mt-5">
      <template #header><span class="text-xl">Top Positions</span></template>
      <Column field="name" />
      <Column field="len" bodyClass="text-right">
        <template #body="{ data }">
          {{ secToHHMMSS(data.len) }}
        </template>
      </Column>
    </DataTable>
  </template>
</template>

<style lang="css" scoped></style>
