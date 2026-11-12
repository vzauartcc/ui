<script setup lang="ts">
import { useAsyncSubmit } from '@/composables/useAsyncSubmit';
import { feedbackService } from '@/services/feedback/feedback.service';
import type { IFeedbackController } from '@/services/feedback/feedback.types';
import { ratingExamService } from '@/services/training/ratingExam.service';
import type {
  IRatingExam,
  IRatingExamAttempt,
  IRatingExamAttemptIndicator,
} from '@/services/training/ratingExam.types';
import { textSort } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { toastError, toastSuccess } from '@/utils/toast';
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
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Fieldset from 'primevue/fieldset';
import FloatLabel from 'primevue/floatlabel';
import InputNumber from 'primevue/inputnumber';
import InputText from 'primevue/inputtext';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import Select from 'primevue/select';
import Textarea from 'primevue/textarea';
import {
  capitalize,
  computed,
  nextTick,
  onMounted,
  ref,
  useTemplateRef,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('New Rating Exam Attempt');
const route = useRoute();
const router = useRouter();

const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

const ratingExams = ref<IRatingExam[] | null>(null);

const students = ref<IFeedbackController[] | null>(null);

const formRef = useTemplateRef<FormInstance>('formRef');

const { isSubmitting, execute } = useAsyncSubmit();

interface IPartialIndicator {
  indicatorId: string;
  performance: 'satisfactory' | '' | 'unsatisfactory';
  occurrences: number;
  notes: string;

  name: string;
  deduction: number;
  failureThreshold: number;
  isActive: boolean;
  category: string;
  type: 'theory' | 'practical';
}

interface IPartialAttempt {
  ratingExamId: string;
  studentCid: number;
  indicators: IPartialIndicator[];
  notes: string;
  theoryNotes: string;
  practicalNotes: string;
}

const initialValues = ref<IPartialAttempt>({
  ratingExamId: '-1',
  studentCid: -1,
  indicators: [] as IRatingExamAttemptIndicator[],
  notes: '',
  theoryNotes: '',
  practicalNotes: '',
});

onMounted(async () => {
  try {
    const data = await ratingExamService.getRatingExams();

    ratingExams.value = data.filter((r) => r.isActive);
  } catch (e) {
    console.error('error loading rating exams', e);
  }

  try {
    const data = await feedbackService.getControllerList();

    students.value = data;
  } catch (e) {
    console.error('error getting student list', e);
  }

  try {
    if (id) {
      const data = await ratingExamService.getRatingExamAttempt(id);

      initialValues.value = {
        ratingExamId: data.ratingExamId,
        studentCid: data.studentCid,
        indicators: data.indicators,
        notes: data.notes || '',
        theoryNotes: data.theoryNotes || '',
        practicalNotes: data.practicalNotes || '',
      };

      formRef.value?.setFieldValue('studentCid', data.studentCid);
      formRef.value?.setFieldValue('ratingExamId', data.ratingExamId);

      formRef.value?.setFieldValue(
        'indicators',
        data.indicators
          .filter((r) => r.isActive)
          .sort(
            (a, b) =>
              textSort(b.type, a.type) ||
              textSort(a.category, b.category) ||
              textSort(a.name, b.name),
          ),
      );
    }
  } catch (e) {
    console.error('error getting attempt data', e);
  }
});

const resolver = ({
  values,
}: FormResolverOptions & { values: Partial<IPartialAttempt> }) => {
  const errors: Record<string, { message: string }[]> = {};

  if (values.indicators === undefined) {
    errors.indicators = [{ message: 'Indicators are required.' }];
  }

  if (values.indicators?.some((i: IPartialIndicator) => i.performance === '')) {
    errors.indicators = [{ message: 'Indicators must be filled out.' }];
  }

  return {
    values,
    errors,
  };
};

const saveAttempt = async (event: FormSubmitEvent) => {
  if (!event.valid) return;

  const { values } = event;

  const attemptId = id ?? '';

  await execute(async () => {
    if (attemptId) {
      await ratingExamService.editRatingExamAttempt(
        attemptId,
        values as IRatingExamAttempt,
      );

      toastSuccess(
        'Rating Attempt Saved!',
        'Changes to the rating attempt have been saved.',
      );

      router.push('/ins/rating-exams');
    } else {
      await ratingExamService.submitRatingExamAttempt(
        values as IRatingExamAttempt,
      );

      toastSuccess(
        'Rating Attempt Submitted!',
        'The rating attempt has been submitted.',
      );
    }

    router.push('/ins/rating-exams');
  });
};

const changeRatingExam = async (newVal: string) => {
  const ratingExam = ratingExams.value?.find((r) => r._id === newVal);
  if (!ratingExam) {
    console.error('this is impossible');

    toastError('Rating Exam Not Found!', 'An error has occurred.');
    return;
  }

  const indicators = ratingExam.indicators
    .filter((r) => r.isActive)
    .map((r) => ({
      indicatorId: r._id,
      performance: '',
      occurrences: 0,
      notes: '',

      name: r.name,
      deduction: r.deduction,
      failureThreshold: r.failureThreshold,
      isActive: true,
      category: r.category,
      type: r.type,
    }))
    .sort(
      (a, b) =>
        textSort(b.type, a.type) ||
        textSort(a.category, b.category) ||
        textSort(a.name, b.name),
    );

  await nextTick();

  formRef.value?.setFieldValue('indicators', indicators);
};

type IndicatorType = IPartialIndicator['type'];
type GroupedIndicators = Record<
  IndicatorType,
  Record<string, IPartialIndicator[]>
>;

const groupedIndicators = computed<GroupedIndicators>(() => {
  const indicators: IPartialIndicator[] =
    formRef.value?.getFieldState('indicators')?.value ?? [];

  const groups: GroupedIndicators = {
    theory: {},
    practical: {},
  };

  for (const indicator of indicators) {
    groups[indicator.type][indicator.category] ??= [];
    groups[indicator.type][indicator.category]!.push(indicator);
  }

  return groups;
});

const getTotalIndicators = (categories: Record<string, IPartialIndicator[]>) =>
  Object.values(categories).reduce(
    (total, indicators) => total + indicators.length,
    0,
  );

const getIndicatorIndex = (indicatorId: string) => {
  return formRef.value
    ?.getFieldState('indicators')
    ?.value.findIndex((i: IPartialIndicator) => i.indicatorId === indicatorId);
};

const updateIndicator = (
  indicatorId: string,
  property: 'performance' | 'occurrences' | 'notes',
  value: string | number | null,
) => {
  const indicators = formRef.value?.getFieldState('indicators')?.value ?? [];

  const index = indicators.findIndex(
    (i: IPartialIndicator) => i.indicatorId === indicatorId,
  );

  if (index === -1) return;

  const updated = [...indicators];

  updated[index] = {
    ...updated[index],
    [property]: value,
  };

  if (updated[index].occurrences >= updated[index].failureThreshold) {
    updated[index].performance = 'unsatisfactory';
  }

  formRef.value?.setFieldValue('indicators', updated);
  formRef.value?.setFieldValue(
    `indicators.${index}.performance`,
    updated[index].performance,
  );
};

const editNoteVisible = ref(false);
const editNoteData = ref({
  id: '',
  name: '',
  notes: '',
});

const editNote = (id: string) => {
  const indicators = formRef.value?.getFieldState('indicators')?.value ?? [];

  const index = indicators.findIndex(
    (i: IPartialIndicator) => i.indicatorId === id,
  );

  if (index === -1) return;

  editNoteData.value = {
    id: id,
    name: indicators[index].name,
    notes: indicators[index].notes,
  };

  editNoteVisible.value = true;
};

const closeEditNote = () => {
  editNoteVisible.value = false;

  editNoteData.value = {
    id: '',
    name: '',
    notes: '',
  };
};

const saveNote = () => {
  updateIndicator(editNoteData.value.id, 'notes', editNoteData.value.notes);

  closeEditNote();
};

const pointsDeducted = computed(() => {
  const indicators: IPartialIndicator[] =
    formRef.value?.getFieldState('indicators')?.value ?? [];

  return (
    indicators
      .filter((i) => i.type !== 'theory')
      .reduce(
        (deduction: number, indicator: IPartialIndicator) =>
          deduction + indicator.deduction * indicator.occurrences,
        0,
      ) || 0
  );
});
</script>

<template>
  <ProgressSpinner v-if="!ratingExams || !students" />
  <Card v-else>
    <template #title> New Rating Exam Attempt </template>

    <template #content>
      <Form
        ref="formRef"
        v-slot="$form"
        :resolver
        :initialValues="initialValues"
        class="mt-5"
        @submit="saveAttempt">
        <div class="grid grid-cols-2 gap-5 mt-5 md:w-1/2">
          <FormField v-slot="$field" name="studentCid">
            <FloatLabel variant="on">
              <Select
                :options="students"
                optionLabel="name"
                optionValue="cid"
                :modelValue="$field.value"
                placeholder="Select Student"
                filter
                id="student" />
              <label for="student" class="required-field">Student</label>
            </FloatLabel>
          </FormField>

          <FormField
            v-slot="$field"
            name="ratingExamId"
            v-if="$form.studentCid?.value > 0">
            <FloatLabel variant="on">
              <Select
                :options="ratingExams"
                optionLabel="name"
                optionValue="_id"
                :modelValue="$field.value"
                filter
                placeholder="Select Rating Exam"
                @update:modelValue="(val) => changeRatingExam(val)"
                id="ratingExamId" />
              <label for="ratingExamId" class="required-field"
                >Rating Exam</label
              >
            </FloatLabel>
          </FormField>
        </div>

        <div
          v-if="
            $form.ratingExamId?.value !== '-1' && $form.studentCid?.value > 0
          ">
          <div class="grid grid-cols-1 gap-5">
            <FormField name="_id" class="hidden">
              <InputText id="_id" disabled />
            </FormField>
          </div>

          <FormField name="indicators" class="my-5 wrap-break-word">
            <div
              class="grid grid-cols-[60px_200px_1fr] font-bold text-center items-end">
              <span></span>
              <span class="p-3 grid grid-cols-1">Category</span>
              <div class="text-center grid grid-cols-4 p-3 items-end">
                <span>Performance Indicator</span>
                <span class="grid grid-rows-2">
                  <span>Grade</span
                  ><span class="grid grid-cols-2"
                    ><span
                      class="font-semibold help-text"
                      v-tooltip.top="'Satisfactory'"
                      >SAT</span
                    ><span
                      class="font-semibold help-text"
                      v-tooltip.top="'Unsatisfactory'"
                      >UNSAT</span
                    ></span
                  ></span
                >
                <span>Errors</span>
                <span>Notes</span>
              </div>
            </div>
            <div
              v-for="(categories, type) in groupedIndicators"
              :key="type"
              class="grid grid-cols-[60px_200px_1fr]"
              :class="{
                'bg-blue-100': type === 'theory',
                'bg-rose-100': type !== 'theory',
              }">
              <div
                class="flex items-center justify-center border p-2"
                :style="{
                  gridRow: `span ${getTotalIndicators(categories) + 1}`,
                }">
                <span class="whitespace-nowrap -rotate-90 font-bold">
                  {{ capitalize(type) }}
                </span>
              </div>

              <template
                v-for="(indicators, category) in categories"
                :key="category">
                <div
                  class="flex col-start-2 border p-3 wrap-break-word items-center justify-center font-medium"
                  :style="{ gridRow: `span ${indicators.length}` }">
                  {{ category }}
                </div>
                <template
                  v-for="indicator in indicators"
                  :key="indicator.indicatorId">
                  <div
                    class="col-start-3 grid grid-cols-4 items-center border p-3 transition-colors duration-200"
                    :class="{
                      'bg-red-300 border-red-500 text-red-900':
                        indicator.occurrences > indicator.failureThreshold ||
                        indicator.performance === 'unsatisfactory',
                      'bg-green-300 border-green-500 text-green-900':
                        indicator.performance === 'satisfactory',
                    }">
                    <div>{{ indicator.name }}</div>

                    <FormField
                      v-slot="$field"
                      class="w-full"
                      :name="`indicators.${getIndicatorIndex(indicator.indicatorId)}.performance`">
                      <div class="grid grid-cols-2">
                        <div class="flex justify-center">
                          <RadioButton
                            size="large"
                            :disabled="
                              indicator.occurrences >=
                              indicator.failureThreshold
                            "
                            :modelValue="$field.value"
                            @update:modelValue="
                              updateIndicator(
                                indicator.indicatorId,
                                'performance',
                                $event,
                              )
                            "
                            :inputId="`sat-${indicator.indicatorId}`"
                            value="satisfactory" />
                        </div>

                        <div class="flex justify-center">
                          <RadioButton
                            size="large"
                            :modelValue="$field.value"
                            @update:modelValue="
                              updateIndicator(
                                indicator.indicatorId,
                                'performance',
                                $event,
                              )
                            "
                            :inputId="`unsat-${indicator.indicatorId}`"
                            value="unsatisfactory" />
                        </div>
                      </div>
                    </FormField>

                    <FormField
                      :name="`indicators.${getIndicatorIndex(indicator.indicatorId)}.occurrences`"
                      class="justify-center flex items-center">
                      <div class="relative w-24" v-if="type !== 'theory'">
                        <InputNumber
                          :modelValue="indicator.occurrences"
                          @update:modelValue="
                            updateIndicator(
                              indicator.indicatorId,
                              'occurrences',
                              $event,
                            )
                          "
                          showButtons
                          :min="0"
                          :max="100"
                          class="w-full"
                          inputClass="w-full"
                          placeholder="# of Occurrences" />
                        <p
                          class="absolute left-full top-1 -translate-y-1/2 pl-5 whitespace-nowrap"
                          :class="{ invisible: indicator.occurrences <= 0 }">
                          -{{ indicator.occurrences * indicator.deduction }} pts
                        </p>
                      </div>
                    </FormField>

                    <FormField
                      :name="`indicators.${getIndicatorIndex(indicator.indicatorId)}.notes`"
                      class="relative justify-center flex text-xl">
                      <span @click="editNote(indicator.indicatorId)">
                        <span
                          v-tooltip.top="'Add Note'"
                          v-if="!indicator.notes">
                          <Icon icon="heroicons:plus-circle" />
                        </span>
                        <span v-tooltip.top="'Edit Note'" v-else>
                          <Icon icon="heroicons:pencil" />
                        </span>
                      </span>
                      <span
                        class="text-xs w-min absolute right-0 text-center"
                        v-if="
                          (indicator.occurrences >=
                            indicator.failureThreshold &&
                            indicator.failureThreshold === 1) ||
                          (type === 'theory' &&
                            indicator.performance === 'unsatisfactory')
                        "
                        >AUTOMATIC FAILURE</span
                      >
                    </FormField>
                  </div>
                </template>
              </template>
              <div
                class="flex col-start-2 border p-3 wrap-break-word items-center justify-center font-medium">
                Comments
              </div>
              <FormField
                class="p-1 col-span-3 col-start-3 border-l border-r border-b"
                v-slot="$field"
                :name="`${type}Notes`">
                <FloatLabel variant="on">
                  <Textarea
                    :id="`${type}Notes`"
                    autoResize
                    class="w-full"
                    maxlength="4000" />
                  <span
                    class="char-counter"
                    :class="{ 'text-red-500': $field?.value?.length === 4000 }"
                    >{{ $field?.value?.length || 0 }}/4000</span
                  >
                  <label :for="`${type}Notes`">(Optional)</label>
                </FloatLabel>
              </FormField>
            </div>
          </FormField>

          <Divider />

          <FormField v-slot="$field" name="notes">
            <FloatLabel variant="on">
              <Textarea id="notes" autoResize class="w-full" maxlength="4000" />
              <span
                class="char-counter"
                :class="{ 'text-red-500': $field?.value?.length === 4000 }"
                >{{ $field?.value?.length || 0 }}/4000</span
              >
              <label for="notes">Overall Comments (optional)</label>
            </FloatLabel>
          </FormField>

          <div class="mt-5 grid gap-5">
            <div class="flex flex-row gap-5">
              <Fieldset legend="Total Score" class="w-1/3">
                {{ Math.max(0, 100 - pointsDeducted) }}
                / 100
              </Fieldset>
              <Fieldset legend="Deductions" class="w-1/3">
                {{ pointsDeducted }}
              </Fieldset>
              <Fieldset legend="Result" class="w-1/3">
                {{
                  $form.indicators?.value.some(
                    (i: IPartialIndicator) =>
                      (i.type === 'theory' &&
                        i.performance === 'unsatisfactory') ||
                      i.occurrences >= i.failureThreshold,
                  ) || Math.max(0, 100 - pointsDeducted) / 100 < 0.8
                    ? 'Failed'
                    : 'Passed'
                }}
                {{
                  `(${Math.max(0, Math.round(((100 - pointsDeducted) / 100) * 100))}%)`
                }}
              </Fieldset>
            </div>
            <div>
              <Button
                type="submit"
                severity="success"
                class="w-full"
                :disabled="!$form?.valid"
                :loading="isSubmitting"
                :label="id ? 'Save!' : 'Submit!'" />
              <p
                v-if="
                  !$form.indicators?.value.every(
                    (i: IPartialIndicator) => i.performance !== '',
                  )
                ">
                All indicators must be graded.
              </p>
            </div>
          </div>
        </div>
      </Form>
    </template>
  </Card>

  <Dialog
    modal
    dismissableMask
    v-model:visible="editNoteVisible"
    class="md:w-1/2"
    @hide="closeEditNote()"
    :header="editNoteData.notes !== '' ? 'Edit Notes' : 'Create Note'">
    <Fieldset legend="Indicator">
      <span>{{ editNoteData.name }}</span>
    </Fieldset>

    <FloatLabel variant="on" class="mt-5">
      <Textarea
        class="w-full"
        id="notes"
        autofocus
        autoResize
        v-model="editNoteData.notes"
        maxlength="4000" />
      <span
        class="char-counter"
        :class="{ 'text-red-500': editNoteData.notes.length === 4000 }"
        >{{ editNoteData.notes.length || 0 }}/4000</span
      >
      <label for="notes">Notes (optional)</label>
    </FloatLabel>

    <template #footer>
      <Button severity="success" label="Save" @click="saveNote" />
      <Button outlined label="Close" @click="closeEditNote" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
