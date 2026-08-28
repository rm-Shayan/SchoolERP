import client from './client';

export interface StaffLeaveRequest {
  id: string;
  staffId: string;
  schoolId: string;
  date: string;
  dateTo?: string;
  leaveType: string;
  reason?: string;
  status: 'PENDING_LEAVE' | 'APPROVED_LEAVE' | 'REJECTED_LEAVE' | 'LEAVE';
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
  createdAt: string;
  staff?: {
    id: string;
    name: string;
    email: string;
    role: string;
    username?: string;
  };
  reviewer?: { name: string };
}

export interface StaffLeaveListResponse {
  requests: StaffLeaveRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const staffLeaveService = {
  requestLeave(data: {
    dateFrom: string;
    dateTo: string;
    leaveType?: string;
    reason: string;
  }) {
    return client.post<{ data: StaffLeaveRequest }>('/staff-leave/request', data);
  },

  listAll(params?: { status?: string; staffId?: string; page?: number; limit?: number }) {
    return client.get<{ data: StaffLeaveListResponse }>('/staff-leave', { params });
  },

  review(leaveId: string, data: { status: 'APPROVED_LEAVE' | 'REJECTED_LEAVE'; remarks?: string }) {
    return client.patch<{ data: StaffLeaveRequest }>(`/staff-leave/${leaveId}/review`, data);
  },

  adminCreate(data: { staffId: string; dateFrom: string; dateTo: string; leaveType?: string; reason: string; status?: string }) {
    return client.post<{ data: StaffLeaveRequest }>('/staff-leave', data);
  },

  delete(leaveId: string) {
    return client.delete(`/staff-leave/${leaveId}`);
  },

  getMyLeaves(params?: { status?: string; page?: number; limit?: number }) {
    return client.get<{ data: StaffLeaveListResponse }>('/staff-leave/my', { params });
  },
};
