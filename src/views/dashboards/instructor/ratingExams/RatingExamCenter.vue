<script setup lang="ts">
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { ratingExamService } from '@/services/training/ratingExam.service';
import type {
  IRatingExam,
  IRatingExamAttempt,
} from '@/services/training/ratingExam.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import { FilterMatchMode } from '@primevue/core/api';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import type {
  DataTableFilterMetaData,
  DataTablePageEvent,
} from 'primevue/datatable';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { onMounted, ref } from 'vue';

useTitle('Rating Exam Center');
const userStore = useUserStore();

interface GenericFilter {
  name: string;
  value: string | number;
}

const ratingExams = ref<IRatingExam[] | null>(null);

const ratingExamAttempts = ref<IRatingExamAttempt[] | null>(null);
const archiveLoading = ref(true);
const totalSessions = ref(0);

const ratingExamFilterOptions = ref<GenericFilter[]>([]);
const studentFilter = ref<GenericFilter[]>([]);

interface ExamFilters {
  ratingExam: DataTableFilterMetaData;
  student: DataTableFilterMetaData;
  [key: string]: DataTableFilterMetaData;
}
const filters = ref<ExamFilters>({
  ratingExam: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  student: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const lazyParams = ref({ page: 1, rows: 10, filters: filters.value });

const studentList = ref<IFeedbackController[]>([]);

onMounted(async () => {
  try {
    const data = await ratingExamService.getRatingExams();

    ratingExams.value = data;
  } catch (e) {
    console.error('error getting rating exams', e);
  }

  try {
    const data = await feedbackService.getControllerList();

    studentList.value = data;
  } catch (e) {
    console.error('error getting student list', e);
  }

  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await ratingExamService.getRatingExamAttempts(
      lazyParams.value.page,
      lazyParams.value.rows,
      lazyParams.value.filters.ratingExam.value || '',
      lazyParams.value.filters.student.value || 0,
    );

    ratingExamAttempts.value = data.attempts;
    totalSessions.value = data.amount;
    studentFilter.value = data.students.map((s) => ({
      name: s.student!.name,
      value: s.student.cid,
    }));

    ratingExamFilterOptions.value = data.attempts.map((a) => ({
      name: a.ratingExam?.name || '',
      value: a.ratingExamId,
    }));
  } catch (e) {
    console.error('error getting rating exam attempts', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.rows = event.rows;

  loadLazyArchive();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const onFilter = (event: any) => {
  lazyParams.value = event;

  lazyParams.value.page = 0;

  loadLazyArchive();
};

const getRowColor = (data: IRatingExamAttempt) => {
  if (data.practicalPassed && data.theoryPassed) {
    return 'bg-green-300 dark:bg-green-500/20';
  }

  return 'bg-red-300 dark:bg-red-500/20';
};

const canEdit = (data: IRatingExamAttempt) => {
  const now = Date.now();
  const created = new Date(data.createdAt).getTime();

  return now < created + 1000 * 60 * 60 * 24;
};
</script>

<template>
  <ProgressSpinner v-if="!ratingExams" />

  <Card v-else>
    <template #title>Rating Exam Center</template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Rating Exam Attempts</Tab>
          <Tab value="1">Rating Exams</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <DataTable
              v-model:value="ratingExamAttempts"
              stripedRows
              lazy
              paginator
              :rows="10"
              :totalRecords="totalSessions"
              :loading="archiveLoading"
              :rowsPerPageOptions="[10, 20, 50]"
              @page="onPage($event)"
              v-model:filters="filters"
              filterDisplay="menu"
              @filter="onFilter($event)"
              size="small"
              currentPageReportTemplate="{first} - {last} of {totalRecords}"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
              :rowClass="getRowColor">
              <template #empty>
                <p>There are no rating exam attempts to display.</p>
              </template>
              <Column
                field="studentCid"
                header="Student"
                :showFilterMatchModes="false">
                <template #filter="{ filterModel }">
                  <Select
                    v-model="filterModel.value"
                    :options="studentFilter"
                    placeholder="Select Student"
                    optionLabel="name"
                    optionValue="value"
                    filter
                    :filterFields="['name', 'value']" />
                </template>
                <template #body="{ data }">{{
                  compileUsersName(data.student)
                }}</template>
              </Column>
              <Column
                field="ratingExamId"
                header="Exam"
                :showFilterMatchModes="false">
                <template #filter="{ filterModel }">
                  <Select
                    v-model="filterModel.value"
                    :options="ratingExamFilterOptions"
                    placeholder="Select Exam"
                    optionLabel="name"
                    optionValue="value"
                    filter />
                </template>
                <template #body="{ data }">
                  {{ data.ratingExam.name }}
                </template>
              </Column>
              <Column field="createdAt" header="Date">
                <template #body="{ data }">
                  {{ dateAsMMDD(data.createdAt) }}
                </template>
              </Column>

              <Column
                field="status"
                header="Status"
                :showFilterMatchModes="false">
                <template #body="{ data }">
                  <span v-if="data.theoryPassed && data.practicalPassed"
                    >Passed</span
                  >
                  <span v-else-if="data.theoryPassed"
                    ><b>Practical Failed</b> / Theory Passed</span
                  >
                  <span v-else-if="data.practicalPassed"
                    >Practical Passed / <b>Theory Failed</b></span
                  >
                  <span v-else
                    ><b>Practical Failed</b> / <b>Theory Failed</b></span
                  >
                </template>
              </Column>

              <Column
                field="options"
                header="Options"
                headerClass="text-right"
                bodyClass="text-right">
                <template #body="{ data }">
                  <router-link
                    v-if="canEdit(data)"
                    :to="`/ins/rating-exams/attempt/${data._id}`"
                    v-tooltip.top="'Edit Attempt'"
                    ><Icon icon="heroicons:pencil"
                  /></router-link>
                  <router-link
                    :to="`/ins/rating-exams/attempt/view/${data._id}`"
                    v-tooltip.top="'View Attempt'">
                    <Icon icon="heroicons:magnifying-glass" />
                  </router-link>
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="1">
            <DataTable v-model:value="ratingExams" stripedRows size="small">
              <template #header>
                <div class="flex justify-between">
                  <router-link to="/ins/rating-exams/new">
                    <Button>
                      <Icon icon="heroicons:plus" class="icon-with-text" />
                      <span>Create Rating Exam</span>
                    </Button>
                  </router-link>
                  <router-link to="/ins/rating-exams/attempt/new">
                    <Button label="Start Assessment" severity="success" />
                  </router-link>
                </div>
              </template>
              <template #empty>
                <p>There are no rating exams to display.</p>
              </template>

              <Column field="name" header="Name" />
              <Column field="user" header="Modified By">
                <template #body="{ data }">
                  {{ compileUsersName(data.user) }}
                </template>
              </Column>
              <Column field="certification" header="Milestone">
                <template #body="{ data }">
                  {{ data.certification.name }}
                </template>
              </Column>
              <Column field="isActive" header="Active">
                <template #body="{ data }">
                  {{ data.isActive ? 'Active' : 'Inactive' }}
                </template>
              </Column>
              <Column
                field="options"
                header="Options"
                headerClass="text-right"
                bodyClass="text-right">
                <template #body="{ data }">
                  <router-link
                    :to="`/ins/rating-exams/${data._id}`"
                    v-tooltip.top="'Edit Rating Exam'"
                    v-if="userStore.isSeniorStaff || userStore.hasRoles('ia')">
                    <Icon icon="heroicons:pencil" />
                  </router-link>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
