<script setup lang="ts">
import RichEditor from '@/components/RichEditor.vue';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import type {
  ITrainingMilestone,
  ITrainingSession,
} from '@/services/training/training.types';
import { useUserStore } from '@/stores/user';
import { localToUTC, roundToNearest15Minutes, utcToLocal } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { toastError } from '@/utils/toast';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import DatePicker from 'primevue/datepicker';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { ref } from 'vue';

const props = defineProps<{
  controllers: IFeedbackController[];
  milestones: ITrainingMilestone[];
  edit: ITrainingSession | null;
}>();
const emit = defineEmits(['finishSession']);

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const submitType = ref<'' | 'submit' | 'save'>('');

const initialValues = ref({
  studentCid: 0,
  milestoneCode: '',
  startTime: utcToLocal(
    roundToNearest15Minutes(new Date(Date.now() - 60 * 60 * 1000)),
  ),
  endTime: utcToLocal(roundToNearest15Minutes(new Date())),
  position: '',
  movements: 0,
  location: 0,
  progress: 3,
  ots: 0,
  studentNotes: '',
  insNotes: '',
});

if (props.edit) {
  initialValues.value = {
    studentCid: props.edit.studentCid,
    milestoneCode: props.edit.milestoneCode,
    startTime: utcToLocal(props.edit.startTime),
    endTime: utcToLocal(props.edit.endTime),
    position: props.edit.position,
    movements: props.edit.movements,
    location: props.edit.location,
    progress: props.edit.progress,
    ots: props.edit.ots,
    studentNotes: props.edit.studentNotes || '',
    insNotes: props.edit.insNotes || '',
  };
}

const locations = ref(['Classroom', 'Live Network', 'Sweatbox']);

const progressOptions = ref([
  { name: 'No Progress', value: 1 },
  { name: 'Little Progress', value: 2 },
  { name: 'Average Progress', value: 3 },
  { name: 'Great Progress', value: 4 },
  { name: 'Exceptional Progress', value: 5 },
]);

const otsOptions = ref(['No OTS', 'OTS Pass', 'OTS Fail', 'Recommend for OTS']);

const resolver = ({
  values,
}: FormResolverOptions & { values: Partial<ITrainingSession> }) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.studentCid || values.studentCid === undefined) {
    errors.studentCid = [{ message: 'Student is required.' }];
  }

  if (!values.startTime || values.startTime === undefined) {
    errors.startTime = [{ message: 'Start Time is required.' }];
  }

  if (!values.endTime || values.endTime === undefined) {
    errors.endTime = [{ message: 'End Time is required.' }];
  } else if (
    values.startTime &&
    new Date(values.startTime) > new Date(values.endTime)
  ) {
    errors.endTime = [{ message: 'End Time must be after Start Time.' }];
  }

  if (!values.milestoneCode || values.milestoneCode === undefined) {
    errors.milestoneCode = [{ message: 'Milestone is required.' }];
  }

  if (!values.position || values.position === undefined) {
    errors.position = [{ message: 'Position is required.' }];
  } else if (!/^[A-Z]_(FSS|CTR|APP|DEP|TWR|GND|DEL)$/.test(values.position)) {
    errors.position = [{ message: 'Position is invalid. Ex: CHI_APP.' }];
  }

  if (values.movements === null || values.movements === undefined) {
    errors.movements = [{ message: 'Movements is required.' }];
  }

  if (values.location === null || values.location === undefined) {
    errors.location = [{ message: 'Location is required.' }];
  }

  if (values.progress === null || values.progress === undefined) {
    errors.progress = [{ message: 'Progress is required.' }];
  }

  if (values.ots === null || values.ots === undefined) {
    errors.ots = [{ message: 'OTS is required.' }];
  }

  return {
    values,
    errors,
  };
};

const submitSession = async (event: FormSubmitEvent) => {
  if (!event.valid) {
    toastError(
      'Incomplete form!',
      'One or more required fields are incomplete.',
    );
    return;
  }

  if (submitType.value === '') {
    console.error('invalid submit type', submitType.value);
    return;
  }

  const { values } = event;

  emit('finishSession', submitType.value, {
    position: values.position,
    movements: values.movements,
    progress: values.progress,
    ots: values.ots,
    location: values.location,
    startTime: localToUTC(values.startTime),
    endTime: localToUTC(values.endTime),
    studentNotes: values.studentNotes,
    insNotes: values.insNotes,
  });
};

const maxEndTime = (startTime?: string | Date) => {
  if (!startTime) return new Date();

  const start = new Date(startTime);
  const maxDate = new Date(start.getTime() + 1000 * 60 * 60 * 10);

  const retval = roundToNearest15Minutes(maxDate);
  if (retval.getTime() > Date.now()) {
    return roundToNearest15Minutes(new Date());
  }

  return retval;
};
</script>

