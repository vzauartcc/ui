export interface IDocument {
  _id: string;
  name: string;
  category: string;
  description: string;
  type: string;
  fileName: string;
  author: number;
  content?: string;
  slug: string;

  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface IDownload {
  _id: string;
  name: string;
  category: string;
  description: string;
  fileName: string;
  author: number;
  slug: string;
  type: string;

  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}
