import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { StatusLine } from '../../src/components/StatusLine';

const line = () => screen.getByRole('status');

describe('StatusLine', () => {
  it('says nothing before the first check', () => {
    render(<StatusLine status="idle" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('');
  });

  /* The first miss is a silent retry — a nudge, with no explanation. */
  it('nudges without explaining on the first miss', () => {
    render(<StatusLine status="wrong" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('Not quite. Try again.');
  });

  /* Once the note is on screen, repeating "try again" adds nothing — point at
     the help that just appeared instead. */
  it('points at the note once the note is showing', () => {
    render(<StatusLine status="wrong" noteOnScreen={true} />);
    expect(line()).toHaveTextContent('Not yet — read the note');
  });

  /* The threshold itself is no longer this component's business — it is told
     whether the note is showing. This is the case that used to be wrong: an
     item with no note is past the threshold and still must not promise one. */
  it('does not promise a note when there is none on screen', () => {
    render(<StatusLine status="wrong" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('Not quite. Try again.');
  });

  /* Announced, but politely — the learner is mid-sentence and must not be
     interrupted by a status change. */
  it('confirms a correct answer without stealing focus', () => {
    render(<StatusLine status="right" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('Correct');
    expect(line()).toHaveAttribute('aria-live', 'polite');
  });

  it('offers another go at an answer it accepts but does not teach', () => {
    render(<StatusLine status="alt" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('Acceptable, but there is more natural phrasing.');
    expect(line()).toHaveTextContent('Retry or tap Check to continue.');
  });

  it('marks a taken alternate apart from a right answer', () => {
    render(<StatusLine status="accepted" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('Accepted');
  });

  it('says so when the answer was revealed rather than built', () => {
    render(<StatusLine status="shown" noteOnScreen={false} />);
    expect(line()).toHaveTextContent('Answer shown');
  });
});
