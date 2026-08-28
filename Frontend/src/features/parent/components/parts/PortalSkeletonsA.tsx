'use client';

import { Card, CardContent, CardHeader } from '@/features/shared/components';

/** Overview: ring card + fee card + 3 quick-stat cards */
export function OverviewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader><div className="h-4 w-40 bg-gray-200 rounded" /></CardHeader>
          <CardContent className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 shrink-0" />
            <div className="grid grid-cols-2 gap-2 flex-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                  <div className="h-2 w-12 bg-gray-200 rounded mb-1.5" />
                  <div className="h-4 w-8 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><div className="h-4 w-28 bg-gray-200 rounded" /></CardHeader>
          <CardContent>
            <div className="text-center mb-3 space-y-1.5">
              <div className="h-8 w-32 bg-gray-200 rounded mx-auto" />
              <div className="h-3 w-40 bg-gray-100 rounded mx-auto" />
            </div>
            <div className="h-14 bg-gray-50 rounded-lg" />
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="h-7 w-10 bg-gray-200 rounded mx-auto mb-1.5" />
            <div className="h-3 w-16 bg-gray-100 rounded mx-auto" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/** Attendance: month nav + 4 stat cards + calendar grid */
export function AttendanceSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
        <div className="h-5 w-36 bg-gray-200 rounded" />
        <div className="w-9 h-9 bg-gray-100 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3 text-center">
            <div className="h-6 w-8 bg-gray-200 rounded mx-auto mb-1" />
            <div className="h-2.5 w-12 bg-gray-100 rounded mx-auto" />
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-3 bg-gray-100 rounded" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }).map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Fees: 4 summary cards + table skeleton */
export function FeesSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4 text-center">
            <div className="h-6 w-20 bg-gray-200 rounded mx-auto mb-1" />
            <div className="h-2.5 w-16 bg-gray-100 rounded mx-auto" />
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader><div className="h-4 w-28 bg-gray-200 rounded" /></CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-4 flex-1 bg-gray-100 rounded" />
              ))}
            </div>
            {Array.from({ length: 5 }).map((_, r) => (
              <div key={r} className="flex gap-3">
                {Array.from({ length: 5 }).map((_, c) => (
                  <div key={c} className="h-10 flex-1 bg-gray-50 rounded-lg" />
                ))}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Profile: avatar + info rows + children list */
export function ProfileSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Card>
        <CardHeader><div className="h-4 w-40 bg-gray-200 rounded" /></CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gray-200 shrink-0" />
            <div className="space-y-2"><div className="h-5 w-36 bg-gray-200 rounded" /><div className="h-3 w-24 bg-gray-100 rounded" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-1.5"><div className="h-2.5 w-20 bg-gray-100 rounded" /><div className="h-4 w-32 bg-gray-200 rounded" /></div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><div className="h-4 w-36 bg-gray-200 rounded" /></CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 space-y-1.5"><div className="h-4 w-32 bg-gray-200 rounded" /><div className="h-2.5 w-48 bg-gray-100 rounded" /></div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
