<script setup lang="ts">
import { weatherService } from '@/services/weather/weather.service';
import type { IMetar } from '@/services/weather/weather.types';
import { Icon } from '@iconify/vue';
import Column from 'primevue/column';
import DataTable from 'primevue/datatable';
import ProgressSpinner from 'primevue/progressspinner';
import { onMounted, ref } from 'vue';

interface IRunwayData {
  icao: string;
  fullName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configs: any;
  getLanding: (speed: number, dir: number, hour: number) => string;
  getDeparting: (speed: number, dir: number, hour: number) => string;
}

interface IAirportData {
  RunwayData?: IRunwayData;
  Metar: IMetar;
}

const loading = ref(true);
const conditions = ref([] as IAirportData[]);

const runwayData = ref<IRunwayData[]>([
  {
    icao: 'KORD',
    fullName: "Chicago O'Hare Int'l",
    configs: {
      landing: {
        W: '28C/27C/27R',
        E: '09C/09L/10C/10R',
        NE: '4R',
        SW: '22L/22R',
      },
      departing: {
        W: '28R/27L/22L',
        E: '10L/09R',
        NE: '4L',
        SW: '22L',
      },
    },
    getLanding: function (speed: number, dir: number) {
      if (speed <= 9) {
        return this.configs.landing.W;
      } else if (
        (dir >= 180 && dir <= 360 && speed >= 10 && speed <= 24) ||
        (dir >= 230 && dir <= 330 && speed >= 25)
      ) {
        return this.configs.landing.W;
      } else if (
        (dir >= 10 && dir <= 170 && speed >= 10 && speed <= 24) ||
        (dir >= 50 && dir <= 150 && speed >= 25)
      ) {
        return this.configs.landing.E;
      } else if (dir >= 340 || (dir <= 40 && speed >= 25)) {
        return this.configs.landing.NE;
      } else if (dir >= 160 && dir <= 220 && speed >= 25) {
        return this.configs.landing.SW;
      } else {
        return this.configs.landing.W;
      }
    },
    getDeparting: function (speed: number, dir: number) {
      if (speed <= 9) {
        return this.configs.departing.W;
      } else if (
        (dir >= 180 && dir <= 360 && speed >= 10 && speed <= 24) ||
        (dir >= 230 && dir <= 330 && speed >= 25)
      ) {
        return this.configs.departing.W;
      } else if (
        (dir >= 10 && dir <= 170 && speed >= 10 && speed <= 24) ||
        (dir >= 50 && dir <= 150 && speed >= 25)
      ) {
        return this.configs.departing.E;
      } else if (dir >= 340 || (dir <= 40 && speed >= 25)) {
        return this.configs.departing.NE;
      } else if (dir >= 160 && dir <= 220 && speed >= 25) {
        return this.configs.departing.SW;
      } else {
        return this.configs.departing.W;
      }
    },
  },
  {
    icao: 'KMDW',
    fullName: "Chicago Midway Int'l",
    configs: {
      landing: {
        NE: '4L/4R',
        NW: '31L/31R',
        SE: '13L/13R',
        SW: '22L/22R',
      },
      departing: {
        NE: '4L/4R',
        NW: '31L/31R',
        SE: '13L/13R',
        SW: '22L/22R',
      },
    },
    getLanding: function (speed: number, dir: number) {
      if (speed <= 9 || (dir >= 280 && dir <= 360 && speed >= 10)) {
        return this.configs.landing.NW;
      } else if (dir >= 10 && dir <= 100 && speed >= 10) {
        return this.configs.landing.NE;
      } else if (dir >= 180 && dir <= 270 && speed >= 10) {
        return this.configs.landing.SW;
      } else if (dir >= 110 && dir <= 170 && speed >= 10) {
        return this.configs.landing.SE;
      } else {
        return this.configs.landing.NW;
      }
    },
    getDeparting: function (speed: number, dir: number) {
      if (speed <= 9 || (dir >= 280 && dir <= 360 && speed >= 10)) {
        return this.configs.departing.NW;
      } else if (dir >= 10 && dir <= 100 && speed >= 10) {
        return this.configs.departing.NE;
      } else if (dir >= 180 && dir <= 270 && speed >= 10) {
        return this.configs.departing.SW;
      } else if (dir >= 110 && dir <= 170 && speed >= 10) {
        return this.configs.departing.SE;
      } else {
        return this.configs.departing.NW;
      }
    },
  },
  {
    icao: 'KMKE',
    fullName: "General Mitchell Int'l",
    configs: {
      landing: {
        W: '25R/25L',
        SW: '25/19',
        S: '19R/19L',
        E: '7R/7L',
        SE: '7R/13',
        NA: '1L',
        N: '1L/1R',
      },
      departing: {
        SW: '25L/25R',
        S: '19R',
        NE: '7R',
        N: '1L/1R',
        E: '7R/13',
        S2: '19R/19L',
        NE2: '7R/7L',
      },
    },
    getLanding: function (speed: number, dir: number, hour: number) {
      if (hour >= 4 && hour <= 12) {
        return this.configs.landing.NA; // Night Noise Abatement
      } else if (speed <= 5) {
        return this.configs.landing.W;
      } else if (dir >= 310 || (dir < 40 && speed >= 25)) {
        return this.configs.landing.N;
      } else if (dir >= 140 && dir <= 220 && speed >= 25) {
        return this.configs.landing.S;
      } else if (dir >= 40 && dir <= 130 && speed >= 25) {
        return this.configs.landing.E;
      } else if (dir >= 220 && dir <= 300 && speed >= 25) {
        return this.configs.landing.W;
      } else {
        return this.configs.landing.W;
      }
    },
    getDeparting: function (speed: number, dir: number, hour: number) {
      if (hour >= 4 && hour <= 12) {
        return this.configs.departing.S; // Night Noise Abatement
      } else if (speed <= 5) {
        return this.configs.departing.S;
      } else if (dir >= 310 || (dir < 40 && speed >= 25)) {
        return this.configs.departing.N;
      } else if (dir >= 140 && dir <= 220 && speed >= 25) {
        return this.configs.departing.S2;
      } else if (dir >= 40 && dir <= 130 && speed >= 25) {
        return this.configs.departing.NE2;
      } else if (dir >= 220 && dir <= 300 && speed >= 25) {
        return this.configs.departing.SW;
      } else {
        return this.configs.departing.S;
      }
    },
  },
  {
    icao: 'KRFD',
    fullName: "Chicago Rockford Int'l",
    configs: {
      landing: {
        SE: '25',
        SW: '25/19',
        NE: '7/1',
      },
      departing: {
        SE: '25',
        SW: '25/19',
        NE: '7/1',
      },
    },
    getLanding: function (speed: number, dir: number) {
      if (speed <= 6) return this.configs.landing.SE;
      else {
        if (dir >= 0 && dir < 130) {
          return this.configs.landing.NE;
        } else if (dir >= 130 && dir < 310) {
          return this.configs.landing.SW;
        } else {
          return this.configs.landing.SE;
        }
      }
    },
    getDeparting: function (speed: number, dir: number) {
      if (speed <= 6) return this.configs.departing.SE;
      else {
        if (dir >= 0 && dir < 130) {
          return this.configs.departing.NE;
        } else if (dir >= 130 && dir < 310) {
          return this.configs.departing.SW;
        } else {
          return this.configs.departing.SE;
        }
      }
    },
  },
  {
    icao: 'KCID',
    fullName: 'The Eastern Iowa Airport',
    configs: {
      landing: {
        NE: '9',
        SW: '27',
      },
      departing: {
        NE: '9',
        SW: '27',
      },
    },
    getLanding: function (speed: number, dir: number) {
      if (speed <= 6) return this.configs.landing.NE;
      else {
        if (dir >= 130 && dir < 310) return this.configs.landing.SW;
        else return this.configs.landing.NE;
      }
    },
    getDeparting: function (speed: number, dir: number) {
      if (speed <= 6) return this.configs.departing.NE;
      else {
        if (dir >= 130 && dir < 310) return this.configs.departing.SW;
        else return this.configs.departing.NE;
      }
    },
  },
]);

