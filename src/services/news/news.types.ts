import type { IController } from '@/services/controller/controller.types';

export interface INewsArticle {
  title: string;
  content: string;
  uriSlug: string;
  createdBy: number;
  createdAt: string; // ISO date

  user: IController;
}

export interface INewsResponse {
  amount: number;
  news: INewsArticle[];
}
