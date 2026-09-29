<script setup lang="ts">
import { filesService } from '@/services/files/files.service';
import type { IDocument } from '@/services/files/files.types';
import { sanitize } from '@/utils/sanitize';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

useTitle('Document Details');

const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug[0]
  : route.params.slug;

const doc = ref<IDocument | null>(null);

onMounted(async () => {
  if (!slug) return;

  try {
    const data = await filesService.getDocument(slug);

    doc.value = data;

    useTitle(data.name);
  } catch (e) {
    console.error('error getting document', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!doc" />
  <Card v-else>
    <template #title>
      {{ doc.name }}
    </template>

    <template #content>
      <div
        class="prose dark:prose-invert"
        v-html="sanitize(doc.content!)"></div>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