onMounted(async () => {
  const stations = ['KORD', 'KMDW', 'KMKE', 'KRFD'];
  const promises = stations.map((val) => weatherService.getStation(val, true));

  const results = await Promise.allSettled(promises);

  results.forEach((result, idx) => {
    if (result.status === 'fulfilled') {
      const val = result.value;
      if (val.metar && val.metar.station) {
        const data = runwayData.value.find(
          (f) => f.icao === val.metar!.station,
        );
        conditions.value.push({
          Metar: val.metar,
          RunwayData: data,
        });
      } else {
        console.error('error parsing', stations[idx], 'metar', val);
      }
    } else {
      console.error('error getting', stations[idx], 'data', result.reason);
    }
  });

  loading.value = false;
});

const formatWind = (dir: number, speed: number, gust?: number) => {
  if (speed < 4) return 'Calm';
  const paddedWind = `0${dir}`.slice(-3);
  return `${paddedWind}@${speed}${gust ? `G${gust}` : ''}`;
};

interface ICondition {
  icon: string;
  label: string;
  tooltip: string;
}
const getConditions = (data: IMetar): ICondition => {
  const visibility = data.visibility?.value || Number.MAX_VALUE;
  const clouds =
    data.clouds?.filter(
      (cloud) => cloud.quantity === 'OVC' || cloud.quantity === 'BKN',
    ) || [];
  const verticalVisibility = data.verticalVisibility || Number.MAX_VALUE;

  // Check for LIFR conditions
  if (
    visibility < 1 ||
    clouds.some((cloud) => cloud.height && cloud.height < 500) ||
    verticalVisibility < 500
  ) {
    return {
      tooltip: 'Low IRF',
      icon: 'mdi:weather-lightning-rainy',
      label: 'LIFR',
    };
  }
  // Check for IFR conditions
  else if (
    (visibility >= 1 && visibility < 3) ||
    clouds.some(
      (cloud) => cloud.height && cloud.height >= 500 && cloud.height < 1000,
    ) ||
    (verticalVisibility >= 500 && verticalVisibility < 1000)
  ) {
    return {
      tooltip: 'IRF',
      icon: 'mdi:weather-rainy',
      label: 'IFR',
    };
  }
  // Check for MVFR conditions
  else if (
    (visibility >= 3 && visibility <= 5) ||
    clouds.some(
      (cloud) => cloud.height && cloud.height >= 1000 && cloud.height <= 3000,
    ) ||
    (verticalVisibility >= 1000 && verticalVisibility <= 3000)
  ) {
    return {
      tooltip: 'Marginal VRF',
      icon: 'mdi:weather-partly-cloudy',
      label: 'MVFR',
    };
  }
  // Otherwise, assume VFR conditions
  return {
    tooltip: 'VFR',
    icon: 'mdi:weather-sunny',
    label: 'VFR',
  };
};
</script>

