'use client';

import { Card, CardContent, CardHeader } from '@/features/shared/components';

/** Homework: grouped teacher cards with assignment rows */
export function HomeworkSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 2 }).map((_, g) => (
        <Card key={g}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="space-y-1.5">
                <div className="h-3.5 w-28 bg-gray-200 rounded" />
                <div className="h-2.5 w-20 bg-gray-100 rounded" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                  <div className="h-3 w-16 bg-gray-100 rounded" />
                </div>
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-2/3 bg-gray-100 rounded" />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Notices: card list with title + content + badge */
export function NoticesSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 space-y-2">
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="h-3 w-3/4 bg-gray-100 rounded" />
              </div>
              <div className="text-right space-y-1.5 shrink-0">
                <div className="h-5 w-16 bg-primary-50 rounded-full" />
                <div className="h-2.5 w-14 bg-gray-100 rounded" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Results: exam card with subject table rows */
export function ResultsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 2 }).map((_, g) => (
        <Card key={g}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <div className="h-4 w-44 bg-gray-200 rounded" />
                <div className="h-2.5 w-32 bg-gray-100 rounded" />
              </div>
              <div className="text-right space-y-1">
                <div className="h-5 w-16 bg-gray-200 rounded ml-auto" />
                <div className="h-2.5 w-10 bg-gray-100 rounded ml-auto" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, r) => (
                <div key={r} className="flex gap-3 py-2 border-b border-gray-50">
                  <div className="h-3.5 flex-1 bg-gray-100 rounded" />
                  <div className="h-3.5 w-16 bg-gray-100 rounded" />
                  <div className="h-3.5 w-10 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Timetable: day cards with slot rows */
export function TimetableSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, d) => (
        <Card key={d}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-primary-50 rounded-full" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, s) => (
                <div key={s} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="h-3 w-20 bg-gray-200 rounded shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-200 rounded" />
                    <div className="h-2.5 w-24 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/** Conduct: remark cards with type badge */
export function ConductSkeleton() {
  return (<div className="space-y-3 animate-pulse">
    {Array.from({ length: 3 }).map((_, i) => (
      <Card key={i}><CardContent className="p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2"><div className="flex gap-2"><div className="h-5 w-16 bg-gray-200 rounded-full" /><div className="h-3 w-14 bg-gray-100 rounded" /></div>
          <div className="h-3.5 w-full bg-gray-100 rounded" /><div className="h-2.5 w-20 bg-gray-100 rounded" /></div>
      </CardContent></Card>))}
  </div>);
}

/** PTM: session cards with date badge */
export function PTMSkeleton() {
  return (<div className="space-y-3 animate-pulse">
    {Array.from({ length: 2 }).map((_, i) => (
      <Card key={i}><CardContent className="p-4 flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2"><div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-full bg-gray-100 rounded" /><div className="flex gap-3"><div className="h-3 w-16 bg-gray-100 rounded" /><div className="h-3 w-24 bg-gray-100 rounded" /></div></div>
      </CardContent></Card>))}
  </div>);
}
