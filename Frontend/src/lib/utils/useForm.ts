'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { type Validator } from './validation';

type Errors = Record<string, string>;

export interface UseFormArgs<T> {
  initialValues: T;
  validators?: Partial<Record<keyof T, Validator>>;
  onSubmit: (values: T) => void | Promise<void>;
}

export function useForm<T extends object>({ initialValues, validators = {}, onSubmit }: UseFormArgs<T>) {
  const initialValuesRef = useRef(initialValues);
  // Keep the ref in sync so reset() always restores the latest initial
  // values (e.g. when the parent loads fresh data after mount).
  useEffect(() => {
    initialValuesRef.current = initialValues;
  }, [initialValues]);
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const onSubmitRef = useRef(onSubmit);
  onSubmitRef.current = onSubmit;

  const validateField = useCallback(
    (name: string, value: unknown, all: T) => {
      const fn = validators[name as keyof T];
      return fn ? fn(value, all as Record<string, unknown>) : undefined;
    },
    [validators]
  );

  const validateAll = useCallback(
    (v: T) => {
      const next: Errors = {};
      (Object.keys(validators) as Array<keyof T>).forEach((name) => {
        const msg = validateField(name as string, v[name], v);
        if (msg) next[name as string] = msg;
      });
      return next;
    },
    [validateField, validators]
  );

  const setValue = useCallback((name: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [name]: value }) as T);
    setErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    const value = type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setValues((prev) => ({ ...prev, [name]: value }) as T);
  }, []);

  const handleBlur = useCallback(
    (name: string) => {
      const msg = validateField(name, values[name as keyof T], values);
      setErrors((prev) => (msg ? { ...prev, [name]: msg } : { ...prev, [name]: '' }));
    },
    [validateField, values]
  );

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const nextErrors = validateAll(values);
      setErrors(nextErrors);
      if (Object.keys(nextErrors).length > 0) return;
      setIsSubmitting(true);
      try {
        await onSubmitRef.current(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateAll, values]
  );

  const reset = useCallback(() => {
    setValues(initialValuesRef.current);
    setErrors({});
  }, []);

  return {
    values,
    errors,
    isSubmitting,
    setValue,
    setErrors,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
  };
}
