export interface ITrainingSession {
  _id: string;
  studentCid: number;
  instructorCid: number;
  milestoneCode: string;
  position: string;
  startTime: string; // ISO date
  endTime: string; // ISO date
  progress: number;
  duration: string; // "HH:MM"
  movements: number;
  location: number;
  ots: number;
  studentNotes: string;
  insNotes?: string;
  submitted: boolean;
  vatusaId: number;
  deleted: boolean;
  milestone: IMilestone;
  student: ITrainingUser;
  instructor: ITrainingUser;
}

export interface IMilestone {
  _id: string;
  name: string;
  code: string;
}

interface ITrainingUser {
  _id: string;
  cid: number;
  fname: string;
  lname: string;
}

export interface ITrainingSessionsResponse {
  count: number;
  sessions: ITrainingSession[];
}

export const sessionLocation = ['Classroom', 'Live Network', 'Sweatbox'];

export const sessionProgress = [
  '', // Progress starts a 1
  'No Progress',
  'Little Progress',
  'Average Progress',
  'Great Progress',
  'Exceptional Progress',
];

export interface ITrainingWaitlist {
  _id: string;
  studentCid: number;
  certCode: string;
  availability: string[];
  instructorCid: number;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  certification: IMilestone;
  student: {
    cid: number;
    fname: string;
    lname: string;
    rating: string;
  };
  instructor?: ITrainingUser;
  assignedDate: string; // ISO date
  notes?: string;
}

export interface ISessionResponse {
  count: number;
  sessions: ITrainingSession[];
}

export interface ISessionByCIDResponse extends ISessionResponse {
  controller: ITrainingUser;
}

export interface IMilestoneResponse {
  milestones: ITrainingMilestone[];
  milestoneTypes: string[];
}

export interface ITrainingMilestone {
  _id: string;
  code: string;
  name: string;
  rating: number;
  certCode: string;
  isActive: boolean;
  order: number;
  type: string;
}

export interface ISoloEndorsement {
  _id: string;
  studentCid: number;
  instructorCid: number;
  expires: string; // ISO Date
  position: string;
  vatusaId: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  deleted?: boolean;
  deletedAt?: string; // ISO Date
  student: ITrainingUser;
  instructor?: ITrainingUser;
}

export interface IInstructor {
  _id: string;
  cid: number;
  fname: string;
  lname: string;
  name: string;
}

export interface IWaitlistSignup {
  student: number;
  instructor?: number;
  certification: string;
  availability: string[];
  notes?: string;
}

export const sessionOts = [
  'No OTS',
  'OTS Pass',
  'OTS Fail',
  'Recommended for OTS',
];
