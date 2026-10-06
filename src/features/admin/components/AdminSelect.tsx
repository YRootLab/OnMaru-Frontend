'use client';

import React from 'react';
import { ChevronDownIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { meok } from '@/design-system/tokens';

export function AdminSelect({ style, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <select
        {...props}
        style={{
          height: '38px',
          paddingLeft: '12px',
          paddingRight: '40px',
          borderRadius: '8px',
          border: '1px solid rgba(78, 89, 104, 0.18)',
          fontSize: '13px',
          color: meok[700],
          backgroundColor: '#FFFFFF',
          outline: 'none',
          appearance: 'none',
          WebkitAppearance: 'none',
          cursor: props.disabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
      />
      <span
        data-testid="admin-select-chevron"
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: '12px',
          display: 'inline-flex',
          pointerEvents: 'none',
          color: meok[600],
        }}
      >
        <HugeiconsIcon icon={ChevronDownIcon} size={16} strokeWidth={2} />
      </span>
    </span>
  );
}
