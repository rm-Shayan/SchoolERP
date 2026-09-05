'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, EmptyState, Button } from '@/features/shared/components';
import { portalDataService } from '@/lib/api/portalDataService';
import type { PortalLeaveRequest } from '@/types/portal';
import { cn, formatDate, getStatusColor } from '@/lib/utils';
import LeaveForm from './LeaveForm';

interface ChildInfo {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
}

export default function LeaveRequestsTab({ children }: { children: ChildInfo[] }) {
  const [requests, setRequests] = useState<PortalLeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    portalDataService.getLeaveRequests().then(setRequests).finally(() => setLoading(false));
  }, []);

  const handleCreated = (newReq: PortalLeaveRequest) => {
    setRequests((prev) => [newReq, ...prev]);
    setShowForm(false);
  };

  if (loading) return <LeaveSkeleton />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Leave Requests</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Request'}
        </Button>
      </div>

      {showForm && children.length > 0 && (
        <LeaveForm children={children} onCreated={handleCreated} onCancel={() => setShowForm(false)} />
      )}

      {requests.length === 0 ? (
        <Card className="p-8">
          <EmptyState title="No leave requests" description="Submit a leave request for your child using the button above." />
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm">
                      {req.student.firstName} {req.student.lastName}
                      <span className="text-gray-400 ml-2">Roll #{req.student.rollNumber}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(req.dateFrom)} → {formatDate(req.dateTo)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{req.reason}</p>
                    {req.remarks && (
                      <p className="text-xs text-gray-400 mt-1 italic">Admin: {req.remarks}</p>
                    )}
                  </div>
                  <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold shrink-0', getStatusColor(req.status))}>
                    {req.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}



function LeaveSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-5 w-32 bg-gray-200 rounded" />
        <div className="h-8 w-28 bg-gray-200 rounded-lg" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
            <div className="h-3 w-48 bg-gray-100 rounded" />
            <div className="h-3 w-full bg-gray-100 rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
