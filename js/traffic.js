'use strict';
WD.Traffic = class {
  constructor() {
    this.cars = [];
    this.pool = [];
    this.trainX = -350;
    this.time = 0;
  }
  gateClosed(x) {
    const d = x - this.trainX;
    return d > -260 && d < 850;
  }
  update(dt, player, settings) {
    this.time += dt;
    this.trainX += 155 * dt;
    if (this.trainX > WD.WIDTH + 500) this.trainX = -500;
    const type = WD.regionAt(player.x, player.y).type;
    const desired = settings.traffic === 0 ? 0 : Math.round(settings.traffic * (['city', 'industry'].includes(type) ? 18 : ['forest', 'snow', 'desert'].includes(type) ? 5 : 10));
    for (let i = this.cars.length - 1; i >= 0; i--) {
      const c = this.cars[i];
      if (Math.hypot(c.x - player.x, c.y - player.y) > 1900 || this.cars.length > desired) {
        this.pool.push(this.cars.splice(i, 1)[0]);
      }
    }
    if (this.cars.length < desired) {
      const c = this.pool.pop() || {};
      const vertical = Math.random() < .5,
        sign = Math.random() < .5 ? 1 : -1;
      let x = player.x + (Math.random() - .5) * 2200,
        y = player.y + (Math.random() - .5) * 2200;
      if (vertical) x = Math.round((x - 350) / 700) * 700 + 350 - sign * 28;
      else y = Math.round((y - 350) / 700) * 700 + 350 + sign * 28;
      if (x > 50 && y > 50 && x < WD.WIDTH - 50 && y < WD.HEIGHT - 50 && Math.hypot(x - player.x, y - player.y) > 500) {
        Object.assign(c, {
          x,
          y,
          vertical,
          sign,
          speed: 0,
          max: ['road'].includes(type) ? 190 : 90 + Math.random() * 45,
          color: ['#f2b46d', '#83b8d8', '#dde2ce', '#d88583'][Math.floor(Math.random() * 4)]
        });
        this.cars.push(c);
      }
    }
    for (const c of this.cars) {
      const coord = c.vertical ? c.y : c.x,
        near = WD.roadDistance(coord);
      const signal = Math.floor(this.time / 6) % 2;
      let stop = near < 112 && near > 62 && (c.vertical ? signal === 0 : signal === 1);
      if (c.vertical && this.gateClosed(c.x) && Math.abs(c.y - 2100) < 160) stop = true;
      for (const other of [...this.cars, player]) {
        if (other === c) continue;
        const forward = ((c.vertical ? other.y - c.y : other.x - c.x) * c.sign);
        if (forward > 0 && forward < 100 && Math.abs(c.vertical ? other.x - c.x : other.y - c.y) < 30) {
          stop = true;
          break;
        }
      }
      c.speed += ((stop ? 0 : c.max) - c.speed) * Math.min(1, dt * 5);
      if (c.vertical) c.y += c.sign * c.speed * dt;
      else c.x += c.sign * c.speed * dt;
      if (Math.hypot(c.x - player.x, c.y - player.y) < 32) {
        player.damage(7);
        player.speed *= -.25;
        c.speed = 0;
      }
    }
    if (Math.abs(player.y - 2100) < 42 && player.x > this.trainX - 270 && player.x < this.trainX + 35) {
      player.damage(20);
      const safe = WD.safeRoad(player.x, player.y - 180);
      player.x = safe.x;
      player.y = safe.y;
      player.speed = 0;
    }
  }
  draw(ctx, night, bounds) {
    for (const c of this.cars) WD.paintCar(ctx, c.x, c.y, c.vertical ? c.sign * Math.PI / 2 : c.sign === 1 ? 0 : Math.PI, c.color, WD.VEHICLES[0], night);
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i === 0 ? '#e7ad4e' : '#9b6864';
      ctx.fillRect(this.trainX - i * 64 - 26, 2077, 58, 46);
      ctx.fillStyle = '#243c46';
      ctx.fillRect(this.trainX - i * 64 - 18, 2085, 35, 9);
    }
    for (let x = 350; x < WD.WIDTH; x += 700) {
      if (x < bounds.x - 100 || x > bounds.x + bounds.w + 100) continue;
      const closed = this.gateClosed(x);
      ctx.strokeStyle = closed ? '#ff9473' : '#b5d5b0';
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.moveTo(x - 60, 2030);
      ctx.lineTo(closed ? x + 60 : x - 60, closed ? 2030 : 1970);
      ctx.stroke();
      ctx.fillStyle = closed ? '#ff725e' : '#71bb8a';
      ctx.beginPath();
      ctx.arc(x - 68, 2030, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }
};
