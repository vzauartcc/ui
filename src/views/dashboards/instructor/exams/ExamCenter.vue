<script setup lang="ts">
import { examService } from '@/services/exam/exam.service';
import type { IExam, IExamAttempt } from '@/services/exam/exam.types';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import { FilterMatchMode } from '@primevue/core/api';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import type {
  DataTableFilterMetaData,
  DataTablePageEvent,
} from 'primevue/datatable';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { onMounted, ref } from 'vue';

useTitle('Exam Center');

interface GenericFilter {
  name: string;
  value: string | number;
}

const userStore = useUserStore();

const exams = ref<IExam[] | null>(null);
const examAttempts = ref<IExamAttempt[] | null>(null);
const archiveLoading = ref(true);
const totalSessions = ref(0);

const examFilterOptions = ref<GenericFilter[]>([]);
const statusFilterOptions = ref<GenericFilter[]>([
  { name: 'Not Started', value: 'not_started' },
  { name: 'In Progress', value: 'in_progress' },
  { name: 'Completed', value: 'completed' },
  { name: 'Expired', value: 'timed_out' },
]);
const studentFilter = ref<GenericFilter[]>([]);

interface ExamFilters {
  exam: DataTableFilterMetaData;
  status: DataTableFilterMetaData;
  student: DataTableFilterMetaData;
  [key: string]: DataTableFilterMetaData;
}
const filters = ref<ExamFilters>({
  exam: { value: null, matchMode: FilterMatchMode.EQUALS },
  status: { value: null, matchMode: FilterMatchMode.EQUALS },
  student: { value: null, matchMode: FilterMatchMode.EQUALS },
});

const lazyParams = ref({ page: 1, rows: 10, filters: filters.value });

const studentList = ref<IFeedbackController[]>([]);
onMounted(async () => {
  loadLazyArchive();

  try {
    const data = await examService.getExams();

    exams.value = data;
    examFilterOptions.value = data.map((e) => ({
      name: e.title,
      value: e._id,
    }));
  } catch (e) {
    console.error('error getting exams', e);
  }

  try {
    const data = await feedbackService.getControllerList();

    studentList.value = data;
  } catch (e) {
    console.error('error getting student list', e);
  }
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await examService.getExamAttempts(
      lazyParams.value.page,
      lazyParams.value.rows,
      lazyParams.value.filters.exam?.value || '',
      lazyParams.value.filters.status?.value || '',
      lazyParams.value.filters.student?.value || 0,
    );

    examAttempts.value = data.attempts;
    totalSessions.value = data.amount;
    studentFilter.value = data.students.map((s) => ({
      name: s.user!.name,
      value: s.user.cid,
    }));
  } catch (e) {
    console.error('error getting exam attempts', e);
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
    return 'bg-gray-300 dark:bg-gray-500';
  }
  return '';
};

const assignVisible = ref(false);
const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.student) {
    errors.student = [{ message: 'Student is required' }];
  }

  if (!values.exam) {
    errors.exam = [{ message: 'Exam is required' }];
  }

  return {
    values,
    errors,
  };
};

const assignExam = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  try {
    await examService.assignExam(values.student, values.exam);

    toastSuccess('Exam Assigned', 'The exam has been assigned.');

    assignVisible.value = false;

    loadLazyArchive();
  } catch (e) {
    console.error('error assigning exam', e);
  }
};

const deleteVisible = ref(false);
const deleteAttempt = ref<IExamAttempt | null>(null);

const loadDelete = (data: IExamAttempt) => {
  deleteAttempt.value = data;
  deleteVisible.value = true;
};

const closeDelete = () => {
  deleteVisible.value = false;
  deleteAttempt.value = null;
};

