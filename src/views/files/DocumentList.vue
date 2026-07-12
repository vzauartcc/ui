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

useTitle('Documents');

interface Documents {
  sop: IDocument[];
  loa: IDocument[];
  policy: IDocument[];
  reference: IDocument[];
  training: IDocument[];
}

const documents = ref<Documents | null>(null);

onMounted(async () => {
  try {
    const data = await filesService.getDocuments();

    documents.value = {
      sop: data.filter((d) => d.category === 'sop'),
      loa: data.filter((d) => d.category === 'loa'),
      policy: data.filter((d) => d.category === 'policy'),
      reference: data.filter((d) => d.category === 'reference'),
      training: data.filter((d) => d.category === 'training'),
    };
  } catch (e) {
    console.error('error getting documents', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!documents" />
  <Card v-else>
    <template #title>Documents</template>
    <template #content>
      <Tabs value="0" class="my-tabs">
        <TabList>
          <Tab value="0">SOPs</Tab>
          <Tab value="1">LOAs</Tab>
          <Tab value="2">Policies</Tab>
          <Tab value="3">Reference</Tab>
          <Tab value="4">Training</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="0">
            <DocumentList :documents="documents.sop" />
          </TabPanel>
          <TabPanel value="1">
            <DocumentList :documents="documents.loa" />
          </TabPanel>
          <TabPanel value="2">
            <DocumentList :documents="documents.policy" />
          </TabPanel>
          <TabPanel value="3">
            <DocumentList :documents="documents.reference" />
          </TabPanel>
          <TabPanel value="4">
            <DocumentList :documents="documents.training" />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
