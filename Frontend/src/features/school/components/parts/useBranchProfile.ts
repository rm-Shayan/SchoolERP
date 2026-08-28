'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { schoolService } from '@/lib/api';
import { setActiveSchool } from '@/store/slices/authSlice';
import { validateAttendanceOrder } from './attendanceTimeSlots';

/**
 * Branch profile form ka saara state + logic.
 *
 * FIX: login/auth-me snapshot mein school ke sirf kuch fields hote hain
 * (id/name/code/logo/times) — address/phone kabhi populate nahi hote the,
 * isliye form khali dikhta tha. Ab mount par poora record
 * GET /schools/:id se load hota hai.
 */
export function useBranchProfile() {
  const dispatch = useAppDispatch();
  const { school } = useAppSelector((s) => s.auth);
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [times, setTimes] = useState({
    attendanceStartTime: '07:45',
    attendanceCutoffTime: '08:30',
    attendanceAbsentTime: '10:00',
    attendanceAlertTime: '09:30',
  });
  const [bankName, setBankName] = useState('');
  const [bankAccountTitle, setBankAccountTitle] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  // Poora branch record — snapshot incomplete hota hai (upar wala FIX).
  useEffect(() => {
    if (!school?.id) return;
    let cancelled = false;
    schoolService
      .getById(school.id)
      .then((fresh) => {
        if (cancelled || !fresh) return;
        setName(fresh.name ?? '');
        setAddress(fresh.address ?? '');
        setPhone(fresh.phone ?? '');
        setLogoUrl(fresh.logoUrl ?? '');
        setTimes({
          attendanceStartTime: fresh.attendanceStartTime || '07:45',
          attendanceCutoffTime: fresh.attendanceCutoffTime || '08:30',
          attendanceAbsentTime: fresh.attendanceAbsentTime || '10:00',
          attendanceAlertTime: fresh.attendanceAlertTime || '09:30',
        });
        setBankName(fresh.bankName ?? '');
        setBankAccountTitle(fresh.bankAccountTitle ?? '');
        setBankAccountNumber(fresh.bankAccountNumber ?? '');
      })
      .catch(() => {}); // fallback: jo snapshot mojood hai wahi dikhega
    return () => { cancelled = true; };
  }, [school?.id]);

  const handleLogo = async (file: File) => {
    if (!school?.id) return;
    setUploading(true);
    try {
      const { url } = await schoolService.uploadLogo(file, school.id);
      setLogoUrl(url);
      toast.success('Logo uploaded — press Save to apply');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!school?.id) return;
    if (!name.trim()) { toast.error('Branch name is required'); return; }
    const timeError = validateAttendanceOrder(times);
    if (timeError) { toast.error(timeError); return; }

    setSaving(true);
    try {
      const updated = await schoolService.update(school.id, {
        name: name.trim(),
        address: address.trim() || undefined,
        phone: phone.trim() || undefined,
        logoUrl: logoUrl || null,
        ...times,
        bankName: bankName.trim() || null,
        bankAccountTitle: bankAccountTitle.trim() || null,
        bankAccountNumber: bankAccountNumber.trim() || null,
      });
      dispatch(setActiveSchool(updated));
      toast.success('Branch profile updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to update branch');
    } finally {
      setSaving(false);
    }
  };

  return {
    school, fileRef, saving, uploading,
    name, setName, address, setAddress, phone, setPhone, logoUrl, setLogoUrl,
    times, setTimes, handleLogo, handleSave,
    bankName, setBankName, bankAccountTitle, setBankAccountTitle, bankAccountNumber, setBankAccountNumber,
    displayLogo: logoUrl || '',
  };
}
