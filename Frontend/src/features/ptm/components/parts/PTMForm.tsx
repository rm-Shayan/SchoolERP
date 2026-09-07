'use client';

import { useState } from 'react';
import { useForm, required } from '@/lib/utils';
import { ptmService } from '@/lib/api/ptmService';
import type { PTMEvent, PTMScope } from '@/lib/api/ptmService';
import type { Class } from '@/lib/api/academicService';
import type { School } from '@/types';
import { Modal, Input, Button } from '@/features/shared/components';
import toast from 'react-hot-toast';
import PTMScopeChips from './PTMScopeChips';
import PTMAudienceFields from './PTMAudienceFields';
import PTMTeacherPicker from './PTMTeacherPicker';
import { EMPTY_AUDIENCE, validateAudience, type AudienceValue } from './ptmFormTypes';

interface PTMFormProps {
  open: boolean;
  schoolId: string;
  school?: School | null;
  classes: Class[];
  session?: PTMEvent | null;
  onClose: () => void;
  onSaved: () => void;
}

function toDatetimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function audienceFromSession(s: PTMEvent): AudienceValue {
  return {
    ...EMPTY_AUDIENCE,
    classFromId: s.classIds[0] ?? '',
    classToId: s.classIds[s.classIds.length - 1] ?? '',
    sectionIds: s.sectionIds,
    student: s.studentId ? { id: s.studentId, label: s.scopeLabel?.replace(/^Student:\s*/, '') ?? '' } : null,
  };
}

export default function PTMForm({ open, schoolId, school, classes, session, onClose, onSaved }: PTMFormProps) {
  const isEdit = Boolean(session);
  const [scope, setScope] = useState<PTMScope>(session?.scope ?? 'WHOLE_SCHOOL');
  const [audience, setAudience] = useState<AudienceValue>(session ? audienceFromSession(session) : EMPTY_AUDIENCE);
  const [teacherIds, setTeacherIds] = useState<string[]>(session?.teachers.map((t) => t.id) ?? []);
  const [scopeError, setScopeError] = useState<string | null>(null);

  const { values, errors, isSubmitting, handleChange, handleBlur, handleSubmit } = useForm({
    initialValues: {
      title: session?.title ?? '',
      scheduledAt: session ? toDatetimeLocal(session.scheduledAt) : '',
      location: session?.venue ?? school?.address ?? '',
    },
    validators: {
      title: required('Session title is required'),
      scheduledAt: required('Date & time is required'),
    },
    onSubmit: async (v) => {
      const invalid = validateAudience(scope, audience);
      if (invalid) { setScopeError(invalid); return; }
      setScopeError(null);
      try {
        const payload = {
          title: v.title as string,
          scheduledAt: new Date(v.scheduledAt as string).toISOString(),
          venue: (v.location as string).trim() || undefined,
          scope,
          classFromId: scope === 'CLASS_RANGE' ? audience.classFromId : undefined,
          classToId: scope === 'CLASS_RANGE' ? audience.classToId : undefined,
          // CLASS_RANGE: sectionIds are an optional narrowing (single-class scenario)
          sectionIds: scope === 'SECTIONS' || scope === 'CLASS_RANGE' ? audience.sectionIds : [],
          studentId: scope === 'STUDENT' ? audience.student!.id : undefined,
          teacherIds,
        };
        if (isEdit && session) await ptmService.update(session.id, payload);
        else await ptmService.create(schoolId, payload);
        toast.success(isEdit ? 'PTM updated' : 'PTM scheduled — parents will be notified');
        onSaved();
      } catch (err: any) {
        toast.error(err?.response?.data?.message ?? `Failed to ${isEdit ? 'update' : 'schedule'} PTM`);
      }
    },
  });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit PTM Session' : 'Schedule PTM Session'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary-600">Meeting details</p>
          <Input label="Session Title" name="title" placeholder="e.g. Mid-Term Parent Meeting"
          value={values.title as string} onChange={handleChange} onBlur={() => handleBlur('title')} error={errors.title} required />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Date & Time" name="scheduledAt" type="datetime-local"
            className="min-w-0" value={values.scheduledAt as string} onChange={handleChange} onBlur={() => handleBlur('scheduledAt')} error={errors.scheduledAt} required />
          <Input label="Venue (optional)" name="location" placeholder="e.g. Main Hall"
            value={values.location as string} onChange={handleChange} />
        </div>

        <section className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:p-5 space-y-4">
          <div>
            <p className="text-sm font-bold text-gray-900">Audience</p>
            <p className="mt-0.5 text-xs text-gray-500">Choose who should receive this meeting invite.</p>
          </div>
          <PTMScopeChips value={scope} onChange={(s) => { setScope(s); setScopeError(null); }} />
          <div className="border-t border-gray-200 pt-4">
            <PTMAudienceFields schoolId={schoolId} classes={classes} scope={scope} value={audience}
              onChange={(patch) => setAudience((prev) => ({ ...prev, ...patch }))} />
          </div>
        </section>
        <section className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
          <div className="mb-3">
            <p className="text-sm font-bold text-gray-900">Staff support <span className="font-normal text-gray-400">(optional)</span></p>
            <p className="mt-0.5 text-xs text-gray-500">Add teachers who will attend this PTM.</p>
          </div>
          <PTMTeacherPicker schoolId={schoolId} value={teacherIds} onChange={setTeacherIds} />
        </section>

        {scopeError && <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{scopeError}</p>}
        <div className="sticky bottom-0 -mx-5 flex flex-col-reverse gap-2 border-t border-gray-200 bg-white/95 px-5 pb-1 pt-3 backdrop-blur sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">
          <Button type="submit" loading={isSubmitting}>{isEdit ? 'Save Changes' : 'Schedule'}</Button>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
