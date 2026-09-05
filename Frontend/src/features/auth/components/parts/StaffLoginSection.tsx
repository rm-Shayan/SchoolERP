'use client';

import LoginCard from '@/features/auth/components/LoginCard';
import AuthFormHeader from './AuthFormHeader';
import type { SchoolBranding } from '@/types';

interface StaffLoginSectionProps {
  branding: SchoolBranding | null;
  onBrandingChange: (branding: SchoolBranding | null) => void;
  school?: string;
  branch?: string;
}

export default function StaffLoginSection({ branding, onBrandingChange, school, branch }: StaffLoginSectionProps) {
  return (
    <div>
      <AuthFormHeader
        title="Staff Portal"
        subtitle="Sign in with your school code and the credentials shared by the office."
      />
      <LoginCard branding={branding} onBrandingChange={onBrandingChange} school={school} branch={branch} hideHeading />
    </div>
  );
}
