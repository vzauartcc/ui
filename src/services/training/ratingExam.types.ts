import type { ICertification } from '../controller/controller.types';
import type { IFeedbackController } from '../feedback/feedback.types';

export interface IRatingExamIndicator {
  _id: string;
  name: string;
  deduction: number;
  failureThreshold: number;
  isActive: boolean;
  category: string;
  type: 'theory' | 'practical';
}

export interface IRatingExam {
  _id: string;
  name: string;
  isActive: boolean;
  updatedBy: number;
  certCode: string;

  indicators: IRatingExamIndicator[];

  // Virtuals
  user?: IFeedbackController;
  certification?: ICertification;
}

export interface IRatingExamAttemptIndicator {
  indicatorId: string;
  performance: 'satisfactory' | 'unsatisfactory';
  occurrences: number;
  notes: string;

  name: string;
  deduction: number;
  failureThreshold: number;
  isActive: boolean;
  category: string;
  type: 'theory' | 'practical';
}

export interface IRatingExamAttempt {
  _id: string;
  ratingExamId: string;
  studentCid: number;
  instructorCid: number;
  certCode: string;

  indicators: IRatingExamAttemptIndicator[];

  theoryPassed: boolean;
  practicalPassed: boolean;
  passed: boolean;

  practicalScore: number;

  notes?: string;
  theoryNotes?: string;
  practicalNotes?: string;

  attempt: number;

  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date

  // Virtuals
  student?: IFeedbackController;
  instructor?: IFeedbackController;
  ratingExam?: IRatingExam;
}

export interface IRatingExamAttemptsResponse {
  amount: number;
  attempts: IRatingExamAttempt[];
  students: {
    _id: string;
    cid: number;
    student: IFeedbackController;
  }[];
}
