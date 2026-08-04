<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
// Imported and converted from the original site
import { splitService } from '@/services/split/split.service';
import type {
  IGeojsonResponse,
  IOwnership,
  IPosition,
} from '@/services/split/split.types';
import { LGeoJson, LIcon, LMap, LMarker } from '@vue-leaflet/vue-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import SelectButton from 'primevue/selectbutton';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Fix for the Icon problem that prevents leaflet from working
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.21/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.21/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.21/dist/images/marker-shadow.png',
});

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

interface PositionData extends IPosition {
  isSpecial?: boolean;
  active?: boolean;
  [key: string]: any;
}

interface PositionInternal extends PositionData {
  id: string;
}

interface Owner {
  name: string;
  color: string;
}

interface OwnedSectors {
  ownedHigh: Set<string>;
  ownedLow: Set<string>;
}

interface LabeledPosition extends PositionInternal {
  displayId: string;
  lat: number;
  lng: number;
  mapLevel: 'high' | 'low';
}

interface CorridorLabel {
  text: string;
  colorA: string;
  colorB: string;
  fillColor: string;
}

interface PmmKubbsLabel {
  pmmText: string;
  kubbsText: string;
}

interface ZmpZobLabel {
  text: string;
  lat: number;
  lng: number;
  mapLevel: 'high' | 'low';
}

interface SpecialLabel {
  key: string;
  lat: number;
  lng: number;
  html: string;
}

const ZOB_COLORS = [
  '#e6194b',
  '#3cb44b',
  '#ffe119',
  '#4363d8',
  '#911eb4',
  '#f032e6',
];
const ZMP_COLORS = [
  '#42d4f4',
  '#469990',
  '#9a6324',
  '#800000',
  '#808000',
  '#000080',
];

const staticCorridorCoords: Record<string, [number, number]> = {
  iowCorridor: [42.182026, -90.919368],
  bdfSplit: [41.1, -90.4],
  bvtCorridor: [41.375229, -88.363288],
  eonLow: [41.120992, -88.302134],
  pmmKubbs: [42.77505, -86.045098],
};

const MAP_BOUNDS: [[number, number], [number, number]] = [
  [39.110179882405795, -95.81045234346043],
  [44.57851537556797, -82.75578162931266],
];

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

const props = defineProps<{
  positionsData: PositionData[];
  ownershipData: IOwnership;
}>();

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const zoom = ref<number>(7.25);
const center = ref<[number, number]>([42, -89]);
const mapOptions = ref({
  zoomSnap: 0,
  wheelPxPerZoomLevel: 300,
  zoomControl: false,
  doubleClickZoom: false,
  scrollWheelZoom: true,
  touchZoom: true,
  dragging: true,
});

const activeLevel = ref<'high' | 'low'>('high');
const levelOptions = [
  { label: 'High', value: 'high' },
  { label: 'Low', value: 'low' },
];

const geojson = ref<IGeojsonResponse | null>(null);

// ---------------------------------------------------------------------------
// Map setup
// ---------------------------------------------------------------------------

const mapRef = ref<any>(null);
let resizeObserver: ResizeObserver | null = null;

const fitMapToData = () => {
  const map = mapRef.value;
  if (!map) return;
  map.fitBounds(MAP_BOUNDS, { padding: [0, 0] });
};

const onMapReady = (obj: any) => {
  mapRef.value = obj;
  if (obj) {
    obj.createPane('bordersPane');
    obj.getPane('bordersPane').style.zIndex = 499;
    resizeObserver?.disconnect();
    resizeObserver = new ResizeObserver(fitMapToData);
    resizeObserver.observe(obj.getContainer());
    fitMapToData();
  }
};

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
});

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const fetchSectorsData = async () => {
  try {
    geojson.value = await splitService.getGeojson();
  } catch (e) {
    console.error('Critical error during map data fetching:', e);
  }
};

