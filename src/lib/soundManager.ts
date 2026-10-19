class SoundManager {
  private audioContext: AudioContext | null = null;
  private sirenNodes: { oscillators: OscillatorNode[]; gains: GainNode[] } | null = null;

  private getContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  playSuccess(): void {
    const ctx = this.getContext();
    
    // Play two tones for clearer feedback
    const playTone = (time: number, freq: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, time);
      oscillator.type = 'sine';

      // Louder volume: 0.6 instead of 0.3
      gainNode.gain.setValueAtTime(0.6, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.12);

      oscillator.start(time);
      oscillator.stop(time + 0.12);
    };

    // Rising two-tone "ding-ding" for success
    playTone(ctx.currentTime, 800);
    playTone(ctx.currentTime + 0.1, 1200);
  }

  playDuplicateAlert(): void {
    const ctx = this.getContext();
    
    // Louder and more distinctive alert for duplicates
    const playTing = (time: number, frequency: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(frequency, time);
      oscillator.type = 'triangle'; // More piercing than sine

      // Much louder: 0.8 instead of 0.5
      gainNode.gain.setValueAtTime(0.8, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.25);

      oscillator.start(time);
      oscillator.stop(time + 0.25);
    };

    // Triple alert "ting-ting-ting" - more urgent
    playTing(ctx.currentTime, 1000);
    playTing(ctx.currentTime + 0.2, 1400);
    playTing(ctx.currentTime + 0.4, 1800);
  }

  playError(): void {
    const ctx = this.getContext();
    
    // Louder error buzz
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(180, ctx.currentTime);
    oscillator.type = 'square';

    // Much louder: 0.6 instead of 0.3
    gainNode.gain.setValueAtTime(0.6, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.35);
  }

  playReject(): void {
    const ctx = this.getContext();
    
    const playBuzzer = (time: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(120, time);
      oscillator.type = 'sawtooth';

      // Sangat keras untuk reject
      gainNode.gain.setValueAtTime(1.0, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.4);

      oscillator.start(time);
      oscillator.stop(time + 0.4);
    };

    // TET TET (dua kali buzz panjang)
    playBuzzer(ctx.currentTime);
    playBuzzer(ctx.currentTime + 0.45);
  }

  /**
   * SIREN ALARM untuk watchlist match.
   * Sangat berbeda dari suara lain — loud, panjang, ascending-descending wail.
   * Dirancang agar tidak mungkin dilewatkan meskipun user tidak melihat layar.
   */
  playWatchlistSiren(): void {
    // Stop any existing siren first
    this.stopSiren();

    const ctx = this.getContext();
    const now = ctx.currentTime;
    const duration = 3.0; // 3 detik total

    const oscillators: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    // Main siren oscillator — frequency sweep naik-turun
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = 'sawtooth';
    gain1.gain.setValueAtTime(0.7, now);

    // Sweep frequency: naik 400→1200 lalu turun 1200→400, diulang
    const sweepPoints = [
      { time: 0, freq: 400 },
      { time: 0.375, freq: 1200 },
      { time: 0.75, freq: 400 },
      { time: 1.125, freq: 1200 },
      { time: 1.5, freq: 400 },
      { time: 1.875, freq: 1200 },
      { time: 2.25, freq: 400 },
      { time: 2.625, freq: 1200 },
      { time: 3.0, freq: 400 },
    ];
    for (const point of sweepPoints) {
      osc1.frequency.linearRampToValueAtTime(point.freq, now + point.time);
    }
    // Fade out di akhir
    gain1.gain.setValueAtTime(0.7, now + duration - 0.3);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc1.start(now);
    osc1.stop(now + duration);
    oscillators.push(osc1);
    gains.push(gain1);

    // Secondary oscillator — detuned untuk efek lebih tebal
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = 'square';
    gain2.gain.setValueAtTime(0.3, now);
    // Slightly different frequency for chorus/beating effect
    for (const point of sweepPoints) {
      osc2.frequency.linearRampToValueAtTime(point.freq * 1.02, now + point.time);
    }
    gain2.gain.setValueAtTime(0.3, now + duration - 0.3);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc2.start(now);
    osc2.stop(now + duration);
    oscillators.push(osc2);
    gains.push(gain2);

    // Pulse beep overlay — rapid staccato bursts untuk urgency
    for (let i = 0; i < 12; i++) {
      const beep = ctx.createOscillator();
      const beepGain = ctx.createGain();
      beep.connect(beepGain);
      beepGain.connect(ctx.destination);
      beep.type = 'sine';
      beep.frequency.setValueAtTime(2400, now + i * 0.25);

      const beepStart = now + i * 0.25;
      beepGain.gain.setValueAtTime(0, beepStart);
      beepGain.gain.linearRampToValueAtTime(0.5, beepStart + 0.02);
      beepGain.gain.exponentialRampToValueAtTime(0.01, beepStart + 0.1);

      beep.start(beepStart);
      beep.stop(beepStart + 0.12);
      oscillators.push(beep);
      gains.push(beepGain);
    }

    this.sirenNodes = { oscillators, gains };

    // Auto-cleanup setelah selesai
    setTimeout(() => {
      this.sirenNodes = null;
    }, duration * 1000 + 100);
  }

  /**
   * Stop siren secara manual (misal saat user dismiss alert).
   */
  stopSiren(): void {
    if (!this.sirenNodes) return;
    const ctx = this.getContext();
    const now = ctx.currentTime;
    for (const gain of this.sirenNodes.gains) {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      } catch { /* ignore */ }
    }
    for (const osc of this.sirenNodes.oscillators) {
      try {
        osc.stop(now + 0.06);
      } catch { /* ignore */ }
    }
    this.sirenNodes = null;
  }
}

export const soundManager = new SoundManager();
