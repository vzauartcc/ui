<script setup lang="ts">
import { eventService } from '@/services/events/events.service';
import type { IEvent } from '@/services/events/events.types';
import { useUserStore } from '@/stores/user.js';
import { dateAsMMDDHHMM } from '@/utils/date';
import { truncateText } from '@/utils/text';
import { getS3Url } from '@/utils/uriHelper';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Galleria from 'primevue/galleria';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

const s3Url = getS3Url();

const events = ref<IEvent[] | null>(null);
const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);

onMounted(async () => {
  try {
    const data = await eventService.getEvents();

    events.value = data;
  } catch (e) {
    console.error('error getting upcoming events', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!events" />
  <template v-else-if="events.length > 0">
    <Galleria
      :value="events"
      :numVisibile="3"
      circular
      autoPlay
      :transitionInterval="3000"
      containerStyle="width: 100%"
      :showThumbnails="false"
      showItemNavigators>
      <template #item="{ item }">
        <img
          :src="`${s3Url}/events/${item.bannerUrl}`"
          alt="Event Banner showing the airports involved and date and time of the event."
          style="width: 100%; display: block" />
      </template>

      <template #caption="{ item }">
        <div class="flex align-items-center justify-content-between w-full">
          <div class="grow">
            <div class="text-xl mb-2 font-bold">
              {{ item.name }} {{ dateAsMMDDHHMM(item.eventStart) }} -
              {{ dateAsMMDDHHMM(item.eventEnd) }}
            </div>
            <p class="text-white">
              {{ truncateText(item.description, 100) }}
            </p>
          </div>

          <div class="ml-4 shrink-0">
            <Button
              type="button"
              as="router-link"
              :to="`/event/${item.url}`"
              :label="`More Info${isLoggedIn && user?.isMember ? ' & Sign Up' : ''}`"
              rounded />
          </div>
        </div>
      </template>
    </Galleria>
  </template>
  <template v-else>
    <p class="italic">
      There are no upcoming events at this time. Check back later!
    </p>
  </template>
</template>

<style lang="css" scoped></style>
