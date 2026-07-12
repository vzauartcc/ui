<script setup lang="ts">
import { trainingService } from '@/services/training/training.service';
import type { ITrainingWaitlist } from '@/services/training/training.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD } from '@/utils/date';
import { ratingShort } from '@/utils/ratings';
import { compileUsersName } from '@/utils/text';
import { toastError, toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import { ref } from 'vue';

const props = withDefaults(
  defineProps<{
    waitlist: ITrainingWaitlist[];
    showStats?: boolean;
  }>(),
  { showStats: false },
);

const userStore = useUserStore();

const deleteVisible = ref(false);
const deleteEntry = ref<ITrainingWaitlist | null>(null);
const deleteWaitlist = (entry: ITrainingWaitlist) => {
  deleteEntry.value = entry;
  deleteVisible.value = true;
};

const doDelete = async () => {
  if (!deleteEntry.value) {
    toastError('Error Deleting Entry!', 'No entry is loaded for deletion.');
    return;
  }

  try {
    await trainingService.deleteWaitlist(deleteEntry.value._id);

    toastSuccess(
      'Waitlist Entry Deleted!',
      'Waitlist entry successfully deleted.',
    );
  } catch (e) {
    console.error('error deleting waitlist entry', e);
  } finally {
    deleteVisible.value = false;
    deleteEntry.value = null;
  }
};

const reduceAvailability = (availability: string[]) => {
  let retval = [...availability];
  if (
    availability.includes('Weekday Afternoons') &&
    availability.includes('Weekday Mornings') &&
    availability.includes('Weekday Nights')
  ) {
    retval = [
      ...retval.filter((u) => !u.includes('Weekday')),
      'Weekday Anytime',
    ];
  }

  if (
    availability.includes('Weekend Afternoons') &&
    availability.includes('Weekend Mornings') &&
    availability.includes('Weekend Nights')
  ) {
    retval = [
      ...retval.filter((u) => !u.includes('Weekend')),
      'Weekend Anytime',
    ];
  }

  if (
    availability.includes('Weekend Mornings') &&
    availability.includes('Weekday Mornings')
  ) {
    retval = [...retval.filter((u) => !u.includes('Mornings')), 'Mornings'];
  }

  if (
    availability.includes('Weekend Afternoons') &&
    availability.includes('Weekday Afternoons')
  ) {
    retval = [...retval.filter((u) => !u.includes('Afternoons')), 'Afternoons'];
  }

  if (
    availability.includes('Weekend Nights') &&
    availability.includes('Weekday Nights')
  ) {
    retval = [...retval.filter((u) => !u.includes('Nights')), 'Nights'];
  }

  if (retval.filter((x) => x.includes('Anytime')).length > 1) {
    retval = ['Anytime'];
  }

  return retval.join(', ');
};

const countAssigned = () => {
  if (props.waitlist.length === 0) return 0;

  return props.waitlist.filter((x) => x.instructorCid !== -1).length;
};

const averageWaitTime = () => {
  if (props.waitlist.length === 0) return 0;

  const assignedDocs = props.waitlist.filter(
    (d) => d.instructorCid !== -1 && d.assignedDate,
  );

  if (assignedDocs.length === 0) {
    return 0;
  }

  const totalWait = assignedDocs.reduce((sum, entry) => {
    const created = new Date(entry.createdAt).getTime();
    const assigned = new Date(entry.assignedDate).getTime();
    return sum + (assigned - created);
  }, 0);

  const avgMs = totalWait / assignedDocs.length;

  const avgDays = avgMs / (1000 * 60 * 60 * 24);

  return avgDays.toFixed(1);
};

const longestWait = () => {
  if (props.waitlist.length === 0) return '';

  const doc = props.waitlist
    .filter((w) => w.instructorCid === -1)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )[0];

  if (doc) {
    return compileUsersName(doc.student);
  }
  return '';
};

const busiestMilestone = () => {
  if (props.waitlist.length === 0) return '';

  const certCodeCounts = props.waitlist.reduce(
    (acc: Record<string, number>, doc) => {
      const code = doc.certification.name;
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    },
    {},
  );

  let maxCount = -1;
  let mostFrequentCode = null;

  for (const [code, count] of Object.entries(certCodeCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCode = code;
    }
  }

  return mostFrequentCode;
};

