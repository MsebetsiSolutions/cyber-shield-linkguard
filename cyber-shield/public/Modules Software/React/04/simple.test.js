import { render } from '@testing-library/react';
import React from 'react';

describe('Diagnostic test', () => {
  test('basic addition', () => {
    expect(1 + 1).toBe(2);
  });

  test('basic rendering', () => {
    const { container } = render(<div>Test</div>);
    expect(container.textContent).toBe('Test');
  });
});