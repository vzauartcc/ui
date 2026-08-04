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
import SelectButton from 'primevue/selectbutton';
import { computed, onMounted, ref, watch } from 'vue';

// Fix for the Icon problem that prevents leaflet from working
delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.21/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.21/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.21/dist/images/marker-shadow.png',
});

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

interface ZmpZobLabel {
  text: string;
  lat: number;
  lng: number;
  mapLevel: 'hi' | 'lo';
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

const props = defineProps<{
  positionsData: PositionData[];
  ownershipData: IOwnership;
}>();

const zoom = ref<number>(7.25);
const center = ref<[number, number]>([42, -89]);
const mapOptions = ref({
  zoomSnap: 0.05,
  zoomControl: false,
  doubleClickZoom: false,
  scrollWheelZoom: true,
  touchZoom: true,
  dragging: true,
});
const isLoading = ref<boolean>(true);

const activeLevel = ref<'hi' | 'lo'>('hi');
const levelOptions = [
  { label: 'High', value: 'hi' },
  { label: 'Low', value: 'lo' },
];

const positions = ref<Map<string, PositionInternal>>(new Map());

const rawHiSectors = ref<any>(null);
const rawLoSectors = ref<any>(null);
const hiSectorData = ref<any>(null);
const loSectorData = ref<any>(null);

const zauHiBorders = ref<any>(null);
const zauLoBorders = ref<any>(null);
const pmmBorder = ref<any>(null);

const zobHiSectors = ref<any>(null);
const zobLoSectors = ref<any>(null);
const rawZobHiSectors = ref<any>(null);
const rawZobLoSectors = ref<any>(null);

const zmpHiSectors = ref<any>(null);
const zmpLoSectors = ref<any>(null);
const rawZmpHiSectors = ref<any>(null);
const rawZmpLoSectors = ref<any>(null);

const showPmmKubbsSplit = ref<boolean>(false);

const iowCorridorLabel = ref<CorridorLabel | null>(null);
const bdfSplitLabel = ref<CorridorLabel | null>(null);
const bvtCorridorLabel = ref<CorridorLabel | null>(null);
const eonLowLabel = ref<CorridorLabel | null>(null);
const pmmKubbsLabel = ref<PmmKubbsLabel | null>(null);

// ---------------------------------------------------------------------------
// Map setup
// ---------------------------------------------------------------------------

const mapReady = (obj: any) => {
  if (obj) {
    obj.createPane('bordersPane');
    obj.getPane('bordersPane').style.zIndex = 499;
  }
};

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

const fetchSectorsData = async () => {
  isLoading.value = true;
  try {
    const data = await splitService.getGeojson();

    hiSectorData.value = data.sectors.high;
    loSectorData.value = data.sectors.low;
    rawHiSectors.value = data.sectors.high;
    rawLoSectors.value = data.sectors.low;

    zauHiBorders.value = data.borders.high;
    zauLoBorders.value = data.borders.low;
    pmmBorder.value = data.borders.PMM;

    zobHiSectors.value = data.zob.high;
    zobLoSectors.value = data.zob.low;
    rawZobHiSectors.value = data.zob.high;
    rawZobLoSectors.value = data.zob.low;

    zmpHiSectors.value = data.zmp.high;
    zmpLoSectors.value = data.zmp.low;
    rawZmpHiSectors.value = data.zmp.high;
    rawZmpLoSectors.value = data.zmp.low;

    initializePositionsAndProcessOwnership();
  } catch (e) {
    console.error('Critical error during map data fetching:', e);
  } finally {
    isLoading.value = false;
  }
};

// ---------------------------------------------------------------------------
// Ownership processing — ZAU
// ---------------------------------------------------------------------------

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

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

    const newSectors = clone(rawSectors);

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

    const byName = new Map(
      newSectors.features.map((f: any) => [f.properties.name, f]),
    );

