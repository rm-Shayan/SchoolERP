import client from './client';

export interface LeaveRequest {
  id: string;
  studentId: string;
  parentId: string;
  schoolId: string;
  dateFrom: string;
  dateTo: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  createdAt: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    rollNumber: string;
    section?: { class?: { name: string }; name: string };
  };
  parent?: {
    id: string;
    name: string;
    phone?: string;
    whatsappNo?: string;
  };
}

export interface LeaveListResponse {
  requests: LeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const leaveService = {
  /** Parent: leave request bhejo */
  requestLeave(data: {
    studentId: string;
    dateFrom: string;
    dateTo: string;
    reason: string;
  }) {
    return client.post<{ data: LeaveRequest }>('/leave/request', data);
  },

  /** Admin: saari leave requests */
  listAll(params?: { status?: string; page?: number; limit?: number }) {
    return client.get<{ data: LeaveListResponse }>('/leave', { params });
  },

  /** Admin: approve ya reject */
  review(leaveId: string, data: { status: 'APPROVED' | 'REJECTED'; remarks?: string }) {
    return client.patch<{ data: LeaveRequest }>(`/leave/${leaveId}/review`, data);
  },

  /** Admin: create leave directly for a student */
  adminCreate(data: { studentId: string; dateFrom: string; dateTo: string; reason: string; status?: string }) {
    return client.post<{ data: LeaveRequest }>('/leave', data);
  },

  /** Admin: update a leave request */
  update(leaveId: string, data: { dateFrom?: string; dateTo?: string; reason?: string; status?: string }) {
    return client.patch<{ data: LeaveRequest }>(`/leave/${leaveId}`, data);
  },

  /** Admin: delete/cancel a leave request */
  delete(leaveId: string) {
    return client.delete(`/leave/${leaveId}`);
  },

  /** Check if student has approved leave */
  checkLeave(studentId: string, date?: string) {
    const params = date ? { date } : {};
    return client.get<{ data: { hasApprovedLeave: boolean } }>(`/leave/check/${studentId}`, { params });
  },
};
