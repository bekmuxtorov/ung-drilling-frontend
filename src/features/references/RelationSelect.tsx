import React from 'react';
import type { ReferenceKey } from './config';
import { useOptions } from './useOptions';
import { SearchableSelect } from '../../components/ui/SearchableSelect';

interface RelationSelectProps {
  reference: ReferenceKey;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  id?: string;
  disabled?: boolean;
  error?: boolean;
}

/** Ma'lumotnomadan qiymat qidirish va tanlash (barcha yozuvlar keshlangan holda yuklanadi) */
export const RelationSelect: React.FC<RelationSelectProps> = ({
  reference,
  placeholder,
  value,
  onChange,
  id,
  disabled,
  error,
}) => {
  const { options, loading } = useOptions(reference);

  return (
    <SearchableSelect
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      loading={loading}
      disabled={disabled}
      error={error}
    />
  );
};
