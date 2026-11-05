<script setup lang="ts">
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { controllerService } from '@/services/controller/controller.service';
import type { ICertification } from '@/services/controller/controller.types';
import { ratingExamService } from '@/services/training/ratingExam.service';
import type {
  IRatingExam,
  IRatingExamIndicator,
} from '@/services/training/ratingExam.types';
import { textSort } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import {
  Form,
  FormField,
  type FormInstance,
  type FormResolverOptions,
  type FormSubmitEvent,
} from '@primevue/forms';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import Dialog from 'primevue/dialog';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import { capitalize, computed, onMounted, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('New Rating Exam');
const route = useRoute();
const router = useRouter();

const { isSubmitting, execute } = useAsyncSubmit();

const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;
const loading = ref(true);

const milestones = ref<ICertification[]>();
const formRef = useTemplateRef<FormInstance>('formRef');

const initialValues = ref({
  _id: '',
  name: '',
  indicators: [] as IRatingExamIndicator[],
  certCode: '',
  isActive: true,
});

onMounted(async () => {
  try {
    const data = await controllerService.getCertifications();

    milestones.value = data;
  } catch (e) {
    console.error('error getting milestones', e);
  }

  if (!id) {
    loading.value = false;
    return;
  }

  try {
    const data = await ratingExamService.getRatingExam(id);

    initialValues.value = {
      _id: data._id,
      name: data.name,
      indicators: data.indicators.sort(
        (a, b) =>
          textSort(b.type, a.type) ||
          textSort(a.category, b.category) ||
          textSort(a.name, b.name),
      ),
      certCode: data.certCode,
      isActive: data.isActive,
    };

    loading.value = false;

    useTitle(`Edit Rating Exam - ${initialValues.value.name}`);
  } catch (e) {
    console.error('error getting exam details', e);
  }
});

const resolver = ({
  values,
}: FormResolverOptions & { values: Partial<IRatingExam> }) => {
  const errors: Record<string, { message: string }[]> = {};

  if (values.name === undefined) {
    errors.name = [{ message: 'Name is required.' }];
  }

  if (values.certCode === undefined) {
    errors.certCode = [{ message: 'Milestone is required.' }];
  }

  if (values.indicators === undefined || values.indicators.length < 1) {
    errors.indicators = [{ message: 'At least one indicator is required.' }];
  }

  return {
    values,
    errors,
  };
};

const saveRatingExam = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  const ratingExamId = values._id;

  await execute(async () => {
    if (ratingExamId !== '') {
      await ratingExamService.editRatingExam(
        ratingExamId,
        values as IRatingExam,
      );

      toastSuccess(
        'Rating Exam Saved!',
        'Changes to the rating exam have been saved.',
      );
    } else {
      await ratingExamService.createRatingExam(values as IRatingExam);

      toastSuccess('Rating Exam Created!', 'The rating exam has been created.');
    }

    router.push('/ins/rating-exams');
  });
};

const deleteIndicator = (index: number) => {
  if (!formRef.value) return;

  const currentIndicators = [
    ...(formRef.value.states.indicators!.value as IRatingExamIndicator[]),
  ];

  currentIndicators.splice(index, 1);

  formRef.value.setFieldValue(
    'indicators',
    currentIndicators.sort(
      (a: IRatingExamIndicator, b: IRatingExamIndicator) =>
        textSort(b.type, a.type) ||
        textSort(a.category, b.category) ||
        textSort(a.name, b.name),
    ),
  );
};

const indicatorVisible = ref(false);

const indicatorDialog = ref({
  _id: '',
  id: -1,
  name: '',
  category: '',
  type: 'theory' as 'theory' | 'practical',
  isActive: true,
  deduction: 10,
  failureThreshold: 2,
});

const indicatorTypes = ref([
  { value: 'theory', name: 'Theory' },
  { value: 'practical', name: 'Practical' },
]);

const categoryOptions = computed(() => {
  const indicators =
    (formRef.value?.states.indicators?.value as
      | IRatingExamIndicator[]
      | undefined) ?? initialValues.value.indicators;

  return [
    ...new Set(
      indicators
        .filter((indicator) => indicator.type === indicatorDialog.value.type)
        .map((indicator) => indicator.category)
        .filter(Boolean),
    ),
  ].sort(textSort);
});

