import type { ReactNode } from 'react';

export const TYPE_CONFIG: Record<
  string,
  { variant: 'info' | 'default' | 'success' | 'warning'; icon: ReactNode; label: string }
> = {
  DOCUMENT: {
    variant: 'info',
    label: 'Document',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  VIDEO: {
    variant: 'default',
    label: 'Video',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  IMAGE: {
    variant: 'success',
    label: 'Image',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  LINK: {
    variant: 'warning',
    label: 'External Link',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
};

export function getMediaType(url: string | null | undefined): 'image' | 'video' | null {
  if (!url) return null;
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url)) return 'image';
  if (/\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)) return 'video';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video';
  return null;
}

export function getYoutubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^&?/]+)/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

/**
 * Accepted file extensions per material type. Used by the upload form to restrict
 * what the file input accepts and to infer the material type from a selected file.
 */
export const TYPE_ACCEPT_MAP = {
  DOCUMENT: ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt'],
  VIDEO: ['.mp4', '.webm', '.ogg', '.mov'],
  IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  LINK: [],
} as const;

/**
 * Per-type client-side size caps, kept in sync with the backend limits so the
 * form can reject oversized files before upload.
 */
export const TYPE_OPTIONS = [
  { value: 'DOCUMENT', label: 'Document' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'IMAGE', label: 'Image' },
  { value: 'LINK', label: 'External Link' },
] as const;

export const TYPE_MAX_BYTES_MAP = {
  DOCUMENT: 25 * 1024 * 1024,
  VIDEO: 50 * 1024 * 1024,
  IMAGE: 10 * 1024 * 1024,
  LINK: 0,
} as const;