// ---------------------------------------------------------------------------
// Derived ownership indexes
// ---------------------------------------------------------------------------

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const positions = computed<Map<string, PositionInternal>>(() => {
  const map = new Map<string, PositionInternal>();
  props.positionsData.forEach((p) => {
    map.set(String(p.id), { ...p, id: String(p.id) });
  });
  return map;
});

const positionOwned = computed<Map<string, OwnedSectors>>(() => {
  const map = new Map<string, OwnedSectors>();
  const ensure = (ownerId: string): OwnedSectors => {
    let entry = map.get(ownerId);
    if (!entry) {
      entry = { ownedHigh: new Set<string>(), ownedLow: new Set<string>() };
      map.set(ownerId, entry);
    }
    return entry;
  };

  const { high, low } = props.ownershipData.zau;
  for (const [sectorId, ownerId] of Object.entries(high)) {
    if (positions.value.has(String(ownerId))) {
      ensure(String(ownerId)).ownedHigh.add(String(sectorId));
    }
  }
  for (const [sectorId, ownerId] of Object.entries(low)) {
    if (positions.value.has(String(ownerId))) {
      ensure(String(ownerId)).ownedLow.add(String(sectorId));
    }
  }
  return map;
});

const sectorOwner = computed<{
  high: Map<string, PositionInternal>;
  low: Map<string, PositionInternal>;
}>(() => {
  const high = new Map<string, PositionInternal>();
  const low = new Map<string, PositionInternal>();
  for (const [positionId, owned] of positionOwned.value) {
    const position = positions.value.get(positionId);
    if (!position) continue;
    for (const sectorId of owned.ownedHigh) high.set(sectorId, position);
    for (const sectorId of owned.ownedLow) low.set(sectorId, position);
  }
  return { high, low };
});

const getOwner = (sectorFeature: any): Owner => {
  const id = String(sectorFeature.properties.id);
  const level = sectorFeature.properties.level as 'high' | 'low';
  const owner = sectorOwner.value[level].get(id);
  return owner
    ? { name: owner.name, color: owner.color }
    : { name: 'N/A', color: '#808080' };
};

// ---------------------------------------------------------------------------
// Sector coloring — ZAU
// ---------------------------------------------------------------------------

const averageColors = (colorA: string, colorB: string): string => {
  const matchA = colorA.match(/\w\w/g);
  const matchB = colorB.match(/\w\w/g);
  if (!matchA || !matchB) return '#808080';

  const [rA, gA, bA] = matchA.map((c) => parseInt(c, 16));
  const [rB, gB, bB] = matchB.map((c) => parseInt(c, 16));
  const r = Math.round((rA! + rB!) * 0.5)
    .toString(16)
    .padStart(2, '0');
  const g = Math.round((gA! + gB!) * 0.5)
    .toString(16)
    .padStart(2, '0');
  const b = Math.round((bA! + bB!) * 0.5)
    .toString(16)
    .padStart(2, '0');
  return '#' + r + g + b;
};

const colorZauSectors = (raw: any, level: 'high' | 'low') => {
  if (!raw) return { type: 'FeatureCollection', features: [] };

  const newSectors = clone(raw);
  const owners = sectorOwner.value[level];

  newSectors.features.forEach((feature: any) => {
    const sectorId = String(feature.properties.id);
    const owner = owners.get(sectorId);
    feature.properties.ownerColor = owner ? owner.color : '#808080';
    feature.properties.isOwned = !!owner;
  });

  const byName = new Map<string, any>(
    newSectors.features.map((f: any) => [f.properties.name, f]),
  );

  if (level === 'high') {
    const iow = byName.get('IOWA CITY');
    const coton = byName.get('COTON');
    const boiler = byName.get('BOILER');
    const gipper = byName.get('GIPPER');
    const bradford = byName.get('BRADFORD');

    const corridor = byName.get('IOW Corridor');
    if (corridor && iow && coton) {
      corridor.properties.ownerColor = averageColors(
        iow.properties.ownerColor,
        coton.properties.ownerColor,
      );
    }

    const boilerClimb = byName.get('BOILER CLIMB CORRIDOR');
    if (boilerClimb && boiler && gipper) {
      boilerClimb.properties.ownerColor = averageColors(
        boiler.properties.ownerColor,
        gipper.properties.ownerColor,
      );
    }

    if (bradford && iow) {
      bradford.properties.ownerColor = averageColors(
        bradford.properties.ownerColor,
        iow.properties.ownerColor,
      );
    }
  } else {
    const lowEon = byName.get('LOW EON');
    const peotone = byName.get('PEOTONE');
    const plano = byName.get('PLANO');
    if (lowEon && peotone && plano) {
      lowEon.properties.ownerColor = averageColors(
        peotone.properties.ownerColor,
        plano.properties.ownerColor,
      );
    }
  }
  return newSectors;
};

