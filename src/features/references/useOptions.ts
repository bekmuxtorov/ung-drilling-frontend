import { useEffect, useState } from 'react';
import type { ReferenceKey } from './config';
import { loadOptions, type Option } from './api';

export const useOptions = (key: ReferenceKey | undefined, version = 0) => {
  const [state, setState] = useState<{ options: Option[]; loading: boolean; error: boolean }>({
    options: [],
    loading: !!key,
    error: false,
  });

  useEffect(() => {
    if (!key) return;
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: false }));
    loadOptions(key)
      .then((options) => active && setState({ options, loading: false, error: false }))
      .catch(() => active && setState({ options: [], loading: false, error: true }));
    return () => {
      active = false;
    };
  }, [key, version]);

  return state;
};
