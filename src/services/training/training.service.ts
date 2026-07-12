import { zauApi } from '@/utils/api';
import type {
  IInstructor,
  IMilestoneResponse,
  ISessionByCIDResponse,
  ISessionResponse,
  ISoloEndorsement,
  ITrainingMilestone,
  ITrainingSession,
  ITrainingSessionsResponse,
  ITrainingWaitlist,
  IWaitlistSignup,
} from './training.types';

export const trainingService = {
  getOwnSessions(page = 1, limit = 10): Promise<ITrainingSessionsResponse> {
    return zauApi
      .get(`training/session/past?page=${page}&limit=${limit}`)
      .json();
  },
  getSession(id: string): Promise<ITrainingSession> {
    return zauApi.get(`training/session/${id}`).json();
  },
  getWaitlist(): Promise<ITrainingWaitlist[]> {
    return zauApi.get('training/waitlist').json();
  },
  deleteWaitlist(id: string) {
    return zauApi.delete(`training/waitlist/${id}`).json();
  },
  getSessionsByCID(
    page = 1,
    limit = 10,
    cid: string | number,
  ): Promise<ISessionByCIDResponse> {
    return zauApi
      .get(`training/session/by-user/${cid}?page=${page}&limit=${limit}`)
      .json();
  },
  getMilestones(): Promise<IMilestoneResponse> {
    return zauApi.get('training/milestones').json();
  },
  reorderMilestones(array: ITrainingMilestone[]) {
    return zauApi
      .patch('training/milestones/order', {
        json: array.map((x) => x._id),
      })
      .json();
  },
  editMilestone(id: string, edit: Partial<ITrainingMilestone>) {
    return zauApi
      .patch(`training/milestones/${id}`, {
        json: edit,
      })
      .json();
  },
  createMilestone(milestone: Partial<ITrainingMilestone>) {
    return zauApi
      .post('training/milestones', {
        json: milestone,
      })
      .json();
  },
  getSoloEndorsements(): Promise<ISoloEndorsement[]> {
    return zauApi.get('training/solo').json();
  },
  editSoloEndorsement(id: string, data: object) {
    return zauApi.patch(`training/solo/${id}`, { json: data }).json();
  },
  deleteSoloEndorsement(id: string) {
    return zauApi.delete(`training/solo/${id}`).json();
  },
  createSoloEndorsement(student: number, position: string, expDate: string) {
    return zauApi
      .post('training/solo', {
        json: { student, position, expirationDate: expDate },
      })
      .json();
  },
  getInstructors(): Promise<IInstructor[]> {
    return zauApi.get('training/waitlist/instructors').json();
  },
  createWaitlistEntryManual(data: IWaitlistSignup) {
    return zauApi
      .post('training/waitlist/manual', {
        json: data,
      })
      .json();
  },
  createWaitlistEntry(data: Partial<IWaitlistSignup>) {
    return zauApi
      .post('training/waitlist', {
        json: data,
      })
      .json();
  },
  getSessions(page = 1, limit = 10): Promise<ISessionResponse> {
    return zauApi.get(`training/session?page=${page}&limit=${limit}`).json();
  },
  getOpenSessions(): Promise<ITrainingSession[]> {
    return zauApi.get('training/session/open').json();
  },
  deleteSession(id: string) {
    return zauApi.delete(`training/session/${id}`).json();
  },
  saveSessionEdit(id: string, data: Partial<ITrainingSession>) {
    return zauApi
      .patch(`training/session/${id}/save`, {
        json: data,
      })
      .json();
  },
  submitSessionEdit(id: string, data: Partial<ITrainingSession>) {
    return zauApi
      .patch(`training/session/${id}/submit`, {
        json: data,
      })
      .json();
  },
  saveSession(data: Partial<ITrainingSession>) {
    return zauApi
      .patch(`training/session/save`, {
        json: data,
      })
      .json();
  },
  submitSession(data: Partial<ITrainingSession>) {
    return zauApi
      .patch(`training/session/submit`, {
        json: data,
      })
      .json();
  },
  getWaitlistEntry(id: string): Promise<ITrainingWaitlist> {
    return zauApi.get(`training/waitlist/${id}`).json();
  },
  editWaitlistEntryManual(id: string, data: Partial<IWaitlistSignup>) {
    return zauApi
      .patch(`training/waitlist/${id}`, {
        json: data,
      })
      .json();
  },
};
