<script setup lang="ts">
import AdminDocumentList from '@/components/documents/AdminDocumentList.vue';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { filesService } from '@/services/files/files.service';
import type { IDocument } from '@/services/files/files.types';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { onMounted, ref } from 'vue';

useTitle('Documents');
const documents = ref<IDocument[] | null>(null);

onMounted(async () => {
  await loadDocuments();
});

const loadDocuments = async () => {
  try {
    const data = await filesService.getDocuments();

    documents.value = data;
  } catch (e) {
    console.error('error getting documents', e);
  }
};

const deleteData = ref<IDocument | null>(null);
const deleteVisible = ref(false);
const loadDelete = (data: IDocument) => {
  deleteData.value = data;
  deleteVisible.value = true;
};

const closeDelete = () => {
  deleteVisible.value = false;
  deleteData.value = null;
};

const deleteDocument = async () => {
  if (!deleteData.value) return;
  try {
    await filesService.deleteDocument(deleteData.value._id);

    toastSuccess(
      'Document deleted',
      `Document ${deleteData.value.name} has been deleted.`,
    );
    closeDelete();
    loadDocuments();
  } catch (e) {
    console.error('error deleting document', e);
  }
};
</script>

<template>
  <AdminDocumentList
    :items="documents"
    :type="'document'"
    @loadDelete="loadDelete" />
  <Dialog
    modal
    v-model:visible="deleteVisible"
    class="w-1/2"
    @hide="closeDelete"
    header="Delete Document?">
    <p>
      This will permanently delete the <b>{{ deleteData?.name }}</b> document.
    </p>
    <template #footer>
      <Button severity="danger" label="Delete" @click="deleteDocument" />
      <Button outlined label="Cancel" @click="closeDelete" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
