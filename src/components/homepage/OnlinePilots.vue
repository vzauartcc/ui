<script setup lang="ts">
import { onlineService } from '@/services/online/online.service';
import type { IOnlinePilot } from '@/services/online/online.types';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

const pilots = ref<IOnlinePilot[] | null>(null);

onMounted(async () => {
  try {
    const data = await onlineService.getPilots();

    pilots.value = data;
  } catch (e) {
    console.error('error getting online pilots', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!pilots" />
  <DataTable
    v-else
    :value="pilots"
    size="small"
    stripedRows
    scrollable
    scrollHeight="calc(var(--spacing) * 50)">
    <Column field="callsign" header="Callsign" />
    <Column field="dep" header="Departure Airfield" />
    <Column field="dest" header="Destination Airfield" />
  </DataTable>
</template>

<style lang="css" scoped></style>
