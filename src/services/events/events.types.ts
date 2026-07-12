import type { IController } from '../controller/controller.types';

export interface IEvent {
  _id: string;
  name: string;
  description: string;
  url: string;
  bannerUrl: string;
  eventStart: Date | string; // ISO date
  eventEnd: Date | string; // ISO date
  requiresEventEndorsement: boolean;
  positions: IPosition[];
  signups: ISignup[];
}

export interface IEventArchive {
  amount: number;
  events: IEvent[];
}

export interface IPosition {
  _id: string;
  pos: string;
  type: 'CTR' | 'APP' | 'DEP' | 'TWR' | 'GND' | 'DEL';
  code: string;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  user: IController | null;
  takenBy?: number;
}

export interface ISignup {
  _id: string;
  cid: number;
  requests: string[];
  user: IController;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface IPositions extends IEvent {
  positions: IPosition[];
  signups: ISignup[];
  open: boolean;
  submitted: boolean;
}
