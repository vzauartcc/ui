<script setup lang="ts">
import { trainingService } from '@/services/training/training.service';
import type {
  ISessionResponse,
  ITrainingSession,
} from '@/services/training/training.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import type { DataTablePageEvent } from 'primevue/datatable';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Training Sessions');

const userStore = useUserStore();

const sessionData = ref<ISessionResponse | null>(null);
const lazyParams = ref({ page: 1, limit: 10 });
const archiveLoading = ref(true);
const totalSessions = ref(0);

const openSessions = ref<ITrainingSession[]>([]);

const visible = ref(false);

onMounted(async () => {
  loadLazyArchive();

  try {
    const data = await trainingService.getOpenSessions();

    openSessions.value = data;
  } catch (e) {
    console.error('error getting open sessions', e);
  }
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await trainingService.getSessions(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    sessionData.value = data;
    totalSessions.value = data.count;
  } catch (e) {
    console.error('error getting training sessions', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.limit = event.rows;

  loadLazyArchive();
};

const deleteSession = ref<ITrainingSession | null>(null);
const loadDelete = (session: ITrainingSession) => {
  deleteSession.value = session;
  visible.value = true;
};

const closeDelete = () => {
  deleteSession.value = null;
  visible.value = false;
};

const confirmDelete = async () => {
  try {
    await trainingService.deleteSession(deleteSession.value!._id);

    toastSuccess(
      'Training Session Deleted!',
      `Successfully deleted training session.`,
    );
    closeDelete();

    loadLazyArchive();
  } catch (e) {
    console.error('error deleting session', e);
  }
};

const canEdit = (session: ITrainingSession) => {
  // Not an OTS pass or fail
  return (
    (session.ots === 0 || session.ots === 3) &&
    // TA or instructor
    (userStore.isSeniorStaff || userStore.isSelf)
  );
};

const canDelete = (session: ITrainingSession) => {
  // Not an OTS pass or fail
  return (session.ots === 0 || session.ots === 3) && userStore.isSeniorStaff;
};
</script>

<template>
  <Card>
    <template #title>
      <div class="flex justify-between items-center w-full">
        <span>Your Training Sessions</span>
        <router-link to="/ins/sessions/new">
          <Button label="New Session" severity="success" />
        </router-link>
      </div>
    </template>
    <template #content>
      <DataTable :value="openSessions" stripedRows size="small">
        <template #empty
          ><p>
            You do not have any outstanding training sessions to complete.
          </p></template
        >

        <Column field="student" header="Student">
          <template #body="{ data }">
            {{ compileUsersName(data.student) }}</template
          >
        </Column>
        <Column field="milestone" header="Milestone">
          <template #body="{ data }">
            {{ data.milestone.name }}
          </template>
        </Column>
        <Column field="startTime" header="Start Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.startTime) }}
          </template>
        </Column>
        <Column field="endTime" header="End Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.endTime) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <router-link
              :to="`/ins/sessions/edit/${data._id}`"
              v-tooltip.top="'Edit Session'">
              <Icon icon="heroicons:pencil" />
            </router-link>
            <span
              @click.prevent="loadDelete(data)"
              class="text-red-500"
              v-tooltip.top="'Delete Session'">
              <Icon icon="heroicons:trash" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
  <Card>
    <template #title>Completed Training Sessions</template>
    <template #content>
      <ProgressSpinner v-if="!sessionData" />
      <DataTable
        v-else
        :value="sessionData.sessions"
        stripedRows
        lazy
        paginator
        :rows="10"
        :totalRecords="totalSessions"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage($event)"
        size="small"
        currentPageReportTemplate="{first} - {last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport">
        <template #empty
          ><p>There are no training records to display</p></template
        >

        <Column field="student" header="Student">
          <template #body="{ data }">
            {{ compileUsersName(data.student) }}</template
          >
        </Column>
        <Column field="instructor" header="Instructor">
          <template #body="{ data }">
            {{ compileUsersName(data.instructor) }}
          </template>
        </Column>
        <Column field="milestone" header="Milestone">
          <template #body="{ data }">
            {{ data.milestone.name }}
          </template>
        </Column>
        <Column field="startTime" header="Start Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.startTime) }}
          </template>
        </Column>
        <Column field="endTime" header="End Time">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.endTime) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <router-link
              :to="`/ins/training/session/${data._id}`"
              v-tooltip.top="'Session Details'">
              <Icon icon="heroicons:magnifying-glass" />
            </router-link>
            <router-link
              :to="`/ins/sessions/edit/${data._id}`"
              v-tooltip.top="'Edit Session'"
              v-if="canEdit(data)">
              <Icon icon="heroicons:pencil" />
            </router-link>
            <span
              @click.prevent="loadDelete(data)"
              v-tooltip.top="'Delete Session'"
              class="text-red-500"
              v-if="canDelete(data)">
              <Icon icon="heroicons:trash" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    modal
    header="Delete Training Session"
    v-model:visible="visible"
    @hide="closeDelete">
    <p>
      This will permanently delete the training session for
      <b>{{ compileUsersName(deleteSession?.student) }}</b
      >.
    </p>
    <template #footer>
      <Button severity="danger" @click="confirmDelete" label="Delete" />
      <Button severity="secondary" @click="closeDelete" label="Cancel" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
