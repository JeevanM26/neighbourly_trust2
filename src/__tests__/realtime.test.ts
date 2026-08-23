import { describe, it, expect } from 'vitest';

export interface BookingState {
  id: string;
  status: 'pending' | 'accepted' | 'completed' | 'declined';
  updated_at: string;
}

export function handleRealtimeStatusChange(
  bookings: BookingState[],
  payload: { id: string; status: 'pending' | 'accepted' | 'completed' | 'declined'; updated_at: string }
): { updatedBookings: BookingState[]; statusMessage: string } {
  const updatedBookings = bookings.map(b => b.id === payload.id ? { ...b, status: payload.status, updated_at: payload.updated_at } : b);
  const statusMessage =
    payload.status === 'accepted' ? '🎉 Your booking was accepted by specialist!' :
    payload.status === 'completed' ? '⭐ Service marked complete!' :
    payload.status === 'declined' ? '⚠️ Booking declined by provider.' : 'Booking status updated';

  return { updatedBookings, statusMessage };
}

describe('Realtime Booking Notification Engine', () => {
  it('updates booking status to accepted and returns celebration message', () => {
    const initial: BookingState[] = [{ id: 'b1', status: 'pending', updated_at: '2026-08-04T10:00:00Z' }];
    const { updatedBookings, statusMessage } = handleRealtimeStatusChange(initial, {
      id: 'b1',
      status: 'accepted',
      updated_at: '2026-08-04T10:05:00Z'
    });

    expect(updatedBookings[0].status).toBe('accepted');
    expect(statusMessage).toContain('accepted');
  });

  it('updates booking status to completed and returns completion message', () => {
    const initial: BookingState[] = [{ id: 'b1', status: 'accepted', updated_at: '2026-08-04T10:05:00Z' }];
    const { updatedBookings, statusMessage } = handleRealtimeStatusChange(initial, {
      id: 'b1',
      status: 'completed',
      updated_at: '2026-08-04T10:45:00Z'
    });

    expect(updatedBookings[0].status).toBe('completed');
    expect(statusMessage).toContain('complete');
  });
});
