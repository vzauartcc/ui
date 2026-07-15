<script setup lang="ts">
import type { IController } from '@/services/controller/controller.types';
import { Icon } from '@iconify/vue';
import Chip from 'primevue/chip';
import Column from 'primevue/column';
import ColumnGroup from 'primevue/columngroup';
import DataTable from 'primevue/datatable';
import Row from 'primevue/row';
import { computed, ref } from 'vue';

const props = defineProps<{ controllers: IController[] }>();

const visiting = computed(() => {
  return props.controllers.every((c) => c.vis === true);
});

const ptColumn = ref({
  columnHeaderContent: { style: { 'justify-content': 'center' } },
});
</script>

<template>
  <DataTable :value="props.controllers" stripedRows showGridlines>
    <ColumnGroup type="header">
      <Row>
        <Column header="Name" :rowspan="3" :pt="ptColumn" />
        <Column header="Endorsements" :colspan="9" :pt="ptColumn" />
      </Row>
      <Row>
        <Column header="Non-Tiered" :colspan="3" :pt="ptColumn" />
        <Column header="Midway" :colspan="2" :pt="ptColumn" />
        <Column header="O'Hare" :colspan="2" :pt="ptColumn" />
        <Column header="C90" :pt="ptColumn" />
        <Column header="ZAU" :pt="ptColumn" />
      </Row>
      <Row>
        <Column header="GND" class="px-1" :pt="ptColumn" />
        <Column header="TWR" class="px-1" :pt="ptColumn" />
        <Column header="APP" class="px-1" :pt="ptColumn" />
        <Column header="GND" class="px-1" :pt="ptColumn" />
        <Column header="TWR" class="px-1" :pt="ptColumn" />
        <Column header="GND" class="px-1" :pt="ptColumn" />
        <Column header="TWR" class="px-1" :pt="ptColumn" />
        <Column class="px-1" />
        <Column class="px-1" />
      </Row>
    </ColumnGroup>
    <Column field="name">
      <template #body="{ data }">
        <router-link :to="`/controllers/${data.cid}`"
          ><b>{{ data.name }}</b></router-link
        >
        ({{ data.oi }})
        <Chip
          v-for="code in data.roleCodes"
          :key="code"
          class="mx-0.5"
          :label="code.toUpperCase()"
          :class="code" />
        <br />
        <span v-if="visiting">{{ data.homeFacility }} - </span>
        <span>{{ data.ratingShort }}</span>
      </template>
    </Column>
    <Column field="non-tiered-gnd" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('gnde')"
            v-tooltip.top="`Event Endorsed`">
            <Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('gnds')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow">
            <Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('gnd')"
            v-tooltip.top="`Endorsed`"
            class="green">
            <Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="non-tiered-twr" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('twre')"
            v-tooltip.top="`Event Endorsed`"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('twrs')"
            v-tooltip.top="`Solo Endorsed`"
            ><Icon icon="heroicons:academic-cap" class="yellow" />
          </span>

          <span
            v-else-if="data.certCodes.includes('twr')"
            v-tooltip.top="`Endorsed`"
            ><Icon icon="heroicons:check-circle-solid" class="green" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="non-tiered-app" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('appe')"
            v-tooltip.top="`Event Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-if="data.certCodes.includes('apps')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('app')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="midway-gnd" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('mdwgnde')"
            v-tooltip.top="`Event Endorsed`"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('mdwgnds')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('mdwgnd')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="midway-twr" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('mdwtwre')"
            v-tooltip.top="`Event Endorsed`"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('mdwtwrs')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('mdwtwr')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="ohare-gnd" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('ordgnde')"
            v-tooltip.top="`Event Endorsed`"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('ordgnds')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('ordgnd')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="ohare-twr" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('ordtwre')"
            v-tooltip.top="`Event Endorsed`"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('ordtwrs')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('ordtwr')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="c90" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('ordappe')"
            v-tooltip.top="`Event Endorsed`"
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('ordapps')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('ordapp')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
    <Column field="zau" class="icons px-1">
      <template #body="{ data }">
        <div class="flex justify-center">
          <span
            v-if="data.certCodes.includes('zaue')"
            v-tooltip.top="`Event Endorsed`"
            class=""
            ><Icon icon="heroicons:calendar-days" />
          </span>

          <span
            v-else-if="data.certCodes.includes('zaus')"
            v-tooltip.top="`Solo Endorsed`"
            class="yellow"
            ><Icon icon="heroicons:academic-cap" />
          </span>

          <span
            v-else-if="data.certCodes.includes('zau')"
            v-tooltip.top="`Endorsed`"
            class="green"
            ><Icon icon="heroicons:check-circle-solid" />
          </span>

          <span v-else v-tooltip.top="`Not Endorsed`" class="red">
            <Icon icon="heroicons:x-circle-solid" />
          </span>
        </div>
      </template>
    </Column>
  </DataTable>
</template>

<style lang="css" scoped>
:deep(.iconify) {
  font-size: xx-large !important;
  cursor: default !important;
}

.red {
  color: red;
}

.green {
  color: green;
}

.yellow {
  color: darkgoldenrod;
}

:deep(.p-chip) {
  font-size: small;
  padding: 0.25rem 0.5rem;
}

.atm,
.datm,
.ta {
  background-color: red;
}

.ec,
.fe,
.wm {
  background-color: yellow;
}

.ins,
.mtr,
.ia {
  background-color: var(--p-core-blue);
}
</style>
