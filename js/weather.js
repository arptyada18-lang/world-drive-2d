'use strict';
WD.Weather = class {
  constructor() {
    this.age = 0;
    this.index = 0;
    this.flash = 0;
    this.kind = 'Clear';
  }
  update(dt, region) {
    this.age += dt;
    this.index = Math.floor(this.age / 65) % 6;
    this.kind = region.type === 'snow' ? 'Snow' : ['Clear', 'Cloudy', 'Rain', 'Fog', 'Heavy rain', 'Thunderstorm'][this.index];
    this.flash = Math.max(0, this.flash - dt);
    if (this.kind === 'Thunderstorm' && Math.random() < dt * .06) this.flash = .15;
  }
  get grip() {
    return this.kind === 'Snow' ? .72 : this.kind.includes('rain') || this.kind === 'Rain' ? .85 : 1;
  }
  draw(ctx, w, h, settings) {
    if (!settings.weather) return;
    const n = settings.quality === 'low' ? 35 : 90;
    ctx.save();
    if (this.kind === 'Fog' || this.kind === 'Cloudy') {
      ctx.fillStyle = this.kind === 'Fog' ? '#d5e3df55' : '#adb9b224';
      ctx.fillRect(0, 0, w, h);
    }
    if (['Rain', 'Heavy rain', 'Thunderstorm', 'Snow'].includes(this.kind)) {
      ctx.strokeStyle = '#cfedf080';
      ctx.fillStyle = '#fff9';
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const x = (i * 107 + this.age * 35) % w,
          y = (i * 89 + this.age * (this.kind === 'Snow' ? 36 : 440)) % h;
        if (this.kind === 'Snow') ctx.fillRect(x, y, 3, 3);
        else {
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - 5, y + 16);
          ctx.stroke();
        }
      }
    }
    if (this.flash > 0) {
      ctx.fillStyle = '#ffffdd60';
      ctx.fillRect(0, 0, w, h);
    }
    ctx.restore();
  }
};
