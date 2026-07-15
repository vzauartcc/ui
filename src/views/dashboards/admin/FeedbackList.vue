<script setup lang="ts">
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedback } from '@/services/feedback/feedback.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import Rating from 'primevue/rating';
import { capitalize, computed, onMounted, ref } from 'vue';

useTitle('Feedback');

const ratings = [
  'Poor',
  'Below Average',
  'Average',
  'Above Average',
  'Excellent',
];
const getRatingText = (rating: number) => {
  return `${ratings[rating - 1]}`;
};

const unapprovedFeedback = ref<IFeedback[] | null>(null);

const feedbackItems = ref<IFeedback[] | null>(null);
const lazyParams = ref({ page: 1, limit: 10 });
const archiveLoading = ref(true);
const totalItems = ref(0);

interface Feedback extends IFeedback {
  pending: boolean;
}

const feedback = ref<Feedback | null>(null);
const feedbackVisible = ref(false);

onMounted(async () => {
  loadLazyArchive();

  getUnapprovedFeedback();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await feedbackService.getFeedback(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    feedbackItems.value = data.feedback;
    totalItems.value = data.amount;
  } catch (e) {
    console.error('error getting feedback', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.limit = event.rows;

  loadLazyArchive();
};

const getUnapprovedFeedback = async () => {
  try {
    const data = await feedbackService.getUnapprovedFeedback();

    unapprovedFeedback.value = data;
  } catch (e) {
    console.error('error getting unapproved feedback', e);
  }
};

const viewFeedback = (data: IFeedback) => {
  feedback.value = { ...data, pending: false };
  feedbackVisible.value = true;
};

const viewUnapprovedFeedback = (data: IFeedback) => {
  feedback.value = { ...data, pending: true };
  feedbackVisible.value = true;
};

const dateToString = computed(() => {
  if (!feedback.value) return '';

  return dateAsMMDDHHMM(feedback.value.createdAt);
});
const getControllerName = computed(() => {
  if (!feedback.value) return '';

  return compileUsersName(feedback.value.controller);
});
const getFeedbackRating = computed(() => {
  if (!feedback.value) return '';

  return getRatingText(feedback.value.rating);
});
const getFeedbackStatus = computed(() => {
  if (!feedback.value) return '';

  return feedback.value.approved ? 'Approved' : 'Not Approved';
});

const approveFeedback = async () => {
  if (!feedback.value) return;

  try {
    await feedbackService.approveFeedback(feedback.value._id);

    toastSuccess('Feedback Approved!', `The feedback item has been approved.`);
    feedbackVisible.value = false;

    getUnapprovedFeedback();
    loadLazyArchive();
  } catch (e) {
    console.error('error approving feedback', e);
  }
};

const rejectFeedback = async () => {
  if (!feedback.value) return;

  try {
    await feedbackService.rejectFeedback(feedback.value._id);

    toastSuccess('Feedback Rejected!', `The feedback item has been rejected.`);
    feedbackVisible.value = false;

    getUnapprovedFeedback();
    loadLazyArchive();
  } catch (e) {
    console.error('error rejecting feedback', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!unapprovedFeedback" />
  <Card v-else>
    <template #title>Unapproved Feedback</template>
    <template #content>
      <DataTable :value="unapprovedFeedback" stripedRows size="small">
        <template #empty
          ><p>There are no pending feedback items to display.</p></template
        >
        <Column field="createdAt" header="Date">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.createdAt) }}
          </template>
        </Column>
        <Column field="name" header="Submitter" />
        <Column field="controller" header="Controller">
          <template #body="{ data }">
            {{ compileUsersName(data.controller) }}
          </template>
        </Column>
        <Column field="rating" header="Rating">
          <template #body="{ data }">
            <Rating
              v-model="data.rating"
              readonly
              v-tooltip.top="`${getRatingText(data.rating)}`" />
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span v-tooltip.top="'View Feedback'">
              <Icon
                icon="heroicons:magnifying-glass"
                cursor="pointer"
                @click="viewUnapprovedFeedback(data)" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <ProgressSpinner v-if="!feedbackItems" />
  <Card v-else>
    <template #title>Recent Feedback</template>
    <template #content>
      <DataTable
        :value="feedbackItems"
        stripedRows
        lazy
        paginator
        :rows="10"
        :totalRecords="totalItems"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 25, 50]"
        @page="onPage($event)"
        size="small"
        currentPageReportTemplate="{first} - {last} of {totalRecords}"
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport">
        <template #empty
          ><p>There are no feedback items to display.</p></template
        >

        <Column field="createdAt" header="Date">
          <template #body="{ data }">
            {{ dateAsMMDDHHMM(data.createdAt) }}
          </template>
        </Column>
        <Column field="controller" header="Controller">
          <template #body="{ data }">
            {{ compileUsersName(data.controller) }}
          </template>
        </Column>
        <Column field="position" header="Position">
          <template #body="{ data }">
            {{ capitalize(data.position) }}
          </template>
        </Column>
        <Column field="rating" header="Rating">
          <template #body="{ data }">
            <Rating
              v-model="data.rating"
              readonly
              v-tooltip.top="`${getRatingText(data.rating)}`" />
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span v-tooltip.top="'View Feedback'">
              <Icon
                icon="heroicons:magnifying-glass"
                cursor="pointer"
                @click="viewFeedback(data)" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    v-model:visible="feedbackVisible"
    modal
    header="Feedback Details"
    class="w-3/4">
    <div class="grid grid-cols-2 gap-5">
      <FloatLabel variant="on">
        <InputText id="name" v-model="feedback!.name" disabled />
        <label for="name">Submitter Name</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputNumber
          v-model="feedback!.submitter"
          disabled
          :useGrouping="false" />
        <label for="cid">Submitter CID</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="email" v-model="feedback!.email" disabled />
        <label for="email">Submitter Email</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="createdAt" v-model="dateToString" disabled />
        <label for="createdAt">Submission Date</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="controller" v-model="getControllerName" disabled />
        <label for="controller">Controller</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="position" v-model="feedback!.position" disabled />
        <label for="position">Position</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="rating" v-model="getFeedbackRating" disabled />
        <label for="rating">Rating</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="status" v-model="getFeedbackStatus" disabled />
        <label for="status">Status</label>
      </FloatLabel>
    </div>
    <p>Comments</p>
    <p id="comments">{{ feedback!.comments }}</p>

    <template #footer>
      <template v-if="feedback!.pending">
        <Button severity="success" label="Approve" @click="approveFeedback" />
        <Button severity="danger" label="Reject" @click="rejectFeedback" />
      </template>
      <Button outlined label="Close" @click="feedbackVisible = false" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped>
.p-card + .p-card {
  margin: 2.5rem 0rem;
}

:deep(.p-rating.p-readonly .p-rating-option) {
  cursor: unset !important;
}
</style>
