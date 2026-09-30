import React from 'react';
import { ChevronDown } from 'lucide-react';
import type { ReferenceKey } from './config';
import { useOptions } from './useOptions';

interface RelationSelectProps {
  reference: ReferenceKey;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  error?: boolean;
}

/** Ma'lumotnomadan qiymat tanlash (barcha yozuvlar keshlangan holda yuklanadi) */
export const RelationSelect: React.FC<RelationSelectProps> = ({ reference, placeholder, value, onChange, id, disabled, error }) => {
  const { options, loading } = useOptions(reference);
  return (
    <div className="select-wrap">
      <select
        id={id}
        className={`input ${error ? 'input--error' : ''} ${value ? '' : 'input--placeholder'}`}
        value={value}
        disabled={disabled || loading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{loading ? 'Yuklanmoqda…' : placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="select-wrap__chevron" />
    </div>
  );
};
