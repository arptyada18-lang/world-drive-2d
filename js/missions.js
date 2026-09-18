'use strict';
WD.MISSIONS = [
  ['Village delivery', 2, 0, 160],
  ['Forest explorer', 3, 0, 160],
  ['Airport run', 20, 0, 260],
  ['Station pickup', 8, 0, 220],
  ['Sunset coast', 9, 0, 250],
  ['Energy delivery', 24, 0, 280],
  ['Mountain challenge', 17, 0, 320],
  ['Highway sprint', 5, 150, 400],
  ['Market passenger', 23, 0, 240],
  ['Ocean bridge tour', 14, 0, 300]
].map(([name, region, seconds, reward]) => ({
  name,
  region,
  seconds,
  reward
}));
WD.Missions = class {
  constructor(save = {}) {
    this.index = save.index || 0;
    this.elapsed = save.elapsed || 0;
    this.completed = save.completed || 0;
  }
  get current() {
    return WD.MISSIONS[this.index % WD.MISSIONS.length];
  }
  target() {
    const r = WD.REGIONS[this.current.region];
    return {
      x: r.x - 350,
      y: r.y - 350
    };
  }
  update(dt, game) {
    this.elapsed += dt;
    const m = this.current,
      t = this.target();
    if (m.seconds && this.elapsed > m.seconds) {
      this.elapsed = 0;
      game.toast('Time expired — sprint restarted');
    }
    if (Math.hypot(game.player.x - t.x, game.player.y - t.y) < 100) {
      game.coins += m.reward;
      game.xp += 120;
      this.index++;
      this.completed++;
      this.elapsed = 0;
      game.toast('MISSION COMPLETE +' + m.reward + ' coins');
      game.save();
    }
  }
  draw(ctx, time) {
    const t = this.target();
    ctx.strokeStyle = '#f6d16d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 58 + Math.sin(time * 3) * 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffe486';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('CHECKPOINT', t.x - 64, t.y - 75);
  }
};
