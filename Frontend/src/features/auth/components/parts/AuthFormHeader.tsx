'use client';

interface AuthFormHeaderProps {
  title: string;
  subtitle?: string;
}

/** Shared auth form header — ek hi typography/spacing har portal form ke liye. */
export default function AuthFormHeader({ title, subtitle }: AuthFormHeaderProps) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold tracking-tight text-gray-900">{title}</h2>
      {subtitle && <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{subtitle}</p>}
    </div>
  );
}
