<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { IController } from '@/services/controller/controller.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD } from '@/utils/date';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import UserDetails from './admin/UserDetails.vue';

const props = defineProps<{ controllers: IController[] }>();
const route = useRoute();

const emit = defineEmits(['getControllers']);

const userStore = useUserStore();

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

interface IDeleteData {
  controller: IController;
  reason: string;
  confirmed: boolean;
}

const deleteData = ref<IDeleteData>({
  controller: {} as IController,
  reason: '',
  confirmed: false,
});
const deleteVisible = ref(false);
const deleteController = (data: IController) => {
  deleteData.value = {
    controller: data,
    reason:
      'vZAU 7210.3 5-1: Activity Requirement not met. Removed in good standing.',
    confirmed: false,
  };
  deleteVisible.value = true;
};
const closeDelete = () => {
  deleteVisible.value = false;
  deleteData.value = {
    controller: {} as IController,
    reason: '',
    confirmed: false,
  };
};

const submitDelete = async () => {
  if (!deleteData.value || !deleteData.value.confirmed) return;
  try {
    await controllerService.removeController(
      deleteData.value.controller.cid,
      deleteData.value.reason,
    );

    toastSuccess(
      'Controller Removed!',
      `${deleteData.value.controller.name} has been removed from the roster.`,
    );

    closeDelete();

    emit('getControllers');
  } catch (e) {
    console.error('error removing controller', e);
  }
};

const detailsVisible = ref(false);
const details = ref<IController | null>(null);
const showDetails = (data: IController) => {
  if (!route.path.includes('/admin/')) {
    return;
  }

  details.value = data;
  detailsVisible.value = true;
};
</script>

<template>
  <DataTable
    :value="props.controllers"
    stripedRows
    v-model:filters="filters"
    :globalFilterFields="['name', 'cid', 'oi']"
    size="small">
    <template #header>
      <div class="flex justify-end">
        <FloatLabel variant="over">
          <IconField>
            <InputIcon>
              <Icon class="no-pointer" icon="heroicons:magnifying-glass" />
            </InputIcon>
            <InputText
              v-model="filters['global'].value"
              id="globalSearch"
              placeholder="Search . . ." />
            <label for="globalSearch"
              >Search by Name, CID, or Operating Initials</label
            >
            <InputIcon
              v-if="filters['global'].value"
              @click="filters['global'].value = null"
              class="pointer-events-auto inline-flex absolute right-3 z-10">
              <Icon icon="heroicons:x-mark" />
            </InputIcon>
          </IconField>
        </FloatLabel>
      </div>
    </template>
    <template #empty>Controller not found</template>
    <Column field="name" header="Name" sortable>
      <template #body="{ data }">
        <router-link :to="`/controllers/${data.cid}`">
          <span class="font-bold">{{ data.name }} ({{ data.oi }})</span>
          <br />
          <span>{{ data.ratingLong }}</span>
        </router-link>
      </template>
    </Column>
    <Column field="vis" bodyClass="w-min" sortable class="w-min">
      <template #body="{ data }">
        <span
          class="inline-flex"
          v-tooltip.top="
            `${data.vis === false ? 'Home' : 'Visiting'} Controller`
          ">
          <Icon
            v-if="data.vis === false"
            icon="heroicons:home"
            class="no-pointer" />
          <Icon v-else icon="heroicons:briefcase" class="no-pointer" />
        </span>
      </template>
    </Column>
    <Column field="cid" sortable header="CID" />
    <Column field="joinDate" sortable header="Join Date">
      <template #body="{ data }">
        {{ dateAsMMDD(data.joinDate) }}
      </template>
    </Column>
    <Column
      field="options"
      header="Options"
      bodyClass="text-right"
      headerClass="text-right">
      <template #body="{ data }">
        <span
          v-if="route.path.includes('/admin')"
          v-tooltip.top="'View Details'"
          @click="showDetails(data)">
          <Icon icon="heroicons:magnifying-glass" />
        </span>
        <router-link
          v-if="route.path.includes('/ins/')"
          :to="`/ins/training/sessions/${data.cid}`"
          v-tooltip.top="'View Sessions'">
          <Icon icon="heroicons:document-text" />
        </router-link>

        <router-link
          :to="`/${route.path.includes('admin') ? 'admin' : 'ins'}/controllers/${data.cid}`"
          v-tooltip.top="'Edit Controller'">
          <Icon icon="heroicons:pencil" class="" />
        </router-link>
        <span
          v-tooltip.top="'Remove Controller'"
          @click="deleteController(data)"
          v-if="userStore.isManagement">
          <Icon icon="heroicons:trash" class="text-red-500" />
        </span>
      </template>
    </Column>
  </DataTable>

  <Dialog
    class="w-1/2"
    header="Remove Controller?"
    modal
    v-model:visible="deleteVisible"
    @hide="closeDelete">
    <div class="grid grid-cols-1 gap-5">
      <p>
        This will remove
        <b
          >{{ deleteData?.controller.name }} ({{
            deleteData?.controller.cid
          }})</b
        >
        from the vZAU roster. Please provide a reason below.
      </p>
      <Textarea v-model="deleteData.reason" class="w-full" />
      <div class="flex gap-3">
        <Checkbox binary v-model="deleteData.confirmed" />
        <span>Confirm roster removal.</span>
      </div>
    </div>

    <template #footer>
      <Button
        severity="danger"
        label="Remove"
        :disabled="!deleteData.confirmed"
        @click="submitDelete" />
      <Button outlined label="Cancel" @click="closeDelete" />
    </template>
  </Dialog>

  <UserDetails v-model:visible="detailsVisible" :user="details" />
</template>

<style lang="css" scoped></style>