const zauColored = computed(() => {
  if (!geojson.value) return null;
  return {
    high: colorZauSectors(geojson.value.sectors.high, 'high'),
    low: colorZauSectors(geojson.value.sectors.low, 'low'),
  };
});

// ---------------------------------------------------------------------------
// Sector coloring — ZMP / ZOB
// ---------------------------------------------------------------------------

const assignColors = (
  ownership: Record<string, string>,
  palette: string[],
): Record<string, string> => {
  const activePositions = [...new Set(Object.values(ownership))].sort();
  const colorMap: Record<string, string> = {};
  activePositions.forEach((positionId, index) => {
    colorMap[positionId] = palette[index % palette.length]!;
  });
  return colorMap;
};

const colorNeighbor = (
  raw: any,
  ownership: Record<string, string>,
  palette: string[],
) => {
  if (!raw) return raw;
  const copy = clone(raw);
  const colorMap = assignColors(ownership, palette);
  copy.features.forEach((feature: any) => {
    const polygonId = String(feature.properties.id);
    const ownerId = ownership[polygonId];
    feature.properties.ownerColor = ownerId
      ? (colorMap[ownerId] ?? '#808080')
      : '#808080';
  });
  return copy;
};

const zobColored = computed(() => {
  if (!geojson.value) return null;
  const ownership = props.ownershipData.zob ?? {};
  return {
    high: colorNeighbor(geojson.value.zob.high, ownership, ZOB_COLORS),
    low: colorNeighbor(geojson.value.zob.low, ownership, ZOB_COLORS),
  };
});

const zmpColored = computed(() => {
  if (!geojson.value) return null;
  const ownership = props.ownershipData.zmp ?? {};
  return {
    high: colorNeighbor(geojson.value.zmp.high, ownership, ZMP_COLORS),
    low: colorNeighbor(geojson.value.zmp.low, ownership, ZMP_COLORS),
  };
});

// ---------------------------------------------------------------------------
// Style / geometry helpers
// ---------------------------------------------------------------------------

const getSectorStyle = (feature: any) => {
  const fillColor = feature.properties.ownerColor || '#808080';
  return {
    color: '#3f3f3f',
    fillColor: fillColor,
    opacity: 1,
    weight: 1,
    fillOpacity: 1,
  };
};

const drawBorders = (feature: any) => {
  switch (feature.properties.borderType) {
    case 'ZAU':
      return { color: '#e4002b', weight: 5, pane: 'bordersPane' };
    case 'Neighbor':
      return { color: '#000000', weight: 2, pane: 'bordersPane' };
    case 'InteriorBoundary':
      return {
        color: '#3f3f3f',
        dashArray: '8',
        dashOffset: '8',
        opacity: 0.8,
        pane: 'bordersPane',
      };
    default:
      return {};
  }
};

const onEachFeature = (feature: any, layer: any) => {
  if (feature.properties.borderType) {
    layer.setStyle(drawBorders(feature));
  } else {
    layer.setStyle(getSectorStyle(feature));
  }
};

const getLabelClass = (position: PositionData) => {
  let className = 'pos-label-base';
  if (position.isSpecial) {
    className += ' spec-label';
  } else {
    className += ' pos-label';
  }
  if (position.active) {
    className += ' pos-active';
  }
  return className;
};

// ---------------------------------------------------------------------------
// Special sector labels (co-owned corridors)
// ---------------------------------------------------------------------------