const categorySelect =
  useTemplateRef<InstanceType<typeof Select>>('categorySelect');

const openCategorySelect = (event: MouseEvent) => {
  // Select in editable mode only opens the overlay from the chevron, clicking the
  // input just focuses it. Open the list so a single click reveals the options.
  if ((event.target as HTMLElement | null)?.tagName !== 'INPUT') return;

  categorySelect.value?.show();
};

const editIndicator = (index: number) => {
  if (!formRef.value) return;

  const data = formRef.value.states.indicators!.value[index];
  if (!data) return;

  indicatorDialog.value = {
    _id: data._id,
    id: index,
    name: data.name,
    isActive: data.isActive,
    type: data.type,
    category: data.category,
    deduction: data.deduction,
    failureThreshold: data.failureThreshold,
  };

  indicatorVisible.value = true;
};

const closeDialog = () => {
  indicatorVisible.value = false;

  indicatorDialog.value = {
    _id: '',
    id: -1,
    name: '',
    category: '',
    type: 'theory' as 'theory' | 'practical',
    isActive: true,
    deduction: 10,
    failureThreshold: 2,
  };
};

const saveIndicator = (doAnother: boolean) => {
  if (!formRef.value) return;

  if (indicatorDialog.value.id !== -1) {
    formRef.value.states.indicators!.value[indicatorDialog.value.id] =
      indicatorDialog.value;
  } else {
    formRef.value.states.indicators!.value.push({ ...indicatorDialog.value });
  }

  formRef.value.states.indicators!.value =
    formRef.value.states.indicators!.value.sort(
      (a: IRatingExamIndicator, b: IRatingExamIndicator) =>
        textSort(b.type, a.type) ||
        textSort(a.category, b.category) ||
        textSort(a.name, b.name),
    );

  if (doAnother) {
    indicatorDialog.value = {
      _id: '',
      id: -1,
      name: '',
      category: '',
      type: indicatorDialog.value.type,
      isActive: true,
      deduction: 10,
      failureThreshold: 2,
    };
  } else {
    closeDialog();
  }
};
</script>

