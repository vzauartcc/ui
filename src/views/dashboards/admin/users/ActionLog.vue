<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { IDossier } from '@/services/controller/controller.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { FilterMatchMode } from '@primevue/core/api';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, {
  type DataTableFilterEvent,
  type DataTableFilterMetaData,
  type DataTablePageEvent,
} from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import { onMounted, ref } from 'vue';

useTitle('Action Log');

const dossierItems = ref<IDossier[] | null>(null);
const lazyParams = ref({ page: 1, limit: 25, action: 0 });
const archiveLoading = ref(true);
const totalItems = ref(0);

const dossierTypes = ref<{ value: number; label: string }[]>([]);
const filters = ref({
  actionType: { value: 0, matchMode: FilterMatchMode.EQUALS },
});

onMounted(async () => {
  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await controllerService.getActionLog(
      lazyParams.value.page,
      lazyParams.value.limit,
      lazyParams.value.action,
    );

    dossierItems.value = data.dossier;
    totalItems.value = data.amount;
  } catch (e) {
    console.error('error getting action log', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.limit = event.rows;

  loadLazyArchive();
};

const onFilter = (event: DataTableFilterEvent) => {
  const target = event.filters?.actionType;

  lazyParams.value.page = 1;
  lazyParams.value.action = target
    ? (target as DataTableFilterMetaData).value
    : 0;

  loadLazyArchive();
};

onMounted(async () => {
  loadLazyArchive();

  try {
    const data = await controllerService.getActionLogTypes();

    const tmp: { value: number; label: string }[] = [];
    for (let i = 0; i < data.length; i++) {
      tmp.push({ value: i, label: data[i]! });
    }

    dossierTypes.value = tmp;
  } catch (e) {
    console.error('error getting action types', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!dossierItems || !dossierTypes" />
  <Card v-else>
    <template #title>Action Log</template>
    <template #content>
      <DataTable
        :value="dossierItems"
        stripedRows
        lazy
        paginator
        :rows="25"
        :totalRecords="totalItems"
        :loading="archiveLoading"
        :rowsPerPageOptions="[25, 50, 100]"
        v-model:filters="filters"
        @page="onPage($event)"
        @filter="onFilter($event)"
        filterDisplay="menu"
        size="small"
        currentPageReportTemplate="{first} - {last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport">
        <template #empty
          ><p>There are no action log items to display.</p></template
        >

        <Column field="createdAt" header="Date">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.createdAt) }}
          </template>
        </Column>
        <Column
          field="actionType"
          header="Action"
          :showFilterMatchModes="false">
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="dossierTypes"
              optionLabel="label"
              optionValue="value"
              filter />
          </template>
          <template #body="{ data }">
            <div
              v-html="
                data.action
                  .replaceAll('%b', `<b>${compileUsersName(data.userBy)}</b>`)
                  .replaceAll(
                    '%a',
                    `<b>${compileUsersName(data.userAffected)}</b>`,
                  )
              " />
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
