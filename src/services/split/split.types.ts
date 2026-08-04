export interface IOwnershipResponse {
  positions: {
    zau: ISplitPosition[];
    zmp: ISplitPosition[];
    zob: ISplitPosition[];
    zid: ISplitPosition[];
  };
  ownership: IOwnership;
}

export interface IOwnership {
  zau: {
    high: Record<string, string>;
    low: Record<string, string>;
  };
  zmp: Record<string, string>;
  zob: Record<string, string>;
  zid: Record<string, string>;
}

export interface ISplitPosition {
  id: string;
  name: string;
  frequency: string;
}

export interface IGeojsonResponse {
  borders: Record<string, IGeojson>;
  sectors: {
    high: IGeojson;
    low: IGeojson;
  };
  zob: {
    high: INeighborGeojson;
    low: INeighborGeojson;
  };
  zmp: {
    high: INeighborGeojson;
    low: INeighborGeojson;
  };
  zid: {
    high: INeighborGeojson;
    low: INeighborGeojson;
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
    level: 'high' | 'low';
    labelAnchor: number[];
  };
  geometry: {
    type: string;
    coordinates: number[][];
  };
}

interface INeighborGeojson {
  type: string;
  features: [
    {
      type: string;
      properties: {
        id: string;
      };
      geometry: {
        type: string;
        coordinates: number[][];
      };
    },
  ];
}
