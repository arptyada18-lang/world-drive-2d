'use strict';
WD.Audio = class {
  constructor() {
    this.ctx = null;
    this.osc = null;
    this.gain = null;
  }
  start() {
    try {
      if (!this.ctx) {
        this.ctx = new(window.AudioContext || window.webkitAudioContext)();
        this.osc = this.ctx.createOscillator();
        this.gain = this.ctx.createGain();
        this.osc.type = 'sawtooth';
        this.osc.connect(this.gain);
        this.gain.connect(this.ctx.destination);
        this.gain.gain.value = 0;
        this.osc.start();
        this.music = this.ctx.createOscillator();
        this.musicGain = this.ctx.createGain();
        this.music.type = 'sine';
        this.music.frequency.value = 110;
        this.music.connect(this.musicGain);
        this.musicGain.connect(this.ctx.destination);
        this.musicGain.gain.value = 0;
        this.music.start();
      }
      this.ctx.resume().catch(() => {});
    } catch (e) {
      this.ctx = null;
    }
  }
  update(speed, s, paused) {
    if (!this.ctx) return;
    this.osc.frequency.setTargetAtTime(38 + Math.abs(speed) * .28, this.ctx.currentTime, .1);
    this.gain.gain.setTargetAtTime(paused ? 0 : s.sound * .025, this.ctx.currentTime, .1);
    this.musicGain.gain.setTargetAtTime(paused ? 0 : s.music * .018, this.ctx.currentTime, .1);
  }
  tone(hz = .0, duration = .15, volume = .2) {
    if (!this.ctx) return;
    try {
      const o = this.ctx.createOscillator(),
        g = this.ctx.createGain();
      o.connect(g);
      g.connect(this.ctx.destination);
      o.frequency.value = hz || 300;
      g.gain.value = volume * .1;
      g.gain.exponentialRampToValueAtTime(.0001, this.ctx.currentTime + duration);
      o.start();
      o.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
};