<template>
  <Form
    v-slot="$form"
    :initialValues="initialValues"
    :resolver
    @submit="submitSession">
    <div class="grid grid-cols-1 gap-5">
      <div class="grid md:grid-cols-2 gap-5">
        <div class="">
          <FormField v-slot="$field" name="studentCid">
            <FloatLabel variant="on">
              <Select
                id="controller"
                :options="controllers"
                optionLabel="name"
                optionValue="cid"
                filter
                class="w-full h-10"
                :disabled="edit !== null" />
              <label for="controller" class="required-field">Student</label>
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
        <div class="">
          <FloatLabel variant="on">
            <InputText
              id="instructor"
              type="text"
              :modelValue="compileUsersName(user!)"
              disabled
              class="w-full" />
            <label for="email">Instructor</label>
          </FloatLabel>
        </div>

        <FormField v-slot="$field" name="startTime">
          <FloatLabel variant="on">
            <DatePicker
              id="startTime"
              hourFormat="24"
              showTime
              :stepMinute="15"
              :maxDate="roundToNearest15Minutes(utcToLocal(new Date()))"
              :modelValue="initialValues.startTime"
              class="w-full" />
            <label for="startTime" class="required-field"
              >Start Time (Zulu)</label
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

        <FormField v-slot="$field" name="endTime">
          <FloatLabel variant="on">
            <DatePicker
              id="endTime"
              hourFormat="24"
              :minDate="
                $form.startTime?.value
                  ? utcToLocal(new Date($form?.startTime.value))
                  : initialValues.startTime
              "
              :maxDate="utcToLocal(maxEndTime($form?.startTime?.value))"
              :stepMinute="15"
              showTime
              :modelValue="initialValues.endTime"
              class="w-full" />
            <label for="endTime" class="required-field">End Time (Zulu)</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>

        <FormField v-slot="$field" name="milestoneCode">
          <FloatLabel variant="on">
            <Select
              id="milestoneCode"
              :options="milestones"
              optionLabel="name"
              optionValue="code"
              filter
              class="w-full h-10"
              :disabled="edit !== null" />
            <label for="milestoneCode" class="">Milestone</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>

        <FormField v-slot="$field" name="position">
          <div class="">
            <FloatLabel variant="on">
              <InputText id="position" type="string" class="w-full" />
              <label for="position">Position</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </div>
        </FormField>

        <FormField v-slot="$field" name="movements">
          <div class="">
            <FloatLabel variant="on">
              <InputNumber id="movements" type="string" class="w-full" />
              <label for="movements"># of Movements</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </div>
        </FormField>

        <FormField v-slot="$field" name="location">
          <FloatLabel variant="on">
            <Select
              id="location"
              :options="locations"
              class="w-full h-10"
              :optionValue="(option) => locations.indexOf(option)" />
            <label for="location" class="required-field">Location</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>

        <FormField v-slot="$field" name="progress">
          <FloatLabel variant="on">
            <Select
              id="progress"
              :options="progressOptions"
              class="w-full"
              optionValue="value"
              optionLabel="name" />
            <label for="progress" class="required-field">Progress</label>
          </FloatLabel>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </FormField>

        <FormField v-slot="$field" name="ots">
          <FloatLabel variant="on">
            <Select id="ots" :options="otsOptions" class="w-full" />
            <label for="ots" class="required-field">OTS</label>
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

      <FormField v-slot="$field" name="studentNotes">
        <label for="studentNotes" class="required-field">Student Notes</label>
        <RichEditor
          :content="$field.value"
          @updateEditor="$form.studentNotes!.value = $event" />
        <Message
          v-if="$field?.invalid"
          severity="error"
          size="small"
          variant="simple"
          >{{ $field.error?.message }}</Message
        >
      </FormField>

      <FormField v-slot="$field" name="insNotes">
        <FloatLabel variant="on">
          <Textarea id="insNotes" maxlength="5000" autoResize class="w-full" />
          <span
            class="char-counter"
            :class="{ 'text-red-500': $field?.value?.length === 5000 }"
            >{{ $field?.value?.length || 0 }}/5000</span
          >
          <label for="insNotes" class="">Instructor Notes (Optional)</label>
        </FloatLabel>
        <Message
          v-if="$field?.invalid"
          severity="error"
          size="small"
          variant="simple"
          >{{ $field.error?.message }}</Message
        >
      </FormField>

      <Message
        severity="warn"
        v-if="$form?.ots?.value === 1 || $form?.ots?.value === 2">
        Due to the OTS Pass/Fail selection, this training session cannot be
        modified later after submission to VATUSA, and any modifications need to
        be requested via VATUSA3.
      </Message>

      <div class="grid md:grid-cols-2 gap-5">
        <Button
          type="submit"
          label="Save"
          severity="secondary"
          :disabled="!$form?.valid"
          v-tooltip.top="'Save session to edit later'"
          @click="submitType = 'save'" />
        <Button
          type="submit"
          severity="success"
          label="Submit to VATUSA"
          :disabled="!$form?.valid"
          v-tooltip.top="'Submit session to VATUSA and make visible to student'"
          @click="submitType = 'submit'" />
      </div>
    </div>
  </Form>
</template>

<style lang="css" scoped></style>
