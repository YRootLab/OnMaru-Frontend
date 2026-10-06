// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AdminSelect } from './AdminSelect';

describe('AdminSelect', () => {
  it('reserves equal 12px leading and trailing spacing around its content', () => {
    render(
      <AdminSelect aria-label="역할 필터" defaultValue="ALL">
        <option value="ALL">전체 역할</option>
      </AdminSelect>,
    );

    const select = screen.getByRole('combobox', { name: '역할 필터' });
    const chevron = screen.getByTestId('admin-select-chevron');

    expect(select.style.paddingLeft).toBe('12px');
    expect(select.style.paddingRight).toBe('40px');
    expect(chevron.style.right).toBe('12px');
  });
});
