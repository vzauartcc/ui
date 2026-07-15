<script setup lang="ts">
import { statsService } from '@/services/stats/stats.service';
import type { IInsStatsResponse } from '@/services/stats/stats.types';
import { useTitle } from '@/utils/title';
import type { ChartData, ChartOptions } from 'chart.js';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Instructor Dashboard');

const stats = ref<IInsStatsResponse | null>(null);
const emptyChart = {
  labels: [],
  datasets: [],
};

const sessionsChart = ref<ChartData<'line'>>(emptyChart);

const lineChartOptions = ref<ChartOptions<'line'>>({
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    y: {
      position: 'left',
      title: {
        display: true,
        text: 'Count',
        color: getComputedStyle(document.documentElement).getPropertyValue(
          '--p-core-blue',
        ),
      },
      ticks: {
        color: getComputedStyle(document.documentElement).getPropertyValue(
          '--p-core-blue',
        ),
      },
    },
    y1: {
      position: 'right',
      title: {
        display: true,
        text: 'Duration (hours)',
        color: getComputedStyle(document.documentElement).getPropertyValue(
          '--p-core-red',
        ),
      },
      ticks: {
        color: getComputedStyle(document.documentElement).getPropertyValue(
          '--p-core-red',
        ),
      },
    },
  },
});

onMounted(async () => {
  try {
    const documentStyle = getComputedStyle(document.documentElement);

    const data = await statsService.getInsStats();

    stats.value = data;

    sessionsChart.value = {
      labels: data.sessions.map((d) => `${d.month} ${d.year}`),
      datasets: [
        {
          label: 'Session Count',
          data: data.sessions.map((d) => d.total),
          fill: false,
          yAxisID: 'y',
          borderColor: documentStyle.getPropertyValue('--p-core-blue'),
          tension: 0.4,
        },
        {
          label: 'Total Session Duration',
          data: data.sessions.map((d) => d.totalTime / 3600),
          fill: false,
          yAxisID: 'y1',
          borderColor: documentStyle.getPropertyValue('--p-core-red'),
          tension: 0.4,
        },
      ],
    };
  } catch (e) {
    console.error('error getting stats', e);
  }
});
</script>

<template>
  <ProgressSpinner v-if="!stats" />
  <Card v-else>
    <template #title>Instructor Dashboard</template>
    <template #content>
      <Card>
        <template #title>Sessions by Month</template>
        <template #content>
          <Chart
            type="line"
            :data="sessionsChart"
            :options="lineChartOptions"
            class="h-80 w-full" />
        </template>
      </Card>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
