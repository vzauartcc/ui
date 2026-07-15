<script setup lang="ts">
import { localToUTC } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess, toastWarning } from '@/utils/toast';
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { trainingService } from '@/services/training/training.service';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import DatePicker from 'primevue/datepicker';
import FloatLabel from 'primevue/floatlabel';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('Issue Solo Endorsement');

const router = useRouter();

const controllers = ref<IFeedbackController[] | null>(null);
const endorsements = ref<ICertification[] | null>(null);

const availablePositions = ref(['MKE_APP', 'CHI_CTR']);

const minExpirationDate = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);

  return d;
});

const maxExpirationDate = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 45);

  return d;
});

onMounted(async () => {
  try {
    const data = await feedbackService.getControllerList();

    controllers.value = data;
  } catch (e) {
    console.error('error getting controller list', e);
  }

  try {
    const data = await controllerService.getCertifications();

    endorsements.value = data
      .filter((m) => m.class.includes('solo'))
      .sort((a, b) => a.order - b.order);
  } catch (e) {
    console.error('error getting endorsements', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.controller) {
    errors.controller = [{ message: 'Student is required' }];
  }

  if (!values.position) {
    errors.position = [{ message: 'Position is required.' }];
  }

  if (!values.expirationDate) {
    errors.expirationDate = [{ message: 'Expiration Date is required' }];
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

    await trainingService.createSoloEndorsement(
      values.controller.cid,
      values.position,
      localToUTC(values.expirationDate),
    );

    toastSuccess(
      'Solo Endorsement Issued!',
      `Solo Endorsement issued to ${values.controller}.`,
    );
    toastWarning(
      'Controller Update Required',
      'Please assign the appropriate solo endorsement.',
    );

    router.push(`/ins/controller/${values.controller.cid}`);
  } catch (e) {
    console.error('error saving form', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!controllers || !endorsements" />
  <Card v-else>
    <template #title>Issue Solo Endorsement</template>
    <template #content>
      <p>
        Solo endorsements may be issued to students who have demonstrated
        sufficient competency on the position for which they are receiving the
        solo endorsement.
      </p>
      <p>
        Solo endorsements must be issued in accordance with
        <b>vZAU 3120.4</b> and <b>VATUSA DP002</b>.
      </p>
      <p>
        Solo endorsements may not be issued for more than <b>45 days</b> in
        length.
      </p>

      <Form v-slot="$form" :resolver @submit="saveForm" class="mt-10">
        <div class="grid grid-cols-1 gap-2">
          <div class="grid md:grid-cols-3 gap-5">
            <FormField v-slot="$field" name="controller">
              <FloatLabel variant="on">
                <Select
                  id="controller"
                  :options="controllers"
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
                  <template #option="{ option }">{{
                    compileUsersName(option)
                  }}</template>
                </Select>
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

            <FormField v-slot="$field" name="position">
              <FloatLabel variant="on">
                <Select
                  id="position"
                  :options="availablePositions"
                  class="w-full" />
                <label for="position" class="required-field"
                  >Position Worked</label
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
                  :minDate="minExpirationDate"
                  :maxDate="maxExpirationDate" />
                <label for="expirationDate" class="required-field"
                  >Expiration Date</label
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

          <Button
            type="submit"
            label="Issue Solo Endorsement"
            :disabled="
              !$form?.valid ||
              $form?.controller?.pristine ||
              $form?.position?.pristine ||
              $form.expirationDate?.pristine
            " />
          <p>Form submissions are automatically be sent to VATUSA.</p>
        </div>
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
