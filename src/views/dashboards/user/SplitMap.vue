<script setup lang="ts">
import SectorOwnership from '@/components/admin/SectorOwnership.vue';
import SplitMap from '@/components/split/SplitMap.vue';
import { splitService } from '@/services/split/split.service';
import type {
  IGeojsonResponse,
  IOwnershipResponse,
} from '@/services/split/split.types';
import { useUserStore } from '@/stores/user';
import { useTitle } from '@/utils/title';
import { toastSuccess } from '@/utils/toast';
import Button from 'primevue/button';
import Card from 'primevue/card';
import Divider from 'primevue/divider';
import Message from 'primevue/message';
import ProgressSpinner from 'primevue/progressspinner';
import Tab from 'primevue/tab';
import TabList from 'primevue/tablist';
import TabPanel from 'primevue/tabpanel';
import TabPanels from 'primevue/tabpanels';
import Tabs from 'primevue/tabs';
import ToggleSwitch from 'primevue/toggleswitch';
import { computed, onMounted, ref } from 'vue';

useTitle('Configure Split Map');
const defaultSector = { id: '35', name: 'BEARZ' };

const userStore = useUserStore();

const currentSplit = ref<IOwnershipResponse | null>(null);
const liveSplit = ref<IOwnershipResponse | null>(null);
const activePositions = ref<{ id: string; name: string }[]>([defaultSector]);
const geojson = ref<IGeojsonResponse | null>(null);

const quickSplits = ref([
  {
    group: '2-Way',
    splits: [
      {
        name: 'Plan 2A N/S',
        description: 'N: 60 BAE, S: 35 BEARZ',
        high: {
          36: '35', // FWA
          25: '60', // PMM
          46: '35', // BOILER
          52: '35', // BDF
          60: '60', // BADGER
          89: '35', // GIJ
          75: '60', // COTON
          94: '35', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '35', // PLANO
          62: '60', // HARLY
          63: '60', // DBQ
          64: '60', // LNR
          74: '60', // FARMM
          77: '35', // MALTA
          44: '35', // EON
          55: '35', // BRL
          26: '60', // KUBBS
          81: '35', // CRIBB
        },
      },
      {
        name: 'Plan 2B E/W',
        description: 'E: 35 BEARZ, W: 75 COTON',
        high: {
          36: '35', // FWA
          25: '35', // PMM
          46: '35', // BOILER
          52: '75', // BDF
          60: '75', // BADGER
          89: '35', // GIJ
          75: '75', // COTON
          94: '75', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '75', // PLANO
          62: '75', // HARLY
          63: '75', // DBQ
          64: '75', // LNR
          74: '75', // FARMM
          77: '75', // MALTA
          44: '35', // EON
          55: '75', // BRL
          26: '35', // KUBBS
          81: '35', // CRIBB
        },
      },
      {
        name: 'Plan 2C Hi/Lo',
        description: 'Hi: 89 GIJ, Lo: 35 LO',
        high: {
          36: '89', // FWA
          25: '89', // PMM
          46: '89', // BOILER
          52: '89', // BDF
          60: '89', // BADGER
          89: '89', // GIJ
          75: '89', // COTON
          94: '89', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '35', // PLANO
          62: '35', // HARLY
          63: '35', // DBQ
          64: '35', // LNR
          74: '35', // FARMM
          77: '35', // MALTA
          44: '35', // EON
          55: '35', // BRL
          26: '35', // KUBBS
          81: '35', // CRIBB
        },
      },
      {
        name: 'Plan 2D: MSP CrossFire',
        description: 'W/SW: 75 COTON, E/NE: 35 BEARZ',
        high: {
          36: '35', // FWA
          25: '35', // PMM
          46: '75', // BOILER
          52: '75', // BDF
          60: '35', // BADGER
          89: '35', // GIJ
          75: '75', // COTON
          94: '75', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '75', // PLANO
          62: '35', // HARLY
          63: '75', // DBQ
          64: '35', // LNR
          74: '75', // FARMM
          77: '75', // MALTA
          44: '75', // EON
          55: '75', // BRL
          26: '35', // KUBBS
          81: '35', // CRIBB
        },
      },
    ],
  },
  {
    group: '3-Way',
    splits: [
      {
        name: 'Plan 3A',
        description: 'W: 75 COTON, N: 60 BAE, SE: 35 BEARZ',
        high: {
          36: '35', // FWA
          25: '60', // PMM
          46: '35', // BOILER
          52: '75', // BDF
          60: '60', // BADGER
          89: '35', // GIJ
          75: '75', // COTON
          94: '75', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '75', // PLANO
          62: '60', // HARLY
          63: '60', // DBQ
          64: '60', // LNR
          74: '75', // FARMM
          77: '75', // MALTA
          44: '35', // EON
          55: '75', // BRL
          26: '60', // KUBBS
          81: '35', // CRIBB
        },
      },
      {
        name: 'Plan 3B East',
        description: 'W: 75 COTON, N: 60 BAE, SE: 35 BEARZ',
        high: {
          36: '35', // FWA
          25: '60', // PMM
          46: '75', // BOILER
          52: '75', // BDF
          60: '60', // BADGER
          89: '35', // GIJ
          75: '75', // COTON
          94: '75', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '75', // PLANO
          62: '60', // HARLY
          63: '60', // DBQ
          64: '60', // LNR
          74: '75', // FARMM
          77: '75', // MALTA
          44: '75', // EON
          55: '75', // BRL
          26: '60', // KUBBS
          81: '35', // CRIBB
        },
      },
    ],
  },
  {
    group: '4-Way',
    splits: [
      {
        name: 'Plan 4A: Standard',
        description: 'N: 60 BAE, SE: 35 BEARZ, SW: 46 BVT, W: 75 COTON',
        high: {
          36: '35', // FWA
          25: '60', // PMM
          46: '46', // BOILER
          52: '46', // BDF
          60: '60', // BADGER
          89: '35', // GIJ
          75: '75', // COTON
          94: '75', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '46', // PLANO
          62: '60', // HARLY
          63: '60', // DBQ
          64: '60', // LNR
          74: '75', // FARMM
          77: '75', // MALTA
          44: '46', // EON
          55: '46', // BRL
          26: '60', // KUBBS
          81: '35', // CRIBB
        },
      },
      {
        name: 'Plan 4B',
        description: 'NW: 60 BAE, NW: 89 GIJ, SE: 35 BEARZ, S/SW: 46 BVT',
        high: {
          36: '35', // FWA
          25: '89', // PMM
          46: '46', // BOILER
          52: '46', // BDF
          60: '60', // BADGER
          89: '89', // GIJ
          75: '60', // COTON
          94: '46', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '46', // PLANO
          62: '60', // HARLY
          63: '60', // DBQ
          64: '60', // LNR
          74: '60', // FARMM
          77: '60', // MALTA
          44: '46', // EON
          55: '46', // BRL
          26: '89', // KUBBS
          81: '89', // CRIBB
        },
      },
      {
        name: 'Plan 4C: Iso-COTON',
        description: 'N/NE: 60 BAE, E/SE: 35 BEARZ, S/SW: 94 IOW, NW: 75 COTON',
        high: {
          36: '35', // FWA
          25: '60', // PMM
          46: '94', // BOILER
          52: '94', // BDF
          60: '60', // BADGER
          89: '35', // GIJ
          75: '75', // COTON
          94: '94', // IOW
        },
        low: {
          35: '35', // BEARZ
          51: '94', // PLANO
          62: '60', // HARLY
          63: '60', // DBQ
          64: '60', // LNR
          74: '75', // FARMM
          77: '94', // MALTA
          44: '94', // EON
          55: '94', // BRL
          26: '60', // KUBBS
          81: '35', // CRIBB
        },
      },
    ],
  },
]);

