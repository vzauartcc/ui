<script setup lang="ts">
import type { IDocument, IDownload } from '@/services/files/files.types';
import { dateAsMMDD } from '@/utils/date';
import { Icon } from '@iconify/vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import { capitalize, ref } from 'vue';

const props = defineProps<{
  items: IDocument[] | IDownload[] | null;
  type: 'document' | 'download';
}>();

const emit = defineEmits(['loadDelete']);

const categoryFilter = ref([
  { name: 'Agreements', value: 'loa' },
  { name: 'Reference', value: 'misc' },
  { name: 'Instructor Reference', value: 'ins' },
  { name: 'Policies', value: 'policy' },
  { name: 'Procedures', value: 'sop' },
  { name: 'Instructor', value: 'training' },
  { name: 'Facility Files', value: 'sectorFiles' },
]);

const categoryName = (id: string) => {
  switch (id) {
    case 'loa':
      return 'Agreements';
    case 'misc':
    case 'ins':
      return 'Reference';
    case 'policy':
      return 'Policies';
    case 'sop':
      return 'Procedures';
    case 'training':
      return 'Instructor';
    case 'sectorFiles':
      return 'Facility Files';
    default:
      return 'Unknown Category';
  }
};

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  category: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const loadDelete = (data: IDownload | IDocument) => {
  emit('loadDelete', data);
};
</script>

<template>
  <ProgressSpinner v-if="!items" />
  <Card v-else>
    <template #title>{{ capitalize(props.type) }}s</template>
    <template #content>
      <DataTable
        :value="items"
        stripedRows
        size="small"
        :globalFilterFields="['name', 'fileName']"
        v-model:filters="filters"
        filterDisplay="menu">
        <template #empty
          ><p>
            There are no {{ props.type }}s to display at this time.
          </p></template
        >

        <template #header>
          <div class="flex justify-between items-center">
            <div class="">
              <router-link :to="`/admin/files/${props.type}s/new`">
                <Button :label="`New ${capitalize(props.type)}`" />
              </router-link>
            </div>
            <FloatLabel variant="over">
              <IconField>
                <InputIcon>
                  <Icon class="no-pointer" icon="heroicons:magnifying-glass" />
                </InputIcon>
                <InputText
                  v-model="filters['global'].value"
                  id="globalSearch"
                  placeholder="Search . . ." />
                <InputIcon
                  v-if="filters['global'].value"
                  @click="filters['global'].value = null"
                  class="pointer-events-auto inline-flex absolute right-3 z-10 text-red-500">
                  <Icon icon="heroicons:x-mark" />
                </InputIcon>
                <label for="globalSearch">Search by Name or File Name</label>
              </IconField>
            </FloatLabel>
          </div>
        </template>
        <Column field="name" header="Name" />
        <Column
          field="category"
          header="Category"
          :showFilterMatchModes="false">
          <template #filter="{ filterModel }">
            <Select
              v-model="filterModel.value"
              :options="categoryFilter"
              optionLabel="name"
              optionValue="value"
              placeholder="Select Category" />
          </template>
          <template #body="{ data }">
            {{ categoryName(data.category) }}
          </template>
        </Column>
        <Column field="updatedAt" header="Last Updated">
          <template #body="{ data }">
            {{ dateAsMMDD(data.updatedAt) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          bodyClass="text-right"
          headerClass="text-right">
          <template #body="{ data }">
            <router-link
              :to="`/admin/files/${props.type}s/${props.type === 'document' ? data.slug : data._id}`"
              v-tooltip.top="`Edit ${capitalize(props.type)}`">
              <Icon icon="heroicons:pencil" />
            </router-link>
            <span
              @click="loadDelete(data)"
              class="text-red-500"
              v-tooltip.top="`Delete ${capitalize(props.type)}`">
              <Icon icon="heroicons:trash" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
