import { zauApi } from '@/utils/api';
import type { IDocument, IDownload } from './files.types';

export const filesService = {
  getDocuments(): Promise<IDocument[]> {
    return zauApi.get('file/documents').json();
  },
  getDownloads(): Promise<IDownload[]> {
    return zauApi.get('file/downloads').json();
  },
  getDocument(slug: string): Promise<IDocument> {
    return zauApi.get(`file/documents/${slug}`).json();
  },
  getDownload(id: string): Promise<IDownload> {
    return zauApi.get(`file/downloads/${id}`).json();
  },
  deleteDocument(id: string) {
    return zauApi.delete(`file/documents/${id}`).json();
  },
  deleteDownload(id: string) {
    return zauApi.delete(`file/downloads/${id}`).json();
  },
  editDocument(
    slug: string,
    data: IDocument,
    fileData: File | null,
  ): Promise<{ url: string }> {
    return zauApi
      .put(`file/documents/${slug}`, {
        json: {
          name: data.name,
          description: data.description,
          category: data.category,
          type: data.type,
          fileName: fileData?.name || '',
          fileType: fileData?.type || '',
        },
      })
      .json();
  },
  createDocument(
    data: IDocument,
    fileData: File | null,
  ): Promise<{ url: string }> {
    return zauApi
      .post(`file/documents`, {
        json: {
          name: data.name,
          description: data.description,
          category: data.category,
          type: data.type,
          fileName: fileData?.name || '',
          fileType: fileData?.type || '',
        },
      })
      .json();
  },
  editDownload(
    id: string,
    data: IDownload,
    fileData: File | null,
  ): Promise<{ url: string }> {
    return zauApi
      .patch(`file/downloads/${id}`, {
        json: {
          name: data.name,
          description: data.description,
          category: data.category,
          fileName: fileData?.name || '',
          fileType: fileData?.type || '',
        },
      })
      .json();
  },
  createDownload(
    data: IDownload,
    fileData: File | null,
  ): Promise<{ url: string }> {
    return zauApi
      .post(`file/downloads`, {
        json: {
          name: data.name,
          description: data.description,
          category: data.category,
          fileName: fileData?.name || '',
          fileType: fileData?.type || '',
        },
      })
      .json();
  },
};
