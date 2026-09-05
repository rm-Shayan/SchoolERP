'use client';

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './baseQuery';

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithAuth,
  tagTypes: [
    'Timetable', 'TeachingAssignment', 'Homework', 'Staff',
    'Academic', 'Notification', 'PTM', 'Conduct', 'Exam',
    'Attendance', 'Me', 'Student', 'Fee', 'Admission',
    'Circular', 'Org', 'School', 'Moderation', 'Audit',
    'StaffLeave', 'StaffAttendance', 'Leave', 'SMTP',
    'Storage', 'Promotion', 'Activity',
  ],
  endpoints: () => ({}),
});
