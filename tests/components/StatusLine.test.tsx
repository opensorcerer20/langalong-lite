import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusLine } from '../../src/components/StatusLine/StatusLine';

const line = () => screen.getByRole('status');

describe('StatusLine', () => {
  it('says nothing before the first check', () => {
    render(<StatusLine status="idle" misses={0} noteAfterMisses={2} />);
    expect(line()).toHaveTextContent('');
  });

  /* The first miss is a silent retry — a nudge, with no explanation. */
  it('nudges without explaining on the first miss', () => {
    render(<StatusLine status="wrong" misses={1} noteAfterMisses={2} />);
    expect(line()).toHaveTextContent('Not quite. Try again.');
  });

  /* Once the note is on screen, repeating "try again" adds nothing — point at
     the help that just appeared instead. */
  it('points at the note once the note is showing', () => {
    render(<StatusLine status="wrong" misses={2} noteAfterMisses={2} />);
    expect(line()).toHaveTextContent('Not yet — read the note');
  });

  it('follows the configured threshold rather than a hard-coded 2', () => {
    render(<StatusLine status="wrong" misses={2} noteAfterMisses={4} />);
    expect(line()).toHaveTextContent('Not quite. Try again.');
  });

  it('confirms a correct answer', () => {
    render(<StatusLine status="right" misses={0} noteAfterMisses={2} />);
    expect(line()).toHaveTextContent('Correct');
  });

  it('says so when the answer was revealed rather than built', () => {
    render(<StatusLine status="shown" misses={3} noteAfterMisses={2} />);
    expect(line()).toHaveTextContent('Answer shown');
  });

  it('announces changes without stealing focus', () => {
    render(<StatusLine status="right" misses={0} noteAfterMisses={2} />);
    expect(line()).toHaveAttribute('aria-live', 'polite');
  });
});
