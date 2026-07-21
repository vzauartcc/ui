<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { eventService } from '@/services/events/events.service';
import type {
  IPosition,
  IPositions,
  ISignup,
} from '@/services/events/events.types';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import FloatLabel from 'primevue/floatlabel';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tag from 'primevue/tag';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

useTitle('Position Assignments');

const route = useRoute();
const slug =
  (Array.isArray(route.params.slug)
    ? route.params.slug[0]
    : route.params.slug) || '';

const certifications = ref<ICertification[]>([]);
const eventData = ref<IPositions | null>(null);
const controllers = ref<IFeedbackController[]>([]);

onMounted(async () => {
  try {
    const data = await controllerService.getCertifications();

    certifications.value = data;
  } catch (e) {
    console.error('error getting certifications', e);
  }

  getEventData();

  try {
    const data = await feedbackService.getControllerList();

    controllers.value = data;
  } catch (e) {
    console.error('error getting controllers', e);
  }
});

const signupData = computed(() => {
  if (!eventData.value) return [];
  const list = eventData.value.signups.map((s) => ({
    ...s,
    name: s.user ? s.user.name : 'Unassigned',
  }));
  return [{ cid: null, name: 'Unassigned' }, ...list];
});

const getEventData = async () => {
  try {
    const data = await eventService.getPositionData(slug);

    eventData.value = data;
  } catch (e) {
    console.error('error getting event data', e);
  }
};

const getCertification = (code: string) => {
  const found = certifications.value.find((c) => c.code === code);

  if (!found) return null;

  return {
    name: found.name.replaceAll(' Events', ''),
    class: found.facility,
  };
};

const deleteSignupVisible = ref(false);
const deleteSignupData = ref<ISignup | null>(null);
const loadDeleteSignup = (data: ISignup) => {
  deleteSignupData.value = data;
  deleteSignupVisible.value = true;
};
const closeDeleteSignup = () => {
  deleteSignupVisible.value = false;
  deleteSignupData.value = null;
};

const deleteSignup = async () => {
  if (!deleteSignupData.value) return;

  try {
    await eventService.manuallyDeleteSignup(slug, deleteSignupData.value.cid);

    closeDeleteSignup();
    toastSuccess('Signup Deleted!', 'Successfully deleted the signup.');
    getEventData();
  } catch (e) {
    console.error('error deleting signup', e);
  }
};

const manualSignupVisible = ref(false);
const manualSignupData = ref({ cid: 0 });
const saveManualSignup = async () => {
  if (manualSignupData.value.cid < 1) return;

  try {
    await eventService.manuallySignUp(slug, manualSignupData.value.cid);

    closeManualSignup();
    toastSuccess('Sign Up Saved!', 'Successfully saved the sign up.');
    getEventData();
  } catch (e) {
    console.error('error saving manual sign up', e);
  }
};
const closeManualSignup = () => {
  manualSignupVisible.value = false;
  manualSignupData.value = { cid: 0 };
};

const getRowColor = (data: IPosition) => {
  if (!data.takenBy) {
    return 'bg-red-100';
  }
};

const assignPosition = async (newVal: number | null, posData: IPosition) => {
  if (!eventData.value) return;

  try {
    await eventService.assignPosition(slug, posData._id, newVal);

    if (newVal) {
      toastSuccess(
        'Position Assigned!',
        `Successfully assigned the ${posData.pos} position.`,
      );
    } else {
      toastSuccess(
        'Position Unassigned'!,
        `Successfully unassigned the ${posData.pos} position.`,
      );
    }

    getEventData();
  } catch (e) {
    console.error('error assigning position', e);
  }
};

const sendEventVisible = ref(false);
const sendEvent = async () => {
  try {
    await eventService.sendEvent(slug);

    toastSuccess('Event Sent!', 'Event has been sent to the Discord channel.');
    sendEventVisible.value = false;
  } catch (e) {
    console.error('error sending event to discord', e);
  }
};

const closeSignups = async () => {
  try {
    await eventService.closeSignups(slug, false);

    eventData.value!.open = false;
  } catch (e) {
    console.error('error closing signups', e);
  }
};

