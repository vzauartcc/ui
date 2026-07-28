export interface IOwnershipResponse {
  positions: IPosition[];
  ownership: IOwnership;
}

export interface IOwnership {
  high: Record<string, string>;
  low: Record<string, string>;
}

export interface IPosition {
  id: string;
  name: string;
  frequency: string;
  color: string; // Hex color
}

export interface IGeojsonResponse {
  borders: Record<string, IGeojson>;
  sectors: {
    high: IGeojson;
    low: IGeojson;
  };
}

interface IGeojson {
  type: string;
  features: IGeojsonFeature[];
}

export interface IGeojsonFeature {
  type: string;
  properties: {
    id: number;
    name: string;
    area: string;
    special: boolean;
    level: 'hi' | 'lo';
    labelAnchor: number[];
  };
  geometry: {
    type: string;
    coordinates: number[][];
  };
}
