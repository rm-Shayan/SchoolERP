'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { staffService, schoolService, orgService } from '@/lib/api';
import { useForm } from '@/lib/utils';
import toast from 'react-hot-toast';
import type { Organization, School } from '@/types';

export interface CreateUserValues {
  [key: string]: unknown;
  name: string; email: string; password: string; phone: string;
  role: string; organizationId: string; schoolId: string;
  firstName: string; lastName: string; rollNumber: string;
  parentName: string; parentWhatsappNo: string; sectionId: string;
  teacherClassId: string; teacherSectionId: string; teacherSubjectId: string;
  smtpUsername: string; smtpPassword: string;
  cloudName: string; cloudApiKey: string; cloudApiSecret: string;
}

const INITIAL: CreateUserValues = {
  name: '', email: '', password: '', phone: '', role: 'TEACHER',
  organizationId: '', schoolId: '', firstName: '', lastName: '',
  rollNumber: '', parentName: '', parentWhatsappNo: '', sectionId: '',
  teacherClassId: '', teacherSectionId: '', teacherSubjectId: '',
  smtpUsername: '', smtpPassword: '', cloudName: '', cloudApiKey: '', cloudApiSecret: '',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateFields(role: string, v: CreateUserValues): Record<string, string> {
  const e: Record<string, string> = {};
  if (!role) e.role = 'Role is required';
  if (role === 'STUDENT') { if (!v.rollNumber?.trim()) e.rollNumber = 'Roll number is required'; return e; }
  if (!v.name?.trim()) e.name = 'Name is required';
  if (!v.email?.trim()) e.email = 'Email is required';
  else if (!EMAIL_RE.test(v.email.trim())) e.email = 'Enter a valid email';
  if (role === 'ADMIN') {
    if (!v.smtpUsername?.trim()) e.smtpUsername = 'SMTP email is required';
    else if (!EMAIL_RE.test(v.smtpUsername.trim())) e.smtpUsername = 'Enter a valid email';
    if (!v.smtpPassword?.trim()) e.smtpPassword = 'App Password is required';
    if (!v.cloudName?.trim()) e.cloudName = 'Cloud Name is required';
    if (!v.cloudApiKey?.trim()) e.cloudApiKey = 'API Key is required';
    if (!v.cloudApiSecret?.trim()) e.cloudApiSecret = 'API Secret is required';
  }
  if (role === 'TEACHER') { if (!v.schoolId) e.schoolId = 'Branch is required'; if (!v.teacherClassId) e.teacherClassId = 'Class is required'; }
  return e;
}

export function useCreateUserForm(onCreated: () => void) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [orgsLoading, setOrgsLoading] = useState(false);
  const [schoolsLoading, setSchoolsLoading] = useState(false);
  const [portalPwd, setPortalPwd] = useState<string | null>(null);
  const [portalPwdLoading, setPortalPwdLoading] = useState(false);
  const portalPwdRef = useRef<string | null>(null);
  portalPwdRef.current = portalPwd;

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, setValue, setErrors } = useForm<CreateUserValues>({
    initialValues: INITIAL,
    validators: {},
    onSubmit: async (v) => {
      const errs = validateFields(v.role, v);
      if (Object.keys(errs).length > 0) { setErrors(errs); return; }
      const role = v.role; const isStudent = role === 'STUDENT';
      let password = v.password;
      if (!isStudent && portalPwdRef.current) password = portalPwdRef.current;
      try {
        if (isStudent) {
          await staffService.createStudent({
            schoolId: v.schoolId, firstName: v.firstName || v.name.split(' ')[0],
            lastName: v.lastName || v.name.split(' ').slice(1).join(' ') || '',
            rollNumber: v.rollNumber, sectionId: v.sectionId || undefined,
            parentName: v.parentName || undefined, parentWhatsappNo: v.parentWhatsappNo || undefined,
          });
          toast.success('Student account created');
        } else {
          const payload: Record<string, unknown> = {
            name: v.name, email: v.email, password: password || undefined,
            phone: v.phone?.trim() || undefined, role,
            organizationId: v.organizationId || undefined, schoolId: v.schoolId || undefined,
          };
          if (role === 'TEACHER') { payload.teacherClassId = v.teacherClassId || undefined; payload.teacherSectionId = v.teacherSectionId || undefined; payload.teacherSubjectId = v.teacherSubjectId || undefined; }
          if (role === 'ADMIN') {
            const su = v.smtpUsername?.trim(); const sp = v.smtpPassword?.replace(/\s+/g, '');
            if (su && sp) payload.smtp = { host: 'smtp.gmail.com', port: 587, secure: false, username: su.toLowerCase(), password: sp };
            const cn = v.cloudName?.trim(); const ck = v.cloudApiKey?.trim(); const cs = v.cloudApiSecret?.trim();
            if (cn && ck && cs) payload.cloudinary = { cloudName: cn, apiKey: ck, apiSecret: cs };
          }
          await staffService.create(payload as any);
          toast.success('Staff account created — credentials will be emailed');
        }
        setErrors({}); onCreated();
      } catch (err: any) { toast.error(err?.response?.data?.message ?? 'Failed to create'); }
    },
  });

  useEffect(() => {
    const orgId = values.organizationId;
    if (!orgId) { setSchools([]); return; }
    setSchoolsLoading(true);
    schoolService.getAll(orgId).then(setSchools).catch(() => setSchools([])).finally(() => setSchoolsLoading(false));
  }, [values.organizationId]);

  const role = values.role; const isAdmin = role === 'ADMIN'; const isTeacher = role === 'TEACHER'; const isStudent = role === 'STUDENT';

  useEffect(() => {
    if (isAdmin) setValue('schoolId', '');
    if (!isTeacher) { setValue('teacherClassId', ''); setValue('teacherSectionId', ''); setValue('teacherSubjectId', ''); }
    setErrors({});
  }, [isAdmin, isTeacher, setValue, setErrors]);

  const fetchPortalPwd = useCallback(async (sid: string) => {
    if (!sid) { setPortalPwd(null); return; }
    setPortalPwdLoading(true);
    try { const s = await schoolService.getPortalPasswordStatus(sid); setPortalPwd(s.hasCustomPassword ? s.schoolCode : null); }
    catch { setPortalPwd(null); } finally { setPortalPwdLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAdmin && values.schoolId) fetchPortalPwd(values.schoolId); else setPortalPwd(null);
  }, [values.schoolId, isAdmin, fetchPortalPwd]);

  const loadOrgs = useCallback((open: boolean) => {
    if (!open) return;
    setOrgsLoading(true);
    orgService.getAll().then(setOrgs).catch(() => toast.error('Failed to load organizations')).finally(() => setOrgsLoading(false));
  }, []);

  const needsBranch = !isAdmin;
  return { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit, setValue, orgs, schools, orgsLoading, schoolsLoading, portalPwd, portalPwdLoading, role, isAdmin, isTeacher, isStudent, needsBranch, loadOrgs };
}
