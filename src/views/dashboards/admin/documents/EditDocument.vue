<script setup lang="ts">
import SingleFileUpload from '@/components/admin/SingleFileUpload.vue';
import RichEditor from '@/components/RichEditor.vue';
import { filesService } from '@/services/files/files.service';
import type { IDocument } from '@/services/files/files.types';
import { s3Service } from '@/services/s3.service';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressBar from 'primevue/progressbar';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug[0]
  : route.params.slug;

const router = useRouter();

const fileData = ref<File | null>(null);

const singleFileUpload =
  useTemplateRef<InstanceType<typeof SingleFileUpload>>('singleFileUpload');

const typeOptions = ref([
  {
    name: 'Agreements',
    value: 'loa',
  },
  {
    name: 'Policies',
    value: 'policy',
  },
  {
    name: 'Procedures',
    value: 'sop',
  },
  {
    name: 'Reference',
    value: 'misc',
  },
  {
    name: 'Training',
    value: 'training',
  },
]);

const file = ref<IDocument | null>(null);
const initialValues = ref<Partial<IDocument>>({});

onMounted(async () => {
  if (!slug) return;

  if (slug === 'new') {
    useTitle('Create Document');

    initialValues.value = {
      name: '',
      category: '',
      description: '',
      content: '',
      type: 'file',
    };
    file.value = {} as IDocument;

    return;
  }

  try {
    useTitle('Edit Document');

    const data = await filesService.getDocument(slug);

    file.value = data;
    initialValues.value = data;
  } catch (e) {
    console.error('error getting file', e);
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

  if (values.type && values.type === 'doc' && !values.content) {
    errors.content = [{ message: 'Content is required' }];
  }

  return {
    values,
    errors,
  };
};

const onSubmit = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  if (
    values.type === 'file' &&
    (singleFileUpload.value?.getFileCount() ?? 0) > 1
  ) {
    toastError(
      'Invalid selection!',
      'Only one file can be uploaded at a time.',
    );
    return;
  }

  try {
    if (file.value!._id) {
      const data = await filesService.editDocument(
        file.value!.slug,
        values as IDocument,
        fileData.value,
      );

      if (data.url !== '') {
        await uploadDocument(data.url);
      }

      toastSuccess(
        'Document Saved!',
        'Successfully saved changes to the document.',
      );
    } else {
      const data = await filesService.createDocument(
        values as IDocument,
        fileData.value,
      );

      if (data.url !== '') {
        await uploadDocument(data.url);
      }

      toastSuccess('Document Created!', 'Successfully created the document.');
    }

    router.push('/admin/files/documents');
  } catch (e) {
    console.error('error saving file changes', e);
  }

  uploadProgress.value = -1;
};

const uploadProgress = ref(-1);
const uploadDocument = async (url: string) => {
  try {
    uploadProgress.value = 0;
    await s3Service.upload(
      url,
      fileData.value!,
      fileData.value!.type,
      (percent) => (uploadProgress.value = percent),
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
    <template #title>{{ file._id ? 'Edit' : 'Create' }} Document</template>
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
              <label for="description">Description (Optional)</label>
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

          <FormField name="type" class="flex flex-wrap gap-5">
            <div class="flex items-center gap-2.5">
              <RadioButton id="type" inputId="file" value="file" />
              <label for="file">File</label>
            </div>

            <div class="flex items-center gap-2.5">
              <RadioButton id="type" inputId="document" value="doc" />
              <label for="document">Document</label>
            </div>
          </FormField>

          <FormField
            v-slot="$field"
            v-if="$form?.type?.value === 'doc'"
            name="content">
            <RichEditor
              :content="$field.value"
              @updateEditor="$form.content!.value = $event" />
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <SingleFileUpload
            v-else
            v-model="fileData"
            :fileName="file.fileName"
            :maxFileSize="500 * 1024 * 1024"
            ref="singleFileUpload" />

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
                ($form?.type?.value === 'doc' && !$form?.content?.value) ||
                ($form?.type?.value === 'file' && !fileData && !slug)
              " />
          </div>
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
