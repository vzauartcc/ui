<script setup lang="ts">
import { newsService } from '@/services/news/news.service';
import type { INewsArticle } from '@/services/news/news.types';
import { dateAsMMDD } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import Column from 'primevue/column';
import DataTable, { type DataTablePageEvent } from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressbar';
import { onMounted, ref } from 'vue';

useTitle('News Articles');

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
        <template #empty><p>There are no news items to display.</p></template>
        <Column field="title" header="Title" bodyClass="font-bold">
          <template #body="{ data }">
            <router-link :to="`news/${data.uriSlug}`">
              {{ data.title }}
            </router-link>
          </template>
        </Column>
        <Column field="user" header="Author">
          <template #body="{ data }">
            {{ compileUsersName(data.user) }}
          </template>
        </Column>
        <Column
          field="createdAt"
          header="Date"
          bodyClass="text-right"
          headerClass="text-right">
          ><template #body="{ data }">
            {{ dateAsMMDD(data.createdAt) }}
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
