<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue';
import { staffingRequestService } from '@/services/staffingRequest/staffingRequest.service';
import { useUserStore } from '@/stores/user';
import { localToUTC } from '@/utils/date';
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
import DatePicker from 'primevue/datepicker';
import FloatLabel from 'primevue/floatlabel';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import Textarea from 'primevue/textarea';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('Request Staffing');

const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);
const router = useRouter();

const minDate = ref(new Date(Date.now() + 24 * 60 * 60 * 1000));

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.pilots) {
    errors.pilots = [
      { message: 'Number of pilots participating is required.' },
    ];
  }

  if (!values.route) {
    errors.route = [{ message: 'Proposed route is required.' }];
  }

  if (!values.vaName) {
    errors.vaName = [{ message: 'VA name is required.' }];
  }

  if (!values.date) {
    errors.date = [{ message: 'Request for staffing date is required.' }];
  }

  return {
    values,
    errors,
  };
};

const requestStaffing = async (event: FormSubmitEvent) => {
  if (!event.valid) {
    toastError(
      'Incomplete form!',
      'One or more required fields are incomplete.',
    );
    return;
  }

  const { values } = event;
  try {
    await staffingRequestService.createRequest(
      values.vaName,
      values.pilots,
      values.description,
      localToUTC(values.date),
      values.route,
    );

    toastSuccess(
      'Request Submitted!',
      'Your request for staffing has been sent to our Events Team!',
    );

    router.push('/');
  } catch (e) {
    console.error('error submitting request for staffing', e);
  }
};
</script>

<template>
  <Card>
    <template #title>Request Staffing</template>
    <template #content>
      <p>
        Flying in to or out of an airport under Chicago ARTCC's control and
        interested in controllers staffing it up? Fill out the form below and
        our Events Team will respond to your staffing request via your email
        address below.
      </p>
      <p>
        Requests for staffing are evaluated on a case-by-case basis. Our Events
        Team will determine the appropriate number of controllers to staff for
        your group flight.
      </p>
      <template v-if="!isLoggedIn || !user">
        <p>Please log in with VATSIM to submit a request for staffing.</p>
        <LoginButton />
      </template>
      <template v-else>
        <Form v-slot="$form" :resolver @submit="requestStaffing" class="mt-10">
          <div class="grid md:grid-cols-1 gap-2">
            <div class="grid md:grid-cols-2 gap-5">
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
            </div>
            <div class="grid md:grid-cols-3 gap-5">
              <div class="">
                <FormField v-slot="$field" name="vaName">
                  <FloatLabel variant="on">
                    <InputText
                      id="vaName"
                      type="text"
                      class="w-full"
                      maxlength="50"
                      minlength="2"
                      :spellcheck="false" />
                    <label for="vaName" class="required-field"
                      >Virtual Airline or Group Name</label
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
              <div class="">
                <FormField v-slot="$field" name="pilots">
                  <FloatLabel variant="on">
                    <InputText id="pilots" type="number" class="w-full" />
                    <label for="pilots" class="required-field"
                      ># of pilots participating</label
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
              <div class="">
                <FormField v-slot="$field" name="date">
                  <FloatLabel variant="on">
                    <DatePicker
                      id="date"
                      showTime
                      hourFormat="24"
                      :minDate="minDate"
                      class="w-full"
                      :stepMinute="15"
                      v-tooltip.top="
                        'If departing from inside of ZAU, this is your estimated departure time. If arriving inside of ZAU, this is your estimated entry time into ZAU\'s airspace.'
                      " />
                    <label for="date" class="required-field"
                      >Approximate entry in ZAU's Airspace</label
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
            </div>

            <FormField v-slot="$field" name="route">
              <FloatLabel variant="on">
                <Textarea
                  id="route"
                  maxlength="5000"
                  autoResize
                  :spellcheck="false"
                  class="w-full"
                  v-tooltip.top="
                    'Routing may change based on airport demand, weather, and/or traffic management initiatives.'
                  " />
                <span
                  class="char-counter"
                  :class="{ 'text-red-500': $field?.value?.length === 5000 }"
                  >{{ $field?.value?.length || 0 }}/5000</span
                >
                <label for="route" class="required-field">Proposed Route</label>
              </FloatLabel>
              <Message
                v-if="$field?.invalid"
                severity="error"
                size="small"
                variant="simple"
                >{{ $field.error?.message }}</Message
              >
            </FormField>

            <div class="md:mt-2">
              <FormField v-slot="$field" name="description">
                <FloatLabel variant="on">
                  <Textarea
                    id="description"
                    maxlength="5000"
                    autoResize
                    class="w-full" />
                  <span
                    class="char-counter"
                    :class="{ 'text-red-500': $field?.value?.length === 5000 }"
                    >{{ $field?.value?.length || 0 }}/5000</span
                  >
                  <label for="description">Additional Information</label>
                </FloatLabel>
              </FormField>
            </div>

            <Button
              type="submit"
              label="Send Request for Staffing"
              :disabled="
                !$form?.valid ||
                $form?.route?.pristine ||
                $form?.pilots?.pristine ||
                $form?.vaName?.pristine
              " />
          </div>
        </Form>
      </template>
    </template>
  </Card>
</template>

<style lang="css" scoped>
.counter {
  position: absolute;
  font-size: 0.8rem;
  right: 0.25rem !important;
}
</style>
