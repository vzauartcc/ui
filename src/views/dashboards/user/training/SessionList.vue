<script setup lang="ts">
import { trainingService } from '@/services/training/training.service';
import type { ITrainingSession } from '@/services/training/training.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import Card from 'primevue/card';
import Column from 'primevue/column';
import type { DataTablePageEvent } from 'primevue/datatable';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Past Training Sessions');

const sessions = ref<ITrainingSession[] | null>(null);
const lazyParams = ref({ page: 1, limit: 10 });
const archiveLoading = ref(true);
const totalItems = ref(0);

onMounted(async () => {
  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await trainingService.getOwnSessions(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    sessions.value = data.sessions;
    totalItems.value = data.count;
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
  <ProgressSpinner v-if="!sessions" />
  <Card v-else>
    <template #title>Completed Sessions</template>
    <template #content>
      <DataTable
        :value="sessions"
        stripedRows
        size="small"
        lazy
        paginator
        :rows="10"
        :totalRecords="totalItems"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 25, 50]"
        @page="onPage($event)"
        currentPageReportTemplate="{first} - {last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport">
        <template #empty
          ><p>You do not have any training sessions on file.</p></template
        >
        <Column field="startTime" header="Start Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.startTime) }}
          </template>
        </Column>
        <Column field="endTime" header="End Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.endTime) }}
          </template>
        </Column>
        <Column field="milestone" header="Milestone">
          <template #body="{ data }">
            {{ data.milestone.name }}
          </template>
        </Column>
        <Column field="instructor" header="Instructor">
          <template #body="{ data }">
            {{ compileUsersName(data.instructor) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <router-link :to="`/dash/training/session/${data._id}`">
              <Icon icon="heroicons:magnifying-glass" cursor="pointer" />
            </router-link>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
