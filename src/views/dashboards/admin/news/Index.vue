<script setup lang="ts">
import { dateAsMMDD } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { newsService } from '@/services/news/news.service';
import type { INewsArticle } from '@/services/news/news.types';
import { useUserStore } from '@/stores/user';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('News');

const news = ref<INewsArticle[] | null>(null);
const totalNews = ref(0);
const archiveLoading = ref(true);
const lazyParams = ref({ page: 1, limit: 10 });

onMounted(async () => {
  loadLazyArchive();
});

const loadLazyArchive = async () => {
  archiveLoading.value = true;

  try {
    const data = await newsService.getPage(
      lazyParams.value.page,
      lazyParams.value.limit,
    );

    news.value = data.news;
    totalNews.value = data.amount;
  } catch (e) {
    console.error('error getting news', e);
  } finally {
    archiveLoading.value = false;
  }
};

const onPage = (event: DataTablePageEvent) => {
  lazyParams.value.page = event.page + 1;
  lazyParams.value.limit = event.rows;

  loadLazyArchive();
};

const userStore = useUserStore();
const canModify = (data: INewsArticle) => {
  return userStore.isSelf(data.createdBy) || userStore.isManagement;
};

const deleteVisible = ref(false);
const deleteData = ref<INewsArticle | null>(null);
const loadDelete = (data: INewsArticle) => {
  deleteData.value = data;
  deleteVisible.value = true;
};
const closeDelete = () => {
  deleteVisible.value = false;
  deleteData.value = null;
};
const confirmDelete = async () => {
  if (!deleteData.value) return;

  try {
    await newsService.deleteArticle(deleteData.value.uriSlug);

    toastSuccess('Article Deleted!', 'Article was successfully deleted.');
    loadLazyArchive();
    closeDelete();
  } catch (e) {
    console.error('error deleting news article', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!news" />
  <Card v-else>
    <template #title>News Articles</template>
    <template #content>
      <DataTable
        :value="news"
        stripedRows
        size="small"
        lazy
        paginator
        :rows="10"
        :totalRecords="totalNews"
        :loading="archiveLoading"
        :rowsPerPageOptions="[10, 20, 50]"
        @page="onPage($event)">
        <template #header>
          <div class="flex justify-end">
            <router-link to="/admin/news/new">
              <Button label="New" />
            </router-link>
          </div>
        </template>
        <template #empty>
          <p>There are no news articles to display.</p>
        </template>

        <Column field="title" header="Title" />
        <Column field="author" header="Author">
          <template #body="{ data }">
            {{ compileUsersName(data.user) }}</template
          >
        </Column>
        <Column field="createdAt" header="Date">
          <template #body="{ data }">
            {{ dateAsMMDD(data.createdAt) }}
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          bodyClass="text-right"
          headerClass="text-right">
          <template #body="{ data }">
            <div v-if="canModify(data)">
              <router-link
                v-tooltip.top="'Edit Article'"
                :to="`/admin/news/${data.uriSlug}`">
                <Icon icon="heroicons:pencil" />
              </router-link>

              <span
                v-tooltip.top="'Delete Article'"
                class="text-red-500"
                @click.prevent="loadDelete(data)">
                <Icon icon="heroicons:trash" />
              </span>
            </div>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    modal
    class="w-1/2"
    v-model:visible="deleteVisible"
    @hide="closeDelete"
    header="Confirm Deletion">
    <p>
      This will permanently delete the <b>{{ deleteData!.title }}</b> news
      article.
    </p>
    <template #footer>
      <Button severity="danger" label="Delete" @click="confirmDelete" />
      <Button outlined label="Cancel" @click="closeDelete" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
