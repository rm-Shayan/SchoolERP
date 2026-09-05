'use client';

import { Badge, Card } from '@/features/shared/components';
import type { StudyMaterial } from '@/lib/api/studyMaterialService';
import { TYPE_CONFIG, getMediaType } from './studyMaterialHelpers';

interface Props {
  item: StudyMaterial;
  onEdit?: (item: StudyMaterial) => void;
  onDelete?: (item: StudyMaterial) => void;
  showActions?: boolean;
}

export default function StudyMaterialCard({ item, onEdit, onDelete, showActions = true }: Props) {
  const config = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.DOCUMENT;
  const mediaUrl = item.fileUrl || item.linkUrl;
  const mediaType = getMediaType(mediaUrl);

  return (
    <Card className="overflow-hidden group hover:shadow-md transition-shadow duration-200">
      {/* Thumbnail */}
      {mediaType === 'image' && mediaUrl ? (
        <div className="relative h-40 bg-gray-100 overflow-hidden">
          <img
            src={mediaUrl}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute top-2 right-2">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>
      ) : mediaType === 'video' && mediaUrl ? (
        <div className="relative h-40 bg-gray-900 flex items-center justify-center">
          <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
            <svg className="w-7 h-7 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </a>
          <div className="absolute top-2 right-2">
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        </div>
      ) : (
        <div className={`h-24 bg-gradient-to-br ${config.color} flex items-center justify-center`}>
          <div className="text-white/90">{config.icon}</div>
        </div>
      )}

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-sm text-gray-900 line-clamp-2">{item.title}</h3>
        </div>
        {item.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{item.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
          {item.section && (
            <span>{item.section.class?.name} — {item.section.name}</span>
          )}
          {item.subject && <span>{item.subject.name}</span>}
          <span>{new Date(item.createdAt).toLocaleDateString()}</span>
        </div>

        {showActions && (
          <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-100">
            {mediaUrl && (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open
              </a>
            )}
            <div className="flex items-center gap-1.5 ml-auto">
              {onEdit && (
                <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Edit">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
