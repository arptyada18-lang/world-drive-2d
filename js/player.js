'use strict';
WD.Player = class {
  constructor(data = {}) {
    Object.assign(this, {
      x: 350,
      y: 350,
      angle: 0,
      speed: 0,
      health: 100,
      fuel: 65,
      car: 'compact',
      color: '#d0ed78',
      hitTimer: 0
    }, data);
    this.speed = 0;
    this.hitTimer = 0;
  }
  update(dt, input, world, grip = 1) {
    const v = WD.vehicle(this.car);
    const ox = this.x,
      oy = this.y;
    this.hitTimer = Math.max(0, this.hitTimer - dt);
    const surface = world.surface(this.x, this.y),
      factor = surface === 1 ? 1 : surface + v.offroad * .24;
    const damaged = .45 + .55 * this.health / 100;
    if (input.gas && this.fuel > 0 && this.health > 0) this.speed += v.accel * damaged * dt;
    if (input.brake) {
      if (this.speed > 0) this.speed = Math.max(0, this.speed - v.brake * dt);
      else if (this.fuel > 0 && this.health > 0) this.speed -= v.accel * .65 * dt;
    }
    const drag = input.handbrake ? 2.6 : (!input.gas && !input.brake ? .7 : .12) + (1 - factor) * 1.5;
    this.speed *= Math.exp(-drag * dt);
    this.speed = WD.clamp(this.speed, -v.speed * .28, v.speed * factor * damaged);
    if (Math.abs(this.speed) < .7) this.speed = 0;
    const steer = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    this.angle += steer * v.handling * grip * (input.handbrake ? 1.35 : 1) * Math.min(Math.abs(this.speed) / 85, 1) * Math.sign(this.speed) * dt;
    this.x = WD.clamp(this.x + Math.cos(this.angle) * this.speed * dt, 30, WD.WIDTH - 30);
    this.y = WD.clamp(this.y + Math.sin(this.angle) * this.speed * dt, 30, WD.HEIGHT - 30);
    const collision = world.collide(this.x, this.y);
    if (collision === 'water') {
      const safe = WD.safeRoad(ox, oy);
      this.x = safe.x;
      this.y = safe.y;
      this.speed = 0;
      this.damage(8);
      return 'Recovered from deep water';
    }
    if (collision) {
      this.x = ox;
      this.y = oy;
      this.damage(Math.abs(this.speed) / 35);
      this.speed *= -.25;
    }
    this.fuel = Math.max(0, this.fuel - Math.abs(this.speed) * dt * .00015);
    return collision ? 'Collision' : null;
  }
  damage(amount) {
    if (this.hitTimer > 0) return;
    this.health = Math.max(0, this.health - amount * 100 / WD.vehicle(this.car).durability);
    this.hitTimer = 1;
  }
};
