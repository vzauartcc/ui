<script setup lang="ts">
import { ratingExamService } from '@/services/training/ratingExam.service';
import type {
  IRatingExamAttempt,
  IRatingExamAttemptIndicator,
} from '@/services/training/ratingExam.types';
import { dateAsMMDD } from '@/utils/date';
import { compileUsersName } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Dialog from 'primevue/dialog';
import Divider from 'primevue/divider';
import Fieldset from 'primevue/fieldset';
import InputNumber from 'primevue/inputnumber';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import { capitalize, computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

useTitle('View Rating Exam Attempt');
const route = useRoute();

const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

const attempt = ref<IRatingExamAttempt | null>(null);

onMounted(async () => {
  try {
    const data = await ratingExamService.getRatingExamAttempt(id ?? '');

    attempt.value = data;
  } catch (e) {
    console.error('error getting attempt', e);
  }
});

type IndicatorType = IRatingExamAttemptIndicator['type'];
type GroupedIndicators = Record<
  IndicatorType,
  Record<string, IRatingExamAttemptIndicator[]>
>;

const groupedIndicators = computed<GroupedIndicators>(() => {
  const groups: GroupedIndicators = {
    theory: {},
    practical: {},
  };
  if (!attempt.value) return groups;

  const indicators: IRatingExamAttemptIndicator[] = attempt.value.indicators;

  for (const indicator of indicators) {
    groups[indicator.type][indicator.category] ??= [];
    groups[indicator.type][indicator.category]!.push(indicator);
  }

  return groups;
});

const getTotalIndicators = (
  categories: Record<string, IRatingExamAttemptIndicator[]>,
) =>
  Object.values(categories).reduce(
    (total, indicators) => total + indicators.length,
    0,
  );

const noteDialog = ref({
  name: '',
  notes: '',
  visible: false,
});
const viewNote = (data: IRatingExamAttemptIndicator) => {
  noteDialog.value = {
    name: data.name,
    notes: data.notes,
    visible: true,
  };
};

const closeNote = () => {
  noteDialog.value = {
    name: '',
    notes: '',
    visible: false,
  };
};
</script>

<template>
  <ProgressSpinner v-if="!attempt" />
  <Card v-else>
    <template #title
      >Rating Exam Attempt - {{ compileUsersName(attempt.student) }} -
      {{ attempt.ratingExam!.name }}</template
    >
    <template #content>
      <Card>
        <template #title>
          <span class="text-2xl font-bold">
            <span
              v-if="attempt.passed"
              class="text-green-600 dark:text-green-400"
              >Passed</span
            >
            <span v-else class="text-red-600 dark:text-red-400">Failed</span>
          </span>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-5">
            <span>Student</span
            ><span>{{ compileUsersName(attempt.student) }}</span>
            <span>Instructor</span
            ><span>{{ compileUsersName(attempt.instructor) }}</span>
            <span>Exam</span><span>{{ attempt.ratingExam!.name }}</span>
            <span>Certification</span
            ><span>{{ attempt.ratingExam!.certification!.name }}</span>
            <span>Attempt</span><span>{{ attempt.attempt }}</span>
            <span>Theory</span
            ><span>{{ attempt.theoryPassed ? 'Passed' : 'Failed' }}</span>
            <span>Practical Score</span>
            <span>{{ attempt.practicalScore }} / 100 points</span>
            <span>Date</span><span>{{ dateAsMMDD(attempt.createdAt) }}</span>
          </div>
        </template>
      </Card>
      <Divider />

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
          <span>Occurrences</span>
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

        <template v-for="(indicators, category) in categories" :key="category">
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

              <div class="w-full grid grid-cols-2">
                <div class="flex justify-center">
                  <RadioButton
                    size="large"
                    disabled
                    :modelValue="indicator.performance"
                    :inputId="`sat-${indicator.indicatorId}`"
                    value="satisfactory" />
                </div>

                <div class="flex justify-center">
                  <RadioButton
                    size="large"
                    :modelValue="indicator.performance"
                    :inputId="`unsat-${indicator.indicatorId}`"
                    disabled
                    value="unsatisfactory" />
                </div>
              </div>

              <div class="justify-center flex items-center">
                <div class="relative w-20" v-if="type !== 'theory'">
                  <InputNumber
                    :modelValue="indicator.occurrences"
                    disabled
                    class="w-full"
                    inputClass="w-full"
                    placeholder="# of Occurrences" />
                  <p
                    class="absolute left-full top-1 -translate-y-1/2 pl-5 whitespace-nowrap"
                    :class="{ invisible: indicator.occurrences <= 0 }">
                    -{{ indicator.occurrences * indicator.deduction }} pts
                  </p>
                </div>
              </div>

              <div class="relative justify-center flex text-xl">
                <span
                  @click="viewNote(indicator)"
                  v-tooltip.top="'View Note'"
                  v-if="indicator.notes">
                  <Icon icon="heroicons:magnifying-glass" />
                </span>
                <span
                  class="text-xs w-min absolute right-0 text-center"
                  v-if="
                    indicator.occurrences >= indicator.failureThreshold ||
                    (type === 'theory' &&
                      indicator.performance === 'unsatisfactory')
                  "
                  >AUTOMATIC FAILURE</span
                >
              </div>
            </div>
          </template>
        </template>
        <div
          class="flex col-start-2 border p-3 wrap-break-word items-center justify-center font-medium">
          Comments
        </div>
        <div class="p-3">
          <p>{{ attempt[`${type}Notes`] || '(None)' }}</p>
        </div>
      </div>

      <Divider />

      <Fieldset legend="Overall Comments">
        <p>{{ attempt.notes || '(None)' }}</p>
      </Fieldset>
    </template>
  </Card>

  <Dialog
    modal
    dismissableMask
    v-model:visible="noteDialog.visible"
    class="md:w-1/2"
    @hide="closeNote"
    header="View Note">
    <Fieldset legend="Indicator">
      <span>{{ noteDialog.name }}</span>
    </Fieldset>

    <Fieldset legend="Notes">
      <p>{{ noteDialog.notes }}</p>
    </Fieldset>

    <template #footer>
      <Button outlined label="Close" @click="closeNote" />
    </template>
  </Dialog>
</template>

<style lang="css" scoped></style>
