import { zauApi } from '@/utils/api';
import type {
  IRatingExam,
  IRatingExamAttempt,
  IRatingExamAttemptsResponse,
} from './ratingExam.types';

export const ratingExamService = {
  getRatingExams(): Promise<IRatingExam[]> {
    return zauApi.get('training/ratingExam/').json();
  },
  getRatingExam(id: string): Promise<IRatingExam> {
    return zauApi.get(`training/ratingExam/${id}`).json();
  },
  createRatingExam(data: Partial<IRatingExam>) {
    return zauApi.post('training/ratingExam', { json: data }).json();
  },
  editRatingExam(id: string, data: Partial<IRatingExam>) {
    return zauApi.patch(`training/ratingExam/${id}`, { json: data }).json();
  },

  getRatingExamAttempts(
    page = 1,
    limit = 10,
    exam = '',
    user = 0,
  ): Promise<IRatingExamAttemptsResponse> {
    return zauApi
      .get(
        `training/ratingExam/attempt?page=${page}&limit=${limit}&exam=${exam}&user=${user}`,
      )
      .json();
  },
  getOwnRatingExamAttempts(cid: number): Promise<IRatingExamAttempt[]> {
    return zauApi.get(`training/ratingExam/attempt/by-user/${cid}`).json();
  },
  getRatingExamAttempt(id: string): Promise<IRatingExamAttempt> {
    return zauApi.get(`training/ratingExam/attempt/${id}`).json();
  },
  submitRatingExamAttempt(data: Partial<IRatingExamAttempt>) {
    return zauApi
      .post(`training/ratingExam/attempt/`, {
        json: data,
      })
      .json();
  },
  editRatingExamAttempt(id: string, data: Partial<IRatingExamAttempt>) {
    return zauApi
      .patch(`training/ratingExam/attempt/${id}`, { json: data })
      .json();
  },
};
