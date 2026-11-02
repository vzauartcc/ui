<script setup lang="ts">
import { ratingExamService } from '@/services/training/ratingExam.service';
import type { IRatingExamAttempt } from '@/services/training/ratingExam.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Rating Exam Center');

const attempts = ref<IRatingExamAttempt[] | null>(null);
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

onMounted(async () => {
  if (!user.value) return;

  try {
    const data = await ratingExamService.getOwnRatingExamAttempts(
      user.value.cid,
    );

    attempts.value = data;
  } catch (e) {
    console.error('error getting attempts', e);
  }
});

const getRowColor = (data: IRatingExamAttempt) => {
  if (data.practicalPassed && data.theoryPassed) {
    return 'bg-green-300 dark:bg-green-500/20';
  }

  return 'bg-red-300 dark:bg-red-500/20';
};
</script>

<template>
  <ProgressSpinner v-if="!attempts" />
  <Card v-else>
    <template #title>Rating Exam Center</template>
    <template #content>
      <DataTable
        v-model:value="attempts"
        stripedRows
        lazy
        filterDisplay="menu"
        size="small"
        :rowClass="getRowColor">
        <template #empty>
          <p>There are no rating exam attempts to display.</p>
        </template>
        <Column field="ratingExam" header="Exam">
          <template #body="{ data }">
            {{ data.ratingExam.name }}
          </template>
        </Column>
        <Column field="createdAt" header="Date">
          <template #body="{ data }">
            {{ dateAsMMDD(data.createdAt) }}
          </template>
        </Column>

        <Column field="status" header="Status" :showFilterMatchModes="false">
          <template #body="{ data }">
            <span v-if="data.theoryPassed && data.practicalPassed">Passed</span>
            <span v-else-if="data.theoryPassed"
              ><b>Practical Failed</b> / Theory Passed</span
            >
            <span v-else-if="data.practicalPassed"
              >Practical Passed / <b>Theory Failed</b></span
            >
            <span v-else><b>Practical Failed</b> / <b>Theory Failed</b></span>
          </template>
        </Column>

        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <router-link
              :to="`/dash/training/rating-exams/${data._id}`"
              v-tooltip.top="'View Attempt'">
              <Icon icon="heroicons:magnifying-glass" />
            </router-link>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
