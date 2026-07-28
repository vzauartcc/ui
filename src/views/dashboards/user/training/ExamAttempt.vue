<script setup lang="ts">
import { examService } from '@/services/exam/exam.service';
import type { IExamAttempt } from '@/services/exam/exam.types';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import { Icon } from '@iconify/vue';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Checkbox from 'primevue/checkbox';
import Divider from 'primevue/divider';
import ProgressSpinner from 'primevue/progressspinner';
import RadioButton from 'primevue/radiobutton';
import Step from 'primevue/step';
import StepList from 'primevue/steplist';
import StepPanel from 'primevue/steppanel';
import StepPanels from 'primevue/steppanels';
import Stepper from 'primevue/stepper';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

useTitle('Take Exam');

const attempt = ref<IExamAttempt | null>(null);
const activeQuestion = ref(1);

const userStore = useUserStore();

const router = useRouter();

const route = useRoute();
const attemptId = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

onMounted(async () => {
  if (!attemptId) return;

  try {
    const data = await examService.getExamAttempt(attemptId);

    if (
      // Trying to access another student's exam
      (!userStore.isSelf(data.student) && !userStore.isTrainingStaff) ||
      // Trying to access a completed exam as a student
      (!userStore.isTrainingStaff && data.isComplete)
    ) {
      console.error('attempted to access an invalid exam id');
      router.push('/dash/training/exams');
      return;
    }

    attempt.value = data;

    if (data.status === 'not_started') {
      console.log('updating status');
      // Force exam to enter in_progress state.
      await examService.saveAnswer(
        attempt.value._id,
        data.questionOrder[0]!._id,
        [],
        0,
      );
    }

    const firstResponse = data.responses.find(
      (r) => r.questionId === data.questionOrder[0]!._id,
    );

    selectedOptions.value = firstResponse
      ? [...firstResponse.selectedOptions]
      : [];
  } catch (e) {
    console.error('error getting exam attempt', e);
  }
});

// After a question is saved, make sure the correct selected options
// from the API are selected.
watch(
  () => attempt.value?.responses,
  (newResponses) => {
    if (!newResponses) return;

    const res = newResponses.find(
      (r) =>
        attempt.value?.questionOrder[activeQuestion.value - 1]!._id ===
        r.questionId,
    );
    if (!res) return;

    selectedOptions.value = [...res.selectedOptions];
  },
  {
    deep: true,
  },
);

const selectedOptions = ref<string[]>([]);
const isSaving = ref(false);
const startTime = ref(Date.now());

const saveAnswer = async (
  questionOrder: number,
  answers: string[],
  timeSpent: number,
) => {
  if (!attempt.value) return;

  try {
    const question = attempt.value.questionOrder[questionOrder - 1];
    if (!question) {
      return;
    }

    // Check to see if they changed anything
    const savedResponse = attempt.value.responses.find(
      (r) => r.questionId === question._id,
    );

    if (
      selectedOptions.value.length === 0 ||
      (savedResponse &&
        selectedOptions.value.every((o) =>
          savedResponse.selectedOptions.includes(o),
        ) &&
        savedResponse.selectedOptions.every((o) =>
          selectedOptions.value.includes(o),
        ))
    ) {
      return;
    }

    isSaving.value = true;
    const data = await examService.saveAnswer(
      attempt.value._id,
      question._id,
      answers,
      timeSpent,
    );

    attempt.value.responses = data.responses;
  } catch (e) {
    console.error('error saving answer', e);
  } finally {
    isSaving.value = false;
  }
};

const handleStepChange = (requestedStep: number) => {
  if (requestedStep === activeQuestion.value) return;

  saveAnswer(
    activeQuestion.value,
    selectedOptions.value,
    Date.now() - startTime.value,
  );

  const response = attempt.value?.responses.find(
    (r) =>
      attempt.value?.questionOrder[requestedStep - 1]!._id === r.questionId,
  );

  selectedOptions.value = response ? [...response.selectedOptions] : [];

  activeQuestion.value = requestedStep;
  startTime.value = Date.now();
};

const allQuestionsAnswered = computed(() => {
  if (!attempt.value) return false;

  const notAnswered = attempt.value.questionOrder.filter(
    (q) =>
      !attempt.value!.responses.some(
        (r) => r.questionId === q._id && r.selectedOptions.length > 0,
      ),
  );

  return (
    notAnswered.length === 0 ||
    (notAnswered.length === 1 &&
      attempt.value.questionOrder[activeQuestion.value - 1]!._id ===
        notAnswered[0]!._id)
  );
});

