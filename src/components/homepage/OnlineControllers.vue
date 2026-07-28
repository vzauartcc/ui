<script setup lang="ts">
import { onlineService } from '@/services/online/online.service';
import type { IOnlineController } from '@/services/online/online.types';
import { timeDiffInHHMMSSAsDate } from '@/utils/date';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

const controllers = ref<IOnlineController[] | null>(null);

onMounted(async () => {
  try {
    const data = await onlineService.getControllers();

    controllers.value = data;
  } catch (e) {
    console.error('error getting online controllers', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!controllers" />
  <DataTable
    v-else
    :value="controllers"
    stripedRows
    size="small"
    scrollable
    scrollHeight="calc(var(--spacing) * 50)">
    <template #empty
      ><p>There are no controllers online right now.</p></template
    >
    <Column field="pos" />
    <Column field="name" />
    <Column field="timeStart">
      <template #body="{ data }">
        {{ timeDiffInHHMMSSAsDate(new Date(data.timeStart)) }}
      </template>
    </Column>
  </DataTable>
</template>

<style lang="css" scoped></style>
