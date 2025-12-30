import React from 'react';
import { render, screen } from '@testing-library/react';
import NetflixPremiumVideoPlayer from './NetflixPremiumVideoPlayer';

test('debug - see what buttons exist', () => {
  render(<NetflixPremiumVideoPlayer />);
  
  // List all buttons
  const buttons = screen.getAllByRole('button');
  console.log('Buttons found:', buttons.length);
  buttons.forEach((btn, i) => {
    console.log(`Button ${i}:`, btn.innerHTML.substring(0, 50));
  });
  
  // Check for specific elements
  console.log('Play button text:', screen.getByText(/play/i)?.innerHTML);
  console.log('Volume slider exists:', screen.getByRole('slider'));
});
