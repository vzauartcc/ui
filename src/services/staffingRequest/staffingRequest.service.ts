import { zauApi } from '@/utils/api';
import type {
  IStaffingRequest,
  IStaffingRequestsResponse,
} from './staffingRequest.types';

export const staffingRequestService = {
  getUpcomingRequests(
    page = 1,
    limit = 10,
  ): Promise<IStaffingRequestsResponse> {
    return zauApi
      .get(`event/staffingRequest/upcoming?page=${page}&limit=${limit}`)
      .json();
  },
  getAllRequests(page = 1, limit = 10): Promise<IStaffingRequestsResponse> {
    return zauApi
      .get(`event/staffingRequest?page=${page}&limit=${limit}`)
      .json();
  },
  getRequest(id: string): Promise<IStaffingRequest> {
    return zauApi.get(`event/staffingRequest/${id}`).json();
  },
  createRequest(
    vaName: string,
    pilots: number,
    description: string,
    date: string,
    route: string,
  ) {
    return zauApi
      .post('event/staffingRequest/', {
        json: {
          vaName,
          pilots,
          route,
          description,
          date,
        },
      })
      .json();
  },
  deleteRequest(id: string) {
    return zauApi.delete(`event/staffingRequest/${id}`).json();
  },
  editRequest(id: string, data: IStaffingRequest) {
    return zauApi
      .put(`event/staffingRequest/${id}`, {
        json: data,
      })
      .json();
  },
};