<template>
  <ProgressSpinner v-if="loading" />
  <DataTable v-else :value="conditions" stripedRows size="small">
    <template #header>
      <p>
        The runways listed here are <strong>suggestions</strong>. Please always
        check with the online ATIS prior to planning your runways, and
        follow all ATC instructions.
      </p></template
    >
    <template #empty>
      <p class="italic">
        There are no weather conditions to display at this time.
      </p>
    </template>
    <Column field="icao" header="Airport">
      <template #body="{ data }: { data: IAirportData }">
        {{ data.RunwayData?.fullName }} (<b>{{ data.RunwayData?.icao }}</b
        >)
      </template>
    </Column>
    <Column field="conditions" header="Conditions">
      <template #body="{ data }: { data: IAirportData }">
        <span v-tooltip.top="getConditions(data.Metar).tooltip">
          <Icon class="text-lg" :icon="getConditions(data.Metar).icon" />
          {{ getConditions(data.Metar).label }}
        </span>
      </template>
    </Column>
    <Column field="wind" header="Wind">
      <template #body="{ data }: { data: IAirportData }">
        <Icon
          icon="mdi:weather-windy"
          class="text-lg"
          v-if="data.Metar.wind?.gust" />
        {{
          formatWind(
            data.Metar.wind!.degrees!,
            data.Metar.wind!.speed!,
            data.Metar.wind!.gust,
          )
        }}
      </template>
    </Column>
    <Column field="departing" header="DEP Runways">
      <template #body="{ data }: { data: IAirportData }">
        {{
          data.RunwayData?.getDeparting(
            data.Metar.wind!.speed!,
            data.Metar.wind!.degrees!,
            data.Metar.hour!,
          )
        }}
      </template>
    </Column>
    <Column field="landing" header="ARR Runways">
      <template #body="{ data }: { data: IAirportData }">
        {{
          data.RunwayData?.getLanding(
            data.Metar.wind!.speed!,
            data.Metar.wind!.degrees!,
            data.Metar.hour!,
          )
        }}
      </template>
    </Column>
  </DataTable>
</template>

<style lang="css" scoped></style>