onMounted(async () => {
  getCurrentSplit();

  try {
    const data = await splitService.getGeojson();

    geojson.value = data;
  } catch (e) {
    console.error('error getting geojson data', e);
  }
});

const getCurrentSplit = async () => {
  try {
    const data = await splitService.getOwnership();

    currentSplit.value = JSON.parse(JSON.stringify(data));
    liveSplit.value = JSON.parse(JSON.stringify(data));

    populateActivePositions(data.ownership);
  } catch (e) {
    console.error('Error getting ownership information', e);
  }
};

const populateActivePositions = (data: {
  high: Record<string, string>;
  low: Record<string, string>;
}) => {
  const allValues = Object.values(data).flatMap((category) =>
    Object.values(category),
  );
  const existingPositions = [...new Set(allValues)];
  existingPositions.forEach((v) => {
    if (v === defaultSector.id) return;

    const p = currentSplit.value!.positions.find((x) => x.id === v);
    if (!p) return;

    activePositions.value.push({ id: p.id, name: p.name });
  });
};

const isChanged = computed(() => {
  if (!currentSplit.value || !liveSplit.value) return false;

  return JSON.stringify(currentSplit.value) !== JSON.stringify(liveSplit.value);
});

const saveSplit = async (
  highSplit: Record<string, string>,
  lowSplit: Record<string, string>,
) => {
  try {
    const data = await splitService.saveSplit(highSplit, lowSplit);

    currentSplit.value!.ownership = JSON.parse(JSON.stringify(data));
    liveSplit.value!.ownership = JSON.parse(JSON.stringify(data));
    populateActivePositions(data);

    toastSuccess('Split Saved!', 'Successfully saved the split.');
  } catch (e) {
    console.error('error saving split', e);
  }
};

const resetSplit = async () => {
  try {
    const data = await splitService.resetSplit();

    currentSplit.value!.ownership = JSON.parse(JSON.stringify(data));
    liveSplit.value!.ownership = JSON.parse(JSON.stringify(data));
    populateActivePositions(data);

    toastSuccess('Split Reset!', 'Center split has been reset.');
  } catch (e) {
    console.error('error resetting split', e);
  }
};