const openSignups = async () => {
  try {
    await eventService.closeSignups(slug, true);

    eventData.value!.open = true;
  } catch (e) {
    console.error('error closing signups', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!eventData" />
  <Card v-else>
    <template #title
      >Position Assignments - <b>{{ eventData.name }}</b></template
    >
    <template #content>
      <DataTable :value="eventData.signups" stripedRows size="small">
        <template #header>
          <span class="text-xl flex justify-center">Signups</span>
          <div class="flex justify-between">
            <Button
              v-if="eventData.open"
              label="Close Signups"
              severity="danger"
              @click="closeSignups" />
            <Button
              v-else
              label="Open Signups"
              severity="success"
              @click="openSignups" />
            <Button label="New Signup" @click="manualSignupVisible = true" />
          </div>
        </template>

        <template #empty>
          <p>There are no sign ups for this event yet.</p>
        </template>

        <Column field="user" header="Controller">
          <template #body="{ data }">
            <router-link :to="`/controllers/${data.user.cid}`">
              <span class="font-bold">{{ data.user.name }}</span>
            </router-link>
          </template>
        </Column>
        <Column field="user.ratingShort" header="Rating" />
        <Column field="eventEndorsements" header="Event Endorsements">
          <template #body="{ data }">
            <div class="flex gap-1">
              <div
                v-for="end of data.user.certCodes.filter((e: string) =>
                  e.endsWith('e'),
                )"
                :key="end">
                <span v-if="getCertification(end)" class="inline-block">
                  <Tag
                    severity="contrast"
                    :class="getCertification(end)!.class"
                    :value="getCertification(end)!.name"
                    class="h-8 min-h-2 flex items-center justify-center text-center whitespace-nowrap" />
                </span>
              </div>
            </div>
          </template>
        </Column>
        <Column field="requests" header="Preferences">
          <template #body="{ data }">
            <Tag
              v-for="request of data.requests"
              :severity="request.includes('Any') ? 'warn' : 'info'"
              :value="request"
              :key="request"
              class="mx-1 my-1" />
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          bodyClass="text-right"
          headerClass="text-right">
          <template #body="{ data }">
            <span
              v-tooltip.top="'Delete Signup'"
              @click="loadDeleteSignup(data)">
              <Icon icon="heroicons:trash" class="text-red-500" />
            </span>
          </template>
        </Column>
      </DataTable>

      <div class="mt-10">
        <Divider />

        <DataTable
          :value="eventData.positions"
          size="small"
          :rowClass="getRowColor">
          <template #header
            ><span class="text-xl flex justify-center"
              >Assignments</span
            ></template
          >
          <template #empty>
            <p>
              There are no positions for this event. Add positions by
              <router-link :to="`/admin/events/${slug}`" class="underline"
                >editing</router-link
              >
              the event.
            </p>
          </template>
          <Column field="pos" header="Position" />
          <Column field="controller" header="Assigned Controller">
            <template #body="{ data }">
              <Select
                name="controller"
                v-model="data.takenBy"
                :options="signupData"
                optionLabel="name"
                optionValue="cid"
                filter
                :filterFields="['name', 'cid']"
                class="w-full"
                placeholder="Unassigned"
                @change="(e) => assignPosition(e.value, data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </template>
    <template #footer>
      <div class="flex justify-end items-center">
        <Button @click="sendEventVisible = true" severity="success">
          <Icon icon="mdi:discord" />
          <span>Send Event</span>
        </Button>
      </div>
    </template>
  </Card>
  <Dialog
    modal
    class="w-1/2"
    v-model:visible="deleteSignupVisible"
    header="Delete Sign Up"
    @hide="closeDeleteSignup">
    <p>
      Confirm the deletion of <b>{{ deleteSignupData?.user.name }}</b
      >'s sign up for this event.
    </p>
    <template #footer>
      <Button severity="danger" label="Delete" @click="deleteSignup" />
      <Button outlined label="Cancel" @click="closeDeleteSignup" />
    </template>
  </Dialog>

  <Dialog
    modal
    class="w-1/2"
    v-model:visible="manualSignupVisible"
    header="Manual Sign Up"
    @hide="closeManualSignup">
    <p>
      Select a controller to manually sign them up for this event. They must be
      on the roster.
    </p>
    <div class="w-full flex justify-center">
      <FloatLabel variant="on" class="w-1/2">
        <Select
          name="controller"
          v-model="manualSignupData.cid"
          :options="controllers"
          optionLabel="name"
          optionValue="cid"
          filter
          :filterFields="['name', 'cid']"
          class="w-full" />
        <label for="controller">Controller</label>
      </FloatLabel>
    </div>
    <template #footer>
      <Button label="Sign Up" @click="saveManualSignup" />
      <Button outlined label="Cancel" @click="closeManualSignup" />
    </template>
  </Dialog>

  <Dialog
    modal
    v-model:visible="sendEventVisible"
    class="w-1/2"
    header="Confirm Send Event"
    @hide="sendEventVisible = false">
    <p>
      This will send <b>{{ eventData?.name }}</b> to the Discord channel.
    </p>
    <template #footer>
      <Button @click="sendEvent" label="Send!" />
      <Button outlined label="Cancel" @click="sendEventVisible = false" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped>
:deep(.ctr) {
  background-color: var(--p-core-blue);
}

:deep(.app) {
  background-color: var(--p-sec-blue-300);
}

:deep(.twr) {
  background-color: var(--p-core-red);
}

:deep(.gnd) {
  background-color: var(--p-sec-red-300);
}
</style>