    if (level === 'hi') {
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

  hiSectorData.value = { ...processSectors(rawHiSectors.value, 'hi') };
  loSectorData.value = { ...processSectors(rawLoSectors.value, 'lo') };
};

const applyOwnership = (ownershipMap: IOwnership) => {
  positions.value.forEach((p) => {
    p.ownedHi.clear();
    p.ownedLo.clear();
  });

  const processLevelOwnership = (level: 'high' | 'low') => {
    const ownershipData = ownershipMap.zau[level];
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
  processZmpZobOwnership(ownershipMap);
};

// ---------------------------------------------------------------------------
// Ownership processing — ZMP / ZOB
// ---------------------------------------------------------------------------

const assignColors = (
  ownership: Record<string, string>,
  palette: string[],
): Record<string, string> => {
  const activePositions = [...new Set(Object.values(ownership))].sort();
  const colorMap: Record<string, string> = {};
  activePositions.forEach((positionId, index) => {
    colorMap[positionId] = palette[index % palette.length];
  });
  return colorMap;
};

const colorSectors = (
  raw: any,
  ownership: Record<string, string>,
  colorMap: Record<string, string>,
) => {
  if (!raw) return raw;
  const copy = clone(raw);
  copy.features.forEach((feature: any) => {
    const polygonId = String(feature.properties.id);
    const ownerId = ownership[polygonId];
    feature.properties.ownerColor = ownerId
      ? (colorMap[ownerId] ?? '#808080')
      : '#808080';
  });
  return copy;
};

const processZmpZobOwnership = (ownershipMap: IOwnership) => {
  const zmpOwnership = ownershipMap.zmp ?? {};
  const zobOwnership = ownershipMap.zob ?? {};

  const zmpPositionColors = assignColors(zmpOwnership, ZMP_COLORS);
  const zobPositionColors = assignColors(zobOwnership, ZOB_COLORS);

  zmpHiSectors.value = colorSectors(
    rawZmpHiSectors.value,
    zmpOwnership,
    zmpPositionColors,
  );
  zmpLoSectors.value = colorSectors(
    rawZmpLoSectors.value,
    zmpOwnership,
    zmpPositionColors,
  );
  zobHiSectors.value = colorSectors(
    rawZobHiSectors.value,
    zobOwnership,
    zobPositionColors,
  );
  zobLoSectors.value = colorSectors(
    rawZobLoSectors.value,
    zobOwnership,
    zobPositionColors,
  );
};

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
// Special sector labels
// ---------------------------------------------------------------------------

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

  const colorCOTON = getFillColor(layerCOTON);
  const colorIOW = getFillColor(layerIOW);
  const colorBDF = getFillColor(layerBDF);
  const colorBVT = getFillColor(layerBVT);
  const colorGIJ = getFillColor(layerGIJ);
  const colorPMM = getFillColor(layerPMM);
  const colorEON = getFillColor(layerEON);
  const colorPLANO = getFillColor(layerPLANO);
  const colorKUBBS = getFillColor(layerKUBBS);

  const ownerCOTON = getOwner(layerCOTON);
  const ownerIOW = getOwner(layerIOW);
  const ownerBDF = getOwner(layerBDF);
  const ownerBVT = getOwner(layerBVT);
  const ownerGIJ = getOwner(layerGIJ);
  const ownerPMM = getOwner(layerPMM);
  const ownerEON = getOwner(layerEON);
  const ownerPLANO = getOwner(layerPLANO);
  const ownerKUBBS = getOwner(layerKUBBS);

  // 1. IOW Corridor
  if (
    colorCOTON === colorIOW ||
    ownerCOTON.name === 'N/A' ||
    ownerIOW.name === 'N/A'
  ) {
    iowCorridorLabel.value = null;
  } else {
    iowCorridorLabel.value = {
      text: `${ownerIOW.name} FL240 - FL329 <br /> ${ownerCOTON.name} FL330+`,
      colorA: colorCOTON,
      colorB: colorIOW,
      fillColor: averageColors(colorCOTON, colorIOW),
    };
  }

  // 2. Bradford Split
  if (
    colorBDF === colorIOW ||
    ownerBDF.name === 'N/A' ||
    ownerIOW.name === 'N/A'
  ) {
    bdfSplitLabel.value = null;
  } else {
    bdfSplitLabel.value = {
      text: `${ownerBDF.name} FL240 - FL330 <br /> ${ownerIOW.name} FL340+`,
      colorA: colorBDF,
      colorB: colorIOW,
      fillColor: averageColors(colorBDF, colorIOW),
    };
  }

  // 3. Boiler Climb Corridor
  if (
    colorBVT === colorGIJ ||
    ownerBVT.name === 'N/A' ||
    ownerGIJ.name === 'N/A'
  ) {
    bvtCorridorLabel.value = null;
  } else {
    bvtCorridorLabel.value = {
      text: `${ownerBVT.name} <br /> FL240 - FL290`,
      colorA: colorBVT,
      colorB: colorGIJ,
      fillColor: averageColors(colorBVT, colorGIJ),
    };
  }

  // 4. Peotone
  if (
    colorEON === colorPLANO ||
    ownerEON.name === 'N/A' ||
    ownerPLANO.name === 'N/A'
  ) {
    eonLowLabel.value = null;
  } else {
    eonLowLabel.value = {
      text: `${ownerEON.name} 110 - FL230 <br /> ${ownerPLANO.name} SFC - 100`,
      colorA: colorEON,
      colorB: colorPLANO,
      fillColor: averageColors(colorEON, colorPLANO),
    };
  }

  // 5. PMM and KUBBS
  if (
    colorPMM === colorKUBBS ||
    ownerPMM.name === 'N/A' ||
    ownerKUBBS.name === 'N/A'
  ) {
    showPmmKubbsSplit.value = false;
    pmmKubbsLabel.value = null;
  } else {
    showPmmKubbsSplit.value = true;
    pmmKubbsLabel.value = {
      pmmText: `${ownerPMM.name} FL200+`,
      kubbsText: `${ownerKUBBS.name} <br /> SFC - FL190`,
    };
  }
};

// ---------------------------------------------------------------------------
// Computed properties
// ---------------------------------------------------------------------------

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
        lat: highAnchor[0],
        lng: highAnchor[1],
        mapLevel: 'hi',
      });
    }
    const lowAnchor = findAnchor(rawLo?.features, positionId);
    if (lowAnchor) {
      labels.push({
        text: `${prefix}${positionId}`,
        lat: lowAnchor[0],
        lng: lowAnchor[1],
        mapLevel: 'lo',
      });
    }
  });

  return labels;
};

