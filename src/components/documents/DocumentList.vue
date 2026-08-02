<script setup lang="ts">
import type { IDocument, IDownload } from '@/services/files/files.types';
import { dateAsMMDDHHMM } from '@/utils/date';
import { getS3Url } from '@/utils/uriHelper';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import DataView from 'primevue/dataview';
import Tag from 'primevue/tag';
import { ref } from 'vue';

const s3Url = getS3Url();

const props = withDefaults(
  defineProps<{
    documents: IDownload[] | IDocument[];
    isDownload?: boolean;
  }>(),
  { isDownload: false },
);

const tagDate = ref(Date.now() - 1000 * 60 * 60 * 24 * 61);
</script>

<template>
  <DataView :value="props.documents">
    <template #empty
      ><p class="italic">
        No {{ props.isDownload ? 'downloads' : 'documents' }} found.
      </p></template
    >
    <template #list="{ items }">
      <div class="flex flex-col">
        <div v-for="(item, index) in items" :key="index">
          <div
            class="flex flex-col sm:flex-row sm:items-center p-6 gap-4"
            :class="{
              'border-t border-surface-200 dark:border-surface-700':
                index !== 0,
            }">
            <div
              class="flex flex-col md:flex-row justify-between md:items-center gap-4 w-full">
              <div class="flex flex-col flex-1 gap-2">
                <div class="text-lg font-medium">
                  {{ item.name }}
                  <Tag
                    value="New"
                    severity="success"
                    v-if="new Date(item.createdAt).getTime() > tagDate"
                    class="ml-1" />
                  <Tag
                    value="Updated"
                    severity="warn"
                    v-else-if="new Date(item.updatedAt).getTime() > tagDate"
                    class="ml-1" />
                </div>
                <div>
                  <span class="block font-medium text-sm ml-5">{{
                    item.description
                  }}</span>
                  <span class="text-xs text-surface-500"
                    >Updated at {{ dateAsMMDDHHMM(item.updatedAt) }}</span
                  >
                </div>
              </div>
              <div
                class="flex items-center md:justify-end cursor-pointer"
                v-tooltip="
                  props.isDownload ? 'Download File' : 'View Document'
                ">
                <Button>
                  <a
                    :href="`${s3Url}/${props.isDownload ? 'downloads' : 'documents'}/${item.fileName}`"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="w-full md:w-auto flex justify-center items-center gap-2">
                    <Icon
                      :icon="`heroicons:${props.isDownload ? 'document-arrow-down' : 'magnifying-glass'}`"
                      class="text-2xl hidden md:block" />
                    <span class="md:hidden font-bold w-full text-center">{{
                      props.isDownload ? 'Download File' : 'View Document'
                    }}</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </DataView>
</template>

<style lang="css" scoped></style>
