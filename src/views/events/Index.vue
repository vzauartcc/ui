<script setup lang="ts">
import { eventService } from '@/services/events/events.service';
import type { IEvent } from '@/services/events/events.types';
import { useUserStore } from '@/stores/user.js';
import { dateAsMMDDHHMM } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { getS3Url } from '@/utils/uriHelper';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

const s3Url = getS3Url();

useTitle('Events');

const events = ref<IEvent[] | null>(null);
const archive = ref<IEvent[] | null>(null);
const totalEvents = ref(0);
const archiveLoading = ref(true);
const lazyParams = ref({ page: 1, limit: 10 });

const userStore = useUserStore();
const { isLoggedIn, user } = storeToRefs(userStore);

onMounted(async () => {
  try {
    const data = await eventService.getEvents();

    events.value = data;
  } catch (e) {
    console.error('error getting events', e);
  }

  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await eventService.getPast(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    archive.value = data.events;
    totalEvents.value = data.amount;
  } catch (e) {
    console.error('error getting past events', e);
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
  <ProgressSpinner v-if="!events" />
  <template v-else>
    <Card v-for="event in events" :key="event._id">
      <template #header>
        <img
          :src="`${s3Url}/events/${event.bannerUrl}`"
          alt="Event banner showing the date and time of the event and the airports involved." />
      </template>
      <template #title>
        <div class="flex items-center justify-between w-full">
          <span class="font-bold">
            <router-link :to="`event/${event.url}`">
              {{ event.name }}
            </router-link></span
          >
          <router-link :to="`event/${event.url}`">
            <Button
              v-if="isLoggedIn && user?.isMember"
              class=""
              label="More Info & Sign Up" />
            <Button v-else class="" label="More Info" />
          </router-link>
        </div>
      </template>
      <template #subtitle>
        <div class="text-lg">
          <span>{{ dateAsMMDDHHMM(event.eventStart) }}</span>
          <Icon icon="heroicons:paper-airplane-solid" class="mx-2 no-pointer" />
          <span>{{ dateAsMMDDHHMM(event.eventEnd) }}</span>
        </div>
      </template>
    </Card>
  </template>

  <ProgressSpinner v-if="!archive" />
  <DataTable
    v-else
    :value="archive"
    stripedRows
    size="small"
    lazy
    paginator
    :rows="10"
    :totalRecords="totalEvents"
    :loading="archiveLoading"
    :rowsPerPageOptions="[10, 25, 50]"
    @page="onPage($event)"
    class="mt-5">
    <template #header><p class="text-xl">Past Events</p></template>
    <template #empty><p>There are no events to display.</p></template>
    <Column field="name" header="Name" bodyClass="font-bold">
      <template #body="{ data }">
        <router-link :to="`event/${data.url}`">{{ data.name }}</router-link>
      </template>
    </Column>
    <Column field="start" header="Start Time">
      <template #body="{ data }">
        {{ dateAsMMDDHHMM(data.eventStart) }}
      </template>
    </Column>
  </DataTable>
</template>

<style lang="css" scoped></style>
