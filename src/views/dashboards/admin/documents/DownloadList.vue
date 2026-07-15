<script setup lang="ts">
import AdminDocumentList from '@/components/documents/AdminDocumentList.vue';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { filesService } from '@/services/files/files.service';
import type { IDownload } from '@/services/files/files.types';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onMounted, ref } from 'vue';

useTitle('Downloads');
const downloads = ref<IDownload[] | null>(null);

onMounted(async () => {
  await loadDownloads();
});

const loadDownloads = async () => {
  try {
    const data = await filesService.getDownloads();

    downloads.value = data;
  } catch (e) {
    console.error('error getting downloads', e);
  }
};

const deleteData = ref<IDownload | null>(null);
const deleteVisible = ref(false);
const loadDelete = (data: IDownload) => {
  deleteData.value = data;
  deleteVisible.value = true;
};

const closeDelete = () => {
  deleteVisible.value = false;
  deleteData.value = null;
};

const deleteDownload = async () => {
  if (!deleteData.value) return;
  try {
    await filesService.deleteDownload(deleteData.value._id);

    toastSuccess(
      'Download deleted',
      `Download ${deleteData.value.name} has been deleted.`,
    );
    closeDelete();
    loadDownloads();
  } catch (e) {
    console.error('error deleting document', e);
  }
};
</script>

<template>
  <AdminDocumentList
    :items="downloads"
    :type="'download'"
    @loadDelete="loadDelete" />
  <Dialog
    modal
    v-model:visible="deleteVisible"
    class="w-1/2"
    @hide="closeDelete"
    header="Delete Download?">
    <p>
      This will permanently delete the <b>{{ deleteData?.name }}</b> download.
    </p>
    <template #footer>
      <Button severity="danger" label="Delete" @click="deleteDownload" />
      <Button outlined label="Cancel" @click="closeDelete" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
