<script setup lang="ts">
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedback } from '@/services/feedback/feedback.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import Rating from 'primevue/rating';
import { capitalize, onMounted, ref } from 'vue';

useTitle('Your Feedback');

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

const feedbackItems = ref<IFeedback[] | null>(null);
const lazyParams = ref({ page: 1, limit: 10 });
const archiveLoading = ref(true);
const totalItems = ref(0);

const feedback = ref<IFeedback | null>(null);
const feedbackVisible = ref(false);

onMounted(async () => {
  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await feedbackService.getOwn(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    feedbackItems.value = data.feedback;
    totalItems.value = data.amount;
  } catch (e) {
    console.error('error getting staffing requests', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.limit = event.rows;

  loadLazyArchive();
};

const viewFeedback = (data: IFeedback) => {
  feedback.value = data;
  feedbackVisible.value = true;
};
</script>

<template>
  <ProgressSpinner v-if="!feedbackItems" />
  <template v-else>
    <Card>
      <template #title>Your Feedback</template>
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
              <Icon
                icon="heroicons:magnifying-glass"
                cursor="pointer"
                @click="viewFeedback(data)" />
            </template>
          </Column>
        </DataTable>
      </template>
    </Card>
  </template>
  <Dialog
    v-model:visible="feedbackVisible"
    modal
    header="Feedback Details"
    class="w-1/2">
    <p>{{ feedback?.comments }}</p>
    <template #footer>
      <Button label="Close" @click="feedbackVisible = false" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped>
:deep(.p-rating.p-readonly .p-rating-option) {
  cursor: unset !important;
}
</style>
