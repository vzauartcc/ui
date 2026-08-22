import DOMPurify from 'dompurify';

export const sanitize = (html: string): string =>
  DOMPurify.sanitize(html) as string;
