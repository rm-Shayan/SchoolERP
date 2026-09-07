'use client';

import { useBranchProfile } from './useBranchProfile';
import { Button, Input } from '@/features/shared/components';
import { LogoUpload } from './LogoUpload';
import { cn } from '@/lib/utils';
import { TIME_SLOTS } from './attendanceTimeSlots';

export function BranchProfileForm() {
  const {
    school, fileRef, saving, uploading,
    name, setName, address, setAddress, phone, setPhone,
    logoUrl, setLogoUrl, times, setTimes, handleLogo, handleSave,
    bankName, setBankName, bankAccountTitle, setBankAccountTitle, bankAccountNumber, setBankAccountNumber,
  } = useBranchProfile();

  if (!school) return null;
  // Show organization logo as default when branch has no logo
  const displayLogo = logoUrl || school.logoUrl || '';

  return (
    <div className="max-w-3xl space-y-6">
      <LogoUpload
        logoUrl={displayLogo}
        name={name || 'Branch'}
        uploading={uploading}
        fileRef={fileRef}
        onChange={(file) => file && handleLogo(file)}
        onRemove={() => setLogoUrl('')}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Branch Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Input label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />

      {/* Bank Details — printed on this branch's fee vouchers */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50/60 to-white p-5">
        <h3 className="text-sm font-bold text-gray-900 mb-1">Bank Details (optional)</h3>
        <p className="text-xs text-gray-400 mb-4">
          This account will be printed on fee vouchers. If left blank, the organization default will be used.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Bank Name" placeholder="e.g. Meezan Bank" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <Input label="Account Number / IBAN" placeholder="e.g. PK00MEZN0000000000000000" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} />
        </div>
        <Input className="mt-4" label="Account Title" placeholder="Account holder name" value={bankAccountTitle} onChange={(e) => setBankAccountTitle(e.target.value)} />
      </div>

      {/* Attendance Timing Rules */}
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50/60 to-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Attendance Timing Rules</h3>
            <p className="text-xs text-gray-400">Saved values shown below — auto-marking jobs use these</p>
          </div>
        </div>

        {/* Visual timeline of saved times */}
        <div className="mb-5 flex items-center px-1">
          {TIME_SLOTS.map((slot, i) => (
            <div key={slot.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn('h-3 w-3 rounded-full ring-4 ring-white shadow-sm', slot.color)} />
                <span className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  {times[slot.key] || slot.defaultVal}
                </span>
              </div>
              {i < TIME_SLOTS.length - 1 && <div className="mx-1 h-0.5 flex-1 rounded-full bg-gray-200" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TIME_SLOTS.map((slot) => (
            <div key={slot.key} className="rounded-xl border border-gray-200 bg-white p-3.5">
              <div className="mb-2 flex items-center gap-2">
                <span className={cn('h-2.5 w-2.5 rounded-full', slot.color)} />
                <label className="text-xs font-bold text-gray-700">{slot.label}</label>
              </div>
              <Input
                type="time"
                value={times[slot.key]}
                onChange={(e) => setTimes((p) => ({ ...p, [slot.key]: e.target.value }))}
              />
              <p className="mt-1.5 text-[11px] text-gray-400">{slot.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">Order required: Start &lt; Late Cutoff ≤ Alert ≤ Absent</p>
      </div>

      <div className="flex gap-3 pt-1">
        <Button loading={saving} onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
