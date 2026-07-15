export interface IFeedbackController {
  cid: number;
  fname: string;
  lname: string;
  rating: number;
  vis: boolean;
  name: string;
}

export interface IOwnFeedbackResponse {
  amount: number;
  feedback: IFeedback[];
}

export interface IFeedback {
  _id: string;
  rating: number;
  position: string;
  comments: string;
  anonymous: boolean;
  createdAt: string; // ISO date
  name: string;
  submitter: number;
  email: string;
  controller: IFeedbackController;
  approved: boolean;
}
