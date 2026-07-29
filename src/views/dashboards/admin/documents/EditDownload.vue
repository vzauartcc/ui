<script setup lang="ts">
import { filesService } from '@/services/files/files.service';
import type { IDownload } from '@/services/files/files.types';
import { s3Service } from '@/services/s3.service';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

const router = useRouter();
const fileData = ref<File | null>(null);

const typeOptions = ref([
  {
    name: 'Facility Files',
    value: 'sectorFiles',
  },
  {
    name: 'Instructor Guides',
    value: 'insguides',
  },
  {
    name: 'Instructor Reference',
    value: 'ins',
  },
  {
    name: 'Training Downloads',
    value: 'training',
  },
]);

const file = ref<IDownload | null>(null);
const initialValues = ref<Partial<IDownload>>({});

onMounted(async () => {
  if (!id) return;

  if (id === 'new') {
    useTitle('Create Download');

    initialValues.value = {
      _id: '',
      name: '',
      description: '',
      fileName: '',
      category: '',
    };
    file.value = {} as IDownload;

    return;
  }
  try {
    useTitle('Edit Download');

    const data = await filesService.getDownload(id);

    file.value = data;
    initialValues.value = data;
  } catch (e) {
    console.error('error getting download', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.name) {
    errors.name = [{ message: 'Name is required' }];
  }

  if (!values.category) {
    errors.category = [{ message: 'Category is required' }];
  }

  if (values.description && values.description.length > 5000) {
    errors.description = [
      { message: 'Description must be less than 5000 characters.' },
    ];
  }

  return {
    values,
    errors,
  };
};

const onFileSelect = (event: FileUploadSelectEvent) => {
  if (event.files && event.files.length > 0) {
    fileData.value = event.files[0];
  }
};

const onSubmit = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  try {
    if (file.value!._id) {
      const data = await filesService.editDownload(
        file.value!._id,
        values as IDownload,
        fileData.value,
      );

      if (data.url !== '') {
        await uploadDownload(data.url);
      }

      toastSuccess(
        'Download Saved!',
        'Successfully saved changes to the download.',
      );
    } else {
      const data = await filesService.createDownload(
        values as IDownload,
        fileData.value,
      );

      if (data.url !== '') {
        await uploadDownload(data.url);
      }
      toastSuccess('Download Created!', 'Successfully created the download.');
    }
    router.push('/admin/files/downloads');
  } catch (e) {
    console.error('error saving file changes', e);
  }

  uploadProgress.value = -1;
};

const uploadProgress = ref(-1);
const uploadDownload = async (url: string) => {
  try {
    uploadProgress.value = 0;
    await s3Service.upload(
      url,
      fileData.value!,
      fileData.value!.type,
      (progress) => (uploadProgress.value = progress),
    );

    await new Promise((resolve) => setTimeout(resolve, 1000));
  } catch (e) {
    console.error('error uploading to s3', e);
    toastError('Error uploading!', 'An error occurred uploading the file.');
  }
};
</script>

<template>
  <ProgressSpinner v-if="!file" />
  <Card v-else>
    <template #title
      >{{ initialValues._id ? 'Edit' : 'Create' }} Download</template
    >
    <template #content>
      <Form
        v-slot="$form"
        :resolver
        v-model:initialValues="initialValues"
        @submit="onSubmit">
        <div class="grid grid-cols-1 gap-5">
          <FormField v-slot="$field" name="name">
            <FloatLabel variant="on">
              <InputText id="name" class="w-1/2" />
              <label for="name" class="required-field">Name</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FormField v-slot="$field" name="description">
            <FloatLabel variant="on">
              <Textarea id="description" class="w-full" :rows="3" />
              <label for="description">Description</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FormField v-slot="$field" name="category">
            <FloatLabel variant="on">
              <Select
                id="category"
                :options="typeOptions"
                optionLabel="name"
                optionValue="value"
                class="w-1/3" />
              <label for="category" class="required-field">Category</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FileUpload
            :maxFileSize="100000000000"
            :fileLimit="1"
            :auto="false"
            @select="onFileSelect">
            <template #header="{ chooseCallback, files }">
              <Button
                @click="chooseCallback()"
                label="Choose"
                :disabled="files.length > 0" />
            </template>
            <template #empty>
              <div class="flex items-center justify-center flex-col">
                <Icon
                  icon="heroicons:cloud-arrow-up"
                  class="no-pointer text-6xl" />
                <p class="mt-6 mb-0">
                  Drag and drop file here to replace upload.
                </p>
              </div>
            </template>
            <template #content="{ files }">
              <div class="flex flex-wrap gap-4 w-full">
                <div
                  v-if="files.length === 0"
                  class="p-8 rounded-border flex flex-col border border-surface items-center gap-4 w-full">
                  <span
                    class="font-semibold text-ellipsis whitespace-nowrap overflow-hidden">
                    {{ file.fileName }}
                  </span>
                </div>
                <div
                  v-else
                  v-for="tmpFile of files"
                  :key="tmpFile.name + tmpFile.type + tmpFile.size"
                  class="p-8 rounded-border flex flex-col border border-surface items-center gap-4 w-full">
                  <span
                    class="font-semibold text-ellipsis whitespace-nowrap overflow-hidden"
                    >{{ tmpFile.name }}</span
                  >
                </div>
              </div>
            </template>
          </FileUpload>

          <template v-if="uploadProgress >= 0">
            <span>Uploading</span>
            <ProgressBar :value="uploadProgress" />
          </template>

          <div class="flex justify-end">
            <Button
              type="submit"
              :label="file._id ? 'Save!' : 'Create!'"
              :disabled="
                !$form?.valid ||
                (!file._id && ($form?.name?.pristine || !fileData))
              " />
          </div>
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
