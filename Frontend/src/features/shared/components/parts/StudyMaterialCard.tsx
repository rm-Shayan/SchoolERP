'use client';

import { Badge, Card } from '@/features/shared/components';
import type { StudyMaterial } from '@/lib/api/studyMaterialService';
import { TYPE_CONFIG, getMediaType, getYoutubeEmbedUrl } from './studyMaterialHelpers';
import { useAppSelector } from '@/store/hooks';
import { buildPrimaryScale } from '@/lib/theme';

interface Props {
  item: StudyMaterial;
  onEdit?: (item: StudyMaterial) => void;
  onDelete?: (item: StudyMaterial) => void;
  showActions?: boolean;
}

export default function StudyMaterialCard({ item, onEdit, onDelete, showActions = true }: Props) {
  const { organization, school } = useAppSelector((s) => s.auth);
  const themeColor = organization?.themeColor || undefined;

  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DOCUMENT;
  const mediaUrl = item.fileUrl || item.linkUrl;
  const mediaType = typeof mediaUrl === 'string' ? getMediaType(mediaUrl) : null;
  const isYoutube = item.linkUrl && (item.linkUrl.includes('youtube.com') || item.linkUrl.includes('youtu.be'));
  const embedUrl = isYoutube && item.linkUrl ? getYoutubeEmbedUrl(item.linkUrl) : null;

  const themeStyle = themeColor ? { color: themeColor, background: `${themeColor}18`, borderColor: `${themeColor}30` } : undefined;

  return (
    <Card className={`overflow-hidden group hover:shadow-lg transition-all duration-200 ${themeColor ? 'border-0' : 'border border-gray-200/70'}`}>
      {/* Preview */}
      {mediaType === 'image' && mediaUrl ? (
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          <img src={mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <Badge variant={config.variant}>{config.label}</Badge>
            {item.subject && <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{item.subject.name}</span>}
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5 text-white/80 text-xs">
            {item.section && <span className="bg-black/30 px-2 py-0.5 rounded">{item.section.class?.name} — {item.section.name}</span>}
          </div>
        </div>
      ) : mediaType === 'video' && mediaUrl ? (
        <div className="relative h-44 bg-gray-900 flex items-center justify-center overflow-hidden">
          {embedUrl ? (              <iframe src={embedUrl} className="w-full h-full absolute inset-0" title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" />
          ) : (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-2 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-1 ring-white/30 transition-colors group-hover:bg-white/30">
                <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </div>
              <span className="text-xs font-medium">Watch</span>
            </a>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
          <div className="absolute top-2 right-2 flex gap-1.5">
            <Badge variant={config.variant}>{config.label}</Badge>
            {item.subject && <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{item.subject.name}</span>}
          </div>
        </div>
      ) : item.type === 'LINK' && mediaUrl ? (
        <div className="relative h-44 flex flex-col justify-end overflow-hidden" style={{ background: themeStyle?.background ?? 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold shadow-sm ${themeColor ? 'border-0 text-white' : 'border-gray-200 text-gray-700'}`} style={themeColor ? { background: `${themeColor}18`, borderColor: `${themeColor}30` } : undefined}>
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              <span className="truncate max-w-[180px]">{mediaUrl.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0]}</span>
            </div>
          </div>          <div className="absolute top-2 right-2 flex gap-1.5">
            <Badge variant={config.variant}>{config.label}</Badge>
            {item.subject && <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">{item.subject.name}</span>}
          </div>
        </div>
      ) : (
        <div className={`h-44 flex items-center justify-center overflow-hidden ${themeColor ? 'bg-white' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`} style={themeColor ? { borderBottom: `1px solid ${themeColor}30` } : undefined}>
          <div className="flex flex-col items-center gap-2 text-center p-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm ${themeColor ? 'text-white' : 'bg-primary-100 text-primary-600'}`} style={themeColor ? { background: `${themeColor}20` } : undefined}>
              {config.icon}
            </div>
            <div className="text-xs font-medium text-gray-500">{config.label}</div>
          </div>
          <div className="absolute top-2 right-2">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 leading-snug line-clamp-2">{item.title}</h3>
            {item.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          {item.section && (
            <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
              <svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9Z" /></svg>
              {item.section.class?.name} — {item.section.name}
            </span>
          )}
          {item.subject && <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100"><svg className="w-3.5 h-3.5 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>{item.subject.name}</span>}
          <span className="inline-flex items-center gap-1 text-gray-400"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{new Date(item.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          {item.createdBy && <span className="inline-flex items-center gap-1 text-gray-400"><svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0111.569-3.761 6 6 0 014.771 4.171 7.5 7.5 0 01-10.49 0A6 6 0 014.501 20.118z" /></svg><span className="truncate max-w-[120px]">{item.createdBy.name}</span></span>}
        </div>

        {showActions && (
          <div className="mt-4 flex items-center gap-2 pt-3 border-t border-gray-100/70" style={themeColor ? { borderColor: `${themeColor}20` } : undefined}>
            {mediaUrl && (
              <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors shadow-sm" style={themeColor ? { background: themeColor, color: '#fff' } : { background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))', color: '#fff' }}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                {item.type === 'LINK' ? 'Open Link' : 'Open'}
              </a>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              {onEdit && (
                <button onClick={() => onEdit(item)} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-transparent">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  Edit
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(item)} className="inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors border border-transparent">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Delete
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
