// Web Audio API custom synthesizer for block fit sound effects and procedural background music
class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private activeSoundscape: 'zen' | 'cosmic' | 'nature' = 'zen';

  private musicState: 'menu' | 'gameplay' | 'win' | 'none' = 'none';
  private musicInterval: any = null;
  private currentBeat: number = 0;
  private mainMusicGain: GainNode | null = null;
  private dragGainNode: GainNode | null = null;
  private padOscillators: OscillatorNode[] = [];
  private activeTimeoutId: any = null;

  setSoundscape(soundscape: 'zen' | 'cosmic' | 'nature') {
    const changed = this.activeSoundscape !== soundscape;
    this.activeSoundscape = soundscape;
    if (changed && !this.isMusicMuted && this.musicState !== 'none') {
      this.playMusic(this.musicState);
    }
  }

  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  setMusicMuted(muted: boolean) {
    this.isMusicMuted = muted;
    if (muted) {
      this.stopMusicLoop();
    } else if (this.musicState !== 'none') {
      this.playMusic(this.musicState);
    }
  }

  setDragging(isDragging: boolean) {
    if (!this.ctx || !this.dragGainNode) return;
    try {
      const targetVolume = isDragging ? 0.3 : 1.0;
      // Smoothly transition volume of background music over 0.25 seconds
      this.dragGainNode.gain.setTargetAtTime(targetVolume, this.ctx.currentTime, 0.12);
    } catch (e) {}
  }

  playMusic(state: 'menu' | 'gameplay' | 'win' | 'none') {
    this.musicState = state;
    if (this.isMusicMuted) return;

    try {
      this.init();
      if (!this.ctx) return;

      this.stopMusicLoop();

      // Create main music gain if not exists
      if (!this.mainMusicGain) {
        this.mainMusicGain = this.ctx.createGain();
        this.mainMusicGain.connect(this.ctx.destination);
      }
      this.mainMusicGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

      // Create drag gain if not exists
      if (!this.dragGainNode) {
        this.dragGainNode = this.ctx.createGain();
        this.dragGainNode.connect(this.mainMusicGain);
      }
      this.dragGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

      if (state === 'menu') {
        this.startMenuMusic();
      } else if (state === 'gameplay') {
        this.startGameplayMusic();
      } else if (state === 'win') {
        this.startWinSting();
      }
    } catch (e) {
      console.error("Failed to play synthesized music:", e);
    }
  }

  private stopMusicLoop() {
    if (this.musicInterval) {
      clearTimeout(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.activeTimeoutId) {
      clearTimeout(this.activeTimeoutId);
      this.activeTimeoutId = null;
    }
    try {
      this.padOscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
      });
      this.padOscillators = [];
    } catch (e) {}
  }

  private startMenuMusic() {
    if (!this.ctx || !this.dragGainNode) return;
    this.currentBeat = 0;
    
    // Choose beat interval & scale & bassNotes based on selected soundscape
    let beatInterval = 666; // Zen (90 BPM)
    let scale = [130.81, 146.83, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00]; // G Major/E minor pentatonic (Zen)
    let bassNotes = [130.81, 110.00, 87.31, 98.00]; // C3, A2, F2, G2 (Zen)

    if (this.activeSoundscape === 'cosmic') {
      beatInterval = 850; // Slower (70 BPM)
      scale = [116.54, 130.81, 155.56, 174.61, 207.65, 233.08, 261.63, 311.13]; // Cosmic sus/minor scale
      bassNotes = [87.31, 69.30, 58.27, 65.41]; // Deep Bb1, Db2, Ab1, C2
    } else if (this.activeSoundscape === 'nature') {
      beatInterval = 550; // Faster (109 BPM)
      scale = [146.83, 164.81, 196.00, 220.00, 293.66, 329.63, 392.00, 440.00]; // Bright major pentatonic
      bassNotes = [130.81, 146.83, 164.81, 196.00]; // C3, D3, E3, G3
    }

    const runBeat = () => {
      if (this.isMusicMuted || this.musicState !== 'menu' || !this.ctx || !this.dragGainNode) return;

      const beat = this.currentBeat % 16;
      
      // Every 4 beats, play a warm low bass drone
      if (beat % 4 === 0) {
        const bassFreq = bassNotes[Math.floor(beat / 4) % bassNotes.length];
        this.playSoftBass(bassFreq, (beatInterval * 3.5) / 1000);
      }

      const pattern = [
        true, false, true, false,
        false, true, false, true,
        true, false, false, true,
        false, true, true, false
      ];

      if (pattern[beat]) {
        const idx = (beat * 3 + Math.floor(this.currentBeat / 16)) % scale.length;
        const freq = scale[idx];
        if (Math.random() > 0.15) {
          this.playPluckNote(freq, this.activeSoundscape === 'cosmic' ? 0.7 : 0.4);
        }
      }

      this.currentBeat++;
      this.musicInterval = setTimeout(runBeat, beatInterval);
    };

    runBeat();
  }

  private playSoftBass(freq: number, duration: number) {
    if (!this.ctx || !this.dragGainNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(150, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.dragGainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  private playPluckNote(freq: number, duration: number) {
    if (!this.ctx || !this.dragGainNode) return;
    try {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, this.ctx.currentTime);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(freq * 2, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03, this.ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.dragGainNode);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + duration);
      osc2.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  private startGameplayMusic() {
    if (!this.ctx || !this.dragGainNode) return;
    this.currentBeat = 0;
    
    // Setup tempo based on soundscape
    let beatInterval = 1000; // Zen (60 BPM)
    if (this.activeSoundscape === 'cosmic') {
      beatInterval = 1400; // Slower (43 BPM)
    } else if (this.activeSoundscape === 'nature') {
      beatInterval = 850; // Brighter (70 BPM)
    }
    
    const runBeat = () => {
      if (this.isMusicMuted || this.musicState !== 'gameplay' || !this.ctx || !this.dragGainNode) return;

      const beat = this.currentBeat % 16;

      // Slow warm pads sweep every 8 beats
      if (beat === 0) {
        let chordProgressions = [
          [110.00, 164.81, 261.63], // Am
          [130.81, 196.00, 329.63], // C
          [87.31, 130.81, 220.00],  // F
          [98.00, 146.83, 246.94]   // G
        ];

        if (this.activeSoundscape === 'cosmic') {
          chordProgressions = [
            [87.31, 130.81, 207.65, 311.13], // Fm7
            [69.30, 103.83, 174.61, 261.63], // Dbmaj7
            [116.54, 174.61, 277.18, 415.30], // Bbm9
            [65.41, 98.00, 174.61, 233.08]   // C7sus4
          ];
        } else if (this.activeSoundscape === 'nature') {
          chordProgressions = [
            [65.41, 98.00, 164.81, 246.94, 293.66], // Cmaj9
            [87.31, 130.81, 220.00, 329.63, 392.00], // Fmaj7#11
            [98.00, 146.83, 246.94, 329.63, 440.00], // G6/9
            [110.00, 164.81, 261.63, 392.00, 493.88]  // Am9
          ];
        }

        const chord = chordProgressions[Math.floor(this.currentBeat / 16) % chordProgressions.length];
        this.playPadChord(chord, (beatInterval * 7.5) / 1000);
      }

      // Occasional crystal bell, subliminal, long decay
      if (beat % 6 === 3) {
        let bellScale = [880.00, 987.77, 1046.50, 1174.66, 1318.51, 1567.98]; // Zen
        let duration = 3.5;

        if (this.activeSoundscape === 'cosmic') {
          bellScale = [987.77, 1174.66, 1567.98, 1975.53, 2349.32]; // Twinkling cosmic highs
          duration = 5.0;
        } else if (this.activeSoundscape === 'nature') {
          bellScale = [783.99, 880.00, 987.77, 1174.66, 1318.51]; // Playful nature melody bells
          duration = 2.5;
        }

        const freq = bellScale[Math.floor(Math.random() * bellScale.length)];
        this.playCrystalBell(freq, duration);
      }

      this.currentBeat++;
      this.musicInterval = setTimeout(runBeat, beatInterval);
    };

    runBeat();
  }

  private playPadChord(freqs: number[], duration: number) {
    if (!this.ctx || !this.dragGainNode) return;
    try {
      freqs.forEach(freq => {
        if (!this.ctx || !this.dragGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        // Custom waveforms/frequencies for different soundscapes
        if (this.activeSoundscape === 'cosmic') {
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(80, this.ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(180, this.ctx.currentTime + duration * 0.5);
          filter.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + duration);

          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.02, this.ctx.currentTime + duration * 0.4);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        } else if (this.activeSoundscape === 'nature') {
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(150, this.ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(450, this.ctx.currentTime + duration * 0.3);
          filter.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + duration);

          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.025, this.ctx.currentTime + duration * 0.25);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        } else {
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(100, this.ctx.currentTime);
          filter.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + duration * 0.4);
          filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);

          gain.gain.setValueAtTime(0, this.ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + duration * 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        }

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.dragGainNode);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
        this.padOscillators.push(osc);
      });
    } catch (e) {}
  }

  private playCrystalBell(freq: number, duration: number) {
    if (!this.ctx || !this.dragGainNode) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(0, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.dragGainNode);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }

  private startWinSting() {
    if (!this.ctx || !this.dragGainNode) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50];
      
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.dragGainNode) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.6);

        osc.connect(gain);
        gain.connect(this.dragGainNode);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.8);
      });

      this.activeTimeoutId = setTimeout(() => {
        if (this.musicState === 'win') {
          this.playMusic('menu');
        }
      }, 3000);
    } catch (e) {}
  }

  playClick() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playPlace() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;
      
      // Resonant organic wooden-block plop: sine with exponential decay
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(260, this.ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.15);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(520, this.ctx.currentTime);
      osc2.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(this.ctx.currentTime + 0.2);
      osc2.stop(this.ctx.currentTime + 0.2);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playInvalid() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(130, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(90, this.ctx.currentTime + 0.2);

      // Low pass filter for a warmer rumble
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, this.ctx.currentTime);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playRotate() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(350, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.15);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playStar(index: number) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      // Arpeggio frequencies: C5, E5, G5
      const freqs = [523.25, 659.25, 783.99];
      const freq = freqs[index % freqs.length] || 523.25;

      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.3);

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.4);
    } catch (e) {
      // Ignore audio errors
    }
  }

  playWin() {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.ctx) return;

      // Sparkling success chord
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + idx * 0.1 + 0.4);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.1, now + idx * 0.1 + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.5);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.1);
        osc.stop(now + idx * 0.1 + 0.5);
      });
    } catch (e) {
      // Ignore audio errors
    }
  }
}

export const sound = new SoundManager();
