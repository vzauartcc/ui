import { zauApi } from '@/utils/api';
import type { IStation } from './weather.types';

export const weatherService = {
  getStation(id: string, silent: boolean): Promise<IStation> {
    return zauApi
      .get(`ids/stations/${id.toUpperCase()}`, { context: { silent: silent } })
      .json();
  },
};
