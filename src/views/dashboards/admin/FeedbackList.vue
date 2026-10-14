<script setup lang="ts">
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedback } from '@/services/feedback/feedback.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import Fieldset from 'primevue/fieldset';
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

const { isSubmitting: isApproving, execute: executeApprove } = useAsyncSubmit();
const { isSubmitting: isRejecting, execute: executeReject } = useAsyncSubmit();

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
  const fb = feedback.value;

  await executeApprove(async () => {
    await feedbackService.approveFeedback(fb._id);

    toastSuccess('Feedback Approved!', `The feedback item has been approved.`);
    feedbackVisible.value = false;

    getUnapprovedFeedback();
    loadLazyArchive();
  });
};

const rejectFeedback = async () => {
  if (!feedback.value) return;
  const fb = feedback.value;

  await executeReject(async () => {
    await feedbackService.rejectFeedback(fb._id);

    toastSuccess('Feedback Rejected!', `The feedback item has been rejected.`);
    feedbackVisible.value = false;

    getUnapprovedFeedback();
    loadLazyArchive();
  });
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
    dismissableMask
    header="Feedback Details"
    class="w-3/4">
    <div class="grid grid-cols-2 gap-5">
      <Fieldset legend="Submitter Name">
        <span>{{ feedback!.name }}</span>
      </Fieldset>
      <Fieldset legend="Submitter CID">
        <span>{{ feedback!.submitter }}</span>
      </Fieldset>
      <Fieldset legend="Submitter Email">
        <span>{{ feedback!.email }}</span>
      </Fieldset>
      <Fieldset legend="Submission Date">
        <span>{{ dateToString }}</span>
      </Fieldset>
      <Fieldset legend="Controller">
        <span>{{ getControllerName }}</span>
      </Fieldset>
      <Fieldset legend="Position">
        <span>{{ feedback!.position }}</span>
      </Fieldset>
      <Fieldset legend="Rating">
        <span>{{ getFeedbackRating }}</span>
      </Fieldset>
      <Fieldset legend="Status">
        <span>{{ getFeedbackStatus }}</span>
      </Fieldset>
    </div>
    <Fieldset legend="Comments">
      <span class="whitespace-pre-line break-words">
        {{ feedback!.comments }}
      </span>
    </Fieldset>

    <template #footer>
      <template v-if="feedback!.pending">
        <Button
          severity="success"
          label="Approve"
          @click="approveFeedback"
          :loading="isApproving" />
        <Button
          severity="danger"
          label="Reject"
          @click="rejectFeedback"
          :loading="isRejecting" />
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