const toggleSplit = (data: { id: string; name: string }) => {
  const idx = activePositions.value.findIndex((o) => o.id === data.id);
  if (idx > -1) {
    activePositions.value.splice(idx, 1);
    Object.entries(currentSplit.value!.ownership).forEach(
      ([_levels, sectors]) => {
        Object.entries(sectors).forEach(([key, val]) => {
          if (`${val}` === data.id) {
            sectors[key] = defaultSector.id;
          }
        });
      },
    );
  } else {
    activePositions.value.push(data);
  }
};

const updateOwnershipLo = (d) => {
  if (!currentSplit.value) return;

  currentSplit.value.ownership.low[d.sectorId] = d.value;
};

const updateOwnershipHi = (d: { sectorId: number; value: string }) => {
  if (!currentSplit.value) return;

  currentSplit.value.ownership.high[d.sectorId] = d.value;
};
</script>

<template>
  <ProgressSpinner v-if="!currentSplit" />
  <Card v-else :class="{ 'bg-red-100': isChanged }">
    <template #title>Edit Center Split</template>
    <template #content>
      <Tabs value="0">
        <TabList>
          <Tab value="0">Split Map</Tab>
          <Tab value="1">Preset Splits</Tab>
          <Tab value="2" v-if="userStore.isEventsTeam">Active Positions</Tab>
          <Tab value="3" v-if="userStore.isEventsTeam && geojson"
            >Sector Ownership</Tab
          >
        </TabList>
        <TabPanels>
          <TabPanel value="0">
            <SplitMap
              :ownershipData="currentSplit.ownership"
              :positionsData="currentSplit.positions" />
          </TabPanel>
          <TabPanel value="1">
            <p>
              Apply a split preset from the options below.<span
                v-if="userStore.isEventsTeam">
                Or configure your own split by using the advanced Active
                Positions and Sector Ownership tools.</span
              >
            </p>
            <div v-for="group of quickSplits" :key="group.group">
              <p class="text-2xl">{{ group.group }}</p>

              <div
                v-for="split of group.splits"
                :key="split.name"
                class="grid grid-cols-5 gap-5 my-2.5 items-center">
                <Button
                  label="Activate"
                  @click="saveSplit(split.high, split.low)" />
                <span class="col-span-4"
                  ><b>{{ split.name }}</b> {{ split.description }}</span
                >
              </div>
            </div>

            <Divider class="my-10" />

            <div class="grid grid-cols-5 gap-5 my-2.5 items-center">
              <Button
                severity="danger"
                label="Reset Split"
                @click="resetSplit" />
              <span class="col-span-4"
                ><b>Plan 1A</b> {{ defaultSector.id }}
                {{ defaultSector.name }} owns everything
              </span>
            </div>
          </TabPanel>
          <TabPanel value="2" v-if="userStore.isEventsTeam">
            <p>
              Select which positions are available to be assigned sectors.
              {{ defaultSector.id }} {{ defaultSector.name }} is always active.
            </p>
            <div class="grid grid-cols-4 gap-5 items-center">
              <div
                v-for="position of currentSplit.positions"
                :key="position.id"
                class="flex flex-row gap-2.5">
                <ToggleSwitch
                  :modelValue="
                    activePositions.some((o) => o.id === position.id)
                  "
                  @update:model-value="toggleSplit(position)"
                  :disabled="position.id === defaultSector.id" />
                <span>{{ position.name }} ({{ position.id }})</span>
              </div>
            </div>
          </TabPanel>
          <TabPanel value="3" v-if="userStore.isEventsTeam && geojson">
            <Message
              v-if="isChanged"
              severity="error"
              :closable="false"
              class="text-center justify-center mb-4"
              >UNSAVED CHANGES</Message
            >
            <p>
              Assign sector ownership based on the available sectors selection.
            </p>
            <div class="grid grid-cols-2 gap-5">
              <div id="high">
                <p class="text-2xl">High</p>
                <SectorOwnership
                  :geojson="geojson.sectors.high.features"
                  :allPositions="currentSplit.positions"
                  :activePositions="activePositions"
                  :ownership="currentSplit.ownership.high"
                  @update:ownership="updateOwnershipHi" />
                <div class="flex justify-center mt-5">
                  <Button
                    severity="danger"
                    label="Reset Split"
                    @click="resetSplit" />
                </div>
              </div>

              <div id="low">
                <p class="text-2xl">Low</p>
                <SectorOwnership
                  :geojson="geojson.sectors.low.features"
                  :allPositions="currentSplit.positions"
                  :activePositions="activePositions"
                  :ownership="currentSplit.ownership.low"
                  @update:ownership="updateOwnershipLo" />
              </div>
            </div>
            <Message
              v-if="isChanged"
              severity="error"
              :closable="false"
              class="text-center justify-center mb-4"
              >UNSAVED CHANGES</Message
            >
            <div class="flex justify-end mt-5">
              <Button
                label="Save!"
                @click="
                  saveSplit(
                    currentSplit.ownership.high,
                    currentSplit.ownership.low,
                  )
                " />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </template>
  </Card>
</template>

<style lang="css" scoped></style>
