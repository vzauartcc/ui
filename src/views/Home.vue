<script setup lang="ts">
import CurrentConditions from '@/components/homepage/CurrentConditions.vue';
import OnlineControllers from '@/components/homepage/OnlineControllers.vue';
import OnlinePilots from '@/components/homepage/OnlinePilots.vue';
import RecentNews from '@/components/homepage/RecentNews.vue';
import TopControllers from '@/components/homepage/TopControllers.vue';
import UpcomingEvents from '@/components/homepage/UpcomingEvents.vue';
import { useUserStore } from '@/stores/user.js';
import { useTitle } from '@/utils/title';
import { getEnvironment } from '@/utils/uriHelper';
import { Icon } from '@iconify/vue';
import { storeToRefs } from 'pinia';
import Button from 'primevue/button';
import Card from 'primevue/card';

useTitle('Home');

const userStore = useUserStore();
const { user, isLoggedIn } = storeToRefs(userStore);
</script>

<template>
  <div class="w-full min-h-screen space-y-12 pb-16">
    <section
      class="relative overflow-hidden rounded-3xl bg-linear-to-br from-surface-50 to-surface-100 dark:from-bg-8 dark:to-surface-50 border border-surface-200 dark:border-surface-100 p-8 md:p-12 shadow-xl">
      <div class="absolute top-0 left-0 w-2 h-full bg-[#e4002b]"></div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-7 space-y-6">
          <span
            class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            <span class="flex h-2 w-2 relative">
              <span
                class="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#41b6e6] opacity-75"></span>
              <span
                class="relative inline-flex rounded-full h-2 w-2 bg-[#41b6e6]"></span>
            </span>
            Virtual Chicago ARTCC
          </span>

          <h1
            class="text-4xl md:text-5xl font-extrabold tracking-tight text-surface-900 dark:text-surface-50 leading-tight">
            Radar Contact. <br />
            <span
              class="text-transparent bg-clip-text bg-linear-to-r from-[#41b6e6] to-[#0092d1]">
              Welcome to vZAU.
            </span>
          </h1>

          <div
            v-if="
              getEnvironment() === 'development' ||
              !isLoggedIn ||
              (!user?.member && !user?.vis)
            "
            class="space-y-4 max-w-2xl">
            <p
              class="text-base text-surface-600 dark:text-surface-300 leading-relaxed">
              The Virtual Chicago ARTCC provides elite air traffic control
              services across the Chicago Metro area, Great Lakes, and Midwest
              sectors. We deliver unrivaled realism, professionalism, and pilot
              courtesy.
            </p>
            <div class="pt-2">
              <Button
                as="router-link"
                to="/visit"
                label="Become a Visitor!"
                icon="pi pi-plane"
                severity="primary"
                class="shadow-md shadow-primary-500/20 font-semibold px-6 py-2.5 rounded-xl transform hover:-translate-y-0.5 transition-all duration-200" />
            </div>
            <p class="text-sm text-surface-500 dark:text-surface-400">
              Rather transfer in? Request via
              <a
                href="https://www.vatusa.net/help/kb#q8"
                target="_blank"
                noreferrer
                noopener
                rel="noopener noreferrer"
                class="text-[#41b6e6] hover:text-[#0092d1] underline transition-colors font-medium"
                >VATUSA</a
              >.
            </p>
          </div>

          <!-- Alternative Welcome for existing members -->
          <div v-else class="max-w-xl">
            <p class="text-base text-surface-600 dark:text-surface-300">
              Welcome back, {{ user?.name }}. Check your briefing updates below.
            </p>
          </div>
        </div>

        <div
          class="lg:col-span-5 w-full lg:h-full flex flex-col justify-center">
          <div
            class="bg-surface-0 dark:bg-surface-50/50 backdrop-blur-md rounded-2xl border border-surface-200/60 dark:border-surface-100/30 p-5 shadow-lg relative">
            <div
              class="flex items-center justify-between mb-4 pb-2 border-b border-surface-100 dark:border-surface-200/10">
              <div class="flex items-center gap-2">
                <Icon
                  icon="heroicons:users"
                  class="text-[#41b6e6] text-2xl! no-pointer" />
                <h3
                  class="font-bold text-surface-800 dark:text-surface-100 text-sm tracking-wide uppercase">
                  Online Controllers
                </h3>
              </div>
            </div>
            <OnlineControllers />
          </div>
        </div>
      </div>
    </section>

    <!-- Left Column -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <main class="lg:col-span-7 space-y-8">
        <div
          class="relative group bg-surface-0 dark:bg-surface-50/10 rounded-2xl p-6 border border-surface-200/80 dark:border-surface-100/20 shadow-sm hover:shadow-md transition-all duration-300">
          <div
            class="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-[#41b6e6]/10 to-transparent rounded-tr-2xl pointer-events-none"></div>
          <div class="flex items-center gap-3 mb-6">
            <div
              class="p-2.5 bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-500">
              <Icon
                icon="heroicons:megaphone"
                class="text-2xl! text-[#41b6e6] no-pointer" />
            </div>
            <h2
              class="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              Recent News
            </h2>
          </div>
          <RecentNews />
        </div>

        <div
          class="relative group bg-surface-0 dark:bg-surface-50/10 rounded-2xl p-6 border border-surface-200/80 dark:border-surface-100/20 shadow-sm hover:shadow-md transition-all duration-300">
          <div
            class="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-[#e4002b]/10 to-transparent rounded-tr-2xl pointer-events-none"></div>
          <div class="flex items-center gap-3 mb-6">
            <div
              class="p-2.5 bg-red-50 dark:bg-red-950/30 rounded-xl text-red-500">
              <Icon
                icon="heroicons:calendar"
                class="text-2xl! text-[#e4002b] no-pointer" />
            </div>
            <h2
              class="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              Upcoming Events
            </h2>
          </div>
          <UpcomingEvents />
        </div>

        <div
          class="relative group bg-surface-0 dark:bg-surface-50/10 rounded-2xl p-6 border border-surface-200/80 dark:border-surface-100/20 shadow-sm hover:shadow-md transition-all duration-300">
          <div
            class="absolute top-0 right-0 w-24 h-24 bg-linear-to-br from-[#41b6e6]/10 to-transparent rounded-tr-2xl pointer-events-none"></div>
          <div class="flex items-center gap-3 mb-6">
            <div
              class="p-2.5 bg-primary-50 dark:bg-primary-950/50 rounded-xl text-primary-500">
              <Icon
                icon="heroicons:paper-airplane"
                class="text-2xl! text-[#41b6e6] no-pointer" />
            </div>
            <h2
              class="text-2xl font-bold tracking-tight text-surface-900 dark:text-surface-50">
              Nearby Aircraft
            </h2>
          </div>
          <div>
            <OnlinePilots />
          </div>
        </div>
      </main>

      <!-- Right Column -->
      <aside class="lg:col-span-5 space-y-8 lg:sticky lg:top-6">
        <Card
          class="overflow-hidden border border-surface-200/80 dark:border-surface-100/20 shadow-sm bg-surface-0! dark:bg-surface-50/10! rounded-2xl!">
          <template #title>
            <div
              class="flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
              <Icon
                icon="heroicons:cloud"
                class="text-2xl! text-sky-400 no-pointer" />
              Airfield Conditions
            </div>
          </template>
          <template #content>
            <CurrentConditions />
          </template>
        </Card>

        <Card
          v-if="user?.isMember"
          class="overflow-hidden border border-surface-200/80 dark:border-surface-100/20 shadow-sm bg-surface-0! dark:bg-surface-50/10! rounded-2xl!">
          <template #title>
            <div class="flex items-center justify-between">
              <div
                class="flex items-center gap-2 text-lg font-bold text-surface-900 dark:text-surface-50">
                <Icon
                  icon="heroicons:chart-pie"
                  class="text-2xl! text-[#e4002b] no-pointer" />
                Iron Mic Leaderboard
              </div>
              <span
                class="text-xs font-normal text-surface-400 px-2 py-0.5 rounded-md bg-surface-100 dark:bg-surface-200/10"
                >This Month</span
              >
            </div>
          </template>
          <template #content>
            <TopControllers />
          </template>
        </Card>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="css">
/* Fix datatable coloring. */
:deep(.p-datatable),
:deep(.p-datatable-thead > tr > th),
:deep(.p-datatable-tbody > tr),
:deep(.p-datatable-tbody > tr > td),
:deep(.p-datatable-tfoot > tr > td) {
  background: transparent !important;
}

:deep(.p-datatable-tbody > tr:nth-child(even)) {
  background-color: color-mix(
    in srgb,
    var(--p-core-blue) 20%,
    transparent
  ) !important;
}

.dark :deep(.p-datatable-thead > tr > th),
.dark :deep(.p-datatable-tbody > tr > td) {
  border-color: rgba(255, 255, 255, 0.06) !important;
}

.light :deep(.p-datatable-thead > tr > th),
.light :deep(.p-datatable-tbody > tr > td) {
  border-color: rgba(0, 0, 0, 0.05) !important;
}

.dark :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(255, 255, 255, 0.05) !important;
}
.light :deep(.p-datatable-tbody > tr:hover) {
  background: rgba(65, 182, 230, 0.08) !important;
}
</style>
