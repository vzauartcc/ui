export interface IUser {
  cid: number;
  fname: string;
  lname: string;
  email: string;
  rating: number;
  oi: string;
  vis: boolean;
  member: boolean;
  discord?: string;
  roleCodes: string[];
  history: {
    start: string; // ISO date
    end: string; // ISO date
    reason: string;
  }[];
  joinDate: string; // ISO date

  // Virtuals
  name: string;
  isMember: boolean;
  isManagement: boolean;
  isSeniorStaff: boolean;
  isStaff: boolean;
  isInstructor: boolean;
  isTrainingStaff: boolean;
  isEventsTeam: boolean;
  isFacilityTeam: boolean;
  ratingShort: string;
  ratingLong: string;

  roles: IRole[];
}

export interface IRole {
  _id: string;
  name: string;
  code: string;
  order: number;
  class: string;
  description: string;
}

export interface IUserSession {
  _id: string;
  timeStart: Date;
  timeEnd: Date;
  position: string;
  cid: number;
}

interface IActivityPeriod {
  unit: string;
  periodsInYear: number;
  periodLength: number;
  currentPeriod: number;
  startOfCurrent: Date;
  endOfCurrent: Date;
}

interface IActivityRequirements {
  unit: string;
  observer: {
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    trainingSessions: number;
  };
  controller: {
    hours: number;
    minutes: number;
    seconds: number;
    milliseconds: number;
    trainingSessions: number;
  };
}

export interface IUserSessionsResponse {
  sessions: IUserSession[];
  training: [];
  period: IActivityPeriod;
  requirements: IActivityRequirements;
}

export interface AllUsersResponse {
  home: IUser[];
  visiting: IUser[];
  removed: IUser[];
}
