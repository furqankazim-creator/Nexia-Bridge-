import React from 'react';

/**
 * Exact 6-bar stacked clinical equalizer/sheet icon
 * matching client screenshots across clinical navigation and SOAP notes.
 */
export const ClinicalBarIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg 
    className={className} 
    viewBox="0 0 20 20" 
    fill="currentColor"
    aria-hidden="true"
  >
    <rect x="2" y="2" width="16" height="1.8" rx="0.9" />
    <rect x="2" y="5.2" width="16" height="1.8" rx="0.9" />
    <rect x="2" y="8.4" width="16" height="1.8" rx="0.9" />
    <rect x="2" y="11.6" width="16" height="1.8" rx="0.9" />
    <rect x="2" y="14.8" width="16" height="1.8" rx="0.9" />
    <rect x="2" y="18" width="16" height="1.8" rx="0.9" />
  </svg>
);

