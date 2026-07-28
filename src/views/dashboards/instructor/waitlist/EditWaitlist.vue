<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { trainingService } from '@/services/training/training.service';
import type {
  IInstructor,
  ITrainingWaitlist,
} from '@/services/training/training.types';
import { compileUsersName } from '@/utils/text';
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
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import MultiSelect from 'primevue/multiselect';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('Edit Waitlist Signup');

const route = useRoute();
const id =
  (Array.isArray(route.params.id) ? route.params.id[0] : route.params.id) || '';

const router = useRouter();
const endorsements = ref<ICertification[] | null>(null);
const instructors = ref<IInstructor[] | null>(null);

const signup = ref<ITrainingWaitlist | null>(null);

const initialValues = ref({
  studentCid: -1,
  availability: [] as string[],
  instructor: -1,
  endorsement: '',
  notes: '',
});

const availabilityOptions = ref([
  'Weekday Mornings',
  'Weekday Afternoons',
  'Weekday Nights',
  'Weekend Mornings',
  'Weekend Afternoons',
  'Weekend Nights',
]);

onMounted(async () => {
  try {
    const data = await trainingService.getWaitlistEntry(id);

    initialValues.value = {
      studentCid: data.studentCid,
      availability: data.availability,
      instructor: data.instructorCid || -1,
      endorsement: data.certCode,
      notes: data.notes || '',
    };

    signup.value = data;
  } catch (e) {
    console.error('error getting controllers', e);
  }

  try {
    const data = await controllerService.getCertifications();

    endorsements.value = data;
  } catch (e) {
    console.error('error getting certifications', e);
  }

  try {
    const data = await trainingService.getInstructors();

    instructors.value = [
      {
        _id: '',
        cid: -1,
        fname: 'Unassigned',
        lname: '',
        name: 'Unassigned',
      },
      ...data,
    ];
  } catch (e) {
    console.error('error getting instructors', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.instructor) {
    errors.instructor = [{ message: 'Instructor is required' }];
  }

  if (!values.endorsement) {
    errors.endorsement = [{ message: 'Milestone is required.' }];
  }

  if (!values.availability) {
    errors.availability = [{ message: 'Availability is required' }];
  }

  return {
    values,
    errors,
  };
};

const saveForm = async (event: FormSubmitEvent) => {
  try {
    if (!event.valid || !signup.value) return;

    const { values } = event;

    await trainingService.editWaitlistEntryManual(signup.value._id, {
      instructor: values.instructor,
      certification: values.endorsement,
      availability: values.availability,
      notes: values.notes,
    });

    toastSuccess(
      'Waitlist Entry Updated!',
      `${compileUsersName(signup.value.student)}'s waitlist entry has been updated.`,
    );

    router.push('/ins/waitlist');
  } catch (e) {
    console.error('error saving form', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!instructors || !endorsements || !signup" />
  <Card v-else>
    <template #title>Edit Waitlist Entry</template>
    <template #content>
      <Form
        v-slot="$form"
        v-model:initialValues="initialValues"
        :resolver
        @submit="saveForm">
        <div class="grid grid-cols-1 gap-2">
          <div class="grid md:grid-cols-2 gap-5">
            <FormField name="controller">
              <FloatLabel variant="on">
                <InputText
                  id="controller"
                  class="w-full"
                  disabled
                  :modelValue="compileUsersName(signup.student)" />
                <label for="controller" class="required-field">Student</label>
              </FloatLabel>
            </FormField>

            <FormField v-slot="$field" name="instructor">
              <FloatLabel variant="on">
                <Select
                  id="instructor"
                  :options="instructors"
                  optionLabel="name"
                  optionValue="cid"
                  class="w-full" />
                <label for="instructor" class="required-field"
                  >Assigned Instructor</label
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

            <FormField v-slot="$field" name="endorsement">
              <FloatLabel variant="on">
                <Select
                  id="endorsement"
                  :options="endorsements"
                  optionLabel="name"
                  optionValue="code"
                  class="w-full" />
                <label for="endorsement" class="required-field"
                  >Milestone</label
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

            <FormField v-slot="$field" name="availability">
              <FloatLabel variant="on">
                <MultiSelect
                  id="availability"
                  :options="availabilityOptions"
                  class="w-full" />
                <label for="availability" class="required-field"
                  >Availability</label
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

            <FormField v-slot="$field" name="notes" class="col-span-2">
              <FloatLabel variant="on">
                <InputText type="text" id="notes" class="w-full" />
                <label for="notes">Notes (Optional)</label>
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

          <Button type="submit" label="Edit Signup" :disabled="!$form?.valid" />
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
