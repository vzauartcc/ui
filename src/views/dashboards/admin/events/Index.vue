<script setup lang="ts">
import { eventService } from '@/services/events/events.service';
import type { IEvent } from '@/services/events/events.types';
import { staffingRequestService } from '@/services/staffingRequest/staffingRequest.service';
import type { IStaffingRequest } from '@/services/staffingRequest/staffingRequest.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Event Management');

const events = ref<IEvent[] | null>(null);

const staffingRequests = ref<IStaffingRequest[] | null>(null);
const totalStaffingRequests = ref(0);
const staffingRequestsLoading = ref(true);
const lazyStaffingRequestParams = ref({ page: 1, limit: 10 });

const pastEvents = ref<IEvent[] | null>(null);
const totalPast = ref(0);
const archiveLoading = ref(true);
const lazyPastParams = ref({ page: 1, limit: 10 });

onMounted(async () => {
  loadLazyArchive();
  loadLazyStaffingRequests();
  loadEvents();
});

const loadEvents = async () => {
  try {
    const data = await eventService.getEvents();

    events.value = data;
  } catch (e) {
    console.error('error getting upcoming events', e);
  }
};

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await eventService.getPast(
      lazyPastParams.value.page,
      lazyPastParams.value.limit,
    );

    pastEvents.value = data.events;
    totalPast.value = data.amount;
  } catch (e) {
    console.error('error getting past events', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPastPage = (event: DataTablePageEvent) => {
  lazyPastParams.value.page = event.page + 1;
  lazyPastParams.value.limit = event.rows;

  loadLazyArchive();
};

const loadLazyStaffingRequests = async () => {
  staffingRequestsLoading.value = true;

  try {
    const data = await staffingRequestService.getAllRequests(
      lazyStaffingRequestParams.value.page,
      lazyStaffingRequestParams.value.limit,
    );

    staffingRequests.value = data.requests;
    totalStaffingRequests.value = data.amount;
  } catch (e) {
    console.error('error getting staffing requests', e);
  } finally {
    staffingRequestsLoading.value = false;
  }
};

const onStaffingPage = (event: DataTablePageEvent) => {
  lazyPastParams.value.page = event.page + 1;
  lazyPastParams.value.limit = event.rows;

  loadLazyArchive();
};

const eventDeleteData = ref<IEvent | null>(null);
const eventDeleteVisible = ref(false);
const loadEventDelete = (data: IEvent) => {
  eventDeleteData.value = data;
  eventDeleteVisible.value = true;
};
const closeEventDelete = () => {
  eventDeleteVisible.value = false;
  eventDeleteData.value = null;
};
const deleteEvent = async () => {
  if (!eventDeleteData.value) return;

  try {
    await eventService.deleteEvent(eventDeleteData.value.url);

    toastSuccess('Event Delete', 'The event has been successfully deleted.');

    loadEvents();
    closeEventDelete();
  } catch (e) {
    console.error('error deleting event', e);
  }
};

const staffingDeleteData = ref<IStaffingRequest | null>(null);
const staffingDeleteVisible = ref(false);
const loadStaffDelete = (data: IStaffingRequest) => {
  staffingDeleteData.value = data;
  staffingDeleteVisible.value = true;
};
const closeStaffingDelete = () => {
  staffingDeleteVisible.value = false;
  staffingDeleteData.value = null;
};
const deleteStaffingRequest = async () => {
  if (!staffingDeleteData.value) return;

  try {
    await staffingRequestService.deleteRequest(staffingDeleteData.value._id);

    toastSuccess('Request Deleted!', 'The staffing request has been deleted.');
    loadLazyStaffingRequests();

    closeStaffingDelete();
  } catch (e) {
    console.error('error deleting staffing request', e);
  }
};

const isInPast = (date?: Date | string) => {
  if (!date) return false;

  return Date.now() > new Date(date).getTime();
};
</script>

<template>
  <ProgressSpinner v-if="!events" />
  <Card v-else>
    <template #title>Upcoming Events</template>
    <template #content>
      <DataTable :value="events" stripedRows size="small">
        <template #header>
          <div class="flex justify-end">
            <router-link to="/admin/events/new">
              <Button label="New Event" />
            </router-link>
          </div>
        </template>
        <template #empty>
          <p>There are no events to display at this time</p>
        </template>
        <Column field="name" header="Name" />
        <Column field="eventStart" header="Date & Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.eventStart) }}
          </template>
        </Column>
        <Column
          field="options"
          header="options"
          headerClass="text-right"
          bodyClass="justify-end flex gap-1">
          <template #body="{ data }">
            <router-link
              v-tooltip.top="'Edit Event'"
              :to="`/admin/events/${data.url}`">
              <Icon icon="heroicons:pencil" />
            </router-link>
            <router-link
              v-tooltip.top="'Assign Positions'"
              :to="`/admin/events/assign/${data.url}`">
              <Icon icon="heroicons:users-solid" />
            </router-link>
            <span v-tooltip.top="'Delete Event'">
              <Icon
                icon="heroicons:trash"
                class="text-red-500"
                @click="loadEventDelete(data)" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <ProgressSpinner v-if="!staffingRequests" />
  <Card v-else>
    <template #title>Staffing Requests</template>
    <template #content>
      <DataTable
        :value="staffingRequests"
        stripedRows
        size="small"
        lazy
        paginator
        :rows="10"
        :totalRecords="totalStaffingRequests"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onStaffingPage($event)">
        <template #empty>
          <p>There are no staffing requests to display.</p>
        </template>
        <Column field="vaName" header="VA Name" />
        <Column field="name" header="Requestor" />
        <Column field="date" header="Date">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.date) }}
          </template>
        </Column>
        <Column field="pilots" header="# of Pilots" />
        <Column
          field="accepted"
          header="Visible to Users"
          headerClass="flex justify-center">
          <template #body="{ data }">
            <span class="flex justify-center">
              <Icon
                :icon="`heroicons:${data.accepted ? 'check' : 'x-mark'}`"
                class="no-pointer text-2xl!"
                :class="{
                  'text-red-500': !data.accepted,
                  'text-green-500': data.accepted,
                }" />
            </span>
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="justify-end flex gap-1">
          <template #body="{ data }">
            <router-link
              v-if="!isInPast(data.date)"
              v-tooltip.top="'Edit Request'"
              :to="`/admin/events/requests/${data._id}`">
              <Icon icon="heroicons:pencil" />
            </router-link>
            <span
              v-tooltip.top="'Delete Request'"
              @click="loadStaffDelete(data)">
              <Icon icon="heroicons:trash" class="text-red-500" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <ProgressSpinner v-if="!pastEvents" />
  <Card v-else>
    <template #title>Past Events</template>
    <template #content>
      <DataTable
        :value="pastEvents"
        stripedRows
        size="small"
        lazy
        paginator
        :rows="10"
        :totalRecords="totalPast"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPastPage($event)">
        <template #empty>
          <p>There are no past events to display.</p>
        </template>

        <Column field="name" header="Name" />
        <Column field="eventStart" header="Date & Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.eventStart) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <router-link
              :to="`/admin/events/${data.url}`"
              v-tooltip.top="'Edit Event'">
              <Icon icon="heroicons:pencil" />
            </router-link>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    modal
    v-model:visible="eventDeleteVisible"
    class="w-1/2"
    header="Confirm Deleteion"
    @hide="closeEventDelete">
    <p>
      Confirm the deletion of the <b>{{ staffingDeleteData?.vaName }}</b> event.
    </p>
    <template #footer>
      <Button severity="danger" @click="deleteEvent" label="Delete" />
      <Button outlined @click="closeEventDelete" label="Cancel" />
    </template>
  </Dialog>

  <Dialog
    modal
    v-model:visible="staffingDeleteVisible"
    class="w-1/2"
    header="Confirm Deleteion"
    @hide="closeStaffingDelete">
    <p>
      Confirm the deletion of <b>{{ staffingDeleteData?.vaName }}</b
      >'s staffing request.
    </p>
    <template #footer>
      <Button severity="danger" @click="deleteStaffingRequest" label="Delete" />
      <Button outlined @click="closeStaffingDelete" label="Cancel" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped>
.p-card + .p-card {
  margin: 1rem 0;
}
</style>
