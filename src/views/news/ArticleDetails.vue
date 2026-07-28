<script setup lang="ts">
import { newsService } from '@/services/news/news.service';
import type { INewsArticle } from '@/services/news/news.types';
import { dateAsMMMMDDYYYY } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

useTitle('News Article');

const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug[0]
  : route.params.slug;

const article = ref<INewsArticle | null>(null);

onMounted(async () => {
  if (!slug) return;

  try {
    const data = await newsService.getArticle(slug);

    article.value = data;

    useTitle(data.title);
  } catch (e) {
    console.error('error getting article', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!article" />
  <Card v-else>
    <template #title>
      {{ article.title }}
    </template>

    <template #subtitle>
      By {{ compileUsersName(article.user) }} on
      {{ dateAsMMMMDDYYYY(article.createdAt) }}
    </template>

    <template #content>
      <div class="prose dark:prose-invert" v-html="article.content"></div>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