<template>
  <ProgressSpinner v-if="loading" />
  <Card v-else>
    <template #title>
      <span v-if="id">Edit Rating Exam - {{ initialValues.name }}</span>
      <span v-else>New Rating Exam</span>
    </template>

    <template #content>
      <Form
        ref="formRef"
        v-slot="$form"
        :resolver
        :initialValues="initialValues"
        @submit="saveRatingExam">
        <div class="grid grid-cols-1 gap-5">
          <FormField name="_id" class="hidden">
            <InputText id="_id" disabled />
          </FormField>
          <FormField v-slot="$field" name="name">
            <FloatLabel variant="on">
              <InputText id="name" class="w-1/2" maxlength="100" />
              <label for="name" class="required-field">Exam Name</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <FormField v-slot="$field" name="certCode">
            <FloatLabel variant="on">
              <Select
                id="certCode"
                :options="milestones"
                filter
                optionLabel="name"
                optionValue="code"
                class="w-1/3" />
              <label for="certCode" class="required-field">Milestone</label>
            </FloatLabel>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>
          <FormField v-slot="$field" name="isActive" class="flex flex-1 gap-3">
            <Checkbox binary id="isActive" />
            <span class="required-field">Active?</span>
            <Message
              v-if="$field?.invalid"
              severity="error"
              size="small"
              variant="simple"
              >{{ $field.error?.message }}</Message
            >
          </FormField>

          <FormField v-slot="$field" name="indicators">
            <DataTable :value="$field.value || []" size="small" stripedRows>
              <template #header>
                <Button
                  label="Add Indicator"
                  @click="indicatorVisible = true" />
              </template>
              <template #empty>
                <p>There are no performance indicators yet.</p>
              </template>

              <Column field="text" header="Indicator Name">
                <template #body="{ data }">
                  <span class="whitespace-pre-line wrap-break-word">{{
                    data.name
                  }}</span>
                </template>
              </Column>
              <Column field="isActive" header="Active">
                <template #body="{ data }">
                  {{ data.isActive ? 'Active' : 'Inactive' }}
                </template>
              </Column>
              <Column field="type" header="Type">
                <template #body="{ data }">
                  {{ capitalize(data.type) }}
                </template>
              </Column>
              <Column field="category" header="Category" />
              <Column field="deduction" header="Deduction per Occurrence" />
              <Column field="failureThreshold" header="Failure Threshold" />
              <Column
                field="options"
                header="Options"
                bodyClass="text-right"
                headerClass="text-right">
                <template #body="{ data, index }">
                  <span
                    v-tooltip.top="'Edit Indicator'"
                    @click="editIndicator(index)">
                    <Icon icon="heroicons:pencil" />
                  </span>
                  <span
                    v-if="data._id === ''"
                    class="text-red-500"
                    v-tooltip.top="'Delete Indicator'"
                    @click="deleteIndicator(index)">
                    <Icon icon="heroicons:trash" />
                  </span>
                </template>
              </Column>
            </DataTable>
          </FormField>

          <Button
            type="submit"
            severity="success"
            :disabled="!$form?.valid || initialValues.indicators.length < 1"
            :loading="isSubmitting">
            <span v-if="id">Save!</span>
            <span v-else>Create!</span>
          </Button>
        </div>
      </Form>
    </template>
  </Card>

  <Dialog
    modal
    dismissableMask
    v-model:visible="indicatorVisible"
    class="md:w-1/2"
    @hide="closeDialog"
    :header="
      indicatorDialog._id !== '' ? 'Edit Indicator' : 'Create Indicator'
    ">
    <div class="grid grid-cols-1 gap-3">
      <FloatLabel variant="on" class="mt-2">
        <Textarea
          class="w-full"
          autofocus
          v-model="indicatorDialog.name"
          name="name"
          maxlength="400" />
        <label for="name" class="required-field">Indicator Name</label>
      </FloatLabel>

      <div class="flex flex-1 gap-3">
        <Checkbox binary v-model="indicatorDialog.isActive" />
        <span class="required-field">Active?</span>
      </div>

      <div class="grid grid-cols-2 gap-5">
        <FloatLabel variant="on">
          <Select
            :options="indicatorTypes"
            v-model="indicatorDialog.type"
            optionValue="value"
            optionLabel="name"
            id="type" />
          <label for="type" class="required-field">Type</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <Select
            ref="categorySelect"
            id="category"
            v-model="indicatorDialog.category"
            :options="categoryOptions"
            :pt="{ label: { maxlength: 50 } }"
            editable
            @click="openCategorySelect" />
          <label for="category" class="required-field">Category</label>
        </FloatLabel>
        <FloatLabel variant="on">
          <InputNumber
            showButtons
            :max="500"
            :min="0"
            id="deduction"
            v-model="indicatorDialog.deduction" />
          <label for="deduction" class="required-field"
            >Points Deducted Per Occurrence</label
          >
        </FloatLabel>
        <FloatLabel variant="on">
          <InputNumber
            :max="100"
            :min="0"
            showButtons
            id="failureThreshold"
            v-model="indicatorDialog.failureThreshold" />
          <label for="failureThreshold" class="required-field"
            >Failure Threshold
          </label>
        </FloatLabel>
      </div>
    </div>

    <div class="flex justify-between w-full mt-5">
      <Button
        label="Save + Create Another"
        @click="saveIndicator(true)"
        :disabled="!indicatorDialog.name" />
      <div class="flex gap-3">
        <Button
          label="Save"
          severity="success"
          @click="saveIndicator(false)"
          :disabled="
            !indicatorDialog.name ||
            !indicatorDialog.category ||
            indicatorDialog.failureThreshold < 1 ||
            indicatorDialog.deduction < 1
          " />
        <Button outlined @click="closeDialog" label="Cancel" />
      </div>
    </div>
  </Dialog>
</template>

<style lang="css" scoped></style>
