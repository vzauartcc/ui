<script setup lang="ts">
import { examService } from '@/services/exam/exam.service';
import type {
  IExamAttempt,
  IQuestion,
  IResponse,
} from '@/services/exam/exam.types';
import { useUserStore } from '@/stores/user';
import { dateAsMMDD, dateAsMMDDHHMM } from '@/utils/date';
import { secToHHMMSS } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Card from 'primevue/card';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import {
  onMounted,
  ref,
  useTemplateRef,
  type ComponentPublicInstance,
} from 'vue';
import { useRoute } from 'vue-router';

useTitle('Exam Attempt');

const route = useRoute();
const userStore = useUserStore();
const { user } = storeToRefs(userStore);

const attempt = ref<IExamAttempt | null>(null);

const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

const questionElements =
  useTemplateRef<(InstanceType<typeof Card> & ComponentPublicInstance)[]>(
    'questionElements',
  );
const overviewElement = useTemplateRef<
  InstanceType<typeof Card> & ComponentPublicInstance
>('overviewElement');

interface ILocalQuestion {
  question: IQuestion;
  response: IResponse;
}

const questions = ref<ILocalQuestion[]>([]);

onMounted(async () => {
  if (!id) return;

  try {
    const data = await examService.getExamAttempt(id);

    attempt.value = data;
    useTitle(`Exam Attempt - ${data.user.name} - ${data.exam.title}`);

    data.questionOrder.forEach((q) => {
      questions.value.push({
        question: q,
        response: data.responses.find((r) => r.questionId === q._id)!,
      });
    });
  } catch (e) {
    console.error('error getting exam attempt', e);
  }
});

const scrollToSection = (index: number) => {
  if (!questionElements.value) return;

  const target = questionElements.value[index];

  if (target) {
    const element = target.$el as HTMLElement;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};

const scrollToOverview = () => {
  const target = overviewElement.value;

  if (target) {
    const element = target.$el as HTMLElement;

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }
};
</script>

<template>
  <ProgressSpinner v-if="!attempt" />
  <Card v-else>
    <template #title
      >{{ attempt.user.name }} - {{ attempt.exam.title }}</template
    >
    <template #content>
      <Card>
        <template #title>
          <span class="text-2xl font-bold">
            <span v-if="attempt.grade >= 80" class="text-green-500"
              >Passed</span
            >
            <span v-else class="text-red-500"
              >Failed<span
                v-if="attempt.status === 'timed_out'"
                class="text-base">
                (Timed Out)</span
              ></span
            >
          </span>
        </template>
        <template #content>
          <div class="grid grid-cols-2 gap-5">
            <span>Student</span><span>{{ attempt.user.name }}</span>
            <span>Exam</span><span>{{ attempt.exam.title }}</span>
            <span>Total Score</span>
            <span
              >{{ attempt.totalScore }} /
              {{ attempt.questionOrder.length }} pts<span
                v-if="attempt.status === 'timed_out'">
                (Attempt Timed Out)</span
              ></span
            >
            <span>Grade</span
            ><span
              >{{ attempt.grade }}%<span v-if="attempt.status === 'timed_out'">
                (Attempt Timed Out)</span
              ></span
            >
            <span>Assigned Date</span
            ><span>{{ dateAsMMDD(attempt.createdAt) }}</span>
            <span>Start Time</span
            ><span>{{
              attempt.startTime ? dateAsMMDDHHMM(attempt.startTime) : ''
            }}</span>
            <span>End Time</span
            ><span>{{
              attempt.status === 'timed_out'
                ? ''
                : dateAsMMDDHHMM(attempt.endTime)
            }}</span>
            <span>Time Spent*</span
            ><span>{{
              attempt.status === 'timed_out'
                ? ''
                : secToHHMMSS(attempt.totalTime / 1000, true)
            }}</span>
          </div>
          <p>
            * This is an estimation based on the amount of time they spent on
            each question.
          </p>
          <Message
            class="mt-5"
            severity="error"
            v-if="attempt.student === user!.cid">
            You may not view the answer key for your own exam attempt.
          </Message>
        </template>
      </Card>
      <template v-if="attempt.student !== user!.cid">
        <Card class="my-2 scroll-m-5" ref="overviewElement">
          <template #title>Question Navigation</template>
          <template #content>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="(response, idx) of attempt.responses"
                :key="idx"
                :class="{
                  'bg-green-500': response.isCorrect,
                  'bg-red-500': !response.isCorrect,
                }"
                class="w-12 border rounded-xl px-3 py-1 text-xl cursor-pointer justify-center inline-flex"
                v-tooltip.top="`Jump to question ${idx + 1}`"
                @click="scrollToSection(idx)"
                >{{ idx + 1 }}</span
              >
            </div>
          </template>
        </Card>

        <Card class="my-5 bg-bg-3 dark:text-black">
          <template #title>Answer Key</template>
          <template #content>
            <div class="grid grid-cols-1 gap-2">
              <div class="correct flex items-center gap-3">
                <span class="text-center w-6"
                  ><Icon icon="heroicons:check-20-solid" class="no-pointer"
                /></span>
                <span>Correct answer selected. (Points Awarded)</span>
              </div>
              <div class="incorrect flex items-center gap-3">
                <span class="text-center w-6"
                  ><Icon icon="heroicons:x-mark-20-solid" class="no-pointer"
                /></span>
                <span>Incorrect answer selected. (No Points Awarded)</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="w-6"></span>
                <span>Incorrect answer not selected.</span>
              </div>
              <div class="missed flex items-center gap-3">
                <span class="w-6"></span>
                <span
                  >Correct answer <b>not</b> selected. (No Points Awarded)</span
                >
              </div>
            </div>
          </template>
        </Card>

        <Card
          v-for="(question, idx) of questions"
          :key="idx"
          ref="questionElements"
          class="my-2 scroll-m-5">
          <template #title>
            <div class="flex gap-5 items-center">
              <span class="w-6">{{ idx + 1 }}.</span>
              <span>{{ question.question.text }}</span>
            </div></template
          >
          <template #content>
            <div class="grid grid-cols-1 gap-2">
              <span
                v-for="option of question.question.options"
                :key="option._id">
                <div
                  class="flex flex-row gap-5 items-center"
                  :class="{
                    missed:
                      option.isCorrect &&
                      !question.response?.selectedOptions.includes(option._id),
                    correct:
                      option.isCorrect &&
                      question.response?.selectedOptions.includes(option._id),
                    incorrect:
                      !option.isCorrect &&
                      question.response?.selectedOptions.includes(option._id),
                  }">
                  <span class="w-6 text-center">
                    <Icon
                      icon="heroicons:x-mark-20-solid"
                      class="no-pointer"
                      v-if="
                        !option.isCorrect &&
                        question.response?.selectedOptions.includes(option._id)
                      " />
                    <Icon
                      icon="heroicons:check-20-solid"
                      class="no-pointer"
                      v-if="
                        option.isCorrect &&
                        question.response?.selectedOptions.includes(option._id)
                      " />
                  </span>
                  <span>{{ option.text }}</span>
                </div>
              </span>
            </div>

            <div class="flex justify-end mt-2.5">
              <span v-tooltip.left="'Jump to top'" @click="scrollToOverview">
                <Icon icon="heroicons:arrow-up" />
              </span>
            </div>
          </template>
        </Card>
      </template>
    </template>
  </Card>
</template>

<style lang="css" scoped>
.missed {
  border: 1px solid;
  border-color: var(--color-green-500);
}

.correct {
  background-color: var(--color-green-500);
}

.incorrect {
  background-color: var(--color-red-500);
}
</style>
