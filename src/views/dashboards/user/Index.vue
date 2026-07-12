<script setup lang="ts">
import { userService } from '@/services/user/user.service';
import type { IUserSessionsResponse } from '@/services/user/user.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDDHHMM } from '@/utils/date';
import { secToHHMMSS } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import StaffingRequests from './StaffingRequests.vue';

useTitle('Controller Dashboard');

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const sessionData = ref<IUserSessionsResponse | null>(null);
const activitySecs = ref(0.0);

const router = useRouter();

onMounted(async () => {
  try {
    const data = await userService.getSessions();

    sessionData.value = data;
    activitySecs.value = data.sessions.reduce((accumulator, currentObject) => {
      return (
        accumulator + calcLength(currentObject.timeStart, currentObject.timeEnd)
      );
    }, 0);
  } catch (e) {
    console.error('error getting controlling sessions', e);
  }
});

const calcLength = (startTime: string | Date, endTime: string | Date) => {
  return Math.floor(
    (new Date(endTime).getTime() - new Date(startTime).getTime()) / 1000,
  );
};

const calcRemaining = (isObs: boolean) => {
  if (!sessionData.value) return 9999;

  let needed = sessionData.value.requirements.controller.seconds;
  if (isObs) {
    needed = sessionData.value.requirements.observer.seconds;
  }

  return needed - activitySecs.value;
};

const linkDiscord = () => {
  router.push('/login/discord');
};

const unlinkDiscord = async () => {
  try {
    await userService.unlinkDiscord();

    toastSuccess(
      'Discord Account Unlink!',
      'Your Discord account has been unlinked.',
    );
  } catch (e) {
    console.error('error unlinking discord', e);

    toastError(
      'Discord Account Unlink Error!',
      'An error occurred unlinking your Discord account.',
    );
  }
};
</script>

<template>
  <Card>
    <template #title>Controller Dashboard</template>
    <template #content>
      <ProgressSpinner v-if="!sessionData" />
      <template v-else>
        <span
          >You have controlled for
          <span
            :class="{
              'font-bold': true,
              'text-red-500': calcRemaining(user!.rating === 1) > 0,
              'text-green-500': calcRemaining(user!.rating === 1) <= 0,
            }"
            >{{ secToHHMMSS(activitySecs) }}</span
          >
          this quarter.
        </span>
        <template v-if="user!.rating === 1">
          <span v-if="calcRemaining(true) > 0"
            >You need to observe for {{ secToHHMMSS(calcRemaining(true)) }} to
            meet the activity requirements for this
            {{ sessionData.period.unit }}.</span
          >
          <span v-else
            >You have met the activity requirements for this
            {{ sessionData.period.unit }}.</span
          >
        </template>
        <template v-else>
          <span v-if="calcRemaining(false) > 0"
            >You need to control for
            <b>{{ secToHHMMSS(calcRemaining(false)) }}</b> to meet the activity
            requirements for this {{ sessionData.period.unit }}.</span
          >
          <span v-else
            >You have met the activity requirements for this
            {{ sessionData.period.unit }}</span
          >
        </template>
      </template>
    </template>
  </Card>
  <Card>
    <template #title>Integrations</template>
    <template #content>
      <Button
        v-if="user!.discord ?? '' !== ''"
        severity="warn"
        @click.prevent="unlinkDiscord()">
        Unlink Discord
        <Icon icon="mdi:discord" />
      </Button>
      <Button v-else @click.prevent="linkDiscord()"
        >Link Discord <Icon icon="mdi:discord" />
      </Button>
    </template>
  </Card>
  <Card>
    <template #title>Recent Sessions</template>
    <template #content>
      <ProgressSpinner v-if="!sessionData" />
      <template v-else>
        <DataTable :value="sessionData.sessions" stripedRows size="small">
          <template #empty
            ><p>There are no recent connections to display.</p></template
          >
          <Column field="position" header="Position" />
          <Column field="timeStart" header="Sign On">
            <template #body="{ data }">
              {{ dateAsMMDDHHMM(data.timeStart) }}
            </template>
          </Column>
          <Column field="timeEnd" header="Sign Off">
            <template #body="{ data }">
              {{ dateAsMMDDHHMM(data.timeEnd) }}
            </template>
          </Column>
          <Column field="isStudent" header="Length">
            <template #body="{ data }">{{
              secToHHMMSS(calcLength(data.timeStart, data.timeEnd))
            }}</template>
          </Column>
        </DataTable>
      </template>
    </template>
  </Card>
  <Card>
    <template #title>Upcoming Staffing Requests</template>
    <template #content><StaffingRequests /></template>
  </Card>
</template>

<style lang="css" scoped>
.p-card {
  margin: 1rem 0rem;
}
</style>
