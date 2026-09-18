'use strict';
WD.DEFAULTS = {
  music: 0,
  sound: .25,
  quality: 'medium',
  traffic: 1,
  weather: true,
  shake: true,
  controls: 62
};
WD.Save = {
  key: 'world-drive-2d-v1',
  available: true,
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (d.version !== 1 || !d.player || !WD.VEHICLES.some(v => v.id === d.player.car)) return null;
      const p = d.player;
      for (const k of ['x', 'y', 'angle', 'health', 'fuel'])
        if (!Number.isFinite(p[k])) return null;
      if (p.x < 0 || p.x > WD.WIDTH || p.y < 0 || p.y > WD.HEIGHT) return null;
      p.health = WD.clamp(p.health, 0, 100);
      p.fuel = WD.clamp(p.fuel, 0, WD.vehicle(p.car).fuel);
      p.color = /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#d0ed78';
      d.coins = WD.clamp(Number(d.coins) || 0, 0, 1e7);
      d.xp = WD.clamp(Number(d.xp) || 0, 0, 1e7);
      d.owned = Array.isArray(d.owned) ? d.owned.filter(id => WD.VEHICLES.some(v => v.id === id)) : ['compact'];
      if (!d.owned.includes('compact')) d.owned.push('compact');
      if (!d.owned.includes(p.car)) p.car = 'compact';
      d.discovered = Array.isArray(d.discovered) ? [...new Set(d.discovered.filter(n => Number.isInteger(n) && n >= 0 && n < 30))] : [];
      const s = d.settings || {};
      d.settings = {
        music: WD.clamp(Number(s.music) || 0, 0, 1),
        sound: WD.clamp(Number(s.sound) || 0, 0, 1),
        quality: ['low', 'medium', 'high'].includes(s.quality) ? s.quality : 'medium',
        traffic: WD.clamp(Number(s.traffic) || 0, 0, 1.5),
        weather: s.weather !== false,
        shake: s.shake !== false,
        controls: WD.clamp(Number(s.controls) || 62, 45, 80)
      };
      const m = d.missions || {};
      d.missions = {
        index: Math.floor(WD.clamp(Number(m.index) || 0, 0, 1e7)),
        elapsed: WD.clamp(Number(m.elapsed) || 0, 0, 150),
        completed: Math.floor(WD.clamp(Number(m.completed) || 0, 0, 1e7))
      };
      return d;
    } catch (e) {
      this.available = false;
      return null;
    }
  },
  write(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify({
        ...data,
        version: 1
      }));
      this.available = true;
      return true;
    } catch (e) {
      this.available = false;
      return false;
    }
  },
  reset() {
    try {
      localStorage.removeItem(this.key);
      return true;
    } catch (e) {
      return false;
    }
  }
};

// Store preferences independently so the title-screen settings also persist.
WD.Save.loadSettings = function() {
  try {
    const s = JSON.parse(localStorage.getItem(this.key + '-settings'));
    if (!s || typeof s !== 'object') return {};
    return {
      music: WD.clamp(Number(s.music) || 0, 0, 1),
      sound: WD.clamp(Number(s.sound) || 0, 0, 1),
      traffic: WD.clamp(Number(s.traffic) || 0, 0, 1.5),
      controls: WD.clamp(Number(s.controls) || 62, 45, 80),
      quality: ['low', 'medium', 'high'].includes(s.quality) ? s.quality : 'medium',
      weather: s.weather !== false,
      shake: s.shake !== false
    };
  } catch (e) {
    return {};
  }
};
WD.Save.writeSettings = function(settings) {
  try {
    localStorage.setItem(this.key + '-settings', JSON.stringify(settings));
    return true;
  } catch (e) {
    return false;
  }
};
