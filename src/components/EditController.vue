<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type {
  ICertification,
  IController,
  IRole,
} from '@/services/controller/controller.types';
import { useUserStore } from '@/stores/user';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import {
  Form,
  FormField,
  type FormFieldState,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import SelectButton from 'primevue/selectbutton';
import { capitalize, onMounted, ref } from 'vue';

interface ICertOption {
  name: string;
  value: string;
}

const props = defineProps<{ cid: string }>();
const userStore = useUserStore();

const certOptions = ref<Record<string, ICertOption[]>>({});
const roleOptions = ref<Record<string, ICertOption[]>>({});

const controller = ref<IController | null>(null);
const takenOI = ref<string[]>([]);
const certifications = ref<ICertification[] | null>(null);
const roles = ref<IRole[] | null>(null);

const initialValues = ref({
  oi: '',
  certCodes: [] as string[],
  roleCodes: [] as string[],
});

onMounted(async () => {
  try {
    const data = await controllerService.getUser(props.cid);

    controller.value = data;
    initialValues.value.oi = data.oi;
    initialValues.value.certCodes = data.certCodes;
    initialValues.value.roleCodes = data.roleCodes;

    useTitle(`Edit ${compileUsersName(data)}`);
  } catch (e) {
    console.error('error getting controller data', e);
  }

  try {
    const data = await controllerService.getTakenOperatingInitials();

    takenOI.value = data;
  } catch (e) {
    console.error('error getting available OIs', e);
  }

  try {
    const data = await controllerService.getCertifications();

    certifications.value = data;
    const tmp: Record<string, ICertOption[]> = data
      .filter((c) => !c.class.includes('solo') && !c.class.includes('event'))
      .sort((a, b) => a.order - b.order)
      .reduce<Record<string, ICertOption[]>>((acc, c) => {
        if (!acc[c.class]) {
          acc[c.class] = [];
        }

        acc[c.class]!.push({ name: c.name, value: c.code });
        return acc;
      }, {});

    tmp['solo'] = data
      .filter((c) => c.class.includes('solo'))
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ name: c.name, value: c.code }));

    tmp['event'] = data
      .filter((c) => c.class.includes('event'))
      .sort((a, b) => a.order - b.order)
      .map((c) => ({ name: c.name, value: c.code }));

    certOptions.value = tmp;
  } catch (e) {
    console.error('error getting certifications', e);
  }

  try {
    const data = await controllerService.getRoles();

    roles.value = data;

    roleOptions.value = data
      .sort((a, b) => a.order - b.order)
      .reduce<Record<string, ICertOption[]>>((acc, r) => {
        if (!acc[r.class]) {
          acc[r.class] = [];
        }

        acc[r.class]!.push({ name: r.name, value: r.code });
        return acc;
      }, {});
  } catch (e) {
    console.error('error getting roles', e);
  }
});

const resolver = ({ values }: FormResolverOptions) => {
  const errors: Record<string, { message: string }[]> = {};

  if (!values.oi || values.oi.length !== 2) {
    errors.oi = [{ message: 'Operating Initials must be 2 characters.' }];
  }

  return { values, errors };
};

const getOITooltip = (field: FormFieldState): string => {
  if (field.invalid) {
    return 'Invalid Operating Initials';
  }

  if (field.value.toUpperCase() === controller.value?.oi) {
    return '';
  }

  if (takenOI.value.includes(field.value.toUpperCase())) {
    return 'Operating Initials Taken';
  }

  return 'Operating Initials Available';
};

const updateController = async (event: FormSubmitEvent) => {
  if (!event.valid) {
    toastError(
      'Incomplete form!',
      'One or more required fields are incomplete.',
    );
    return;
  }

  if (!props.cid) return;

  const { values } = event;

  try {
    await controllerService.updateController(
      props.cid,
      values.roleCodes,
      values.certCodes,
      values.oi.toUpperCase(),
    );

    toastSuccess('Controller Updated!', 'Successfully updated controller.');
  } catch (e) {
    console.error('error saving controller', e);
  }
};
</script>

