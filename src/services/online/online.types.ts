export interface IOnlineController {
  name: string;
  pos: string;
  timeStart: string; // ISO date
}

export interface IOnlinePilot {
  callsign: string;
  dep: string;
  dest: string;
  aircraft: string;
}

export interface IOnlineResponse {
  pilots: IOnlinePilot[];
  atc: IOnlineController[];
}

interface TopController {
  name: string;
  cid: number;
  len: number;
}

export interface ITopControllers {
  controllers: TopController[];
  positions: TopController[];
}
