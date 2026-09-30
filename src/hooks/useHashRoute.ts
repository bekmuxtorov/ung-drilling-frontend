import { useCallback, useEffect, useState } from 'react';

const readHash = () => window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);

/** Oddiy hash-routing: `#/references/regions` → ['references', 'regions'] */
export const useHashRoute = () => {
  const [segments, setSegments] = useState<string[]>(readHash);

  useEffect(() => {
    const onChange = () => setSegments(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((path: string) => {
    window.location.hash = `/${path.replace(/^\//, '')}`;
  }, []);

  return { segments, navigate };
};