<template>
  <ProgressSpinner v-if="!controller" />
  <Card v-else>
    <template #title
      >Edit Controller - {{ compileUsersName(controller) }}
    </template>
    <template #content>
      <Form
        v-slot="$form"
        :initialValues="initialValues"
        :resolver
        @submit="updateController">
        <div class="grid md:grid-cols-3 gap-5">
          <FloatLabel variant="on">
            <InputText
              name="firstName"
              v-model="controller.fname"
              disabled
              readonly />
            <label for="firstName">First Name</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText
              name="lastName"
              v-model="controller.lname"
              disabled
              readonly />
            <label for="lastName">Last Name</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputNumber
              :useGrouping="false"
              name="cid"
              v-model="controller.cid"
              disabled
              readonly />
            <label for="cid">CID</label>
          </FloatLabel>
          <FloatLabel variant="on" v-if="userStore.isStaff">
            <InputText
              name="email"
              v-model="controller.email"
              disabled
              readonly />
            <label for="email">Email Address</label>
          </FloatLabel>

          <FloatLabel variant="on">
            <InputText name="rating" v-model="controller.ratingLong" disabled />
            <label for="rating">Rating</label>
          </FloatLabel>

          <FormField v-slot="$field" name="oi" v-if="controller.member">
            <FloatLabel variant="on">
              <InputText
                class="uppercase"
                v-keyfilter.alpha
                minlength="2"
                maxlength="2"
                required
                :disabled="!userStore.isStaff"
                :readonly="!userStore.isStaff" />
              <label for="oi">Operating Initials</label>
              <span class="text-3xl" v-tooltip.top="getOITooltip($field)">
                <Icon
                  icon="heroicons:x-circle-solid"
                  class="text-red-500 no-pointer"
                  v-if="
                    $field.invalid ||
                    (takenOI.includes($field.value.toUpperCase()) &&
                      $field.value.toUpperCase() !== controller.oi)
                  " />
                <Icon
                  icon="heroicons:check-circle-solid"
                  class="text-green-500 no-pointer"
                  v-else />
              </span>
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
        <template v-if="certifications && controller.member">
          <Divider />
          <p class="text-xl">Certifications</p>
          <div v-for="(opts, level) of certOptions" :key="level" class="my-2.5">
            <p>{{ capitalize(level) }} Endorsements</p>
            <SelectButton
              name="certCodes"
              :class="level"
              :options="opts"
              optionLabel="name"
              optionValue="value"
              multiple
              ariaLabelledby="multiple"
              class="mybuttons" />
          </div>
        </template>
        <template v-if="userStore.isStaff && roles">
          <Divider />
          <p class="text-xl">Roles</p>
          <div v-for="(opts, level) of roleOptions" :key="level" class="my-2.5">
            <p>{{ capitalize(level) }} Roles</p>
            <SelectButton
              name="roleCodes"
              :class="level"
              :options="opts"
              optionLabel="name"
              optionValue="value"
              multiple
              ariaLabelledby="multiple"
              class="mybuttons" />
          </div>
        </template>
        <Divider />
        <Button
          type="submit"
          label="Update Controller"
          :disabled="!$form?.valid" />
      </Form>
    </template>
  </Card>
</template>

<style lang="css" scoped>
.non-tier :deep(.p-togglebutton) {
  background-color: var(--p-sec-green-600);
}
.tier-2 :deep(.p-togglebutton) {
  background-color: var(--p-core-red);
}

.tier-1 :deep(.p-togglebutton) {
  background-color: var(--p-sec-blue-300);
}
.solo :deep(.p-togglebutton) {
  background-color: var(--p-sec-gold-600);
}
.event :deep(.p-togglebutton) {
  background-color: var(--p-core-blue);
}

.senior :deep(.p-togglebutton) {
  background-color: var(--p-core-red);
}

.junior :deep(.p-togglebutton) {
  background-color: var(--p-core-blue);
}

.training :deep(.p-togglebutton) {
  background-color: var(--p-sec-green-300);
}

/* Fix text color on the role buttons */
:deep(.p-togglebutton)[data-p-checked='false'] {
  color: black;
}
.app-dark .mybuttons :deep(.p-togglebutton)[data-p-checked='false'] {
  color: white;
}
</style>
