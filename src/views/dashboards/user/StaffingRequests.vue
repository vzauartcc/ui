<script setup lang="ts">
import { staffingRequestService } from '@/services/staffingRequest/staffingRequest.service';
import type { IStaffingRequest } from '@/services/staffingRequest/staffingRequest.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { useTitle } from '@/utils/title';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Upcoming Staffing Requests');

const staffingRequests = ref<IStaffingRequest[] | null>(null);
const lazyParams = ref({ page: 1, limit: 10 });
const archiveLoading = ref(true);
const totalRequests = ref(0);

onMounted(async () => {
  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await staffingRequestService.getUpcomingRequests(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    staffingRequests.value = data.requests;
    totalRequests.value = data.amount;
  } catch (e) {
    console.error('error getting staffing requests', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.limit = event.rows;

  loadLazyArchive();
};
</script>

<template>
  <ProgressSpinner v-if="!staffingRequests" />
  <template v-else>
    <DataTable
      :value="staffingRequests"
      stripedRows
      size="small"
      lazy
      paginator
      :rows="10"
      :totalRecords="totalRequests"
      :loading="archiveLoading"
      :rowsPerPageOptions="[10, 25, 50]"
      @page="onPage($event)">
      <template #empty
        ><p>There are no staffing requests to display.</p></template
      >

      <Column field="vaName" header="VA Name" />
      <Column field="pilots" header="# of pilots" />
      <Column field="date" header="Date">
        <template #body="{ data }">
          {{ dateAsMMDDHHMM(data.date) }}
        </template>
      </Column>
    </DataTable>
  </template>
</template>

<style lang="css" scoped></style>
