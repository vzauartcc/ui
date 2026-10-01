<script setup lang="ts">
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { controllerService } from '@/services/controller/controller.service';
import type { ILeaveOfAbsence } from '@/services/controller/controller.types';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { dateAsMMDD, dateAsMMDDHHMM } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
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
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import DatePicker from 'primevue/datepicker';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { computed, onMounted, ref } from 'vue';

useTitle('Leave of Absences');

const loas = ref<ILeaveOfAbsence[] | null>(null);
const controllerList = ref<IFeedbackController[] | null>(null);

onMounted(async () => {
  fetchAbsences();

  try {
    const data = await feedbackService.getControllerList();

    controllerList.value = data;
  } catch (e) {
    console.error('error getting controller list', e);
  }
});

const fetchAbsences = async () => {
  try {
    const data = await controllerService.getAbsences();

    loas.value = data;
  } catch (e) {
    console.error('error getting leave of absences', e);
  }
};

const dateToString = (d: string) => {
  if (!d) return '';

  return dateAsMMDDHHMM(d);
};

const deleteVisible = ref(false);
const deleteData = ref<ILeaveOfAbsence | null>(null);
const loadDelete = (data: ILeaveOfAbsence) => {
  deleteData.value = data;
  deleteVisible.value = true;
};
const closeDelete = () => {
  deleteVisible.value = false;
  deleteData.value = null;
};

const getControllerName = computed(() => {
  if (!deleteData.value?.user) return '';

  return compileUsersName(deleteData.value.user);
});
const getCreatedAt = computed(() => {
  if (!deleteData.value) return '';

  return dateToString(deleteData.value.createdAt);
});
const getExpirationDate = computed(() => {
  if (!deleteData.value) return '';

  return dateToString(deleteData.value.expirationDate);
});

const { isSubmitting: isDeleting, execute: executeDelete } = useAsyncSubmit();

const deleteLoa = async () => {
  if (!deleteData.value) return;
  const loa = deleteData.value;

  await executeDelete(async () => {
    await controllerService.deleteAbsence(loa._id);

    closeDelete();
    toastSuccess('LOA Deleted!', 'Successfully deleted the LOA.');

    await fetchAbsences();
  });
};

interface ICreateData {
  controller: IFeedbackController | undefined;
  expirationDate: Date | undefined;
  reason: string;
}
const emptyCreateData = (): ICreateData => ({
  controller: undefined,
  expirationDate: undefined,
  reason: '',
});

const createVisible = ref(false);
const createData = ref<ICreateData>(emptyCreateData());

const openCreate = () => {
  createData.value = emptyCreateData();

  createVisible.value = true;
};
const closeCreate = () => {
  createVisible.value = false;
  createData.value = emptyCreateData();
};

const minDate = new Date();
minDate.setDate(minDate.getDate() + 1);

const startOfDay = (d: Date) => {
  const date = new Date(d);

  date.setUTCHours(0, 0, 0, 0);

  return date;
};

const createResolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.controller) {
    errors.controller = [{ message: 'Controller is required' }];
  }

  if (!values.expirationDate) {
    errors.expirationDate = [{ message: 'An end date is required' }];
  }

  if (!values.reason?.trim()) {
    errors.reason = [{ message: 'A reason is required' }];
  }

  return {
    values,
    errors,
  };
};

const { isSubmitting: isCreating, execute: executeCreate } = useAsyncSubmit();

const createLoa = async (event: FormSubmitEvent) => {
  if (!event.valid) {
    toastError(
      'Incomplete form!',
      'One or more required fields are incomplete.',
    );
    return;
  }

  const { values } = event;

  await executeCreate(async () => {
    const name = compileUsersName(values.controller);

    await controllerService.createAbsence(
      values.controller.cid,
      startOfDay(values.expirationDate),
      values.reason.trim(),
    );

    closeCreate();
    toastSuccess('LOA Created!', `${name}'s LOA has been created.`);

    await fetchAbsences();
  });
};
</script>

