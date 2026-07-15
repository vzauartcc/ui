<script setup lang="ts">
import DocumentList from '@/components/documents/DocumentList.vue';
import { filesService } from '@/services/files/files.service';
import type { IDownload } from '@/services/files/files.types';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Downloads');

const downloads = ref<IDownload[] | null>(null);

onMounted(async () => {
  try {
    const data = await filesService.getDownloads();

    downloads.value = data.filter((d) => d.category !== 'ins');
  } catch (e) {
    console.error('error getting downloads', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!downloads" />
  <Card v-else>
    <template #title>Downloads</template>
    <template #content>
      <DocumentList :documents="downloads" isDownload />
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
