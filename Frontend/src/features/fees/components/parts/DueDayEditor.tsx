'use client';

import { useState } from 'react';
import { Button, Card } from '@/features/shared/components';
import { getApiErrorMessage } from '@/lib/utils';
import { feeService } from '@/lib/api';
import toast from 'react-hot-toast';

interface DueDayEditorProps {
  schoolId: string;
  currentDueDay: number;
  onSaved: (dueDay: number) => void;
  onCancel: () => void;
}

const QUICK_DAYS = [5, 10, 15, 20, 25];

export default function DueDayEditor({ schoolId, currentDueDay, onSaved, onCancel }: DueDayEditorProps) {
  const [dueDay, setDueDay] = useState(currentDueDay);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!dueDay || dueDay < 1 || dueDay > 28) { toast.error('Due day must be between 1 and 28'); return; }
    setSaving(true);
    try {
      const res = await feeService.setSchoolDueDay(schoolId, dueDay);
      onSaved(res.monthlyFeeDueDay);
      toast.success(`Default due day set to ${res.monthlyFeeDueDay}th`);
    } catch (err) { toast.error(getApiErrorMessage(err, 'Failed to set due day')); }
    finally { setSaving(false); }
  };

  return (
    <Card className="relative overflow-hidden border border-primary-100/50">
      <div className="h-1 w-full bg-gradient-to-r from-primary-400 to-primary-600" />
      <div className="p-5 space-y-4">
        <div>
          <p className="text-sm font-bold text-gray-900">Default Due Day</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Next month's vouchers will use this day</p>
        </div>

        {/* Quick pick buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Quick:</span>
          {QUICK_DAYS.map((d) => (
            <button key={d} type="button" onClick={() => setDueDay(d)}
              className={`w-10 h-10 rounded-xl text-sm font-bold border transition-all duration-200 ${
                dueDay === d
                  ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-200'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:bg-primary-50'
              }`}>
              {d}
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-gray-500 mb-1.5">Or enter custom day</label>
            <input type="number" min={1} max={28} value={dueDay}
              onChange={(e) => setDueDay(Number(e.target.value))}
              className="block h-11 w-full rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-gray-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100 transition-all" />
          </div>
          <Button size="sm" loading={saving} onClick={save} className="h-11 px-6">Save</Button>
          <Button size="sm" variant="ghost" onClick={onCancel} className="h-11">Cancel</Button>
        </div>
      </div>
    </Card>
  );
}