const zmpLabels = computed<ZmpZobLabel[]>(() =>
  buildZmpZobLabels(
    props.ownershipData.zmp ?? {},
    'P',
    rawZmpHiSectors.value,
    rawZmpLoSectors.value,
  ),
);

const zobLabels = computed<ZmpZobLabel[]>(() =>
  buildZmpZobLabels(
    props.ownershipData.zob ?? {},
    'C',
    rawZobHiSectors.value,
    rawZobLoSectors.value,
  ),
);

const activeSectors = computed(() =>
  activeLevel.value === 'hi' ? hiSectorData.value : loSectorData.value,
);

const activeBorders = computed(() =>
  activeLevel.value === 'hi' ? zauHiBorders.value : zauLoBorders.value,
);

const activeZob = computed(() =>
  activeLevel.value === 'hi' ? zobHiSectors.value : zobLoSectors.value,
);

const activeZmp = computed(() =>
  activeLevel.value === 'hi' ? zmpHiSectors.value : zmpLoSectors.value,
);

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

  const push = (key: string, coords: [number, number], html: string) => {
    labels.push({ key, lat: coords[0], lng: coords[1], html });
  };

  if (activeLevel.value === 'hi') {
    if (iowCorridorLabel.value) {
      push(
        'iow',
        staticCorridorCoords.iowCorridor!,
        iowCorridorLabel.value.text,
      );
    }
    if (bvtCorridorLabel.value) {
      push(
        'bvt',
        staticCorridorCoords.bvtCorridor!,
        bvtCorridorLabel.value.text,
      );
    }
    if (showPmmKubbsSplit.value && pmmKubbsLabel.value) {
      push('pmm', staticCorridorCoords.pmmKubbs!, pmmKubbsLabel.value.pmmText);
    }
    if (bdfSplitLabel.value) {
      push('bdf', staticCorridorCoords.bdfSplit!, bdfSplitLabel.value.text);
    }
  } else {
    if (eonLowLabel.value) {
      push('eon', staticCorridorCoords.eonLow!, eonLowLabel.value.text);
    }
    if (showPmmKubbsSplit.value && pmmKubbsLabel.value) {
      push(
        'pmm',
        staticCorridorCoords.pmmKubbs!,
        pmmKubbsLabel.value.kubbsText,
      );
    }
  }

  return labels;
});

// ---------------------------------------------------------------------------
// Watchers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Lifecycle Hooks
// ---------------------------------------------------------------------------

onMounted(async () => {
  await fetchSectorsData();
});
</script>

<template>
  <ProgressSpinner v-if="!hiSectorData" />
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
        @ready="mapReady">
        <LGeoJson
          v-if="activeSectors && activeSectors.features.length"
          :geojson="activeSectors"
          :options="testOptions" />

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
          :options="testOptions" />

        <LGeoJson
          v-if="showPmmKubbsSplit"
          :geojson="pmmBorder"
          :options="testOptions" />

        <LGeoJson
          v-if="activeZob"
          :geojson="activeZob"
          :options="testOptions" />

        <LGeoJson
          v-if="activeZmp"
          :geojson="activeZmp"
          :options="testOptions" />

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
