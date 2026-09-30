import React from 'react';
import { REFERENCE_MAP, REFERENCES, isReferenceKey } from './config';
import { ReferenceTablePanel } from './ReferenceTablePanel';

export const ReferencesPage: React.FC<{ activeKey?: string }> = ({ activeKey }) => {
  const config = isReferenceKey(activeKey) ? REFERENCE_MAP[activeKey] : REFERENCES[0];
  return <ReferenceTablePanel key={config.key} config={config} />;
};
