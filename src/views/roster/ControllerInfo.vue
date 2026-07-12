<script setup lang="ts">
import { controllerService } from '@/services/controller/controller.service';
import type {
  IController,
  IControllerStats,
} from '@/services/controller/controller.types';
import { secToHHMM } from '@/utils/text';
import { useTitle } from '@/utils/title';
import Card from 'primevue/card';
import Chip from 'primevue/chip';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

useTitle('User Details');

const route = useRoute();
const user = ref<IController | null>(null);

const stats = ref<IControllerStats | null>(null);

const cid =
  (Array.isArray(route.params.cid) ? route.params.cid[0] : route.params.cid) ||
  '';

useTitle(cid);

onMounted(async () => {
  try {
    const data = await controllerService.getUser(cid);

    useTitle(data.name);
    user.value = data;
  } catch (e) {
    console.error('error getting user details', e);
  }

  try {
    const hours = await controllerService.getUserActivity(cid);
    stats.value = hours;
  } catch (e) {
    console.error('error getting user activity', e);
  }
});

const randomAvatarColor = (): string => {
  const vals = [
    '#e4002b',
    '#41b6e6',
    '#cc393e',
    '#0075bb',
    '#f9c642',
    '#4aa564',
  ];

  return vals[Math.floor(Math.random() * vals.length)]!;
};
</script>

<template>
  <ProgressSpinner v-if="!user" />
  <Card v-else>
    <template #title>
      <div class="md:flex items-center">
        <div class="p-2 border border-gray-500">
          <div
            class="min-w-36 text-center py-12 px-6 font-bold border border-white text-6xl text-white"
            :style="{ backgroundColor: randomAvatarColor() }">
            {{ user.oi || `${user.cid}`.substring(0, 2) }}
          </div>
        </div>
        <span class="ml-3">
          <b>{{ user.name }}</b> - {{ user.cid }}
          <br />
          <Chip
            v-for="role in user.roles"
            :key="role.name"
            :label="role.name"
            class="text-sm mx-1 my-1"
            :class="role.code" />
          <br />
          <span class="text-sm">Endorsements</span>
          <br />
          <Chip
            v-for="cert in user.certifications"
            :key="cert.code"
            :label="`${cert.name}`"
            class="text-sm mx-1 certs my-1"
            :class="cert.code" />
        </span>
      </div>
    </template>
    <template #content>
      <DataTable
        :value="stats.activity"
        showGridlines
        stripedRows
        size="small"
        v-if="stats">
        <Column field="name" bodyClass="font-bold" />
        <Column field="del" header="DEL">
          <template #body="{ data }">
            <span v-if="data.del !== 0">
              {{ secToHHMM(data.del) }}
            </span>
          </template>
        </Column>
        <Column field="gnd" header="GND">
          <template #body="{ data }">
            <span v-if="data.gnd !== 0">
              {{ secToHHMM(data.gnd) }}
            </span>
          </template>
        </Column>
        <Column field="twr" header="TWR">
          <template #body="{ data }">
            <span v-if="data.twr !== 0">
              {{ secToHHMM(data.twr) }}
            </span>
          </template>
        </Column>
        <Column field="app" header="APP">
          <template #body="{ data }">
            <span v-if="data.app !== 0">
              {{ secToHHMM(data.app) }}
            </span>
          </template>
        </Column>
        <Column field="ctr" header="CTR">
          <template #body="{ data }">
            <span v-if="data.ctr !== 0">
              {{ secToHHMM(data.ctr) }}
            </span>
          </template>
        </Column>
        <Column
          field="total"
          header="Total"
          bodyClass="border-l-2 border-l-black text-right"
          headerClass="border-l-2 border-l-black text-right">
          <template #body="{ data }">
            <span
              v-if="data.ctr + data.app + data.twr + data.gnd + data.del !== 0">
              {{
                secToHHMM(data.ctr + data.app + data.twr + data.gnd + data.del)
              }}
            </span>
          </template>
        </Column>
        <template #footer>
          <div class="grid grid-cols-2 w-max gap-x-2">
            <span class="font-bold">Total Sessions:</span>
            <span>{{ stats.sessionCount }}</span>
            <span class="font-bold">Avg. Session:</span>
            <span>{{ secToHHMM(stats.sessionAvg) }}</span>
          </div>
        </template>
      </DataTable>
    </template>
  </Card>
</template>

<style lang="css" scoped>
.atm,
.datm,
.ta {
  background-color: var(--p-red-900);
  color: white;
}

.ec,
.fe,
.wm {
  background-color: var(--p-sec-gold-900);
}

.ins,
.mtr {
  background-color: var(--p-red-600);
}

.zau {
  background-color: var(--p-sec-gold-600);
  color: initial;
}

.certs[class*='ord']:not([class$='s']):not([class$='e']) {
  background-color: var(--p-core-red);
  color: initial;
}

.certs[class*='mdw']:not([class$='s']):not([class$='e']) {
  background-color: var(--p-core-blue);
  color: initial;
}

.certs[class$='e'] {
  background-color: var(--p-sec-green-900);
}

.certs[class$='s'] {
  background-color: black;
  color: white;
}

.certs:is(.app, .twr, .gnd) {
  background-color: var(--p-sec-gray-300);
  color: initial;
}
</style>
