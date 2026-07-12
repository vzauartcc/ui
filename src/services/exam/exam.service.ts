import { zauApi } from '@/utils/api';
import type { IExam, IExamAttempt, IExamAttemptsResponse } from './exam.types';

export const examService = {
  getExams(): Promise<IExam[]> {
    return zauApi.get('exam/').json();
  },
  getOwnExams(cid: number): Promise<IExamAttempt[]> {
    return zauApi.get(`exam/attempt/by-user/${cid}`).json();
  },
  getExamAttempts(
    page = 1,
    limit = 10,
    exam = '',
    status = '',
    user = 0,
  ): Promise<IExamAttemptsResponse> {
    return zauApi
      .get(
        `exam/attempt?page=${page}&limit=${limit}&exam=${exam}&status=${status}&user=${user}`,
      )
      .json();
  },
  getExamAttempt(id: string): Promise<IExamAttempt> {
    return zauApi.get(`exam/attempt/${id}`).json();
  },
  saveAnswer(
    attemptId: string,
    questionId: string,
    answers: string[],
    timeSpent: number,
  ): Promise<IExamAttempt> {
    return zauApi
      .patch(`exam/attempt/${attemptId}`, {
        json: {
          questionId: questionId,
          selectedOptions: answers.filter((a) => a !== null && a.trim() !== ''),
          timeSpent: timeSpent,
        },
      })
      .json();
  },
  submitExam(attemptId: string) {
    return zauApi
      .post(`exam/attempt/${attemptId}/submit`, {
        json: {},
      })
      .json();
  },
  assignExam(studentCid: number, examId: string) {
    return zauApi
      .post(`exam/${examId}/assign`, {
        json: { cid: studentCid },
      })
      .json();
  },
  deleteAttempt(attemptId: string) {
    return zauApi.delete(`exam/attempt/${attemptId}`).json();
  },
  getExam(id: string): Promise<IExam> {
    return zauApi.get(`exam/${id}`).json();
  },
  createExam(data: IExam) {
    return zauApi.post('exam', { json: data }).json();
  },
  editExam(id: string, data: IExam) {
    return zauApi.patch(`exam/${id}`, { json: data }).json();
  },
};
