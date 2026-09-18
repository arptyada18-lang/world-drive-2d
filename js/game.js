'use strict';
WD.Game = class {
  constructor() {
    this.canvas = document.getElementById('game');
    this.ctx = this.canvas.getContext('2d');
    this.saved = WD.Save.load();
    this.hasSave = !!this.saved;
    this.settings = {
      ...WD.DEFAULTS,
      ...this.saved?.settings,
      ...WD.Save.loadSettings()
    };
    this.started = false;
    this.paused = true;
    this.time = 0;
    this.last = 0;
    this.accumulator = 0;
    this.saveTimer = 0;
    this.hornTimer = 0;
    this.cameraMode = 0;
    this.audio = new WD.Audio();
    this.resetState(this.saved);
    this.ui = new WD.UI(this);
    this.input = new WD.Input(this);
    this.applySettings();
    addEventListener('resize', () => this.resize());
    document.getElementById('loading').hidden = true;
    requestAnimationFrame(t => this.frame(t));
  }
  resetState(d) {
    this.world = new WD.World();
    this.player = new WD.Player(d?.player);
    this.coins = d?.coins ?? 200;
    this.xp = d?.xp ?? 0;
    this.owned = d?.owned || ['compact'];
    this.discovered = d?.discovered || [];
    this.tutorial = d?.tutorial || false;
    this.missions = new WD.Missions(d?.missions);
    this.traffic = new WD.Traffic();
    this.day = new WD.DayNight();
    this.weather = new WD.Weather();
    this.cam = {
      x: this.player.x,
      y: this.player.y,
      zoom: 1
    };
    this.world.update(this.player.x, this.player.y);
    if (this.world.collide(this.player.x, this.player.y)) {
      Object.assign(this.player, WD.safeRoad(this.player.x, this.player.y));
    }
  }
  start(resume) {
    const d = resume ? WD.Save.load() : null;
    this.resetState(d);
    this.started = true;
    this.paused = false;
    this.audio.start();
    this.ui.menu.close();
    document.getElementById('hud').hidden = false;
    document.getElementById('touch').hidden = !this.input.mobile;
    this.input.clear();
    this.save();
    if (!this.tutorial) this.ui.open('tutorial');
  }
  saveSettings() {
    WD.Save.writeSettings(this.settings);
    if (this.started) this.save();
  }
  applySettings() {
    document.documentElement.style.setProperty('--button', this.settings.controls + 'px');
    this.resize();
  }
  resize() {
    this.w = innerWidth;
    this.h = innerHeight;
    const cap = this.settings.quality === 'low' ? 1 : this.settings.quality === 'high' ? 2 : 1.5;
    this.dpr = Math.min(devicePixelRatio || 1, cap);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
  }
  direction() {
    const n = Math.round((((this.player.angle * 180 / Math.PI) + 90) % 360 + 360) % 360 / 45) % 8;
    return ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][n];
  }
  toast(text) {
    const el = document.getElementById('toast');
    el.textContent = text;
    el.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
  }
  recover() {
    Object.assign(this.player, WD.safeRoad(this.player.x, this.player.y));
    this.player.speed = 0;
    this.player.health = Math.max(this.player.health, 55);
    this.player.fuel = Math.max(this.player.fuel, WD.vehicle(this.player.car).fuel * .25);
    this.toast('Roadside recovery · fuel and repairs supplied');
    this.save();
  }
  save() {
    if (!this.started) return false;
    const p = this.player;
    const ok = WD.Save.write({
      player: {
        x: p.x,
        y: p.y,
        angle: p.angle,
        health: p.health,
        fuel: p.fuel,
        car: p.car,
        color: p.color
      },
      coins: this.coins,
      xp: this.xp,
      owned: this.owned,
      settings: this.settings,
      missions: {
        index: this.missions.index,
        elapsed: this.missions.elapsed,
        completed: this.missions.completed
      },
      discovered: this.discovered,
      tutorial: this.tutorial
    });
    this.hasSave = ok;
    return ok;
  }
  step(dt) {
    const p = this.player,
      r = WD.regionAt(p.x, p.y);
    this.world.update(p.x, p.y);
    const result = p.update(dt, this.input.state, this.world, this.weather.grip);
    if (result === 'Recovered from deep water') this.toast(result);
    if (result === 'Collision' && p.hitTimer > .98) this.audio.tone(75, .08, this.settings.sound);
    this.traffic.update(dt, p, this.settings);
    this.day.update(dt);
    this.weather.update(dt, r);
    this.missions.update(dt, this);
    if (!this.discovered.includes(r.id)) {
      this.discovered.push(r.id);
      this.xp += 40;
      this.toast('NEW AREA DISCOVERED · ' + r.name + ' +40 XP');
    }
    if (['fuel', 'garage'].includes(r.type) && Math.hypot(p.x - (r.id % 6 * 1400 + 460), p.y - (Math.floor(r.id / 6) * 1400 + 350)) < 130 && Math.abs(p.speed) < 30) {
      if (r.type === 'fuel') p.fuel = WD.vehicle(p.car).fuel;
      else p.health = 100;
    }
    this.hornTimer -= dt;
    if (this.input.state.horn && this.hornTimer <= 0) {
      this.audio.tone(330, .3, this.settings.sound);
      this.hornTimer = .45;
    }
    this.saveTimer += dt;
    if (this.saveTimer > 10) {
      this.saveTimer = 0;
      if (!this.save()) this.toast('Autosave unavailable — browser storage is blocked');
    }
  }
  frame(stamp) {
    const dt = Math.min((stamp - this.last) / 1000 || 0, .05);
    this.last = stamp;
    this.time += dt;
    if (this.started && !this.paused) {
      this.accumulator += dt;
      let ticks = 0;
      while (this.accumulator >= 1 / 60 && ticks < 4) {
        this.step(1 / 60);
        this.accumulator -= 1 / 60;
        ticks++;
      }
    } else this.accumulator = 0;
    this.cam.x += (this.player.x - this.cam.x) * Math.min(1, dt * 7);
    this.cam.y += (this.player.y - this.cam.y) * Math.min(1, dt * 7);
    const zoom = this.cameraMode ? .65 : Math.max(.65, 1 - Math.abs(this.player.speed) / 1200);
    this.cam.zoom += (zoom - this.cam.zoom) * Math.min(1, dt * 3);
    // Keep the viewport inside the finite world, including on wide displays.
    const halfW = Math.min(WD.WIDTH / 2, this.w / (2 * this.cam.zoom));
    const halfH = Math.min(WD.HEIGHT / 2, this.h / (2 * this.cam.zoom));
    this.cam.x = WD.clamp(this.cam.x, halfW, WD.WIDTH - halfW);
    this.cam.y = WD.clamp(this.cam.y, halfH, WD.HEIGHT - halfH);
    this.draw();
    this.audio.update(this.player.speed, this.settings, this.paused);
    if (this.started) this.ui.hud(this.time);
    requestAnimationFrame(t => this.frame(t));
  }
  draw() {
    const c = this.ctx,
      w = this.w,
      h = this.h,
      z = this.cam.zoom;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.fillStyle = '#264448';
    c.fillRect(0, 0, w, h);
    c.save();
    const shake = this.settings.shake && this.player.hitTimer > .8 && !this.paused ? Math.sin(this.time * 90) * 3 : 0;
    c.translate(w / 2 + shake, h / 2);
    c.scale(z, z);
    c.translate(-this.cam.x, -this.cam.y);
    const bounds = {
      x: this.cam.x - w / 2 / z,
      y: this.cam.y - h / 2 / z,
      w: w / z,
      h: h / z
    };
    this.world.draw(c, bounds, this.time, this.day.night, this.settings.quality, this.traffic.time);
    this.traffic.draw(c, this.day.night, bounds);
    this.missions.draw(c, this.time);
    WD.paintCar(c, this.player.x, this.player.y, this.player.angle, this.player.color, WD.vehicle(this.player.car), this.day.night);
    if (!this.started) {
      WD.paintCar(c, this.player.x + Math.sin(this.time * .7) * 250, this.player.y + 180, 0, '#efa775', WD.VEHICLES[1]);
    }
    c.restore();
    this.day.draw(c, w, h);
    this.weather.draw(c, w, h, this.settings);
  }
};
