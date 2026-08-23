import { describe, it, expect } from 'vitest';
import { BookingStatus } from '../lib/types';

describe('Booking Finite State Machine (FSM)', () => {
  const VALID_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
    searching: ['accepted', 'cancelled', 'no_workers_found'],
    pending: ['accepted', 'cancelled', 'no_workers_found'],
    accepted: ['on_the_way', 'cancelled'],
    on_the_way: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [], // terminal
    cancelled: [], // terminal
    no_workers_found: ['searching', 'cancelled'],
  };

  function canTransition(current: BookingStatus, next: BookingStatus): boolean {
    return VALID_TRANSITIONS[current]?.includes(next) ?? false;
  }

  function getCompletionPin(bookingId: string): string {
    return (bookingId || '0000').slice(-4).toUpperCase();
  }

  it('allows valid forward happy-path transitions', () => {
    expect(canTransition('searching', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'on_the_way')).toBe(true);
    expect(canTransition('on_the_way', 'in_progress')).toBe(true);
    expect(canTransition('in_progress', 'completed')).toBe(true);
  });

  it('allows cancellation from active intermediate states', () => {
    expect(canTransition('searching', 'cancelled')).toBe(true);
    expect(canTransition('accepted', 'cancelled')).toBe(true);
    expect(canTransition('on_the_way', 'cancelled')).toBe(true);
    expect(canTransition('in_progress', 'cancelled')).toBe(true);
  });

  it('blocks invalid backward or terminal transitions', () => {
    expect(canTransition('completed', 'in_progress')).toBe(false);
    expect(canTransition('completed', 'searching')).toBe(false);
    expect(canTransition('cancelled', 'completed')).toBe(false);
    expect(canTransition('in_progress', 'accepted')).toBe(false);
    expect(canTransition('searching', 'completed')).toBe(false);
  });

  it('generates consistent 4-character completion PINs', () => {
    expect(getCompletionPin('b128-49af-98bc-a1f9')).toBe('A1F9');
    expect(getCompletionPin('job-9988')).toBe('9988');
    expect(getCompletionPin('')).toBe('0000');
  });
});
