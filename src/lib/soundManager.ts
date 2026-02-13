class SoundManager {
  private audioContext: AudioContext | null = null;

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
}

export const soundManager = new SoundManager();
