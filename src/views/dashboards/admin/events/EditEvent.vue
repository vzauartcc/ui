<script setup lang="ts">
import { eventService } from '@/services/events/events.service';
import type { IEvent, IPosition } from '@/services/events/events.types';
import { s3Service } from '@/services/s3.service';
import { localToUTC, roundToNearest15Minutes, utcToLocal } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import {
  Form,
  FormField,
  type FormInstance,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import FileUpload, { type FileUploadSelectEvent } from 'primevue/fileupload';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import {
  nextTick,
  onMounted,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const slug = Array.isArray(route.params.slug)
  ? route.params.slug[0]
  : route.params.slug;

const router = useRouter();

const eventData = ref<IEvent | null>(null);
const fileData = ref<File | null>(null);
const initialValues = ref<Partial<IEvent>>({
  name: '',
  description: '',
  eventStart: '',
  eventEnd: '',
  positions: [],
  requiresEventEndorsement: false,
});
const formRef = useTemplateRef<FormInstance>('formRef');

onMounted(async () => {
  if (!slug) return;

  if (slug === 'new') {
    useTitle('Create Event');
    eventData.value = {} as IEvent;

    return;
  }

  try {
    useTitle('Edit Event');
    const data = await eventService.getEvent(slug);

    initialValues.value = data;
    initialValues.value.eventStart = utcToLocal(
      roundToNearest15Minutes(data.eventStart),
    );
    initialValues.value.eventEnd = utcToLocal(
      roundToNearest15Minutes(data.eventEnd),
    );
    eventData.value = data;
  } catch (e) {
    console.error('error getting event', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.name) {
    errors.name = [{ message: 'Name is required' }];
  }

  if (
    !values.description ||
    (values.description && values.description.length > 5000)
  ) {
    errors.description = [
      { message: 'Description must be less than 5000 characters.' },
    ];
  }

  if (!values.eventStart) {
    errors.eventStart = [{ message: 'Event Start is required.' }];
  }

  if (!values.eventEnd) {
    errors.eventStart = [{ message: 'Event End is required.' }];
  } else if (
    values.eventStart &&
    new Date(values.eventStart) > new Date(values.eventEnd)
  ) {
    errors.eventStart = [{ message: 'Event Start must be before Event End.' }];
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

const deletePosition = (index: number) => {
  if (!formRef.value) return;

  const currentPositions = [
    ...((formRef.value.states.positions?.value as IPosition[]) || []),
  ];

  currentPositions.splice(index, 1);

  formRef.value.setFieldValue('positions', currentPositions);
};

const positionInput = useTemplateRef<
  InstanceType<typeof InputText> & ComponentPublicInstance
>('positionInput');
const addPositionData = ref('');
const addPosition = async () => {
  if (!formRef.value) return;

  if (
    formRef.value.states
      .positions!.value.map((p: IPosition) => p.pos)
      .includes(addPositionData.value)
  ) {
    toastError(
      'Position Already Exists!',
      addPositionData.value + ' is already added for this event.',
    );
    return;
  }

  formRef.value.states.positions!.value.push({ pos: addPositionData.value });

  addPositionData.value = '';

  // Focus trap the InputText element for quick position adding.
  await nextTick();
  if (positionInput.value) {
    const inputElement = positionInput.value.$el;
    if (inputElement) {
      inputElement.focus();
    }
  }
};

const onSubmit = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  try {
    if (eventData.value?._id) {
      const positions = values.positions.map((p: IPosition) => p.pos);

      const data = await eventService.editEvent(
        eventData.value!.url,
        values.name,
        localToUTC(values.eventStart),
        localToUTC(values.eventEnd),
        values.description,
        positions,
        fileData.value,
        values.requiresEventEndorsement,
      );

      if (data.url !== '') {
        await uploadBanner(data.url);
      }
    } else {
      const data = await eventService.createEvent(
        values.name,
        localToUTC(values.eventStart),
        localToUTC(values.eventEnd),
        values.description,
        fileData.value!,
        values.requiresEventEndorsement,
      );

      if (data.url !== '') {
        await uploadBanner(data.url);
      }
    }

    toastSuccess('Event Updated!', 'The event has been successfully updated.');
    router.push('/admin/events');
  } catch (e) {
    console.error('error saving event', e);
  }

  uploadProgress.value = -1;
};

const uploadProgress = ref(-1);
const uploadBanner = async (url: string) => {
  try {
    uploadProgress.value = 0;

    await s3Service.upload(
      url,
      fileData.value!,
      fileData.value!.type,
      (percent) => (uploadProgress.value = percent),
    );
  } catch (e) {
    console.error('error uploading to s3', e);
    toastError('Error Uploading!', 'Error uploading the file.');
  }
};

const minEndTime = (startTime?: string | Date) => {
  if (!startTime) return new Date();

  const start = new Date(startTime);
  const minDate = new Date(start.getTime() + 1000 * 60 * 60 * 2);

  return roundToNearest15Minutes(minDate);
};
</script>

<template>
  <ProgressSpinner v-if="!eventData" />
  <Card v-else>
    <template #title>{{ eventData.url ? 'Edit' : 'Create' }} Event</template>
    <template #content>
      <Form
        v-slot="$form"
        :initialValues
        :resolver
        @submit="onSubmit"
        ref="formRef">
        <div class="grid grid-cols-1 gap-5">
          <FormField v-slot="$field" name="name">
            <FloatLabel variant="on">
              <InputText id="name" class="w-full" />
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

          <div class="grid grid-cols-2 gap-5">
            <FormField v-slot="$field" name="eventStart">
              <FloatLabel variant="on">
                <DatePicker
                  id="eventStart"
                  showTime
                  class="w-full"
                  hourFormat="24"
                  :modelValue="initialValues.eventStart as Date"
                  :stepMinute="15" />
                <label for="eventStart" class="required-field"
                  >Event Start Time (Zulu)</label
                >
              </FloatLabel>
              <Message
                v-if="$field?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $field.error?.message }}</Message
              >
            </FormField>

            <FormField v-slot="$field" name="eventEnd">
              <FloatLabel variant="on">
                <DatePicker
                  id="eventEnd"
                  showTime
                  hourFormat="24"
                  class="w-full"
                  :modelValue="initialValues.eventEnd as Date"
                  :minDate="
                    $form.eventStart?.value
                      ? minEndTime($form.eventStart.value)
                      : undefined
                  "
                  :stepMinute="15" />
                <label for="eventEnd" class="required-field"
                  >Event End Time (Zulu)</label
                >
              </FloatLabel>
              <Message
                v-if="$field?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $field.error?.message }}</Message
              >
            </FormField>
          </div>

          <FormField v-slot="$field" name="description">
            <FloatLabel variant="on">
              <Textarea id="description" class="w-full" />
              <label for="name" class="required-field">Description</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FormField name="requiresEventEndorsement">
            <div class="flex gap-2.5 items-center">
              <Checkbox binary id="requiresEventEndorsement" />
              <span>Event Endorsement required for one or more positions.</span>
            </div>
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
                    {{ eventData.bannerUrl }}
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
        </div>

        <Card class="my-2" v-if="eventData._id">
          <template #title>Positions</template>
          <template #content>
            <FormField v-slot="$field" name="positions">
              <DataTable :value="$field.value" stripedRows size="small">
                <Column field="pos" header="Position" />
                <Column
                  field="options"
                  header="Options"
                  bodyClass="text-right"
                  headerClass="text-right">
                  <template #body="{ index }">
                    <span v-tooltip.top="'Delete Position'">
                      <Icon
                        icon="heroicons:trash"
                        class="text-red-500"
                        @click="deletePosition(index)" />
                    </span>
                  </template>
                </Column>
              </DataTable>
            </FormField>
          </template>
          <template #footer>
            <div class="flex items-center gap-2.5">
              <InputText
                ref="positionInput"
                id="addPosition"
                v-model="addPositionData"
                placeholder="CHI_35_CTR"
                @keydown.enter.prevent="addPosition" />
              <Button
                v-tooltip.top="'Add Position'"
                type="button"
                @click="addPosition">
                <Icon icon="heroicons:plus" />
              </Button>
            </div>
          </template>
        </Card>

        <div class="flex justify-end mt-5">
          <Button type="submit" :label="slug ? 'Save!' : 'Create!'" />
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
