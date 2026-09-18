'use strict';
WD.DayNight = class {
  constructor() {
    this.hour = 9;
  }
  update(dt) {
    this.hour = (this.hour + dt / 24) % 24;
  }
  get night() {
    return this.hour < 6 || this.hour > 19;
  }
  get darkness() {
    return this.night ? .48 : this.hour < 8 || this.hour > 17 ? .16 : 0;
  }
  get label() {
    return String(Math.floor(this.hour)).padStart(2, '0') + ':' + String(Math.floor(this.hour % 1 * 60)).padStart(2, '0');
  }
  draw(ctx, w, h) {
    ctx.fillStyle = `rgba(9,21,48,${this.darkness})`;
    ctx.fillRect(0, 0, w, h);
    const phase = this.night ? ((this.hour + 5) % 24) / 12 : (this.hour - 6) / 13;
    const x = w * .35 + WD.clamp(phase, 0, 1) * w * .3,
      y = 45 + Math.sin(WD.clamp(phase, 0, 1) * Math.PI) * 20;
    ctx.fillStyle = this.night ? '#e2eadf' : '#ffdc76';
    ctx.beginPath();
    ctx.arc(x, y, this.night ? 10 : 13, 0, Math.PI * 2);
    ctx.fill();
    if (this.night) {
      ctx.fillStyle = '#c8d4df88';
      for (let i = 0; i < 12; i++) ctx.fillRect(w * .3 + (i * 53) % (w * .4), 10 + i % 3 * 12, 2, 2);
    }
  }
};
