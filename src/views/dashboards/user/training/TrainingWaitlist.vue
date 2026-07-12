<script setup lang="ts">
import TrainingWaitlist from '@/components/training/TrainingWaitlist.vue';
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { trainingService } from '@/services/training/training.service';
import type { ITrainingWaitlist } from '@/services/training/training.types';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';
import MultiSelect from 'primevue/multiselect';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('Training Waitlist');

const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const router = useRouter();

const waitlist = ref<ITrainingWaitlist[] | null>(null);
const endorsements = ref<ICertification[]>([]);

const visible = ref(false);

const availability = ref([
  'Weekday Mornings',
  'Weekday Afternoons',
  'Weekday Nights',
  'Weekend Mornings',
  'Weekend Afternoons',
  'Weekend Nights',
]);

onMounted(async () => {
  try {
    const data = await trainingService.getWaitlist();

    waitlist.value = data;
  } catch (e) {
    console.error('error getting waitlist', e);
  }

  try {
    const data = await controllerService.getCertifications();

    endorsements.value = data;
  } catch (e) {
    console.error('error getting endorsements', e);
  }
});

const isOnWaitlist = computed(() => {
  return (
    waitlist.value &&
    user.value &&
    waitlist.value.some((w) => w.studentCid === user.value!.cid)
  );
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

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
    if (!event.valid) return;

    const { values } = event;

    await trainingService.createWaitlistEntry({
      student: user.value!.cid,
      certification: values.endorsement,
      availability: values.availability,
    });

    toastSuccess(
      'Waitlist Signup Recorded!',
      `You have been added to the waitlist.`,
    );

    visible.value = false;

    router.push('/dash/training/waitlist');
  } catch (e) {
    console.error('error saving form', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!waitlist" />
  <Card v-else>
    <template #title>Training Waitlist</template>
    <template #content>
      <Button
        severity="success"
        label="Join Waitlist"
        v-if="user!.rating < 5 && !isOnWaitlist"
        @click.prevent="visible = true" />
      <Message severity="error" v-if="isOnWaitlist"
        >You are on the waitlist.<span
          class="font-bold"
          v-if="
            waitlist.find((w) => w.studentCid === user!.cid)!.instructorCid > 0
          ">
          You have been assigned an instructor.</span
        ></Message
      >
      <TrainingWaitlist :waitlist="waitlist" showStats />
    </template>
  </Card>
  <Dialog
    modal
    v-model:visible="visible"
    class="w-1/2"
    header="Waitlist Signup">
    <Form v-slot="$form" :resolver @submit="saveForm" class="mt-10">
      <div class="grid grid-cols-1 gap-2">
        <FormField v-slot="$field" name="endorsement">
          <FloatLabel variant="on">
            <Select
              id="endorsement"
              :options="endorsements"
              optionLabel="name"
              optionValue="code"
              class="w-full" />
            <label for="endorsement" class="required-field">Milestone</label>
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
              :options="availability"
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

        <p>
          Note: the waitlist is not processed in order. Students are assigned an
          instructor based on availability matches and requested endorsement.
        </p>

        <p>
          Please ensure that you've studied the relevant training material, as
          per
          <b>vZAU 3120.4</b>, before requesting a session.
        </p>

        <Button
          type="submit"
          label="Sign up!"
          :disabled="
            !$form?.valid ||
            $form?.certCode?.pristine ||
            $form.availability?.pristine
          " />
      </div>
    </Form>
  </Dialog>
</template>

<style lang="css" scoped></style>
