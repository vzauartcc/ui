import type { IFeedbackController } from '../feedback/feedback.types';

export interface IController {
  _id: string;
  cid: number;
  fname: string;
  lname: string;
  rating: number;
  oi: string;
  member: boolean;
  vis: boolean;
  certCodes: string[];
  roleCodes: string[];
  avatar: string;
  joinDate: string; // ISO date
  email?: string;
  history?: {
    start: string; // ISO date
    end: string; // ISO date
    reason: string;
  }[];

  // Virtuals
  name: string;
  ratingShort: string;
  ratingLong: string;
  roles: IRole[];
  certifications: ICertification[];
}

export interface IRole {
  _id: string;
  name: string;
  code: string;
  order: number;
  class: string;
}

export interface ICertification extends IRole {
  facility: string;
  rolledInto: string[];
}

export interface IControllersResponse {
  home: IController[];
  visiting: IController[];
}

export interface IStaff {
  atm: IStaffPosition;
  datm: IStaffPosition;
  ta: IStaffPosition;
  ec: IStaffPosition;
  wm: IStaffPosition;
  fe: IStaffPosition;
  ins: IStaffPosition;
  ia: IStaffPosition;
  mtr: IStaffPosition;

  ft: IStaffPosition;
  wt: IStaffPosition;
  et: IStaffPosition;
  cc: IStaffPosition;
}

interface IStaffPosition {
  name: string;
  description: string;
  code: string;
  users: IFeedbackController[];
}

export interface IControllerStats {
  sessionCount: number;
  sessionAvg: number;
  activity: IControllerActivity[];
}

interface IControllerActivity {
  name: string;
  month: number;
  year: number;

  del: number;
  gnd: number;
  twr: number;
  app: number;
  ctr: number;
}

export interface IActionLogResponse {
  amount: number;
  dossier: IDossier[];
}

export interface IDossier {
  _id: string;
  by: number;
  affected: number;
  action: string;
  actionType: number;
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
  userAffected?: IFeedbackController;
  userBy?: IFeedbackController;
}

export interface IVisitApplication {
  application: IVisitorApplication;

  statusChecks: {
    visiting: boolean;
    recentlyRostered: boolean;
    hasRating: boolean;
    ratingConsolidation: boolean;
    needsBasic: boolean;
    promo: boolean;
    visitingDays: number;
    hasHome: boolean;
    ratingHours: number;
    promoDays: number;
  };
}

export interface IVisitorApplication {
  _id: string;
  cid: number;
  fname: string;
  lname: string;
  rating: string;
  email: string;
  home: string;
  reason: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface IOwnVisitingStatus {
  count: number;
  status: {
    visiting: boolean;
    recentlyRostered: boolean;
    hasRating: boolean;
    ratingConsolidation: boolean;
    needsBasic: boolean;
    promo: boolean;
    visitingDays: number;
    hasHome: boolean;
    ratingHours: number;
    promoDays: number;
  };
}
