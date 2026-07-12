import { zauApi } from '@/utils/api';
import type { IEvent, IEventArchive, IPositions } from './events.types';

export const eventService = {
  getEvents(): Promise<IEvent[]> {
    return zauApi.get('event').json();
  },
  getPast(page = 1, limit = 20): Promise<IEventArchive> {
    return zauApi.get(`event/archive?page=${page}&limit=${limit}`).json();
  },
  getEvent(url: string): Promise<IEvent> {
    return zauApi.get(`event/${url}`).json();
  },
  getPositionData(url: string): Promise<IPositions> {
    return zauApi.get(`event/${url}/positions`).json();
  },
  deleteSignup(url: string) {
    return zauApi.delete(`event/${url}/signup`).json();
  },
  submitSignup(url: string, requests: string[]) {
    return zauApi
      .patch(`event/${url}/signup`, {
        json: {
          requests: requests,
        },
      })
      .json();
  },
  deleteEvent(slug: string) {
    return zauApi.delete(`event/${slug}`).json();
  },
  createEvent(
    name: string,
    startTime: string,
    endTime: string,
    description: string,
    fileData: File,
    endorsementRequired: boolean,
  ): Promise<{ url: string }> {
    return zauApi
      .post('event', {
        json: {
          name,
          startTime,
          endTime,
          description,
          requiresEventEndorsement: endorsementRequired,
          fileName: fileData.name,
          fileType: fileData.type,
        },
      })
      .json();
  },
  editEvent(
    slug: string,
    name: string,
    startTime: string,
    endTime: string,
    description: string,
    positions: string[],
    fileData: File | null,
    endorsementRequired: boolean,
  ): Promise<{ url: string }> {
    return zauApi
      .put(`event/${slug}`, {
        json: {
          name,
          startTime,
          endTime,
          description,
          positions,
          requiresEventEndorsement: endorsementRequired,
          fileName: fileData?.name || '',
          fileType: fileData?.type || '',
        },
      })
      .json();
  },
  manuallyDeleteSignup(slug: string, cid: number) {
    return zauApi.delete(`event/${slug}/mandelete/${cid}`).json();
  },
  manuallySignUp(slug: string, cid: number) {
    return zauApi.patch(`event/${slug}/mansignup/${cid}`).json();
  },
  assignPosition(slug: string, position: string, cid: number | null) {
    return zauApi
      .patch(`event/${slug}/assign`, {
        json: { position, cid },
      })
      .json();
  },
  sendEvent(url: string) {
    return zauApi.post('event/sendEvent', { json: { url } }).json();
  },
  closeSignups(url: string, status: boolean) {
    return zauApi
      .put(`event/${url}/close`, {
        json: { open: status },
      })
      .json();
  },
};
