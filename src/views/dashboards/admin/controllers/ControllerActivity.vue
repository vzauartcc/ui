<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import { statsService } from '@/services/stats/stats.service';
import type {
  IActivityResponse,
  IControllerActivity,
} from '@/services/stats/stats.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD } from '@/utils/date';
import { secToHHMM } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import { capitalize, onMounted, ref } from 'vue';

useTitle('Controller Activity');

const userStore = useUserStore();

const activityData = ref<IActivityResponse | null>(null);
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

onMounted(async () => {
  loadData();
});

const loadData = async (period?: number, year?: number) => {
  // Reload correct period and year after roster removal
  if (!period && activityData.value) {
    period = activityData.value.activityPeriod;
  }
  if (!year && activityData.value) {
    year = activityData.value.activityYear;
  }

  try {
    const data = await statsService.getActivity(period, year);

    activityData.value = data;
  } catch (e) {
    console.error('error getting controller activity', e);
  }
};

const decrementPeriod = () => {
  if (!activityData.value) return;

  if (activityData.value.activityPeriod === 1) {
    loadData(
      activityData.value.periodData.periodsInYear,
      activityData.value.activityYear - 1,
    );
    return;
  }

  loadData(
    activityData.value.activityPeriod - 1,
    activityData.value.activityYear,
  );
};

const incrementPeriod = () => {
  if (!activityData.value) return;

  if (
    activityData.value.activityPeriod ===
    activityData.value.periodData.periodsInYear
  ) {
    loadData(1, activityData.value.activityYear + 1);
    return;
  }

  loadData(
    activityData.value.activityPeriod + 1,
    activityData.value.activityYear,
  );
};

interface IDeleteData {
  controller: IControllerActivity;
  reason: string;
  confirmed: boolean;
}

const deleteData = ref<IDeleteData>({
  controller: {} as IControllerActivity,
  reason: '',
  confirmed: false,
});
const deleteVisible = ref(false);
const deleteController = (data: IControllerActivity) => {
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
    controller: {} as IControllerActivity,
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

    loadData();
  } catch (e) {
    console.error('error removing controller', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!activityData" />
  <Card v-else>
    <template #title>Controller Activity Report</template>
    <template #content>
      <!-- @TODO: maybe add filtering of columns for like active, rating, home/vis. -->
      <DataTable
        v-model:value="activityData.activity"
        stripedRows
        size="small"
        :globalFilterFields="['name', 'cid', 'oi']"
        v-model:filters="filters">
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
                <InputIcon
                  v-if="filters['global'].value"
                  @click="filters['global'].value = null"
                  class="pointer-events-auto absolute right-3 z-10">
                  <Icon icon="heroicons:x-mark" />
                </InputIcon>
                <label for="globalSearch"
                  >Search by Name, CID, or Operating Initials</label
                >
              </IconField>
            </FloatLabel>
          </div>
          <div class="flex items-center justify-between mt-5">
            <span
              >Showing activity for
              <b
                >{{ capitalize(activityData.periodData.unit[0]!)
                }}{{ activityData.activityPeriod }}
                {{ activityData.activityYear }}</b
              >.</span
            >
            <div class="flex gap-5">
              <Button
                label="Previous Period"
                severity="danger"
                @click="decrementPeriod" />
              <Button
                label="Next Period"
                severity="success"
                @click="incrementPeriod"
                :disabled="
                  activityData.activityPeriod ===
                    activityData.periodData.currentPeriod &&
                  activityData.activityYear === new Date().getFullYear()
                " />
            </div>
          </div>
        </template>
        <template #empty>
          <p>There is no activity data at this time.</p>
        </template>
        <Column field="tooLow" header="Active?" sortable>
          <template #body="{ data }">
            <span
              class="text-red-500"
              v-if="data.tooLow === true"
              v-tooltip.top="'Does not meet Activity Requirements'">
              <Icon class="no-pointer" icon="heroicons:x-mark" />
            </span>
            <span
              class="text-green-500"
              v-else
              v-tooltip.top="'Activity Requirements Met'">
              <Icon class="no-pointer" icon="heroicons:check" />
            </span>
          </template>
        </Column>
        <Column field="name" header="Controller" sortable>
          <template #body="{ data }">
            <div class="flex justify-between">
              <span>
                {{ data.name }}
              </span>
              <span
                v-tooltip.top="
                  data.vis ? 'Visiting Controller' : 'Home Controller'
                ">
                <Icon
                  class="no-pointer"
                  :icon="data.vis ? 'heroicons:briefcase' : 'heroicons:home'" />
              </span>
            </div>
          </template>
        </Column>
        <Column field="rating" header="Rating" sortable>
          <template #body="{ data }">
            {{ data.ratingShort }}
          </template>
        </Column>
        <Column field="totalTime" header="Time" sortable>
          <template #body="{ data }">
            <span v-if="data.rating > 1">
              {{ secToHHMM(data.totalTime) }}
            </span>
          </template>
        </Column>
        <Column field="obsTime" header="OBS Time" sortable>
          <template #body="{ data }">
            <span v-if="data.rating < 2">
              {{ secToHHMM(data.obsTime) }}
            </span>
          </template>
        </Column>
        <Column field="joinDate" header="Join Date" sortable>
          <template #body="{ data }">
            {{ dateAsMMDD(data.joinDate) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          v-if="userStore.isManagement"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span
              class="text-red-500"
              @click="deleteController(data)"
              v-tooltip.top="'Remove Controller'">
              <Icon icon="heroicons:trash" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

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
</template>

<style lang="css" scoped></style>
