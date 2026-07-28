<script setup lang="ts">
import { trainingService } from '@/services/training/training.service';
import type { ISessionByCIDResponse } from '@/services/training/training.types';
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
import { useRoute } from 'vue-router';

useTitle('Training Sessions');

const route = useRoute();

const sessionData = ref<ISessionByCIDResponse | null>(null);
const lazyParams = ref({ page: 1, limit: 10 });
const archiveLoading = ref(true);
const totalSessions = ref(0);
const cid = Array.isArray(route.params.cid)
  ? route.params.cid[0]
  : route.params.cid;

onMounted(async () => {
  loadLazyArchive();
});

const loadLazyArchive = async () => {
  if (!cid) return;

  archiveLoading.value = true;

  try {
    const data = await trainingService.getSessionsByCID(
      lazyParams.value.page,
      lazyParams.value.limit,
      cid,
    );

    sessionData.value = data;
    totalSessions.value = data.count;

    useTitle(`${compileUsersName(data.controller)} - Sessions`);
  } catch (e) {
    console.error('error getting user training sessions', e);
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
  <ProgressSpinner v-if="!sessionData" />
  <Card v-else>
    <template #title>Training Sessions - {{ sessionData.controller }}</template>
    <template #content>
      <DataTable
        :value="sessionData.sessions"
        stripedRows
        lazy
        paginator
        :rows="10"
        :totalRecords="totalSessions"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage($event)"
        size="small"
        currentPageReportTemplate="{first} - {last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport">
        <template #empty
          ><p>There are no training records to display</p></template
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
            <router-link
              :to="`/ins/training/session/${data._id}`"
              v-tooltip.top="'Session Details'">
              <Icon icon="heroicons:magnifying-glass" />
            </router-link>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
