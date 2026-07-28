<script setup lang="ts">
import { examService } from '@/services/exam/exam.service';
import type { IExamAttempt } from '@/services/exam/exam.types';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Exam Center');

const attempts = ref<IExamAttempt[] | null>(null);

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

onMounted(async () => {
  try {
    const data = await examService.getOwnExams(user.value!.cid);

    attempts.value = data;
  } catch (e) {
    console.error('error getting exams', e);
  }
});

const getExamStatus = (attempt: IExamAttempt) => {
  const today = new Date();
  const assignedDate = new Date(attempt.createdAt);
  const expiresDate = new Date(attempt.createdAt);
  expiresDate.setDate(assignedDate.getDate() + 31);
  switch (attempt.status) {
    case 'in_progress':
      return `In Progress (${Math.floor((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days remaining)`;
    case 'completed':
      return `Completed (${attempt.grade}%)`;
    case 'timed_out':
      return `Expired`;
    default:
      return `Pending (${Math.floor((expiresDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))} days remaining)`;
  }
};

const getRowColor = (data: IExamAttempt) => {
  if (data.status === 'completed') {
    if (data.grade >= 80) {
      return 'bg-green-300 dark:bg-green-500';
    } else {
      return 'bg-red-300 dark:bg-red-700';
    }
  } else if (data.status === 'in_progress') {
    return 'bg-yellow-500 dark:bg-yellow-700';
  } else if (data.status === 'timed_out') {
    return 'bg-red-300 dark:bg-red-700';
  }
  return '';
};
</script>

<template>
  <ProgressSpinner v-if="!attempts" />
  <Card v-else>
    <template #title>Exam Center</template>
    <template #content>
      <DataTable
        :value="attempts"
        stripedRows
        size="small"
        :rowClass="getRowColor">
        <template #empty><p>There are no attempts to display.</p></template>
        <Column field="name" header="Title">
          <template #body="{ data }">
            {{ data.exam.title }}
          </template>
        </Column>
        <Column field="milestone" header="Milestone">
          <template #body="{ data }">
            {{ data.exam.certification.name }}
          </template>
        </Column>
        <Column field="questionOrder" header="Questions (Remaining)">
          <template #body="{ data }">
            {{ data.questionOrder.length }} ({{
              data.questionOrder.length - data.responses.length
            }})
          </template>
        </Column>
        <Column field="status" header="Status">
          <template #body="{ data }">
            {{ getExamStatus(data) }}
          </template>
        </Column>
        <Column
          header="Take Exam"
          bodyClass="text-right text-2xl"
          headerClass="text-right">
          <template #body="{ data }">
            <router-link
              :to="`/dash/training/exams/${data._id}`"
              v-tooltip.top="'Take Exam'"
              v-if="!data.isComplete">
              <Icon icon="heroicons:arrow-right-end-on-rectangle" class="" />
            </router-link>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
