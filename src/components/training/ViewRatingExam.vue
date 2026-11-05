<script setup lang="ts">
import { ratingExamService } from '@/services/training/ratingExam.service';
import type {
  IRatingExam,
  IRatingExamIndicator,
} from '@/services/training/ratingExam.types';
import { textSort } from '@/utils/text';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { capitalize, computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

useTitle('View Rating Exam');
const route = useRoute();

const id = Array.isArray(route.params.id)
  ? route.params.id[0]
  : route.params.id;

const ratingExam = ref<IRatingExam | null>(null);

onMounted(async () => {
  try {
    const data = await ratingExamService.getRatingExam(id ?? '');

    ratingExam.value = data;
  } catch (e) {
    console.error('error getting rating exam', e);
  }
});

type IndicatorType = IRatingExamIndicator['type'];
type GroupedIndicators = Record<
  IndicatorType,
  Record<string, IRatingExamIndicator[]>
>;

const groupedIndicators = computed<GroupedIndicators>(() => {
  const groups: GroupedIndicators = {
    theory: {},
    practical: {},
  };
  if (!ratingExam.value) return groups;

  const indicators: IRatingExamIndicator[] = ratingExam.value.indicators;
  indicators.sort(
    (a, b) =>
      textSort(b.type, a.type) ||
      textSort(a.category, b.category) ||
      textSort(a.name, b.name),
  );

  for (const indicator of indicators) {
    groups[indicator.type][indicator.category] ??= [];
    groups[indicator.type][indicator.category]!.push(indicator);
  }

  return groups;
});

const getTotalIndicators = (
  categories: Record<string, IRatingExamIndicator[]>,
) =>
  Object.values(categories).reduce(
    (total, indicators) => total + indicators.length,
    0,
  );
</script>

<template>
  <ProgressSpinner v-if="!ratingExam" />
  <Card v-else>
    <template #title>Rating Exam - {{ ratingExam.name }}</template>
    <template #content>
      <div
        class="grid grid-cols-[60px_200px_1fr] font-bold text-center items-end">
        <span></span>
        <span class="p-3 grid grid-cols-1">Category</span>
        <div class="text-center grid grid-cols-3 p-3 items-end">
          <span>Performance Indicator</span>
          <span>Deduction per Occurrence</span>
          <span>Error Threshold</span>
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
          <template v-for="indicator in indicators" :key="indicator._id">
            <div
              class="col-start-3 grid grid-cols-3 items-center border p-3 transition-colors duration-200">
              <div>{{ indicator.name }}</div>

              <div class="text-center">
                {{ indicator.deduction }}
              </div>

              <div class="text-center">{{ indicator.failureThreshold }}</div>
            </div>
          </template>
        </template>
      </div>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
