import type { IController } from '@/services/controller/controller.types';

export interface IControllerActivity extends IController {
  totalTime: number;
  totalRequests: number;
  totalSessions: number;
  exempt: boolean;
  protected: boolean;
  tooLow: boolean;
  obsTime: number;
}

export interface IActivityResponse {
  activity: IControllerActivity[];
  activityPeriod: number;
  activityYear: number;
  activityStart: string; // ISO Date
  activityEnd: string; // ISO Date
  periodData: {
    unit: string;
    periodsInYear: number;
    periodLength: number;
    currentPeriod: number;
    startOfCurrent: string; // ISO Date
    endOfCurrent: string; // ISO Date
  };
}

export interface IAdminStatsResponse {
  totalTime: number;
  totalSessions: number;
  feedback: IMonthlyCount[];
  hours: IMonthlyCount[];
  counts: IUserCount;
}

export interface IInsStatsResponse {
  sessions: ISessionMonthlyCount[];
}

interface ISessionMonthlyCount extends IMonthlyCount {
  totalTime: number;
}

interface IMonthlyCount {
  _id: { month: number; year: number };
  total: number;
  month: string;
  year: number;
}

interface IUserCount {
  home: number;
  vis: number;
  byRating: {
    _id: number;
    count: number;
    rating: string;
  }[];
}
