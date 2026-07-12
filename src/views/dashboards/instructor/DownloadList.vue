<script setup lang="ts">
import DocumentList from '@/components/documents/DocumentList.vue';
import { filesService } from '@/services/files/files.service';
import type { IDocument } from '@/services/files/files.types';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import { onMounted, ref } from 'vue';

useTitle('Instructor Downloads');

interface Documents {
  training: IDocument[];
  insguides: IDocument[];
}

const documents = ref<Documents | null>(null);

onMounted(async () => {
  try {
    const data = await filesService.getDocuments();

    documents.value = {
      training: data.filter((d) => d.category === 'training'),
      insguides: data.filter((d) => d.category === 'insguides'),
    };
  } catch (e) {
    console.error('error getting documents', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!documents" />
  <Card v-else>
    <template #title>Documents & Downloads</template>
    <template #content>
      <Tabs value="0" class="my-tabs">
        <TabList>
          <Tab value="0">Sweatbox Files</Tab>
          <Tab value="1">Instructor Guides</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="0">
            <DocumentList :documents="documents.training" isDownload />
          </TabPanel>
          <TabPanel value="1">
            <DocumentList :documents="documents.insguides" isDownload />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
