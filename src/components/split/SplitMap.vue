<script setup lang="ts">
/* eslint-disable @typescript-eslint/no-explicit-any */
// Imported and converted from the original site
import { splitService } from '@/services/split/split.service';
import type {
  IGeojsonResponse,
  IOwnership,
  ISplitPosition,
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

interface PositionData extends ISplitPosition {
  color?: string;
  isSpecial?: boolean;
  active?: boolean;
  [key: string]: any;
}

interface PositionsByCenter {
  zau: PositionData[];
  zmp: PositionData[];
  zob: PositionData[];
  zid: PositionData[];
  zkc: PositionData[];
}

interface PositionInternal extends PositionData {
  id: string;
}

interface Owner {
  name: string;
  id: string;
  color: string;
}

interface OwnedSectors {
  ownedHigh: Set<string>;
  ownedLow: Set<string>;
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

interface SpecialLabel {
  key: string;
  lat: number;
  lng: number;
  html: string;
}

interface LegendItem {
  label: string;
  color: string;
  key: string;
}

interface LegendGroup {
  title: string;
  items: LegendItem[];
}

const ZOB_COLORS = [
  '#c62828',
  '#e65100',
  '#827717',
  '#f57f17',
  '#ff4081',
  '#ff6e40',
];
const ZMP_COLORS = [
  '#1a237e',
  '#00695c',
  '#37474f',
  '#01579b',
  '#004d40',
  '#311b92',
];
const ZID_COLORS = [
  '#880e4f',
  '#1b5e20',
  '#4a148c',
  '#00bfa5',
  '#006064',
  '#00897b',
];
const ZKC_COLORS = [
  '#7c3aed',
  '#84cc16',
  '#06b6d4',
  '#a855f7',
  '#db2777',
  '#d946ef',
];
const ZAU_COLORS = [
  '#4aa564',
  '#5674b9',
  '#ff7f27',
  '#f06eaa',
  '#9999ff',
  '#a4d5ee',
  '#cccc00',
  '#f5989d',
  '#7accc8',
  '#f26d7d',
  '#fbaf5d',
  '#7fd2a8',
  '#f9ad81',
  '#fbc98e',
  '#c2c2c2',
  '#41b6e6',
  '#2e8540',
];

const CENTER_PREFIX: Record<'zau' | 'zmp' | 'zob' | 'zid' | 'zkc', string> = {
  zau: 'CHI',
  zmp: 'MSP',
  zob: 'CLE',
  zid: 'IND',
  zkc: 'KC',
};

const staticCorridorCoords: Record<string, [number, number]> = {
  iowCorridor: [42.182026, -90.919368],
  bdfSplit: [40.9, -90.4],
  bvtCorridor: [41.375229, -88.163288],
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
  positionsData: PositionsByCenter;
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

const positions = computed<
  Record<'zau' | 'zmp' | 'zob' | 'zid' | 'zkc', Map<string, PositionInternal>>
>(() => {
  const maps: Record<
    'zau' | 'zmp' | 'zob' | 'zid' | 'zkc',
    Map<string, PositionInternal>
  > = {
    zau: new Map<string, PositionInternal>(),
    zmp: new Map<string, PositionInternal>(),
    zob: new Map<string, PositionInternal>(),
    zid: new Map<string, PositionInternal>(),
    zkc: new Map<string, PositionInternal>(),
  };
  (['zau', 'zmp', 'zob', 'zid', 'zkc'] as const).forEach((center) => {
    props.positionsData[center].forEach((p) => {
      maps[center].set(String(p.id), { ...p, id: String(p.id) });
    });
  });
  return maps;
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
    if (positions.value.zau.has(String(ownerId))) {
      ensure(String(ownerId)).ownedHigh.add(String(sectorId));
    }
  }
  for (const [sectorId, ownerId] of Object.entries(low)) {
    if (positions.value.zau.has(String(ownerId))) {
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
    const position = positions.value.zau.get(positionId);
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
  const color = sectorFeature.properties.ownerColor || '#808080';
  return owner
    ? { id, name: owner.name, color }
    : { id: '0', name: 'N/A', color };
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

const colorZauSectors = (
  raw: any,
  level: 'high' | 'low',
  colorMap: Record<string, string>,
) => {
  if (!raw) return { type: 'FeatureCollection', features: [] };

  const newSectors = clone(raw);
  const ownership = props.ownershipData.zau[level];

  newSectors.features.forEach((feature: any) => {
    const sectorId = String(feature.properties.id);
    const ownerId = ownership[sectorId];
    feature.properties.ownerColor = ownerId
      ? (colorMap[ownerId] ?? '#808080')
      : '#808080';
    feature.properties.isOwned = !!ownerId;
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

// Unified ZAU color map across both high+low levels so same position gets same color
const zauColorMap = computed<Record<string, string>>(() => {
  const allOwnership: Record<string, string> = {
    ...props.ownershipData.zau.high,
    ...props.ownershipData.zau.low,
  };
  return assignColors(allOwnership, ZAU_COLORS);
});

const zauColored = computed(() => {
  if (!geojson.value) return null;
  const colorMap = zauColorMap.value;
  return {
    high: colorZauSectors(geojson.value.sectors.high, 'high', colorMap),
    low: colorZauSectors(geojson.value.sectors.low, 'low', colorMap),
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

const zidColored = computed(() => {
  if (!geojson.value) return null;
  const ownership = props.ownershipData.zid ?? {};
  return {
    high: colorNeighbor(geojson.value.zid.high, ownership, ZID_COLORS),
    low: colorNeighbor(geojson.value.zid.low, ownership, ZID_COLORS),
  };
});

const zkcColored = computed(() => {
  if (!geojson.value) return null;
  const ownership = props.ownershipData.zkc ?? {};
  return {
    high: colorNeighbor(geojson.value.zkc.high, ownership, ZKC_COLORS),
    low: colorNeighbor(geojson.value.zkc.low, ownership, ZKC_COLORS),
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
      return { color: '#000000', weight: 3, pane: 'bordersPane' };
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

const getSectorOwnerInfo = (
  feature: any,
  center?: 'zob' | 'zmp' | 'zid' | 'zkc',
) => {
  const id = String(feature.properties.id);
  const level = feature.properties.level as 'high' | 'low' | undefined;

  if (level === 'high' || level === 'low') {
    const owner = sectorOwner.value[level].get(id);
    return {
      id,
      callsign: owner ? `${CENTER_PREFIX.zau}_${owner.id}_CTR` : 'N/A',
      ownerColor: owner?.color ?? '#808080',
    };
  }

  const ownership = props.ownershipData[center!];
  const ownerId = ownership?.[id];
  const owner = ownerId ? positions.value[center!].get(String(ownerId)) : null;
  const ownerName = owner?.name ?? '';
  return {
    id,
    callsign: owner
      ? `${CENTER_PREFIX[center!]}_${owner.id}_CTR - ${ownerName}`
      : 'N/A',
    ownerColor: owner?.color ?? '#808080',
  };
};

const onEachFeature = (feature: any, layer: any) => {
  if (feature.properties.borderType) {
    layer.setStyle(drawBorders(feature));
  } else {
    layer.setStyle(getSectorStyle(feature));
    const { callsign } = getSectorOwnerInfo(feature);
    const level = feature.properties.level;
    const isSpecialZauSector =
      (level === 'high' || level === 'low') &&
      Number(feature.properties.id) < 10;
    const idHtml = isSpecialZauSector
      ? ''
      : `<span class="sector-tooltip-id">Sector ${feature.properties.id}</span>`;
    layer.bindTooltip(
      `<div class="sector-tooltip">${callsign}${idHtml}</div>`,
      { sticky: true, direction: 'top' },
    );
  }
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
    (a, b) => `${b.name} ${b.id} FL240 - FL329 <br /> ${a.name} ${a.id} FL330+`,
  );
  const bdf = corridorLabel(
    byName(high, 'BRADFORD'),
    byName(high, 'IOWA CITY'),
    (a, b) => `${a.name} ${a.id} FL240 - FL330 <br /> ${b.name} ${b.id} FL340+`,
  );
  const bvt = corridorLabel(
    byName(high, 'BOILER'),
    byName(high, 'GIPPER'),
    (a) => `${a.name} ${a.id} <br /> FL240 - FL290`,
  );
  const eon = corridorLabel(
    byName(low, 'PEOTONE'),
    byName(low, 'PLANO'),
    (a, b) =>
      `${a.name} ${a.id} 110 - FL230 <br /> ${b.name} ${b.id} SFC - 100`,
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
        pmmText: `${ownerPMM.name} ${ownerPMM.id} FL200+`,
        kubbsText: `${ownerKUBBS.name} ${ownerKUBBS.id} <br /> SFC - FL190`,
      };
    }
  }

  return { iow, bdf, bvt, eon, pmmKubbs, showPmmKubbsSplit };
});

// ---------------------------------------------------------------------------
// Computed properties
// ---------------------------------------------------------------------------

const makeOnEachFeature =
  (center: 'zob' | 'zmp' | 'zid' | 'zkc') => (feature: any, layer: any) => {
    if (feature.properties.borderType) {
      layer.setStyle(drawBorders(feature));
    } else {
      layer.setStyle(getSectorStyle(feature));
      const { callsign } = getSectorOwnerInfo(feature, center);
      const idHtml = `<span class="sector-tooltip-id">Sector ${feature.properties.id}</span>`;
      layer.bindTooltip(
        `<div class="sector-tooltip">${callsign}${idHtml}</div>`,
        {
          sticky: true,
          direction: 'top',
        },
      );
    }
  };

const zobOptions = {
  style: getSectorStyle,
  onEachFeature: makeOnEachFeature('zob'),
};
const zmpOptions = {
  style: getSectorStyle,
  onEachFeature: makeOnEachFeature('zmp'),
};
const zidOptions = {
  style: getSectorStyle,
  onEachFeature: makeOnEachFeature('zid'),
};
const zkcOptions = {
  style: getSectorStyle,
  onEachFeature: makeOnEachFeature('zkc'),
};

const geojsonOptions = computed(() => ({
  style: getSectorStyle,
  onEachFeature: onEachFeature,
}));

const buildLegendGroup = (
  center: 'zau' | 'zmp' | 'zob' | 'zid' | 'zkc',
  ownership: Record<string, string>,
  colorMap: Record<string, string>,
): LegendGroup => {
  const prefix = CENTER_PREFIX[center];
  const positionMap = positions.value[center];
  const activePositions = [...new Set(Object.values(ownership))].sort();
  const items: LegendItem[] = activePositions.map((positionId) => {
    const pos = positionMap.get(String(positionId));
    return {
      label: `${prefix}_${positionId}_CTR - ${pos?.frequency ?? ''}`,
      color: colorMap[positionId] ?? '#808080',
      key: `${prefix}-${positionId}`,
    };
  });
  return { title: center.toUpperCase(), items };
};

const filterOwnershipByLevel = (
  ownership: Record<string, string>,
  features: any[] | undefined,
): Record<string, string> => {
  if (!features) return {};
  const result: Record<string, string> = {};
  for (const feature of features) {
    const sectorId = String(feature.properties.id);
    const ownerId = ownership[sectorId];
    if (ownerId !== undefined) result[sectorId] = ownerId;
  }
  return result;
};

const legendGroups = computed<LegendGroup[]>(() => {
  const groups: LegendGroup[] = [];

  const zauOwnership = props.ownershipData.zau[activeLevel.value] ?? {};
  const zau = buildLegendGroup(
    'zau',
    filterOwnershipByLevel(
      zauOwnership,
      geojson.value?.sectors[activeLevel.value].features,
    ),
    zauColorMap.value,
  );
  if (zau.items.length > 0) groups.push(zau);

  const zobOwnership = props.ownershipData.zob ?? {};
  const zob = buildLegendGroup(
    'zob',
    filterOwnershipByLevel(
      zobOwnership,
      geojson.value?.zob[activeLevel.value].features,
    ),
    assignColors(zobOwnership, ZOB_COLORS),
  );
  if (zob.items.length > 0) groups.push(zob);

  const zmpOwnership = props.ownershipData.zmp ?? {};
  const zmp = buildLegendGroup(
    'zmp',
    filterOwnershipByLevel(
      zmpOwnership,
      geojson.value?.zmp[activeLevel.value].features,
    ),
    assignColors(zmpOwnership, ZMP_COLORS),
  );
  if (zmp.items.length > 0) groups.push(zmp);

  const zidOwnership = props.ownershipData.zid ?? {};
  const zid = buildLegendGroup(
    'zid',
    filterOwnershipByLevel(
      zidOwnership,
      geojson.value?.zid[activeLevel.value].features,
    ),
    assignColors(zidOwnership, ZID_COLORS),
  );
  if (zid.items.length > 0) groups.push(zid);

  const zkcOwnership = props.ownershipData.zkc ?? {};
  const zkc = buildLegendGroup(
    'zkc',
    filterOwnershipByLevel(
      zkcOwnership,
      geojson.value?.zkc[activeLevel.value].features,
    ),
    assignColors(zkcOwnership, ZKC_COLORS),
  );
  if (zkc.items.length > 0) groups.push(zkc);

  return groups;
});

const activeSectors = computed(
  () => zauColored.value?.[activeLevel.value] ?? null,
);

const activeBorders = computed<any>(
  () => geojson.value?.borders[activeLevel.value] ?? null,
);

const activeZob = computed(() => zobColored.value?.[activeLevel.value] ?? null);

const activeZmp = computed(() => zmpColored.value?.[activeLevel.value] ?? null);

const activeZid = computed(() => zidColored.value?.[activeLevel.value] ?? null);
const activeZkc = computed(() => zkcColored.value?.[activeLevel.value] ?? null);

const pmmBorder = computed<any>(() => geojson.value?.borders.PMM ?? null);

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

      <div class="map-wrapper">
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
            :options="zobOptions" />

          <LGeoJson
            v-if="activeZmp"
            :geojson="activeZmp"
            :options="zmpOptions" />

          <LGeoJson
            v-if="activeZid"
            :geojson="activeZid"
            :options="zidOptions" />

          <LGeoJson
            v-if="activeZkc"
            :geojson="activeZkc"
            :options="zkcOptions" />
        </LMap>

        <div class="map-legend">
          <div
            v-for="group in legendGroups"
            :key="group.title"
            class="legend-group">
            <div class="legend-group-title">{{ group.title }}</div>
            <div v-for="item in group.items" :key="item.key" class="legend-row">
              <span
                class="legend-swatch"
                :style="{ backgroundColor: item.color }"></span>
              <span class="legend-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </div>
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

.level-toggle {
  display: flex;
  justify-content: center;
  margin-bottom: 0.5rem;
}

.map-wrapper {
  position: relative;
}

.map-legend {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  font-family: 'Roboto', Arial, sans-serif;
}

.legend-group-title {
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  color: #3f3f3f;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-swatch {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border: 1px solid rgba(0, 0, 0, 0.25);
  border-radius: 2px;
}

.legend-label {
  font-size: 12px;
  color: #1f1f1f;
  white-space: nowrap;
}

.sector-tooltip {
  font-family: 'Roboto', Arial, sans-serif;
  font-size: 12px;
  font-weight: bold;
  color: #1f1f1f;
  text-align: center;
}

.sector-tooltip-id {
  display: block;
  font-weight: normal;
  color: #5a5a5a;
}

.p-card-title,
.p-card-subtitle {
  text-align: center;
}

.leaflet-interactive {
  cursor: default !important;
}
</style>
