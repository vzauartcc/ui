export interface IOwnershipResponse {
  positions: IPosition[];
  ownership: IOwnership;
}

export interface IOwnership {
  zau: {
    high: Record<string, string>;
    low: Record<string, string>;
  };
  zmp: Record<string, string>;
  zob: Record<string, string>;
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
  zob: {
    high: IZOBGeojson;
    low: IZOBGeojson;
  };
  zmp: {
    high: IZMPGeojson;
    low: IZMPGeojson;
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

interface IZOBGeojson {
  type: string;
  features: [
    {
      type: string;
      properties: {
        id: string;
        sector: string;
        labelAnchor: number[];
      };
      geometry: {
        type: string;
        coordinates: number[][];
      };
    },
  ];
}

interface IZMPGeojson {
  type: string;
  features: [
    {
      type: string;
      properties: {
        id: string | number;
        labelAnchor: number[];
      };
      geometry: {
        type: string;
        coordinates: number[][];
      };
    },
  ];
}
