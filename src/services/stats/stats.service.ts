import { zauApi } from '@/utils/api';
import type {
  IActivityResponse,
  IAdminStatsResponse,
  IInsStatsResponse,
} from './stats.types';

export const statsService = {
  getActivity(period?: number, year?: number): Promise<IActivityResponse> {
    return zauApi
      .get(`stats/activity?period=${period}&year=${year}`, {})
      .json();
  },
  getAdminStats(): Promise<IAdminStatsResponse> {
    return zauApi.get('stats/admin').json();
  },
  getInsStats(): Promise<IInsStatsResponse> {
    return zauApi.get('stats/ins').json();
  },
};
