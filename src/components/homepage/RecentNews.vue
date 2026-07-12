<script setup lang="ts">
import { newsService } from '@/services/news/news.service';
import type { INewsArticle } from '@/services/news/news.types';
import { truncateText } from '@/utils/text';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

const news = ref<INewsArticle[] | null>(null);

onMounted(async () => {
  try {
    const data = await newsService.getRecent();

    news.value = data.news;
  } catch (e) {
    console.error('error getting recent news', e);
  }
});

const formatDate = (input: string) => {
  const date = new Date(input);
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
};
</script>

<template>
  <ProgressSpinner v-if="!news" />
  <DataTable v-else :value="news" stripedRows size="small">
    <template #empty>
      <p>There are no recent news articles to display. Check back later!</p>
    </template>
    <Column field="title" header="Title">
      <template #body="{ data }">
        <router-link :to="`/news/${data.uriSlug}`">
          <b>{{ truncateText(data.title, 50) }}</b>
        </router-link>
      </template>
    </Column>
    <Column field="createdAt" bodyClass="text-right" headerClass="text-right">
      <template #header>
        <b class="flex-1 text-right">Date</b>
      </template>
      <template #body="{ data }">
        {{ formatDate(data.createdAt) }}
      </template>
    </Column>
  </DataTable>
</template>

<style lang="css" scoped></style>
