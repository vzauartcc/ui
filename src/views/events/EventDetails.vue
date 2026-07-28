<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue';
import SignupDialog from '@/components/split/PositionSignup.vue';
import { eventService } from '@/services/events/events.service';
import type { IEvent, IPositions } from '@/services/events/events.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDDHHMM } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { getS3Url } from '@/utils/uriHelper';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const s3Url = getS3Url();

useTitle('Event Details');

const route = useRoute();

const eventData = ref<IEvent | null>(null);
const positions = ref<IPositions | null>(null);
const signupVisible = ref(false);

const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);

const isSignedUp = computed(() =>
  positions.value?.signups.some((s) => s.cid === user.value?.cid),
);
const isAssignedPosition = computed(() =>
  positions.value?.positions.some((p) => p.takenBy === user.value?.cid),
);
const slug =
  (Array.isArray(route.params.slug)
    ? route.params.slug[0]
    : route.params.slug) || '';

onMounted(async () => {
  await getEvent();
});

const getEvent = async () => {
  try {
    const data = await eventService.getEvent(slug);

    eventData.value = data;

    useTitle(data.name);

    const posData = await eventService.getPositionData(slug);

    posData.positions = [...posData.positions].sort((a, b) => {
      const v1 = a.code;
      const v2 = b.code;

      const order: Record<string, number> = {
        zau: 1,
        ordapp: 2,
        app: 3,
        dep: 4,
        ordtwr: 5,
        mdwtwr: 6,
        twr: 7,
        ordgnd: 8,
        mdwgnd: 9,
        gnd: 10,
        orddel: 11,
        mdwdel: 12,
        del: 13,
      };

      return order[v1]! < order[v2]! ? -1 : order[v1]! > order[v2]! ? 1 : 0;
    });

    positions.value = posData;
  } catch (e) {
    console.error('error getting event data', e);
  }
};

const removeSignup = async () => {
  if (!eventData.value) return;

  try {
    await eventService.deleteSignup(eventData.value.url);

    toastSuccess('Event signup removed!', 'Your signup has been deleted.');

    getEvent();
  } catch (e) {
    console.error('Error deleting signup request', e);
  }
};

const isEventInPast = () => {
  if (!eventData.value) return false;

  return Date.now() > new Date(eventData.value.eventEnd).getTime();
};

const reloadEventData = async () => {
  signupVisible.value = false;

  getEvent();
};
</script>

<template>
  <ProgressSpinner v-if="!eventData" />
  <template v-else>
    <Card>
      <template #header>
        <img
          :src="`${s3Url}/events/${eventData.bannerUrl}`"
          alt="Event banner with the event name, start and end times, and involved airports or ARTCCs." />
      </template>
      <template #title>
        <span class="font-bold">{{ eventData.name }}</span>
      </template>
      <template #subtitle>
        <span>{{ dateAsMMDDHHMM(eventData.eventStart) }}</span>
        <Icon icon="heroicons:paper-airplane-solid" class="mx-2 no-pointer" />
        <span>{{ dateAsMMDDHHMM(eventData.eventEnd) }}</span>
      </template>
      <template #content>
        <p>{{ eventData.description }}</p>
      </template>
    </Card>

    <Card>
      <template #title>Positions</template>
      <template #content>
        <ProgressSpinner v-if="!positions" />
        <template v-else-if="!isLoggedIn">
          <p>
            Please log in with your VATSIM account to see the available
            positions for this event.
          </p>
          <LoginButton />
        </template>
        <DataTable
          v-else
          :value="positions.positions"
          rowGroupMode="subheader"
          groupRowsBy="type"
          stripedRows
          size="small">
          <template #header>
            <template v-if="user?.isMember">
              <SignupDialog
                v-model:visible="signupVisible"
                :event="eventData"
                :positions="positions.positions"
                :signups="positions.signups"
                :cid="user?.cid"
                @signedUp="reloadEventData" />

              <Button
                v-if="positions.open && !isSignedUp && !isEventInPast()"
                label="Sign up"
                @click.prevent="signupVisible = true" />

              <Button
                v-else-if="
                  positions.open &&
                  isSignedUp &&
                  !isAssignedPosition &&
                  !isEventInPast()
                "
                label="Remove signup"
                @click.prevent="removeSignup" />

              <Message
                severity="warn"
                v-if="isSignedUp && !isAssignedPosition && !isEventInPast()"
                class="mt-2">
                You have signed up for
                <pre class="inline-flex">{{
                  positions.signups
                    .find((p) => p.cid === user?.cid)
                    ?.requests.join(', ')
                }}</pre>
                . The Events Coordinator has not yet assigned you a position.
                Check back soon!
              </Message>

              <p class="" v-if="!isEventInPast() && positions.open === false">
                Sign ups are no longer open for this event. Please reach out to
                the Events Coordinator with any questions or concerns.
              </p>

              <Message
                severity="success"
                v-if="isAssignedPosition"
                class="mt-2">
                You have been assigned a position. If you are unable to attend
                the event, please let the Events Coordinator know as soon as
                possible.
              </Message>
            </template>
            <p class="font-bold" v-if="!isEventInPast()">
              Position assignments are subject to change, including up to the
              start of the event. Please refer to vZAU GP001 for more
              information on event position assignments.
            </p>

            <Message
              severity="error"
              v-if="!!eventData.requiresEventEndorsement"
              class="mt-2">
              This event requires an
              <b
                class="help-text"
                v-tooltip="`Event endorsements are defined in vZAU 3210.4`"
                >Event endorsement</b
              >
              for one or more positions.
            </Message>
          </template>

          <template #empty
            ><p>There are no positions for this event yet.</p></template
          >

          <template #groupheader="{ data }">
            <div class="font-bold">
              {{ data.type }}
            </div>
          </template>
          <Column field="type" header="Position Type" :colspan="2" />

          <Column field="pos">
            <template #body="{ data }">
              <span :class="{ 'font-bold': data.takenBy === user?.cid }">{{
                data.pos
              }}</span>
            </template>
          </Column>

          <Column field="takenBy">
            <template #body="{ data }">
              <span
                v-if="data.takenBy"
                :class="{ 'font-bold': data.takenBy === user?.cid }"
                >{{ data.user.name }}</span
              >
              <span v-else>Available</span>
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </template>
</template>

<style lang="css" scoped></style>
