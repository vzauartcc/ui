<script setup lang="ts">
import DocumentList from '@/components/documents/DocumentList.vue';
import { filesService } from '@/services/files/files.service';
import type { IDownload } from '@/services/files/files.types';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { onMounted, ref } from 'vue';

useTitle('Downloads');

interface Downloads {
  sectorFiles: IDownload[];
  training: IDownload[];
}

const downloads = ref<Downloads | null>(null);

onMounted(async () => {
  try {
    const data = await filesService.getDownloads();

    downloads.value = {
      sectorFiles: data.filter((d) => d.category === 'sectorFiles'),
      training: data.filter((d) => d.category === 'training'),
    };
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
      <Tabs value="0" class="my-tabs">
        <TabList>
          <Tab value="0">Facility Files</Tab>
          <Tab value="1">Training</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="0">
            <DocumentList :documents="downloads.sectorFiles" isDownload />
          </TabPanel>
          <TabPanel value="1">
            <DocumentList :documents="downloads.training" isDownload />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
