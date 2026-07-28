<script setup lang="ts">
import { secToHHMMSS } from '@/utils/text';
import { useTitle } from '@/utils/title';
import { statsService } from '@/services/stats/stats.service';
import type { IAdminStatsResponse } from '@/services/stats/stats.types';
import { Icon } from '@iconify/vue';
import type { ChartData, ChartOptions } from 'chart.js';
import Card from 'primevue/card';
import Chart from 'primevue/chart';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

useTitle('Admin Dashboard');
const emptyChart = {
  labels: [],
  datasets: [],
};

const stats = ref<IAdminStatsResponse | null>(null);

const hoursChart = ref<ChartData<'line'>>(emptyChart);
const feedbackChart = ref<ChartData<'line'>>(emptyChart);
const ratingChart = ref<ChartData<'bar'>>(emptyChart);

const lineChartOptions = ref<ChartOptions<'line'>>({
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
});
const barChartOptions = ref<ChartOptions<'bar'>>({
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
    },
  },
  scales: {
    x: {
      offset: true,
    },
    y: {
      grace: '10%',
      beginAtZero: true,
      ticks: {
        precision: 0,
      },
    },
  },
});

onMounted(async () => {
  try {
    const documentStyle = getComputedStyle(document.documentElement);

    const data = await statsService.getAdminStats();

    stats.value = data;

    hoursChart.value = {
      labels: data.hours.map((d) => `${d.month} ${d.year}`),
      datasets: [
        {
          label: 'Hours',
          data: data.hours.map((d) => d.total / 3600),
          fill: false,
          borderColor: documentStyle.getPropertyValue('--p-core-blue'),
          tension: 0.4,
        },
      ],
    };

    feedbackChart.value = {
      labels: data.hours.map((d) => `${d.month} ${d.year}`),
      datasets: [
        {
          label: 'Feedback Submitted',
          data: data.feedback.map((d) => d.total),
          fill: false,
          borderColor: documentStyle.getPropertyValue('--p-core-blue'),
          tension: 0.4,
        },
      ],
    };

    ratingChart.value = {
      labels: data.counts.byRating
        .filter((r) => r._id > 0)
        .map((r) => r.rating),
      datasets: [
        {
          label: 'Count',
          data: data.counts.byRating
            .filter((r) => r._id > 0)
            .map((d) => d.count),
          borderColor: documentStyle.getPropertyValue('--p-core-blue'),
          backgroundColor: documentStyle.getPropertyValue('--p-core-blue'),
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
    <template #title>Admin Dashboard</template>
    <template #content>
      <div class="grid grid-cols-3 gap-5 header">
        <Card>
          <template #title>Hours This Month</template>
          <template #content>{{ secToHHMMSS(stats.totalTime) }}</template>
        </Card>
        <Card>
          <template #title>Total Controllers</template>
          <template #content>
            <Icon icon="heroicons:home" /><span class="mx-2.5">{{
              stats.counts.home
            }}</span>
            <span class="mx-2.5">/</span>
            <Icon icon="heroicons:briefcase" /><span class="mx-2.5">{{
              stats.counts.vis
            }}</span>
          </template>
        </Card>
        <Card>
          <template #title>Sessions This Month</template>
          <template #content>{{ stats.totalSessions }}</template>
        </Card>
      </div>

      <Card class="mt-5">
        <template #title>Controller Hours by Month</template>
        <template #content>
          <Chart
            type="line"
            :data="hoursChart"
            :options="lineChartOptions"
            class="h-80 w-full" />
        </template>
      </Card>

      <Card>
        <template #title>Feedback by Month</template>
        <template #content>
          <Chart
            type="line"
            :data="feedbackChart"
            :options="lineChartOptions"
            class="h-80 w-full" />
        </template>
      </Card>

      <Card>
        <template #title>Rating Distribution</template>
        <template #content>
          <Chart
            type="bar"
            :data="ratingChart"
            :options="barChartOptions"
            class="h-80 w-full" />
        </template>
      </Card>
    </template>
  </Card>
</template>

<style lang="css" scoped>
:deep(.header .p-card-title) {
  text-align: center;
  font-weight: bold;
}

:deep(.header .p-card-content) {
  text-align: center;
  font-size: x-large;
}
</style>