<template>
  <ProgressSpinner v-if="!loas" />
  <Card v-else>
    <template #title>Leave of Absences</template>
    <template #content>
      <DataTable :value="loas" stripedRows size="small">
        <template #header>
          <div class="flex justify-end">
            <Button label="New LOA" @click="openCreate" />
          </div>
        </template>
        <template #empty
          ><p class="italic">
            There are no Leave of Absences to display.
          </p></template
        >
        <Column field="name" header="Name">
          <template #body="{ data }">
            {{ compileUsersName(data.user) }}
          </template>
        </Column>
        <Column field="createdAt" header="LOA Start">
          <template #body="{ data }">
            {{ dateAsMMDD(data.createdAt) }}
          </template>
        </Column>
        <Column field="expirationDate" header="LOA End">
          <template #body="{ data }">
            {{ dateAsMMDD(data.expirationDate) }} ({{
              Math.round(
                (new Date(data.expirationDate).getTime() -
                  new Date().getTime()) /
                  (1000 * 60 * 60 * 24),
              )
            }}
            days)
          </template>
        </Column>
        <Column
          field="options"
          header="Options"
          headerClass="text-right"
          bodyClass="text-right">
          <template #body="{ data }">
            <span v-tooltip.top="'View LOA'" @click="loadDelete(data)">
              <Icon icon="heroicons:magnifying-glass" />
            </span>
          </template>
        </Column>
      </DataTable>
    </template>
  </Card>

  <Dialog
    v-model:visible="deleteVisible"
    modal
    dismissableMask
    header="Leave of Absence Details"
    class="w-3/4">
    <div class="grid grid-cols-3 gap-5 mt-5">
      <FloatLabel variant="on">
        <InputText id="name" v-model="getControllerName" disabled />
        <label for="name">Controller</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="createdAt" v-model="getCreatedAt" disabled />
        <label for="createdAt">Submission Date</label>
      </FloatLabel>
      <FloatLabel variant="on">
        <InputText id="expirationDate" v-model="getExpirationDate" disabled />
        <label for="expirationDate">Expiration Date</label>
      </FloatLabel>
    </div>
    <Divider />
    <p>Reason</p>
    <p id="comments" class="whitespace-pre-line break-words">
      {{ deleteData!.reason }}
    </p>

    <template #footer>
      <Button
        severity="danger"
        label="Delete"
        @click="deleteLoa"
        :loading="isDeleting" />
      <Button outlined label="Close" @click="deleteVisible = false" />
    </template>
  </Dialog>

  <Dialog
    v-model:visible="createVisible"
    modal
    dismissableMask
    header="New Leave of Absence"
    class="w-3/4">
    <Form
      v-slot="$form"
      :initialValues="createData"
      :resolver="createResolver"
      @submit="createLoa">
      <div class="grid grid-cols-2 gap-5 mt-5">
        <FormField v-slot="$field" name="controller">
          <FloatLabel variant="on">
            <Select
              id="createController"
              :options="controllerList ?? []"
              optionLabel="name"
              filter
              class="w-full h-10">
              <template #value="slotProps">
                <template v-if="slotProps.value">
                  {{ compileUsersName(slotProps.value) }}
                </template>
                <template v-else>
                  {{ slotProps.placeholder }}
                </template>
              </template>
              <template #option="{ option }">
                {{ compileUsersName(option) }}
              </template>
            </Select>
            <label for="createController" class="required-field"
              >Controller</label
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

        <FormField v-slot="$field" name="expirationDate">
          <FloatLabel variant="on">
            <DatePicker
              id="expirationDate"
              v-model="$field.value"
              :minDate="minDate"
              showIcon
              class="w-full" />
            <label for="expirationDate" class="required-field">LOA End</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>

        <div class="col-span-2">
          <FormField v-slot="$field" name="reason">
            <FloatLabel variant="on">
              <Textarea
                id="createReason"
                maxlength="5000"
                autoResize
                class="w-full" />
              <label for="createReason" class="required-field">Reason</label>
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
      </div>

      <div class="flex justify-end gap-2.5 mt-5">
        <Button
          label="Create LOA"
          type="submit"
          :disabled="!$form?.valid"
          :loading="isCreating" />
        <Button type="button" outlined label="Cancel" @click="closeCreate" />
      </div>
    </Form>
  </Dialog>
</template>

<style lang="css" scoped></style>
