import { zauApi } from '@/utils/api';
import type { INewsArticle, INewsResponse } from './news.types';

export const newsService = {
  getRecent(): Promise<INewsResponse> {
    return zauApi
      .get('news?page=1&limit=3', {
        context: { silent: true },
      })
      .json();
  },
  getPage(page = 1, limit = 20): Promise<INewsResponse> {
    return zauApi.get(`news?page=${page}&limit=${limit}`).json();
  },
  getArticle(slug: string): Promise<INewsArticle> {
    return zauApi.get(`news/${slug}`).json();
  },
  deleteArticle(slug: string) {
    return zauApi.delete(`news/${slug}`).json();
  },
  createArticle(title: string, content: string) {
    return zauApi.post('news', { json: { title, content } }).json();
  },
  editArticle(slug: string, title: string, content: string) {
    return zauApi
      .patch(`news/${slug}`, {
        json: { title, content },
      })
      .json();
  },
};