const corridorLabel = (
  a: any,
  b: any,
  text: (ownerA: Owner, ownerB: Owner) => string,
): CorridorLabel | null => {
  if (!a || !b) return null;
  const ownerA = getOwner(a);
  const ownerB = getOwner(b);
  const colorA = a.properties.ownerColor;
  const colorB = b.properties.ownerColor;
  if (colorA === colorB || ownerA.name === 'N/A' || ownerB.name === 'N/A') {
    return null;
  }
  return {
    text: text(ownerA, ownerB),
    colorA,
    colorB,
    fillColor: averageColors(colorA, colorB),
  };
};

const specialSectors = computed(() => {
  const zau = zauColored.value;
  if (!zau) return null;
  const high = zau.high.features;
  const low = zau.low.features;
  const byName = (features: any[], name: string) =>
    features.find((f: any) => f.properties.name === name);

  const iow = corridorLabel(
    byName(high, 'COTON'),
    byName(high, 'IOWA CITY'),
    (a, b) => `${b.name} FL240 - FL329 <br /> ${a.name} FL330+`,
  );
  const bdf = corridorLabel(
    byName(high, 'BRADFORD'),
    byName(high, 'IOWA CITY'),
    (a, b) => `${a.name} FL240 - FL330 <br /> ${b.name} FL340+`,
  );
  const bvt = corridorLabel(
    byName(high, 'BOILER'),
    byName(high, 'GIPPER'),
    (a) => `${a.name} <br /> FL240 - FL290`,
  );
  const eon = corridorLabel(
    byName(low, 'PEOTONE'),
    byName(low, 'PLANO'),
    (a, b) => `${a.name} 110 - FL230 <br /> ${b.name} SFC - 100`,
  );

  const pmm = byName(high, 'PULLMAN');
  const kubbs = byName(low, 'KUBBS');
  let pmmKubbs: PmmKubbsLabel | null = null;
  let showPmmKubbsSplit = false;
  if (pmm && kubbs) {
    const ownerPMM = getOwner(pmm);
    const ownerKUBBS = getOwner(kubbs);
    const colorPMM = pmm.properties.ownerColor;
    const colorKUBBS = kubbs.properties.ownerColor;
    if (
      colorPMM !== colorKUBBS &&
      ownerPMM.name !== 'N/A' &&
      ownerKUBBS.name !== 'N/A'
    ) {
      showPmmKubbsSplit = true;
      pmmKubbs = {
        pmmText: `${ownerPMM.name} FL200+`,
        kubbsText: `${ownerKUBBS.name} <br /> SFC - FL190`,
      };
    }
  }

  return { iow, bdf, bvt, eon, pmmKubbs, showPmmKubbsSplit };
});

// ---------------------------------------------------------------------------
// Computed properties
// ---------------------------------------------------------------------------

const geojsonOptions = computed(() => ({
  style: getSectorStyle,
  onEachFeature: onEachFeature,
}));

const labeledPositions = computed<LabeledPosition[]>(() => {
  const labeled: LabeledPosition[] = [];
  const findFeature = (features: any[] | undefined, sectorId: string) => {
    if (!features) return null;
    return features.find(
      (f) => String(f.properties.id) === sectorId && f.properties.labelAnchor,
    );
  };

  for (const [positionId, owned] of positionOwned.value) {
    if (owned.ownedHigh.size > 0) {
      const firstSectorId = Array.from(owned.ownedHigh).find(
        (n) => Number(n) > 10,
      );
      const feature = findFeature(
        geojson.value?.sectors.high.features,
        firstSectorId!,
      );

      if (feature && feature.properties.labelAnchor) {
        const latLng = feature.properties.labelAnchor;
        const pos = positions.value.get(positionId)!;
        labeled.push({
          ...pos,
          displayId: `${pos.id}-high`,
          lat: latLng[0],
          lng: latLng[1],
          mapLevel: 'high',
        });
      }
    }

    if (owned.ownedLow.size > 0) {
      const firstSectorId = Array.from(owned.ownedLow).find(
        (n) => Number(n) > 10,
      );
      const feature = findFeature(
        geojson.value?.sectors.low.features,
        firstSectorId!,
      );

      if (feature && feature.properties.labelAnchor) {
        const latLng = feature.properties.labelAnchor;
        const pos = positions.value.get(positionId)!;
        labeled.push({
          ...pos,
          displayId: `${pos.id}-low`,
          lat: latLng[0],
          lng: latLng[1],
          mapLevel: 'low',
        });
      }
    }
  }

  return labeled;
});