const submitExam = async () => {
  if (!attempt.value) return;

  if (!allQuestionsAnswered.value) {
    alert('Some questions are missing!');
  }
  try {
    // Force save the current question.
    await saveAnswer(
      activeQuestion.value,
      selectedOptions.value,
      Date.now() - startTime.value,
    );

    await examService.submitExam(attempt.value._id);
    router.push('/dash/training/exams');
    toastSuccess('Exam Submitted!', 'Your exam attempt has been recorded.');
  } catch (e) {
    console.error('error submitting exam', e);
  }
};

const questionIsAnswered = (id: number) => {
  if (!attempt.value) return false;

  const question = attempt.value.questionOrder[id];
  if (!question) return false;

  const response = attempt.value.responses.find(
    (r) => r.questionId === question._id,
  );
  if (!response) return false;

  return response.selectedOptions.length > 0;
};
</script>

<template>
  <ProgressSpinner v-if="!attempt" />
  <Card v-else>
    <template #title>
      {{ attempt.exam.title }}
    </template>
    <template #content>
      <Stepper :value="activeQuestion" @update:value="handleStepChange">
        <StepList :pt="{ root: { class: 'flex-wrap justify-start gap-y-4' } }">
          <Step
            v-for="(_, idx) of attempt.questionOrder"
            :key="idx"
            asChild
            v-slot="{ activateCallback, value, a11yAttrs }"
            :value="idx + 1">
            <div class="flex items-center gap-2 mx-2" v-bind="a11yAttrs.root">
              <button
                class="bg-transparent border-0 inline-flex flex-col gap-2 mt-2 cursor-pointer"
                @click="activateCallback"
                v-bind="a11yAttrs.header">
                <Icon
                  v-if="questionIsAnswered(idx)"
                  icon="heroicons:check-circle-solid"
                  class="text-green-500 rounded-full border-2 w-8 h-8 inline-flex items-center justify-center no-mt" />
                <span
                  v-else
                  class="rounded-full border-2 w-8 h-8 inline-flex items-center justify-center">
                  {{ value }}
                </span>
              </button>
              <Divider
                v-if="idx < attempt.questionOrder.length - 1"
                class="mt-6" />
            </div>
            <!-- OLD BELOW -->
            <!-- <span class="flex items-center justify-center gap-1"> -->
            <!--   <Icon -->
            <!--     class="text-green-500 text-3xl" -->
            <!--     icon="heroicons:check-circle-16-solid" -->
            <!--     v-if="questionIsAnswered(idx)" /> -->
            <!--   <span v-else>{{ idx + 1 }}</span> -->
            <!-- </span> -->
          </Step>
        </StepList>
        <StepPanels>
          <StepPanel
            v-for="(question, idx) of attempt.questionOrder"
            :key="question._id"
            :value="idx + 1"
            ref="questionRef">
            <Card>
              <template #title
                ><b>{{ idx + 1 }}</b
                >. {{ question.text }}</template
              >
              <template #content>
                <div
                  v-for="option of question.options"
                  :key="option._id"
                  class="my-2">
                  <RadioButton
                    variant="outlined"
                    v-model="selectedOptions[0]"
                    :inputId="option._id"
                    name="dynamic"
                    :value="option._id"
                    v-if="!question.multiCorrect" />
                  <Checkbox
                    v-model="selectedOptions"
                    :inputId="option._id"
                    name="dynamic"
                    :value="option._id"
                    v-else />
                  <label :for="option._id" class="ml-2">{{
                    option.text
                  }}</label>
                </div>
              </template>

              <template #footer>
                <div class="flex justify-end gap-4">
                  <Button
                    label="Prev"
                    outlined
                    @click="handleStepChange(idx)"
                    v-if="idx > 0" />
                  <Button
                    label="Next"
                    @click="handleStepChange(idx + 2)"
                    v-if="idx < attempt.questionOrder.length - 1" />
                  <Button
                    label="Submit"
                    @click="submitExam"
                    v-if="allQuestionsAnswered"
                    severity="danger" />
                </div>
              </template>
            </Card>
          </StepPanel>
        </StepPanels>
      </Stepper>
    </template>
  </Card>
</template>

<style lang="css" scoped>
.no-mt {
  margin-top: unset !important;
}
</style>
