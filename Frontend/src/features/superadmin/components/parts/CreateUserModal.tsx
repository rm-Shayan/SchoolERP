'use client';

import { useEffect } from 'react';
import { Modal, Input, Select, Button } from '@/features/shared/components';
import { getRoleLabel } from '@/lib/utils';
import StudentFields from './StudentFields';
import TeacherAssignmentFields from './TeacherAssignmentFields';
import AdminIntegrationFields from './AdminIntegrationFields';
import { useCreateUserForm } from './useCreateUserForm';

const ROLES = ['ADMIN', 'TEACHER', 'RECEPTIONIST', 'STUDENT'];

interface Props { open: boolean; onClose: () => void; onCreated: () => void; }

export default function CreateUserModal({ open, onClose, onCreated }: Props) {
  const f = useCreateUserForm(onCreated);
  useEffect(() => { if (open) f.loadOrgs(open); }, [open, f.loadOrgs]);

  return (
    <Modal open={open} onClose={onClose} title="Create User" size="md">
      <form onSubmit={f.handleSubmit} className="space-y-4">
        <Select label="Role" name="role" options={ROLES.map((r) => ({ value: r, label: getRoleLabel(r) }))}
          value={f.role} onChange={f.handleChange} error={f.errors.role} />

        {!f.isStudent && (
          <>
            <Input label="Full Name" name="name" placeholder="e.g. Ayesha Khan"
              value={f.values.name} onChange={f.handleChange} onBlur={() => f.handleBlur('name')} error={f.errors.name} required />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Email" name="email" type="email" placeholder="staff@school.com"
                value={f.values.email} onChange={f.handleChange} onBlur={() => f.handleBlur('email')} error={f.errors.email} required />
              <Input label="Phone" name="phone" placeholder="0300 1234567"
                value={f.values.phone} onChange={f.handleChange} onBlur={() => f.handleBlur('phone')} error={f.errors.phone} />
            </div>
          </>
        )}

        {f.isStudent && <StudentFields values={f.values} errors={f.errors} onChange={f.handleChange} />}

        {!f.isStudent && (
          <>
            <Select label={`Organization${f.isAdmin ? ' (optional)' : ''}`} name="organizationId"
              placeholder={f.orgsLoading ? 'Loading…' : 'Select organization'}
              options={f.orgs.map((o) => ({ value: o.id, label: o.name }))}
              value={f.values.organizationId} onChange={f.handleChange} error={!f.isAdmin ? f.errors.organizationId : undefined} />
            <Select label={`Branch${f.isAdmin ? ' (optional)' : (f.isTeacher ? ' *' : '')}`} name="schoolId"
              placeholder={!f.values.organizationId ? 'Select org first' : f.schoolsLoading ? 'Loading…' : 'Select branch'}
              options={f.schools.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }))}
              value={f.values.schoolId} onChange={f.handleChange}
              error={f.needsBranch ? f.errors.schoolId : undefined} disabled={!f.values.organizationId} />
            {f.isAdmin && <p className="text-xs text-gray-500 -mt-2">Admin users can be org-level (no branch needed).</p>}
          </>
        )}

        {f.isTeacher && f.values.schoolId && (
          <TeacherAssignmentFields schoolId={f.values.schoolId} values={f.values} errors={f.errors} onChange={f.handleChange as any} />
        )}

        {f.isAdmin && <AdminIntegrationFields values={f.values} errors={f.errors} onChange={f.handleChange} onBlur={f.handleBlur} />}

        {!f.isAdmin && !f.isStudent && (f.portalPwd !== null ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700 font-medium">Portal password will be used</p>
            <p className="text-xs text-green-600 mt-0.5">This branch has a portal password set.</p>
          </div>
        ) : (
          <Input label="Temporary Password" name="password" type="password" placeholder="System generated if left blank"
            value={f.values.password} onChange={f.handleChange} onBlur={() => f.handleBlur('password')} error={f.errors.password} />
        ))}

        {f.isStudent && (f.portalPwd !== null ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-3">
            <p className="text-sm text-green-700 font-medium">Portal password will be used</p>
            <p className="text-xs text-green-600 mt-0.5">Students will use the branch portal password to login.</p>
          </div>
        ) : (
          <Input label="Student Password" name="password" type="password" placeholder="Enter student portal password"
            value={f.values.password} onChange={f.handleChange} onBlur={() => f.handleBlur('password')} error={f.errors.password} />
        ))}

        {f.isAdmin && (
          <Input label="Admin Password" name="password" type="password" placeholder="Min 5 characters"
            value={f.values.password} onChange={f.handleChange} onBlur={() => f.handleBlur('password')} error={f.errors.password} />
        )}

        {f.portalPwdLoading && <p className="text-xs text-gray-400">Checking portal password…</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" loading={f.isSubmitting}>{f.isStudent ? 'Add Student' : 'Create User'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