const buildZmpZobLabels = (
  ownership: Record<string, string>,
  prefix: string,
  rawHi: any,
  rawLo: any,
): ZmpZobLabel[] => {
  const labels: ZmpZobLabel[] = [];
  const activePositions = [...new Set(Object.values(ownership))].sort();

  const findAnchor = (
    features: any[] | undefined,
    positionId: string,
  ): number[] | null => {
    if (!features) return null;
    for (const feature of features) {
      const polygonId = String(feature.properties.id);
      const anchor = feature.properties.labelAnchor;
      if (ownership[polygonId] === positionId && anchor) {
        return anchor;
      }
    }
    return null;
  };

  activePositions.forEach((positionId) => {
    const highAnchor = findAnchor(rawHi?.features, positionId);
    if (highAnchor) {
      labels.push({
        text: `${prefix}${positionId}`,
        lat: highAnchor[0]!,
        lng: highAnchor[1]!,
        mapLevel: 'high',
      });
    }
    const lowAnchor = findAnchor(rawLo?.features, positionId);
    if (lowAnchor) {
      labels.push({
        text: `${prefix}${positionId}`,
        lat: lowAnchor[0]!,
        lng: lowAnchor[1]!,
        mapLevel: 'low',
      });
    }
  });

  return labels;
};

const zmpLabels = computed<ZmpZobLabel[]>(() =>
  buildZmpZobLabels(
    props.ownershipData.zmp ?? {},
    'P',
    geojson.value?.zmp.high,
    geojson.value?.zmp.low,
  ),
);

const zobLabels = computed<ZmpZobLabel[]>(() =>
  buildZmpZobLabels(
    props.ownershipData.zob ?? {},
    'C',
    geojson.value?.zob.high,
    geojson.value?.zob.low,
  ),
);

const activeSectors = computed(
  () => zauColored.value?.[activeLevel.value] ?? null,
);

const activeBorders = computed<any>(
  () => geojson.value?.borders[activeLevel.value] ?? null,
);

const activeZob = computed(() => zobColored.value?.[activeLevel.value] ?? null);

const activeZmp = computed(() => zmpColored.value?.[activeLevel.value] ?? null);

const pmmBorder = computed<any>(() => geojson.value?.borders.PMM ?? null);

const activePositionLabels = computed<LabeledPosition[]>(() =>
  labeledPositions.value.filter(
    (label) => label.mapLevel === activeLevel.value,
  ),
);

const activeZobLabels = computed<ZmpZobLabel[]>(() =>
  zobLabels.value.filter((label) => label.mapLevel === activeLevel.value),
);

const activeZmpLabels = computed<ZmpZobLabel[]>(() =>
  zmpLabels.value.filter((label) => label.mapLevel === activeLevel.value),
);

const activeSpecialLabels = computed<SpecialLabel[]>(() => {
  const labels: SpecialLabel[] = [];
  const special = specialSectors.value;
  if (!special) return labels;

  const push = (key: string, coords: [number, number], html: string) => {
    labels.push({ key, lat: coords[0], lng: coords[1], html });
  };

  if (activeLevel.value === 'high') {
    if (special.iow) {
      push('iow', staticCorridorCoords.iowCorridor!, special.iow.text);
    }
    if (special.bvt) {
      push('bvt', staticCorridorCoords.bvtCorridor!, special.bvt.text);
    }
    if (special.showPmmKubbsSplit && special.pmmKubbs) {
      push('pmm', staticCorridorCoords.pmmKubbs!, special.pmmKubbs.pmmText);
    }
    if (special.bdf) {
      push('bdf', staticCorridorCoords.bdfSplit!, special.bdf.text);
    }
  } else {
    if (special.eon) {
      push('eon', staticCorridorCoords.eonLow!, special.eon.text);
    }
    if (special.showPmmKubbsSplit && special.pmmKubbs) {
      push('pmm', staticCorridorCoords.pmmKubbs!, special.pmmKubbs.kubbsText);
    }
  }

  return labels;
});

