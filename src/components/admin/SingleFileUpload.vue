<script setup lang="ts">
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import Message from 'primevue/message';
import { nextTick, useTemplateRef } from 'vue';

const props = withDefaults(
  defineProps<{
    fileName?: string;
    maxFileSize: number;
  }>(),
  {
    fileName: '',
  },
);

const modelValue = defineModel<File | null>({ default: null });

const fileUploadRef =
  useTemplateRef<InstanceType<typeof FileUpload>>('fileUploadRef');

const onFileSelect = (event: FileUploadSelectEvent) => {
  if (event.files && event.files.length > 0) {
    modelValue.value = event.files[0];
  }
};

const onClear = () => {
  modelValue.value = null;
};

const removeFile = () => {
  (fileUploadRef.value as unknown as { clear: () => void } | null)?.clear();
};

const handleChoose = async (
  chooseCallback: () => void,
  clearCallback: () => void,
  files: File[],
) => {
  if (files.length > 0) {
    clearCallback();
    await nextTick();
  }
  chooseCallback();
};

const formatFileSize = (bytes: number) => {
  if (bytes >= 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
};

const onReplaceDrop = (event: DragEvent) => {
  event.preventDefault();
  event.stopPropagation();

  const file = event.dataTransfer?.files[0];
  if (!file || !fileUploadRef.value) return;

  const fu = fileUploadRef.value as unknown as {
    files: File[];
    clear: () => void;
    messages: string[] | null;
  };

  if (file.size > props.maxFileSize) {
    fu.messages = [
      `${file.name}: Invalid file size, file size should be smaller than ${formatFileSize(props.maxFileSize)}.`,
    ];
    return;
  }

  fu.clear();
  fu.files = [file];
  modelValue.value = file;
};

const getFileCount = () =>
  (fileUploadRef.value as unknown as { files: File[] } | null)?.files.length ??
  0;

defineExpose({ getFileCount });
</script>

<template>
  <FileUpload
    ref="fileUploadRef"
    :maxFileSize
    :fileLimit="1"
    :auto="false"
    @select="onFileSelect"
    @clear="onClear">
    <template #header="{ chooseCallback, clearCallback, files }">
      <Button
        @click="handleChoose(chooseCallback, clearCallback, files)"
        label="Choose" />
    </template>
    <template #empty>
      <div class="flex items-center justify-center flex-col">
        <Icon icon="heroicons:cloud-arrow-up" class="no-pointer text-6xl" />
        <p class="mt-6 mb-0">
          {{
            fileName
              ? 'Drag and drop file here to replace upload.'
              : 'Drag and drop file here to upload.'
          }}
        </p>
      </div>
    </template>
    <template #content="{ files, messages }">
      <Message
        v-for="msg in messages ?? []"
        :key="msg"
        severity="error"
        size="small"
        variant="simple"
        class="mb-3 w-full"
        >{{ msg }}</Message
      >
      <div
        class="flex flex-wrap gap-4 w-full"
        @dragover.prevent
        @drop="onReplaceDrop">
        <div
          v-if="files.length === 0"
          class="p-8 rounded-border flex flex-col border border-surface items-center gap-4 w-full">
          <span
            class="font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
            {{ fileName }}
          </span>
        </div>
        <div
          v-else
          v-for="tmpFile of files"
          :key="tmpFile.name + tmpFile.type + tmpFile.size"
          class="p-8 rounded-border flex flex-col border border-surface items-center gap-4 w-full">
          <div class="flex items-center gap-2.5 w-full justify-center">
            <span
              class="font-semibold text-ellipsis whitespace-nowrap overflow-hidden"
              >{{ tmpFile.name }}</span
            >
            <Button
              v-tooltip.top="'Remove file'"
              severity="danger"
              text
              rounded
              size="small"
              @click="removeFile">
              <Icon icon="heroicons:trash" />
            </Button>
          </div>
        </div>
      </div>
    </template>
  </FileUpload>
</template>

<style lang="css" scoped></style>
