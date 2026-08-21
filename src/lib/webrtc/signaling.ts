import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';

export type SignalingEvent =
  | { type: 'incoming_call'; callerId: string; callerName: string; callerAvatar?: string; roomId: string }
  | { type: 'offer'; offer: RTCSessionDescriptionInit; senderId: string }
  | { type: 'answer'; answer: RTCSessionDescriptionInit; senderId: string }
  | { type: 'ice_candidate'; candidate: RTCIceCandidateInit; senderId: string }
  | { type: 'joined'; senderId: string }
  | { type: 'call_declined' }
  | { type: 'call_ended' }
  | { type: 'call_busy' };

export class SignalingManager {
  private client: SupabaseClient;
  private channel: RealtimeChannel | null = null;
  private onMessageCb: ((payload: SignalingEvent) => void) | null = null;
  
  constructor(client: SupabaseClient) {
    this.client = client;
  }

  /**
   * Listen to a personal channel to receive incoming calls
   */
  subscribeToPersonalChannel(userId: string, onIncomingCall: (payload: Extract<SignalingEvent, { type: 'incoming_call' }>) => void) {
    const channelHash = typeof btoa !== 'undefined' ? btoa(userId + '_WEBRTC_SALT').replace(/=/g, '') : userId;
    const personalChannel = this.client.channel(`user_${channelHash}`);
    personalChannel.on('broadcast', { event: 'incoming_call' }, (payload) => {
      onIncomingCall(payload.payload as any);
    }).subscribe();

    return () => {
      personalChannel.unsubscribe();
    };
  }

  /**
   * Ping a user to start a call
   */
  async pingUser(targetUserId: string, callerId: string, callerName: string, callerAvatar: string | undefined, roomId: string) {
    const channelHash = typeof btoa !== 'undefined' ? btoa(targetUserId + '_WEBRTC_SALT').replace(/=/g, '') : targetUserId;
    const pingChannel = this.client.channel(`user_${channelHash}`);
    
    await new Promise<void>((resolve) => {
      let isDone = false;
      const timeoutId = setTimeout(() => {
        if (!isDone) {
          isDone = true;
          pingChannel.unsubscribe();
          resolve();
        }
      }, 4000);

      pingChannel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && !isDone) {
          try {
            await pingChannel.send({
              type: 'broadcast',
              event: 'incoming_call',
              payload: { callerId, callerName: callerName || 'Neighborly User', callerAvatar, roomId }
            });
          } catch (err) {
            console.warn('Signaling send error:', err);
          } finally {
            if (!isDone) {
              isDone = true;
              clearTimeout(timeoutId);
              pingChannel.unsubscribe();
              resolve();
            }
          }
        } else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && !isDone) {
          isDone = true;
          clearTimeout(timeoutId);
          pingChannel.unsubscribe();
          resolve();
        }
      });
    });
  }

  /**
   * Join a specific call room for signaling
   */
  async joinRoom(roomId: string, onMessage: (payload: SignalingEvent) => void): Promise<void> {
    this.onMessageCb = onMessage;
    this.channel = this.client.channel(roomId);

    return new Promise((resolve, reject) => {
      this.channel!
        .on('broadcast', { event: 'offer' }, (payload) => this.onMessageCb?.({ type: 'offer', ...payload.payload }))
        .on('broadcast', { event: 'answer' }, (payload) => this.onMessageCb?.({ type: 'answer', ...payload.payload }))
        .on('broadcast', { event: 'ice_candidate' }, (payload) => this.onMessageCb?.({ type: 'ice_candidate', ...payload.payload }))
        .on('broadcast', { event: 'joined' }, (payload) => this.onMessageCb?.({ type: 'joined', ...payload.payload }))
        .on('broadcast', { event: 'call_ended' }, () => this.onMessageCb?.({ type: 'call_ended' }))
        .on('broadcast', { event: 'call_declined' }, () => this.onMessageCb?.({ type: 'call_declined' }))
        .on('broadcast', { event: 'call_busy' }, () => this.onMessageCb?.({ type: 'call_busy' }))
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            resolve();
          }
        });
      // Safety timeout
      setTimeout(() => reject(new Error('Signaling join room timeout')), 10000);
    });
  }

  /**
   * Send a message to the current room
   */
  sendSignal(event: string, payload: any) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event,
      payload
    });
  }

  /**
   * Leave the room and clean up
   */
  leaveRoom() {
    if (this.channel) {
      this.channel.unsubscribe();
      this.channel = null;
    }
    this.onMessageCb = null;
  }
}
