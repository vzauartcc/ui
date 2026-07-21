<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { useUserStore } from '@/stores/user';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import {
  Form,
  FormField,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('Submit Feedback');

const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);
const router = useRouter();

const controllerList = ref<IFeedbackController[] | null>(null);

const availablePositions = ref([
  { name: 'Center', value: 'center' },
  { name: 'Approach', value: 'approach' },
  { name: 'Tower', value: 'tower' },
  { name: 'Ground', value: 'ground' },
  { name: 'Delivery', value: 'delivery' },
]);

const availableRatings = ref([
  { name: 'Excellent', value: 5 },
  { name: 'Above Average', value: 4 },
  { name: 'Average', value: 3 },
  { name: 'Below Average', value: 2 },
  { name: 'Poor', value: 1 },
]);

onMounted(async () => {
  try {
    const data = await feedbackService.getControllerList();

    controllerList.value = data;
  } catch (e) {
    console.error('error getting controller list', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.controller) {
    errors.controller = [{ message: 'Controller is required' }];
  }

  if (!values.rating) {
    errors.rating = [{ message: 'Rating is required' }];
  }

  if (!values.position) {
    errors.position = [{ message: 'Position is required' }];
  }

  if (!values.comments) {
    errors.comments = [{ message: 'A comment is required' }];
  } else {
  }

  return {
    values,
    errors,
  };
};

const sendFeedback = async (event: FormSubmitEvent) => {
  if (!event.valid) {
    toastError(
      'Incomplete form!',
      'One or more required fields are incomplete.',
    );
    return;
  }

  const { values } = event;

  try {
    await feedbackService.postFeedback(
      values.controller.cid,
      values.position,
      values.rating,
      values.comments,
      values.anonymous === true,
    );

    toastSuccess('Feedback Submitted!', 'Your feedback has been submitted.');
    router.push('/');
  } catch (err) {
    console.error('error submitting feedback', err);
  }
};
</script>

<template>
  <Card>
    <template #title>Leave Feedback</template>
    <template #content>
      <template v-if="!isLoggedIn">
        <p>
          We welcome your feedback! Please log in with your VATSIM account to
          leave feedback for one of our controllers.
        </p>
        <LoginButton />
      </template>
      <template v-else>
        <ProgressSpinner v-if="!controllerList || !user" />
        <template v-else>
          <p>
            We welcome your feedback! Use the form below to send feedback about
            one of our controllers.
          </p>
          <p>
            <b>Please note:</b> your identity will always be shared with the
            ATM, DATM, and TA, even if you select the 'Remain Anonymous' option.
          </p>
          <Form v-slot="$form" :resolver @submit="sendFeedback" class="mt-10">
            <div class="grid grid-cols-1 gap-2">
              <div class="grid md:grid-cols-3 gap-5">
                <div class="">
                  <FloatLabel variant="on">
                    <InputText
                      id="username"
                      type="text"
                      v-model="user.name"
                      disabled
                      class="w-full" />
                    <label for="username">Your Name</label>
                  </FloatLabel>
                </div>
                <div class="">
                  <FloatLabel variant="on">
                    <InputText
                      id="email"
                      type="text"
                      v-model="user.email"
                      disabled
                      class="w-full" />
                    <label for="email">Your Email Address</label>
                  </FloatLabel>
                </div>
                <div class="">
                  <FloatLabel variant="on">
                    <InputNumber
                      id="cid"
                      type="string"
                      v-model="user.cid"
                      disabled
                      class="w-full"
                      :useGrouping="false" />
                    <label for="cid">Your CID</label>
                  </FloatLabel>
                </div>
              </div>

              <div class="grid md:grid-cols-3 gap-5">
                <FormField v-slot="$field" name="controller">
                  <FloatLabel variant="on">
                    <Select
                      id="controller"
                      :options="controllerList"
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
                    <label for="controller" class="required-field"
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

                <FormField v-slot="$field" name="position">
                  <FloatLabel variant="on">
                    <Select
                      id="position"
                      :options="availablePositions"
                      optionLabel="name"
                      optionValue="value"
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

                <FormField v-slot="$field" name="rating">
                  <FloatLabel variant="on">
                    <Select
                      id="rating"
                      :options="availableRatings"
                      optionLabel="name"
                      optionValue="value"
                      class="w-full" />
                    <label for="rating" class="required-field"
                      >Controller Performance</label
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

              <FormField v-slot="$field" name="comments">
                <FloatLabel variant="on">
                  <Textarea
                    id="comments"
                    maxlength="5000"
                    autoResize
                    class="w-full" />
                  <span
                    class="char-counter"
                    :class="{ 'text-red-500': $field?.value?.length === 5000 }"
                    >{{ $field?.value?.length || 0 }}/5000</span
                  >
                  <label for="comments" class="required-field">Comments</label>
                </FloatLabel>
                <Message
                  v-if="$field?.invalid"
                  severity="error"
                  size="small"
                  variant="simple"
                  >{{ $field.error?.message }}</Message
                >
              </FormField>

              <FormField name="anonymous" class="flex items-center gap-4">
                <Checkbox id="anon" binary />
                <label for="anon">Remain anonymous?</label>
              </FormField>

              <Button
                type="submit"
                label="Send Feedback"
                :disabled="!$form?.valid || $form?.comments?.pristine" />
            </div>
          </Form>
        </template>
      </template>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
