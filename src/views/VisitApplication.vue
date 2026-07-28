<script setup lang="ts">
import LoginButton from '@/components/LoginButton.vue';
import { controllerService } from '@/services/controller/controller.service';
import { useUserStore } from '@/stores/user';
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
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Textarea from 'primevue/textarea';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

useTitle('Visitor Application');

const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);

const loading = ref(true);
const ineligible = ref([] as string[]);
const alreadyApplied = ref(false);

const initialValues = ref({
  facility: '',
  reason: '',
});

onMounted(async () => {
  if (!user.value) {
    loading.value = false;
    return;
  }

  if (user.value.isMember) {
    toastError(
      'Forbidden!',
      'This page does not apply to you, redirecting you to safety.',
    );
    router.push('/');
  }

  try {
    const data = await controllerService.checkVisitStatus();

    alreadyApplied.value = data.count > 0;

    if (!data.status.hasHome) {
      ineligible.value.push('no home facility');
    }
    if (!data.status.needsBasic) {
      ineligible.value.push('need basic training');
    }
    if (!data.status.hasRating) {
      ineligible.value.push('rating less than S3');
    }
    if (!data.status.promo) {
      ineligible.value.push(
        `recently promoted (${data.status.promoDays || 'Unknown'} days ago)`,
      );
    }
    if (!data.status.ratingConsolidation) {
      ineligible.value.push(
        `rating hours less than 50 (${data.status.ratingHours || 'Unknown'} hours)`,
      );
    }
    if (!data.status.recentlyRostered) {
      ineligible.value.push(
        `added to a roster in the past 60 days (${data.status.visitingDays || 'Unknown'} days ago)`,
      );
    }
  } catch (e) {
    console.error('error getting visiting checks', e);
  } finally {
    loading.value = false;
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.facility || values.facility.trim() === '') {
    errors.facility = [{ message: 'Home Facility/FIR is required.' }];
  }

  if (!values.reason || values.reason.trim() === '') {
    errors.reason = [{ message: 'Reason for visiting status is required.' }];
  }

  return { values, errors };
};

const router = useRouter();
const submitApplication = async (event: FormSubmitEvent) => {
  if (!event.valid || !user.value) return;

  const { values } = event;
  try {
    await controllerService.submitVisitApplication(
      values.facility,
      values.reason,
      user.value.email,
    );

    toastSuccess(
      'Application Submitted!',
      'Your visiting application has been submitted.',
    );

    router.push('/');
  } catch (e) {
    console.error('error submitting application', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="loading" />
  <Card v-else>
    <template #title>Visitor Application</template>
    <template #content>
      <template v-if="!isLoggedIn">
        <p>
          Thank you for your interest in visiting the Virtual Chicago ARTCC. To
          apply for visiting status, please login with VATSIM.
        </p>
        <LoginButton />
      </template>
      <p v-else-if="alreadyApplied">
        We have received your visiting application, and our staff team will
        review it shortly. In the meantime, if you have any questions or
        concerns, please
        <a href="mailto:datm@zauartcc.org" class="underline"
          >reach out to our DATM</a
        >.
      </p>
      <template v-else-if="ineligible.length > 0">
        <p>
          <a href="https://www.vatusa.net/my/profile" class="underline"
            >According to VATUSA's records</a
          >, you do not meet the requirements to become a visiting controller.
          Once you have meet the requirements, please come back to complete your
          visiting application.
        </p>
        <p>Requirements not met: {{ ineligible.join(', ') }}</p>
      </template>
      <template v-else>
        <p>
          <b class="text-red-500">Important:</b> Please ensure that you meet all
          requirements to become a visitor, as outlined in
          <a
            href="https://vatusa-storage.nyc3.cdn.digitaloceanspaces.com/docs/general-division-policy.pdf"
            class="underline"
            >VATUSA DP001, Chapter 14</a
          >. Any application that does not meet these requirements will be
          rejected.
        </p>
        <Form
          v-slot="$form"
          v-model:initialValues="initialValues"
          :resolver
          @submit="submitApplication">
          <div class="grid grid-cols-2 gap-5">
            <FloatLabel variant="on">
              <InputNumber
                name="cid"
                v-model="user!.cid"
                disabled
                readonly
                :useGrouping="false" />
              <label for="cid">CID</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText name="email" v-model="user!.email" disabled readonly />
              <label for="email">Email Address</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText
                name="firstName"
                v-model="user!.fname"
                disabled
                readonly />
              <label for="firstName">First Name</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText
                name="lastName"
                v-model="user!.lname"
                disabled
                readonly />
              <label for="lastName">Last Name</label>
            </FloatLabel>
            <FloatLabel variant="on">
              <InputText
                name="ratingLong"
                v-model="user!.ratingLong"
                disabled
                readonly />
              <label for="ratingLong">Rating</label>
            </FloatLabel>

            <FormField v-slot="$field" name="facility" class="col-span-2">
              <FloatLabel variant="on">
                <InputText id="facility" class="w-1/2" />
                <label for="facility" class="required-field"
                  >Home Facility / FIR</label
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
            <FormField v-slot="$field" name="reason" class="col-span-2">
              <FloatLabel variant="on">
                <Textarea id="reason" class="w-full" />
                <label for="reason" class="required-field"
                  >Reason for visiting</label
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
            label="Submit Application"
            :disabled="
              !$form?.valid ||
              $form?.reason?.pristine ||
              $form?.facility?.pristine
            " />
        </Form>
      </template>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