// ---------------------------------------------------------------------------
// Lifecycle Hooks
// ---------------------------------------------------------------------------

onMounted(async () => {
  await fetchSectorsData();
});
</script>

<template>
  <ProgressSpinner v-if="!geojson" />
  <Card v-else>
    <template #title>High / Low Altitude Sectors</template>
    <template #content>
      <div class="level-toggle">
        <SelectButton
          v-model="activeLevel"
          :options="levelOptions"
          optionLabel="label"
          optionValue="value"
          :allowEmpty="false" />
      </div>

      <LMap
        :zoom="zoom"
        :center="center"
        :useGlobalLeaflet="false"
        :options="mapOptions"
        class="leaflet-map"
        style="width: 100%; aspect-ratio: 16 / 9"
        @ready="onMapReady">
        <LGeoJson
          v-if="activeSectors && activeSectors.features.length"
          :geojson="activeSectors"
          :options="geojsonOptions" />

        <div v-for="pos in activePositionLabels" :key="pos.displayId">
          <LMarker :lat-lng="[pos.lat, pos.lng]">
            <LIcon :icon-anchor="[0, 0]" className="">
              <div :class="getLabelClass(pos)">
                {{ pos.name }} ({{ pos.id }})
              </div>
            </LIcon>
          </LMarker>
        </div>

        <LMarker
          v-for="label in activeSpecialLabels"
          :key="label.key"
          :lat-lng="[label.lat, label.lng]">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="label.html"></div>
          </LIcon>
        </LMarker>

        <LGeoJson
          v-if="activeBorders"
          :geojson="activeBorders"
          :options="geojsonOptions" />

        <LGeoJson
          v-if="specialSectors?.showPmmKubbsSplit"
          :geojson="pmmBorder"
          :options="geojsonOptions" />

        <LGeoJson
          v-if="activeZob"
          :geojson="activeZob"
          :options="geojsonOptions" />

        <LGeoJson
          v-if="activeZmp"
          :geojson="activeZmp"
          :options="geojsonOptions" />

        <div v-for="label in activeZobLabels" :key="`zob-${label.text}`">
          <LMarker :lat-lng="[label.lat, label.lng]">
            <LIcon :icon-anchor="[0, 0]" className="">
              <div class="neighbor-label">{{ label.text }}</div>
            </LIcon>
          </LMarker>
        </div>

        <div v-for="label in activeZmpLabels" :key="`zmp-${label.text}`">
          <LMarker :lat-lng="[label.lat, label.lng]">
            <LIcon :icon-anchor="[0, 0]" className="">
              <div class="neighbor-label">{{ label.text }}</div>
            </LIcon>
          </LMarker>
        </div>
      </LMap>
    </template>
  </Card>
</template>

<style>
.spec-label {
  text-align: center;
  width: max-content;
  color: black;
  font-family: 'Roboto', Arial, Helvetica, sans-serif;
  font-weight: bold;
  font-size: 10px;
}

.pos-label-base {
  text-align: center;
  color: black;
  font-family: 'Roboto', Arial, sans-serif;
  font-weight: bold;
  font-size: 20px;
  line-height: 1;
  width: min-content;
}

.neighbor-label {
  text-align: center;
  color: black;
  font-family: 'Roboto', Arial, sans-serif;
  font-weight: bold;
  font-size: 18px;
  line-height: 1;
  width: min-content;
}

.level-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.p-card-title,
.p-card-subtitle {
  text-align: center;
}

.leaflet-interactive {
  cursor: default !important;
}
</style>