const busiestInstructor = () => {
  if (props.waitlist.length === 0) return '';

  const assignedDocs = props.waitlist.filter((doc) => doc.instructorCid !== -1);

  if (assignedDocs.length === 0) {
    return null;
  }

  const instructorCounts = assignedDocs.reduce(
    (acc: Record<string, number>, doc) => {
      const id = compileUsersName(doc.instructor);
      acc[id] = (acc[id] || 0) + 1;
      return acc;
    },
    {},
  );

  let maxCount = -1;
  let busiestId = null;

  for (const [idString, count] of Object.entries(instructorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      busiestId = idString; // Convert key back to number
    }
  }
  return busiestId;
};

const averageInstructorLoad = () => {
  if (props.waitlist.length === 0) return 0;

  const assignedDocs = props.waitlist.filter((doc) => doc.instructorCid !== -1);
  const totalAssignedDocuments = assignedDocs.length;

  if (totalAssignedDocuments === 0) {
    return 0;
  }

  const uniqueInstructorCids = new Set();
  assignedDocs.forEach((doc) => {
    uniqueInstructorCids.add(doc.instructorCid);
  });

  const numberOfUniqueInstructors = uniqueInstructorCids.size;

  if (numberOfUniqueInstructors === 0) {
    return 0;
  }

  const averageLoad = totalAssignedDocuments / numberOfUniqueInstructors;

  return Number(averageLoad.toFixed(1));
};
</script>

<template>
  <DataTable :value="waitlist" stripedRows size="small">
    <template #header>
      <p v-if="!userStore.isTrainingStaff">
        The training waitlist <b>is not</b> processed in any particular order.
        Students are assigned an instructor based on availability matches and
        requested endorsement.
      </p>
    </template>
    <template #empty v-if="!props.showStats"
      ><p>This waitlist is currently empty.</p></template
    >
    <Column field="student" header="Student">
      <template #body="{ data }">
        {{ compileUsersName(data.student) }} ({{
          ratingShort[data.student.rating]
        }})
      </template>
    </Column>
    <Column field="instructor" header="Instructor">
      <template #body="{ data }">
        <span v-if="data.instructor">
          {{ compileUsersName(data.instructor) }}
        </span>
      </template>
    </Column>
    <Column field="certCode" header="Milestone">
      <template #body="{ data }">
        {{ data.certification.name }}
      </template>
    </Column>
    <Column field="createdAt" header="Entry Date">
      <template #body="{ data }">
        {{ dateAsMMDD(data.createdAt) }}
      </template>
    </Column>
    <Column
      field="availability"
      header="Availability"
      v-if="userStore.isTrainingStaff">
      <template #body="{ data }">
        {{ reduceAvailability(data.availability) }}
      </template>
    </Column>
    <Column
      field="options"
      header="Options"
      v-if="userStore.isSeniorStaff"
      headerClass="text-right"
      bodyClass="text-right">
      <template #body="{ data }">
        <span v-if="data.notes" v-tooltip.top="data.notes">
          <Icon icon="heroicons:document" class="no-pointer" />
        </span>
        <router-link
          :to="`/ins/waitlist/${data._id}`"
          v-tooltip.top="'Edit Waitlist Entry'">
          <Icon icon="heroicons:pencil-square" class="" />
        </router-link>
        <span v-tooltip.top="'Delete Waitlist Entry'">
          <Icon
            icon="heroicons:trash"
            class="text-red-500"
            @click.prevent="deleteWaitlist(data)" />
        </span>
      </template>
    </Column>
    <template #footer v-if="showStats">
      <div class="grid grid-cols-2 w-max gap-x-2">
        <span>Total Entries:</span>
        <span>{{ waitlist.length }}</span>
        <span>Assigned:</span>
        <span>
          {{ countAssigned() }} /
          {{ Math.round((countAssigned() / waitlist.length) * 100) }}%</span
        >
        <span>Average Wait:</span>
        <span>{{ averageWaitTime() }} days</span>
        <span>Longest Wait:</span>
        <span>{{ longestWait() }}</span>
        <span>Busiest Milestone:</span>
        <span>{{ busiestMilestone() }}</span>
        <span>Busiest Instructor:</span>
        <span>{{ busiestInstructor() }}</span>
        <span>Average INS Load:</span>
        <span>{{ averageInstructorLoad() }} students</span>
      </div>
    </template>
  </DataTable>

  <Dialog v-model:visible="deleteVisible" modal header="Delete Waitlist Entry">
    <p>
      Confirm the deletion of
      <b>{{ compileUsersName(deleteEntry?.student) }}</b
      >'s waitlist entry for <b>{{ deleteEntry?.certification.name }}</b
      >.
    </p>
    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="Cancel" @click="deleteVisible = false" outlined />
        <Button
          severity="danger"
          label="Delete Entry"
          @click.prevent="doDelete()" />
      </div>
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
