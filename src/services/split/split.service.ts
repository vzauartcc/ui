import { zauApi } from '@/utils/api';
import type {
  IGeojsonResponse,
  IOwnership,
  IOwnershipResponse,
} from './split.types';

export const splitService = {
  getOwnership(): Promise<IOwnershipResponse> {
    return zauApi.get('split/ownership').json();
  },
  getGeojson(): Promise<IGeojsonResponse> {
    return zauApi.get('split/geojson').json();
  },
  saveSplit(
    high: Record<string, string>,
    low: Record<string, string>,
  ): Promise<IOwnership> {
    return zauApi
      .put('split/ownership', {
        json: { high, low },
      })
      .json();
  },
  resetSplit(): Promise<IOwnership> {
    return zauApi.delete('split/ownership').json();
  },
  isSplit(): Promise<boolean> {
    return zauApi.get('split/isSplit', { context: { silent: true } }).json();
  },
};
