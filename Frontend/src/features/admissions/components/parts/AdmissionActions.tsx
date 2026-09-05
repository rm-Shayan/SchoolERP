'use client';

import { useEffect, useState } from 'react';
import { academicService } from '@/lib/api';
import type { Applicant, AdmissionStatus } from '@/types';
import { Button, Input, Select } from '@/features/shared/components';
import { getStage } from '../../utils/admissionStages';

interface AdmissionActionsProps {
  applicant: Applicant;
  busy: boolean;
  onMove: (status: AdmissionStatus, extra?: { testDate?: string; testTime?: string; testVenue?: string; testMarks?: string }) => void;
  onApprove: () => void;
  onGenerateSlip: (amount: string) => void;
  onEnroll: (sectionId: string, rollNumber: string) => void;
}

export default function AdmissionActions({
  applicant,
  busy,
  onMove,
  onApprove,
  onGenerateSlip,
  onEnroll,
}: AdmissionActionsProps) {
  const stage = getStage(applicant.status);
  const [sections, setSections] = useState<{ id: string; name: string }[]>([]);
  const [sectionId, setSectionId] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');
  const [sectionError, setSectionError] = useState('');
  const [testDate, setTestDate] = useState('');
  const [testTime, setTestTime] = useState('');
  const [testVenue, setTestVenue] = useState('');
  const [testMarks, setTestMarks] = useState('');
  const [testError, setTestError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setSections(await academicService.getSectionsByClass(applicant.classId));
      } catch {
        setSections([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicant.id]);

  const handleScheduleTest = () => {
    if (!testDate) { setTestError('Select the test date'); return; }
    setTestError('');
    onMove('TEST_SCHEDULED', { testDate, testTime: testTime || undefined, testVenue: testVenue || undefined });
  };

  const handleResult = (status: 'TEST_PASSED' | 'TEST_FAILED') => {
    onMove(status, { testMarks: testMarks || undefined });
  };

  const handleSlip = () => {
    const value = Number(amount);
    if (!amount.trim() || Number.isNaN(value)) { setAmountError('Enter the advance fee amount'); return; }
    if (value <= 0) { setAmountError('Must be greater than zero'); return; }
    setAmountError('');
    onGenerateSlip(amount);
  };

  const handleEnroll = () => {
    if (!sectionId) { setSectionError('Select a section'); return; }
    setSectionError('');
    onEnroll(sectionId, rollNumber);
  };

  return (
    <div className="pt-3 border-t border-gray-100 space-y-3">
      {stage.next.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Move to next stage</p>
          {stage.next.includes('TEST_SCHEDULED') ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input label="Test Date" type="date" value={testDate} onChange={(e) => { setTestDate(e.target.value); setTestError(''); }} error={testError} />
                <Input label="Test Time" type="time" value={testTime} onChange={(e) => setTestTime(e.target.value)} />
              </div>
              <Input label="Test Venue" placeholder="e.g. Main Campus, Room 2" value={testVenue} onChange={(e) => setTestVenue(e.target.value)} />
              <Button size="sm" loading={busy} onClick={handleScheduleTest} className="w-full">Schedule Test &amp; Email Parent</Button>
            </div>
          ) : stage.next.some((s) => s === 'TEST_PASSED' || s === 'TEST_FAILED') ? (
            <div className="space-y-2">
              <Input label="Test Marks (optional)" placeholder="e.g. 45/50" value={testMarks} onChange={(e) => setTestMarks(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => handleResult('TEST_PASSED')}>Pass</Button>
                <Button size="sm" variant="outline" disabled={busy} onClick={() => handleResult('TEST_FAILED')}>Fail</Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {stage.next.map((s) => (
                <Button key={s} size="sm" variant="outline" disabled={busy} onClick={() => onMove(s)}>
                  {s.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {applicant.status === 'FORM_SUBMITTED' && (
        <Button size="sm" loading={busy} onClick={onApprove} className="w-full">Approve Admission</Button>
      )}

      {applicant.status === 'APPROVED' && (
        <div className="space-y-2">
          <Input label="Advance Fee Amount (PKR)" type="number" value={amount} onChange={(e) => { setAmount(e.target.value); setAmountError(''); }} placeholder="e.g. 20000" error={amountError} />
          <Button size="sm" loading={busy} onClick={handleSlip} className="w-full">Record Fee &amp; Generate Receipt</Button>
        </div>
      )}

      {applicant.status === 'FEE_PENDING' && (
        <div className="space-y-2">
          <Select
            label="Section"
            options={sections.map((s) => ({ value: s.id, label: s.name }))}
            placeholder="Select section"
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              setSectionError('');
            }}
            error={sectionError}
          />
          <Input label="Roll Number (optional)" placeholder="Auto if left blank" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
          <Button size="sm" loading={busy} onClick={handleEnroll} className="w-full">Enroll &amp; Generate ID Card</Button>
        </div>
      )}

    </div>
  );
}
