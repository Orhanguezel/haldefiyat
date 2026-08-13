"use client";

import { Combobox } from "./Combobox";

type Option = { value: string; label: string };

interface SearchableSelectProps {
  label?: string;
  placeholder?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Geriye uyumlu ad. Arama, klavye, label/hint/error ve ARIA davranışı artık
 * tek Combobox uygulamasından gelir; ikinci bir select davranışı tutulmaz.
 */
export function SearchableSelect({
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
  hint,
  required,
  disabled,
}: SearchableSelectProps) {
  return (
    <Combobox
      label={label}
      placeholder={placeholder}
      options={options}
      value={value || null}
      onChange={(next) => onChange(next ?? "")}
      error={error}
      hint={hint}
      required={required}
      disabled={disabled}
    />
  );
}
