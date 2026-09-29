import { zauApi } from '@/utils/api';
import type {
  IActionLogResponse,
  ICertification,
  IController,
  IControllersResponse,
  IControllerStats,
  ILeaveOfAbsence,
  IOwnVisitingStatus,
  IRole,
  IStaff,
  IVisitApplication,
} from './controller.types';

export const controllerService = {
  getControllers(): Promise<IControllersResponse> {
    return zauApi.get('controller/').json();
  },
  getStaff(): Promise<IStaff> {
    return zauApi.get('controller/staff').json();
  },
  getUser(cid: string): Promise<IController> {
    return zauApi.get(`controller/${cid}`).json();
  },
  getUserActivity(cid: string): Promise<IControllerStats> {
    return zauApi.get(`controller/stats/${cid}`).json();
  },
  getTakenOperatingInitials(): Promise<string[]> {
    return zauApi.get('controller/oi').json();
  },
  getCertifications(): Promise<ICertification[]> {
    return zauApi.get('controller/certifications').json();
  },
  getRoles(): Promise<IRole[]> {
    return zauApi.get('controller/role').json();
  },
  updateController(
    cid: number | string,
    roleCodes: string[],
    certCodes: string[],
    oi: string,
  ) {
    return zauApi
      .put(`controller/${cid}`, {
        json: {
          roles: roleCodes,
          certs: certCodes,
          oi: oi,
        },
      })
      .json();
  },
  removeController(cid: number | string, reason: string) {
    return zauApi
      .delete(`controller/${cid}`, {
        json: { reason },
      })
      .json();
  },
  getActionLog(
    page: number,
    limit: number,
    action: number,
  ): Promise<IActionLogResponse> {
    return zauApi
      .get(`controller/log?page=${page}&limit=${limit}&action=${action}`)
      .json();
  },
  getActionLogTypes(): Promise<string[]> {
    return zauApi.get('controller/log/types').json();
  },
  getVisitApplications(): Promise<IVisitApplication[]> {
    return zauApi.get('controller/visit').json();
  },
  acceptVisitApplication(id: string): Promise<{ message: string }> {
    return zauApi.patch(`controller/visit/${id}`).json();
  },
  rejectVisitApplication(id: string, reason: string) {
    return zauApi
      .delete(`controller/visit/${id}`, {
        json: { reason },
      })
      .json();
  },
  checkVisitStatus(): Promise<IOwnVisitingStatus> {
    return zauApi.get('controller/visit/status').json();
  },
  submitVisitApplication(facility: string, reason: string, email: string) {
    return zauApi
      .post('controller/visit', {
        json: { facility, reason, email },
      })
      .json();
  },
  getAbsences(): Promise<ILeaveOfAbsence[]> {
    return zauApi.get('controller/absence').json();
  },
  createAbsence(cid: number, endDate: Date, reason: string) {
    return zauApi
      .post('controller/absence', {
        json: {
          controller: cid,
          reason: reason,
          expirationDate: endDate,
        },
      })
      .json();
  },
  deleteAbsence(id: string) {
    return zauApi.delete(`controller/absence/${id}`).json();
  },
};
