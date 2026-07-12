import type { IController } from '@/services/controller/controller.types';

export interface IExamAttempt {
  _id: string;
  examId: string;
  student: number;
  questionOrder: IQuestion[];
  responses: IResponse[];
  attemptNumber: number;
  status: string;
  deleted: boolean;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  startTime: string; // ISO date
  endTime: string; // ISO date
  grade: number;
  passed: boolean;
  totalScore: number;
  totalTime: number;
  isComplete: boolean;

  // Virtuals
  exam: IExam;
  user: IStudent;
}

interface IStudent {
  _id: string;
  cid: number;
  fname: string;
  lname: string;
  name: string;
}

export interface IExam {
  _id: string;
  title: string;
  description: string;
  certCode: string;
  questions: IQuestion[];
  isActive: boolean;
  createdBy: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date

  // Virtuals
  user: IStudent;
  certification: IMilestone;
}

interface IMilestone {
  _id: string;
  code: string;
  name: string;
}

export interface IQuestion {
  _id: string;
  text: string;
  isActive: boolean;
  options: { _id: string; text: string; isCorrect: boolean }[];
  multiCorrect: boolean;
}

export interface IResponse {
  questionId: string;
  selectedOptions: string[];
  timeSpent: number;
  isCorrect: boolean;
  question?: IQuestion;
}

export interface IExamAttemptsResponse {
  amount: number;
  attempts: IExamAttempt[];
  students: {
    _id: string;
    cid: number;
    user: IController;
  }[];
}
