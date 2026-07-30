<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
// Imported and converted from the original site
import { splitService } from '@/services/split/split.service';
import type { IOwnership, IPosition } from '@/services/split/split.types';
import { LGeoJson, LIcon, LMap, LMarker } from '@vue-leaflet/vue-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import { computed, onMounted, ref, watch } from 'vue';

// Fix for the Icon problem that prevents leaflet from working
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.21/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.21/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.21/dist/images/marker-shadow.png',
});

// Interfaces
interface PositionData extends IPosition {
  isSpecial?: boolean;
  active?: boolean;
  [key: string]: any;
}

interface PositionInternal extends PositionData {
  id: string;
  ownedHi: Set<string>;
  ownedLo: Set<string>;
}

interface LabeledPosition extends PositionInternal {
  displayId: string;
  lat: number;
  lng: number;
  mapLevel: 'hi' | 'lo';
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

const props = defineProps<{
  positionsData: PositionData[];
  ownershipData: IOwnership;
}>();

// Reactive State variables
const hiSectorData = ref<any>(null);
const loSectorData = ref<any>(null);
const zauHiBorders = ref<any>(null);
const zauLoBorders = ref<any>(null);
const pmmBorder = ref<any>(null);
const eonBorder = ref<any>(null);

const zoom = ref<number>(6.7);
const center = ref<[number, number]>([42, -89]);
const mapOptions = ref({
  zoomSnap: 0.1,
  zoomControl: false,
  doubleClickZoom: false,
  scrollWheelZoom: false,
  touchZoom: false,
  dragging: false,
});
const isLoading = ref<boolean>(true);

const positions = ref<Map<string, PositionInternal>>(new Map());
const rawHiSectors = ref<any>(null);
const rawLoSectors = ref<any>(null);

const showPmmKubbsSplit = ref<boolean>(false);

const iowCorridorLabel = ref<CorridorLabel | null>(null);
const bdfSplitLabel = ref<CorridorLabel | null>(null);
const bvtCorridorLabel = ref<CorridorLabel | null>(null);
const eonLowLabel = ref<CorridorLabel | null>(null);
const pmmKubbsLabel = ref<PmmKubbsLabel | null>(null);

const staticCorridorCoords: Record<string, [number, number]> = {
  iowCorridor: [42.182026, -90.919368],
  bdfSplit: [41.1, -90.4],
  bvtCorridor: [41.375229, -88.363288],
  eonLow: [41.120992, -88.302134],
  pmmKubbs: [42.77505, -86.045098],
};

const mapReady = (obj: any) => {
  if (obj) {
    obj.createPane('bordersPane');
    obj.getPane('bordersPane').style.zIndex = 499;
  }
};

const initializePositionsMap = () => {
  const map = new Map<string, PositionInternal>();
  props.positionsData.forEach((p) => {
    map.set(String(p.id), {
      ...p,
      id: String(p.id),
      ownedHi: new Set<string>(),
      ownedLo: new Set<string>(),
    });
  });
  positions.value = map;
};

const processOwnershipUpdates = () => {
  if (!positions.value.size || !rawHiSectors.value) {
    return;
  }
  applyOwnership(props.ownershipData);
};

const initializePositionsAndProcessOwnership = () => {
  if (props.positionsData && props.positionsData.length > 0) {
    initializePositionsMap();
    processOwnershipUpdates();
  }
};

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

const getOwner = (sectorFeature: any) => {
  const id = String(sectorFeature.properties.id);
  const level = sectorFeature.properties.level;

  for (const pos of positions.value.values()) {
    if (level === 'hi' && pos.ownedHi.has(id)) return pos;
    if (level === 'lo' && pos.ownedLo.has(id)) return pos;
  }
  return { name: 'N/A', color: '#808080' };
};

const updateSectorColors = () => {
  const processSectors = (rawSectors: any, level: 'hi' | 'lo') => {
    if (!rawSectors) return { type: 'FeatureCollection', features: [] };

    const newSectors = JSON.parse(JSON.stringify(rawSectors));

    newSectors.features.forEach((feature: any) => {
      const sectorId = String(feature.properties.id);
      let ownerColor = '#808080';
      let isOwned = false;

      for (const pos of positions.value.values()) {
        if (level === 'hi' && pos.ownedHi.has(sectorId)) {
          ownerColor = pos.color;
          isOwned = true;
          break;
        } else if (level === 'lo' && pos.ownedLo.has(sectorId)) {
          ownerColor = pos.color;
          isOwned = true;
          break;
        }
      }
      feature.properties.ownerColor = ownerColor;
      feature.properties.isOwned = isOwned;
    });

    if (level === 'hi') {
      newSectors.features.forEach((feature: any) => {
        if (feature.properties.name === 'IOW Corridor') {
          feature.properties.ownerColor = averageColors(
            newSectors.features.find(
              (x: any) => x.properties.name === 'IOWA CITY',
            ).properties.ownerColor,
            newSectors.features.find((x: any) => x.properties.name === 'COTON')
              .properties.ownerColor,
          );
        }
        if (feature.properties.name === 'BOILER CLIMB CORRIDOR') {
          feature.properties.ownerColor = averageColors(
            newSectors.features.find((x: any) => x.properties.name === 'BOILER')
              .properties.ownerColor,
            newSectors.features.find((x: any) => x.properties.name === 'GIPPER')
              .properties.ownerColor,
          );
        }
        if (feature.properties.name === 'BRADFORD') {
          feature.properties.ownerColor = averageColors(
            newSectors.features.find(
              (x: any) => x.properties.name === 'BRADFORD',
            ).properties.ownerColor,
            newSectors.features.find(
              (x: any) => x.properties.name === 'IOWA CITY',
            ).properties.ownerColor,
          );
        }
      });
    } else {
      newSectors.features.forEach((feature: any) => {
        if (feature.properties.name === 'LOW EON') {
          feature.properties.ownerColor = averageColors(
            newSectors.features.find(
              (x: any) => x.properties.name === 'PEOTONE',
            ).properties.ownerColor,
            newSectors.features.find((x: any) => x.properties.name === 'PLANO')
              .properties.ownerColor,
          );
        }
      });
    }
    return newSectors;
  };

  hiSectorData.value = { ...processSectors(rawHiSectors.value, 'hi') };
  loSectorData.value = { ...processSectors(rawLoSectors.value, 'lo') };
};

const applyOwnership = (ownershipMap: IOwnership) => {
  positions.value.forEach((p) => {
    p.ownedHi.clear();
    p.ownedLo.clear();
  });

  const processLevelOwnership = (level: 'high' | 'low') => {
    const ownershipData = ownershipMap[level];
    if (!ownershipData) return;

    for (const sectorId in ownershipData) {
      const ownerId = String(ownershipData[sectorId]);
      const owner = positions.value.get(ownerId);

      if (owner) {
        if (level === 'high') {
          owner.ownedHi.add(String(sectorId));
        } else if (level === 'low') {
          owner.ownedLo.add(String(sectorId));
        }
      }
    }
  };

  processLevelOwnership('high');
  processLevelOwnership('low');
  updateSectorColors();
};

const checkSpecialSectors = () => {
  if (!hiSectorData.value || !loSectorData.value) return;

  const findSector = (name: string, level: 'hi' | 'lo') => {
    const data = level === 'hi' ? hiSectorData.value : loSectorData.value;
    return data.features.find((f: any) => f.properties.name === name);
  };

  const getFillColor = (feature: any) => feature.properties.ownerColor;

  const layerCOTON = findSector('COTON', 'hi');
  const layerIOW = findSector('IOWA CITY', 'hi');
  const layerBDF = findSector('BRADFORD', 'hi');
  const layerBVT = findSector('BOILER', 'hi');
  const layerGIJ = findSector('GIPPER', 'hi');
  const layerPMM = findSector('PULLMAN', 'hi');
  const layerEON = findSector('PEOTONE', 'lo');
  const layerPLANO = findSector('PLANO', 'lo');
  const layerKUBBS = findSector('KUBBS', 'lo');

  if (
    !layerCOTON ||
    !layerIOW ||
    !layerBDF ||
    !layerBVT ||
    !layerGIJ ||
    !layerPMM ||
    !layerEON ||
    !layerPLANO ||
    !layerKUBBS
  )
    return;

  // 1. IOW Corridor
  if (
    getFillColor(layerCOTON) === getFillColor(layerIOW) ||
    getOwner(layerCOTON).name === 'N/A' ||
    getOwner(layerIOW).name === 'N/A'
  ) {
    iowCorridorLabel.value = null;
  } else {
    iowCorridorLabel.value = {
      text: `${getOwner(layerIOW).name} FL240 - FL329 <br /> ${getOwner(layerCOTON).name} FL330+`,
      colorA: getFillColor(layerCOTON),
      colorB: getFillColor(layerIOW),
      fillColor: averageColors(
        getFillColor(layerCOTON),
        getFillColor(layerIOW),
      ),
    };
  }

  // 2. Bradford Split
  if (
    getFillColor(layerBDF) === getFillColor(layerIOW) ||
    getOwner(layerBDF).name === 'N/A' ||
    getOwner(layerIOW).name === 'N/A'
  ) {
    bdfSplitLabel.value = null;
  } else {
    bdfSplitLabel.value = {
      text: `${getOwner(layerBDF).name} FL240 - FL330 <br /> ${getOwner(layerIOW).name} FL340+`,
      colorA: getFillColor(layerBDF),
      colorB: getFillColor(layerIOW),
      fillColor: averageColors(getFillColor(layerBDF), getFillColor(layerIOW)),
    };
  }

  // 3. Boiler Climb Corridor
  if (
    getFillColor(layerBVT) === getFillColor(layerGIJ) ||
    getOwner(layerBVT).name === 'N/A' ||
    getOwner(layerGIJ).name === 'N/A'
  ) {
    bvtCorridorLabel.value = null;
  } else {
    bvtCorridorLabel.value = {
      text: `${getOwner(layerBVT).name} <br /> FL240 - FL290`,
      colorA: getFillColor(layerBVT),
      colorB: getFillColor(layerGIJ),
      fillColor: averageColors(getFillColor(layerBVT), getFillColor(layerGIJ)),
    };
  }

  // 4. Peotone
  if (
    getFillColor(layerEON) === getFillColor(layerPLANO) ||
    getOwner(layerEON).name === 'N/A' ||
    getOwner(layerPLANO).name === 'N/A'
  ) {
    eonLowLabel.value = null;
  } else {
    eonLowLabel.value = {
      text: `${getOwner(layerEON).name} 110 - FL230 <br /> ${getOwner(layerPLANO).name} SFC - 100`,
      colorA: getFillColor(layerEON),
      colorB: getFillColor(layerPLANO),
      fillColor: averageColors(
        getFillColor(layerEON),
        getFillColor(layerPLANO),
      ),
    };
  }

  // 5. PMM and KUBBS
  if (
    getFillColor(layerPMM) === getFillColor(layerKUBBS) ||
    getOwner(layerPMM).name === 'N/A' ||
    getOwner(layerKUBBS).name === 'N/A'
  ) {
    showPmmKubbsSplit.value = false;
    pmmKubbsLabel.value = null;
  } else {
    showPmmKubbsSplit.value = true;
    pmmKubbsLabel.value = {
      pmmText: `${getOwner(layerPMM).name} FL200+`,
      kubbsText: `${getOwner(layerKUBBS).name} <br /> SFC - FL190`,
    };
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

const fetchSectorsData = async () => {
  isLoading.value = true;
  try {
    const data = await splitService.getGeojson();

    hiSectorData.value = data.sectors.high;
    loSectorData.value = data.sectors.low;
    zauHiBorders.value = data.borders.high;
    zauLoBorders.value = data.borders.low;
    pmmBorder.value = data.borders.PMM;
    eonBorder.value = data.borders.EON;

    rawHiSectors.value = data.sectors.high;
    rawLoSectors.value = data.sectors.low;

    initializePositionsAndProcessOwnership();
  } catch (e) {
    console.error('Critical error during map data fetching:', e);
  } finally {
    isLoading.value = false;
  }
};

// Computed properties
const testOptions = computed(() => ({
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

  for (const pos of positions.value.values()) {
    if (pos.ownedHi.size > 0) {
      const firstSectorId = Array.from(pos.ownedHi).find((n) => n > 10);
      const feature = findFeature(rawHiSectors.value?.features, firstSectorId!);

      if (feature && feature.properties.labelAnchor) {
        const latLng = feature.properties.labelAnchor;
        labeled.push({
          ...pos,
          displayId: `${pos.id}-hi`,
          lat: latLng[0],
          lng: latLng[1],
          mapLevel: 'hi',
        });
      }
    }

    if (pos.ownedLo.size > 0) {
      const firstSectorId = Array.from(pos.ownedLo).find((n) => n > 10);
      const feature = findFeature(rawLoSectors.value?.features, firstSectorId!);

      if (feature && feature.properties.labelAnchor) {
        const latLng = feature.properties.labelAnchor;
        labeled.push({
          ...pos,
          displayId: `${pos.id}-lo`,
          lat: latLng[0],
          lng: latLng[1],
          mapLevel: 'lo',
        });
      }
    }
  }

  return labeled;
});

// Watchers
watch(
  hiSectorData,
  () => {
    if (!isLoading.value) {
      checkSpecialSectors();
    }
  },
  { deep: true },
);

watch(
  () => props.positionsData,
  () => {
    initializePositionsAndProcessOwnership();
  },
  { deep: true, immediate: true },
);

watch(
  () => props.ownershipData,
  () => {
    processOwnershipUpdates();
  },
  { deep: true, immediate: true },
);

// Lifecycle Hooks
onMounted(async () => {
  await fetchSectorsData();
});
</script>

<template>
  <ProgressSpinner v-if="!hiSectorData" />
  <Card v-else>
    <template #title>High Altitude Sectors</template>
    <template #subtitle>FL240 & Above</template>
    <template #content>
      <LMap
        v-model:zoom="zoom"
        :center="center"
        :useGlobalLeaflet="false"
        :options="mapOptions"
        class="leaflet-map-hi"
        style="height: 500px"
        @ready="mapReady">
        <LGeoJson
          v-if="hiSectorData && hiSectorData.features.length"
          :geojson="hiSectorData"
          :options="testOptions" />

        <div v-for="pos in labeledPositions" :key="pos.displayId">
          <LMarker
            :lat-lng="[pos.lat, pos.lng]"
            v-if="pos.mapLevel && pos.mapLevel === 'hi'">
            <LIcon :icon-anchor="[0, 0]" className="">
              <div :class="getLabelClass(pos)">
                {{ pos.name }} ({{ pos.id }})
              </div>
            </LIcon>
          </LMarker>
        </div>

        <LMarker
          v-if="iowCorridorLabel"
          :lat-lng="staticCorridorCoords.iowCorridor!">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="iowCorridorLabel.text"></div>
          </LIcon>
        </LMarker>

        <LMarker
          v-if="bvtCorridorLabel"
          :lat-lng="staticCorridorCoords.bvtCorridor!">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="bvtCorridorLabel.text"></div>
          </LIcon>
        </LMarker>

        <LMarker
          v-if="showPmmKubbsSplit && pmmKubbsLabel"
          :lat-lng="staticCorridorCoords.pmmKubbs!">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="pmmKubbsLabel.pmmText"></div>
          </LIcon>
        </LMarker>

        <LMarker v-if="bdfSplitLabel" :lat-lng="staticCorridorCoords.bdfSplit!">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="bdfSplitLabel.text"></div>
          </LIcon>
        </LMarker>

        <LGeoJson
          v-if="zauHiBorders"
          :geojson="zauHiBorders"
          :options="testOptions" />

        <LGeoJson
          v-if="showPmmKubbsSplit"
          :geojson="pmmBorder"
          :options="testOptions" />
      </LMap>
    </template>
  </Card>
  <Card>
    <template #title>Low Altitude Sectors</template>
    <template #subtitle>FL230 & Below</template>
    <template #content>
      <LMap
        v-model:zoom="zoom"
        :center="center"
        :useGlobalLeaflet="false"
        :options="mapOptions"
        class="leaflet-map-lo"
        style="height: 500px"
        @ready="mapReady">
        <LGeoJson
          v-if="loSectorData"
          :geojson="loSectorData"
          :options="testOptions" />

        <div v-for="pos in labeledPositions" :key="pos.displayId">
          <LMarker
            :lat-lng="[pos.lat, pos.lng]"
            v-if="pos.mapLevel && pos.mapLevel === 'lo'">
            <LIcon :icon-anchor="[0, 0]" className="">
              <div :class="getLabelClass(pos)">
                {{ pos.name }} ({{ pos.id }})
              </div>
            </LIcon>
          </LMarker>
        </div>

        <LMarker v-if="eonLowLabel" :lat-lng="staticCorridorCoords.eonLow!">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="eonLowLabel.text"></div>
          </LIcon>
        </LMarker>

        <LMarker
          v-if="showPmmKubbsSplit && pmmKubbsLabel"
          :lat-lng="staticCorridorCoords.pmmKubbs!">
          <LIcon :icon-anchor="[0, 0]" className="">
            <div class="spec-label" v-html="pmmKubbsLabel.kubbsText"></div>
          </LIcon>
        </LMarker>

        <LGeoJson
          v-if="zauLoBorders"
          :geojson="zauLoBorders"
          :options="testOptions" />

        <LGeoJson
          v-if="showPmmKubbsSplit"
          :geojson="pmmBorder"
          :options="testOptions" />
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

.p-card-title,
.p-card-subtitle {
  text-align: center;
}

.leaflet-interactive {
  cursor: default !important;
}
</style>
