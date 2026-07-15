export interface StaffingRequest {
  vaName: string;
  pilots: number;
  route: string;
  description: string;
  date: Date; // Form data
}

export interface IStaffingRequest {
  _id: string;
  vaName: string;
  date: string; // ISO date
  pilots: number;
  route: string;
  accepted: boolean;
  description: string;

  name: string;
  email: string;
}

export interface IStaffingRequestsResponse {
  amount: number;
  requests: IStaffingRequest[];
}
