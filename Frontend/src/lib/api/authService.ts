import api from './client';
import type { ApiResponse, AuthResponse, LoginRequest, User } from '@/types';


export const authService = {
  // Staff Auth
  async login(data: LoginRequest): Promise<AuthResponse> {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data.data;
  },
  async getMe(): Promise<User> {
    const res = await api.get<ApiResponse<User>>('/auth/me');
    return res.data.data;
  },
  async updateMe(data: { name: string; phone?: string }): Promise<User> {
    const res = await api.patch<ApiResponse<User>>('/auth/me', data);
    return res.data.data;
  },
  async uploadAvatar(file: File): Promise<User> {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post<ApiResponse<User>>('/auth/me/avatar', form);
    return res.data.data;
  },
  async logout(refreshToken: string) {
    await api.post('/auth/logout', { refreshToken });
  },
  async logoutAll() {
    await api.post('/auth/logout-all');
  },
  async changePassword(data: { oldPassword: string; newPassword: string }) {
    const res = await api.post<ApiResponse<boolean>>('/auth/change-password', data);
    return res.data.data;
  },
  async forgotPassword(email: string): Promise<boolean> {
    const res = await api.post<ApiResponse<{ sent: boolean }>>('/auth/forgot-password', { email });
    return res.data.data.sent;
  },

  // Staff user management (CRUD / import / reset password) lives in staffService.

  // Parent Portal OTP Auth
  async parentRequestOtp(whatsappNo: string): Promise<{ message: string; parentName: string; devOtp?: string }> {
    const res = await api.post<ApiResponse<{ message: string; parentName: string; devOtp?: string }>>('/auth/parent/request-otp', { whatsappNo });
    return res.data.data;
  },
  async parentVerifyOtp(whatsappNo: string, otp: string): Promise<{ token: string; parent: any }> {
    const res = await api.post<ApiResponse<{ token: string; parent: any }>>('/auth/parent/verify-otp', { whatsappNo, otp });
    return res.data.data;
  },
  async parentGetMe(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/auth/parent/me');
    return res.data.data;
  },

  // Student Portal Auth (Direct & OTP)
  async studentDirectLogin(schoolCode: string, rollNumber: string, password: string): Promise<{ token: string; student: any }> {
    const res = await api.post<ApiResponse<{ token: string; student: any }>>('/auth/student/login', { schoolCode, rollNumber, password });
    return res.data.data;
  },
  async studentRequestOtp(payload: { schoolCode?: string; rollNumber?: string; identifierCode?: string }): Promise<{ message: string; devOtp?: string }> {
    const res = await api.post<ApiResponse<{ message: string; devOtp?: string }>>('/auth/student/request-otp', payload);
    return res.data.data;
  },
  async studentVerifyOtp(payload: { schoolCode?: string; rollNumber?: string; identifier: string; otp: string }): Promise<{ token: string; student: any }> {
    const res = await api.post<ApiResponse<{ token: string; student: any }>>('/auth/student/verify-otp', payload);
    return res.data.data;
  },
  async studentGetMe(): Promise<any> {
    const res = await api.get<ApiResponse<any>>('/auth/student/me');
    return res.data.data;
  },
};

