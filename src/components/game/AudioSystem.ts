/**
 * Procedural Audio Synthesis System
 * Generates polished, lag-free retro SFX on-the-fly using Web Audio API
 */

class AudioSystem {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        this.ctx = new AudioContextClass();
      } catch (e) {
        console.warn('Web Audio API not supported in this browser:', e);
      }
    }
    // Resume context if suspended (browser security autoplay policies)
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // 1. Hunter Blaster Shoot SFX: High-energy descending pitch slide with noise
  public playShootSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);
  }

  // 2. Successful Hit on Prop SFX: Metallic "ping" with chime reflection
  public playHitSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    // First sharp high chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1200, ctx.currentTime);
    osc1.frequency.setValueAtTime(1500, ctx.currentTime + 0.03);
    gain1.gain.setValueAtTime(0.05, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc1.start();
    osc1.stop(ctx.currentTime + 0.2);

    // Deep chest impact
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(180, ctx.currentTime);
    osc2.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.1);
    gain2.gain.setValueAtTime(0.15, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc2.start();
    osc2.stop(ctx.currentTime + 0.13);
  }

  // 3. Take Damage SFX: Harsh low-frequency impact grunt
  public playDamageSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(60, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }

  // 4. Misfire (hitting environment / losing health) SFX: Buzzing error tone
  public playMisfireSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, ctx.currentTime);
    osc.frequency.setValueAtTime(110, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.start();
    osc.stop(ctx.currentTime + 0.26);
  }

  // 5. Transforming / Disguising SFX: Uplifting bubbly digital swirl
  public playDisguiseSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.start();
    osc.stop(ctx.currentTime + 0.23);
  }

  // 6. Whistle Taunt (Classic GMod style!)
  public playWhistleTaunt() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    
    // Whistle frequency modulation (sliding up, vibrato, sliding down)
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
    osc.frequency.linearRampToValueAtTime(1150, t + 0.25);
    osc.frequency.linearRampToValueAtTime(1300, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.6);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);

    osc.start();
    osc.stop(t + 0.62);
  }

  // 7. Rhythmic Digital Chirp
  public playChirpTaunt() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const playBeep = (delay: number, freq: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + delay);
      gain.gain.setValueAtTime(0.05, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + duration);
      osc.start(t + delay);
      osc.stop(t + delay + duration + 0.02);
    };

    playBeep(0, 523, 0.08);     // C5
    playBeep(0.1, 587, 0.08);   // D5
    playBeep(0.2, 659, 0.08);   // E5
    playBeep(0.3, 784, 0.15);   // G5
  }

  // 8. Panic Beeping Alarm
  public playAlarmTaunt() {
    const ctx = this.getContext();
    if (!ctx) return;

    const t = ctx.currentTime;
    const playPulse = (delay: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(987, t + delay); // B5
      osc.frequency.linearRampToValueAtTime(880, t + delay + 0.1);
      gain.gain.setValueAtTime(0.04, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.12);
      osc.start(t + delay);
      osc.stop(t + delay + 0.13);
    };

    playPulse(0);
    playPulse(0.15);
    playPulse(0.3);
  }

  // 9. Playful Slide Whistle
  public playSlideTaunt() {
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.4);
    osc.frequency.exponentialRampToValueAtTime(440, t + 0.8);

    gain.gain.setValueAtTime(0.07, t);
    gain.gain.linearRampToValueAtTime(0.07, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.82);

    osc.start();
    osc.stop(t + 0.85);
  }
}

export const audioSystem = new AudioSystem();
