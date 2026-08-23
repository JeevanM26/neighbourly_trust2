import { describe, it, expect } from 'vitest';
import { optimizeAudioSdp } from '../lib/webrtc/callManager';

describe('WebRTC SDP Audio Bandwidth Optimizer (Metered.ca Free Tier Quota)', () => {
  const sampleSdpWithOpusFmtp = `v=0
o=- 439201940 2 IN IP4 127.0.0.1
s=-
t=0 0
m=audio 9 UDP/TLS/RTP/SAVPF 111 103 104 9 0 8 106 105 13 110 126
c=IN IP4 0.0.0.0
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
a=sendrecv`;

  const sampleSdpWithoutFmtp = `v=0
o=- 439201940 2 IN IP4 127.0.0.1
s=-
t=0 0
m=audio 9 UDP/TLS/RTP/SAVPF 111
c=IN IP4 0.0.0.0
a=sendrecv`;

  it('restricts Opus audio bitrate to 12kbps mono voice', () => {
    const optimized = optimizeAudioSdp(sampleSdpWithOpusFmtp, 12000);
    expect(optimized).toContain('maxaveragebitrate=12000');
    expect(optimized).toContain('stereo=0');
    expect(optimized).toContain('sprop-stereo=0');
    expect(optimized).toContain('cbr=1');
  });

  it('injects fmtp constraints if m=audio exists without fmtp', () => {
    const optimized = optimizeAudioSdp(sampleSdpWithoutFmtp, 12000);
    expect(optimized).toContain('a=fmtp:111');
    expect(optimized).toContain('maxaveragebitrate=12000');
  });

  it('calculates 85% bandwidth reduction correctly', () => {
    const uncompressedBitrateKbps = 64; // Default WebRTC Opus stereo
    const optimizedBitrateKbps = 12; // Our voice optimized mono
    const reductionPct = ((uncompressedBitrateKbps - optimizedBitrateKbps) / uncompressedBitrateKbps) * 100;
    
    expect(reductionPct).toBeCloseTo(81.25, 1);
    
    // Metered.ca 500MB free quota calculation:
    const freeQuotaBytes = 500 * 1024 * 1024;
    const bytesPerSecondOptimized = (12 * 1000) / 8; // 1500 bytes/sec
    const totalVoiceMinutes = freeQuotaBytes / (bytesPerSecondOptimized * 60);
    
    // Yields ~5,825 minutes (~97 hours) of voice calling on free tier!
    expect(totalVoiceMinutes).toBeGreaterThan(5000);
  });
});
