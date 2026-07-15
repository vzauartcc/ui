import { zauApi } from '@/utils/api';
import type {
  IFeedback,
  IFeedbackController,
  IOwnFeedbackResponse,
} from './feedback.types';

export const feedbackService = {
  getControllerList(): Promise<IFeedbackController[]> {
    return zauApi.get('feedback/controllers').json();
  },
  getOwn(page = 1, limit = 1): Promise<IOwnFeedbackResponse> {
    return zauApi.get(`feedback/own?page=${page}&limit=${limit}`).json();
  },
  postFeedback(
    targetCid: number,
    position: string,
    rating: number,
    comments: string,
    anonymous: boolean,
  ) {
    return zauApi
      .post('feedback/', {
        json: {
          controller: targetCid,
          rating: rating,
          position: position,
          comments: comments,
          anon: anonymous,
        },
      })
      .json();
  },
  getFeedback(page: number, limit: number): Promise<IOwnFeedbackResponse> {
    return zauApi.get(`feedback?page=${page}&limit=${limit}`).json();
  },
  getUnapprovedFeedback(): Promise<IFeedback[]> {
    return zauApi.get('feedback/unapproved').json();
  },
  approveFeedback(id: string) {
    return zauApi.patch(`feedback/${id}/approve`).json();
  },
  rejectFeedback(id: string) {
    return zauApi.patch(`feedback/${id}/reject`).json();
  },
};
