'use client';

import type { Socket } from 'socket.io-client';
import { store } from '@/store';
import { setSocketStatus } from '@/store/slices/socketSlice';
import { setOrgStatus, setSchoolStatus } from '@/store/slices/portalStatusSlice';
import toast from 'react-hot-toast';

const isMySchool = (payload: any) => {
  const mySchoolId = store.getState().auth.user?.schoolId;
  return Boolean(mySchoolId) && payload?.schoolId === mySchoolId;
};

export function registerSocketHandlers(s: Socket) {
  s.on('organization_blocked', () => store.dispatch(setOrgStatus('BLOCKED')));
  s.on('organization_unblocked', () => store.dispatch(setOrgStatus('ACTIVE')));

  s.on('school_blocked', (p: any) => { if (isMySchool(p)) store.dispatch(setSchoolStatus('BLOCKED')); });
  s.on('school_unblocked', (p: any) => { if (isMySchool(p)) store.dispatch(setSchoolStatus('ACTIVE')); });

  const t = (msg: string, icon?: string) => toast(msg, icon ? { icon } : undefined);
  const ts = (msg: string) => toast.success(msg);
  const on = (e: string, fn: (p: any) => void) => s.on(e, fn);

  on('fee_payment_recorded', (p) => { if (isMySchool(p)) ts(`Fee payment: ${p.studentName ?? 'Student'} — ${p.status ?? 'recorded'}`); });
  on('admission_approved', (p) => { if (isMySchool(p)) ts('Admission approved'); });
  on('admission_enrolled', (p) => { if (isMySchool(p)) ts(`${p.studentName ?? 'Student'} enrolled successfully`); });
  on('circular_created', (p) => { if (isMySchool(p)) t(`New circular: ${p.title ?? ''}`, '📢'); });
  on('homework_broadcast', (p) => { if (isMySchool(p)) t(`Homework: ${p.title ?? ''}`, '📝'); });
  on('homework_broadcast_deleted', (p) => { if (isMySchool(p)) t('Homework removed', '📝'); });
  on('exam_results_published', (p) => { if (isMySchool(p)) ts('Exam results published'); });
  on('leave_request_created', (p) => { if (isMySchool(p)) t(`Leave request from ${p.studentName ?? 'student'}`, '📋'); });
  on('leave_request_reviewed', (p) => { if (isMySchool(p)) ts(`Leave ${p.status ?? 'reviewed'}`); });
  on('conduct_remark', (p) => { if (isMySchool(p)) t(`Conduct remark: ${p.studentName ?? 'student'}`, '📝'); });
  on('fees_generated', (p) => { if (isMySchool(p)) ts(`${p.count ?? ''} fee records generated`); });
  on('promotions_created', (p) => { if (isMySchool(p)) ts(`${p.count ?? ''} students promoted`); });
  on('ptm_created', (p) => { if (isMySchool(p)) ts(`PTM session created (${p.notifiedParents ?? 0} parents notified)`); });
  on('ptm_updated', (p) => { if (isMySchool(p)) t('PTM session updated', '📅'); });
  on('ptm_deleted', (p) => { if (isMySchool(p)) t('PTM session cancelled', '📅'); });
  on('student_status_changed', (p) => { if (isMySchool(p)) t(`${p.studentName ?? 'Student'}: ${p.status ?? 'status changed'}`); });
  on('timetable_slot_created', (p) => { if (isMySchool(p)) t('Timetable slot added', '📅'); });
  on('timetable_slot_updated', (p) => { if (isMySchool(p)) t('Timetable slot updated', '📅'); });
  on('timetable_slot_deleted', (p) => { if (isMySchool(p)) t('Timetable slot removed', '📅'); });
  on('timetable_cleared', (p) => { if (isMySchool(p)) t(`${p.deletedCount ?? 0} timetable slot(s) cleared`, '📅'); });
  on('staff_leave_request_created', (p) => { if (isMySchool(p)) t(`Staff leave request: ${p.staffName ?? 'staff'}`, '📋'); });
  on('staff_leave_request_reviewed', (p) => { if (isMySchool(p)) ts(`Staff leave ${p.status ?? 'reviewed'}`); });
  on('staff_attendance_marked', (p) => { if (isMySchool(p)) t('Staff attendance marked', '✅'); });
  on('assignment_updated', (p) => { if (isMySchool(p)) t('Teaching assignment updated', '👤'); });
  on('overview_updated', () => store.dispatch(setSocketStatus('connected')));
}