const deleteExamAttempt = async () => {
  if (!deleteAttempt.value) return;

  try {
    await examService.deleteAttempt(deleteAttempt.value._id);

    toastSuccess('Attempt Deleted!', `Exam attempt deleted.`);

    closeDelete();
    loadLazyArchive();
  } catch (e) {
    console.error('error deleting exam attempt', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!examAttempts" />
  <Card v-else>
    <template #title>Exam Center</template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Exam Attempts</Tab>
          <Tab value="1">Exams</Tab>
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <DataTable
              v-model:value="examAttempts"
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
                <p>There are no exam attempts to display.</p>
              </template>
              <Column
                field="student"
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
                  compileUsersName(data.user)
                }}</template>
              </Column>
              <Column field="exam" header="Exam" :showFilterMatchModes="false">
                <template #filter="{ filterModel }">
                  <Select
                    v-model="filterModel.value"
                    :options="examFilterOptions"
                    placeholder="Select Exam"
                    optionLabel="name"
                    optionValue="value"
                    filter />
                </template>
                <template #body="{ data }">
                  {{ data.exam.title }}
                </template>
              </Column>
              <Column field="attemptNumber" header="Attempt #" />
              <Column field="createdAt" header="Assigned Date">
                <template #body="{ data }">
                  {{ dateAsMMDD(data.createdAt) }}
                </template>
              </Column>

              <Column
                field="status"
                header="Score"
                :showFilterMatchModes="false">
                <template #filter="{ filterModel }">
                  <Select
                    v-model="filterModel.value"
                    :options="statusFilterOptions"
                    placeholder="Select Status"
                    optionLabel="name"
                    optionValue="value" />
                </template>
                <template #body="{ data }">
                  <span v-if="data.status === 'completed'"
                    >{{ data.grade }}%</span
                  >
                  <span v-else-if="data.status === 'timed_out'">Expired</span>
                  <span v-else-if="data.status === 'in_progress'"
                    >In Progress</span
                  >
                  <span v-else>Not Started</span>
                </template>
              </Column>

              <Column
                field="options"
                header="Options"
                headerClass="text-right"
                bodyClass="text-right">
                <template #body="{ data }">
                  <router-link
                    :to="`/ins/exams/attempt/${data._id}`"
                    v-tooltip.top="'View Attempt'"
                    v-if="
                      data.status !== 'in_progress' &&
                      data.status !== 'not_started'
                    ">
                    <Icon icon="heroicons:magnifying-glass" />
                  </router-link>
                  <span
                    @click.prevent="loadDelete(data)"
                    v-tooltip.top="'Delete Attempt'"
                    class="text-red-500"
                    v-if="data.status === 'not_started'">
                    <Icon icon="heroicons:trash" />
                  </span>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
          <TabPanel value="1">
            <DataTable v-model:value="exams" stripedRows size="small">
              <template #header>
                <div class="flex justify-between">
                  <router-link to="exams/new">
                    <Button>
                      <Icon icon="heroicons:plus" />
                      <span>Create Exam</span>
                    </Button>
                  </router-link>
                  <Button
                    @click="assignVisible = true"
                    label="Assign Exam"
                    severity="success" />
                </div>
              </template>
              <Column field="title" header="Name" />
              <Column field="user" header="Modified By">
                <template #body="{ data }">
                  {{ data.user.name }}
                </template>
              </Column>
              <Column field="certification" header="Milestone">
                <template #body="{ data }">
                  {{ data.certification.name }}
                </template>
              </Column>
              <Column field="questions" header="Questions">
                <template #body="{ data }">
                  {{ data.questions.length }}
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
                    :to="`/ins/exams/${data._id}`"
                    v-tooltip.top="'Edit Exam'"
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

  <Dialog
    modal
    v-model:visible="assignVisible"
    header="Assign Exam"
    class="w-1/2">
    <p>They will have <b>30 days</b> to complete the exam.</p>
    <Form v-slot="$form" :resolver @submit="assignExam">
      <div class="grid grid-cols-1 gap-5 mt-5">
        <FormField v-slot="$field" name="student">
          <FloatLabel variant="on">
            <Select
              class="w-1/2"
              :options="studentFilter"
              optionLabel="name"
              optionValue="value"
              filter
              required />

            <label for="student" class="required-field">Student</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>

        <FormField v-slot="$field" name="exam">
          <FloatLabel variant="on">
            <Select
              class="w-1/2"
              :options="examFilterOptions"
              optionLabel="name"
              optionValue="value"
              filter
              required />

            <label for="student" class="required-field">Exam</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>
      </div>
      <div class="flex justify-end gap-5">
        <Button
          label="Assign"
          type="submit"
          severity="success"
          :disabled="
            !$form?.valid || $form?.student?.pristine || $form?.exam?.pristine
          " />
        <Button label="Cancel" outlined @click="assignVisible = false" />
      </div>
    </Form>
  </Dialog>

  <Dialog
    modal
    v-model:visible="deleteVisible"
    header="Delete Exam Attempt"
    @hide="closeDelete"
    class="w-1/2">
    <p>
      Confirm the deletion of <b>{{ deleteAttempt!.user.name }}</b
      >'s exam attempt for <b>{{ deleteAttempt!.exam.title }}</b
      >.
    </p>
    <template #footer>
      <Button
        severity="danger"
        label="Delete"
        @click.prevent="deleteExamAttempt" />
      <Button outlined label="Cancel" @click.prevent="closeDelete" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped>
.core-blue {
  color: var(--p-core-blue);
}
</style>
