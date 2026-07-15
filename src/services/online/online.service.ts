import { zauApi } from '@/utils/api';
import type {
  IOnlineController,
  IOnlinePilot,
  ITopControllers,
} from './online.types';

export const onlineService = {
  getControllers(): Promise<IOnlineController[]> {
    return zauApi
      .get('online/atc', {
        context: {
          silent: true,
        },
      })
      .json();
  },
  getPilots(): Promise<IOnlinePilot[]> {
    return zauApi.get('online/pilots', { context: { silent: true } }).json();
  },
  getTop(): Promise<ITopControllers> {
    return zauApi
      .get('online/top', {
        context: { silent: true },
      })
      .json();
  },
};
