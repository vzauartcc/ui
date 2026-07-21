<script setup lang="ts">
import { staffingRequestService } from '@/services/staffingRequest/staffingRequest.service';
import type { IStaffingRequest } from '@/services/staffingRequest/staffingRequest.types';
import { utcToLocal } from '@/utils/date';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import DatePicker from 'primevue/datepicker';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('Edit Staffing Request');

const route = useRoute();
const id =
  (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) || '';

const router = useRouter();

const staffingRequest = ref<IStaffingRequest | null>(null);
const initialValues = ref<IStaffingRequest>({
  vaName: '',
  name: '',
  email: '',
  route: '',
  description: '',
  accepted: false,
  pilots: 0,
  date: '',
  _id: '',
});

onMounted(async () => {
  try {
    const data = await staffingRequestService.getRequest(id);

    staffingRequest.value = data;
    initialValues.value = data;
    initialValues.value.date = utcToLocal(data.date).toString();
  } catch (e) {
    console.error('error getting staffing request', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.vaName) {
    errors.vaName = [{ message: 'VA Name is required' }];
  }

  if (!values.route) {
    errors.route = [{ message: 'Route is required' }];
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

const onSubmit = async (event: FormSubmitEvent) => {
  if (!event.valid || !staffingRequest.value) return;

  const { values } = event;

  const data = { ...staffingRequest.value, ...values };

  try {
    await staffingRequestService.editRequest(staffingRequest.value._id, data);
    toastSuccess(
      'Staffing Request Saved!',
      'The changes to the staffing request have been saved.',
    );
    router.push('/admin/events');
  } catch (e) {
    console.error('error saving staffing request', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!staffingRequest" />
  <Card v-else>
    <template #title>Edit Staffing Request</template>
    <template #content>
      <Form v-slot="$form" :initialValues :resolver @submit="onSubmit">
        <div class="grid grid-cols-3 gap-5">
          <FormField v-slot="$field" name="vaName">
            <FloatLabel variant="on">
              <InputText id="vaName" />
              <label for="vaName" class="required-field">VA Name</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <FloatLabel variant="on">
            <InputText name="name" v-model="staffingRequest.name" disabled />
            <label for="name">Requestor Name</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText name="email" v-model="staffingRequest.email" disabled />
            <label for="email">Requestor Email</label>
          </FloatLabel>
          <FloatLabel varient="on">
            <DatePicker
              :modelValue="new Date(initialValues.date)"
              disabled
              showTime />
            <label for="date">Date</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputNumber
              name="pilots"
              v-model="staffingRequest.pilots"
              :useGrouping="false"
              disabled />
            <label for="pilots">Number of Pilots</label>
          </FloatLabel>

          <div class="col-span-3">
            <FormField v-slot="$field" name="route">
              <FloatLabel variant="on">
                <InputText id="route" class="w-full" />
                <label for="route" class="required-field">Route</label>
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

          <div class="col-span-3">
            <FormField v-slot="$field" name="description">
              <FloatLabel variant="on">
                <Textarea id="description" class="w-full" />
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
          </div>

          <FormField
            v-slot="$field"
            name="accepted"
            class="flex flex-1 gap-2 items-center">
            <Checkbox binary id="accepted" />
            <span>Make visible to controllers</span>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
        </div>
        <div class="flex justify-end mt-5">
          <Button type="submit" label="Save!" :disabled="!$form?.valid" />
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
