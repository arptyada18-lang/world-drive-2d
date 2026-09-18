// Dependency-free tests of the actual gameplay systems. Node is for tests only.
const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const data = new Map();
const env = {
  console,
  Math,
  Map,
  Set,
  localStorage: {
    getItem: k => data.get(k) || null,
    setItem: (k, v) => data.set(k, v),
    removeItem: k => data.delete(k)
  }
};
env.window = env;
vm.createContext(env);
for (const f of ['vehicles', 'world', 'player', 'traffic', 'dayNight', 'weather', 'missions', 'saveSystem']) vm.runInContext(fs.readFileSync(__dirname + '/../js/' + f + '.js', 'utf8'), env, {
  filename: f
});
const W = env.WD;
let passed = 0;

function test(name, fn) {
  fn();
  console.log('PASS ' + name);
  passed++;
}
const road = {
  surface: () => 1,
  collide: () => false
};
test('17 unique vehicles, positive independent stats', () => {
  assert.equal(W.VEHICLES.length, 17);
  assert.equal(new Set(W.VEHICLES.map(v => v.id)).size, 17);
  for (const v of W.VEHICLES)
    for (const k of ['speed', 'accel', 'brake', 'handling', 'durability', 'fuel', 'offroad']) assert(v[k] > 0);
});
test('Acceleration, steering, reverse and handbrake', () => {
  const p = new W.Player();
  for (let i = 0; i < 120; i++) p.update(1 / 60, {
    gas: true
  }, road);
  assert(p.x > 500);
  assert(p.speed > 100);
  p.update(.1, {
    right: true
  }, road);
  assert(p.angle > 0);
  const speed = p.speed;
  p.update(.2, {
    handbrake: true
  }, road);
  assert(p.speed < speed);
  for (let i = 0; i < 240; i++) p.update(1 / 60, {
    brake: true
  }, road);
  assert(p.speed < 0);
});
test('Empty fuel and destroyed cars cannot reverse', () => {
  for (const state of [{
      fuel: 0
    }, {
      health: 0
    }]) {
    const p = new W.Player(state);
    p.update(1, {
      brake: true
    }, road);
    assert.equal(p.speed, 0);
    p.update(1, {
      gas: true
    }, road);
    assert.equal(p.speed, 0);
  }
});
test('Fuel consumption, damage cooldown and terrain resistance', () => {
  const p = new W.Player();
  p.update(1, {
    gas: true
  }, road);
  assert(p.fuel < 65);
  p.damage(20);
  const h = p.health;
  p.damage(20);
  assert.equal(p.health, h);
  const a = new W.Player(),
    b = new W.Player();
  for (let i = 0; i < 600; i++) {
    a.update(1 / 60, {
      gas: true
    }, road);
    b.update(1 / 60, {
      gas: true
    }, {
      ...road,
      surface: () => .45
    });
  }
  assert(b.speed < a.speed);
});
test('Thirty regions load deterministically; at most nine chunks retained', () => {
  const w = new W.World();
  assert.equal(W.REGIONS.length, 30);
  const a = JSON.stringify(w.chunk(0, 0).props);
  for (const r of W.REGIONS) {
    w.update(r.x, r.y);
    assert(w.chunks.size <= 9);
    assert.equal(W.regionAt(r.x, r.y).id, r.id);
  }
  w.update(350, 350);
  assert.equal(JSON.stringify(w.chunk(0, 0).props), a);
});
test('Deep water recovery and connected bridge corridors', () => {
  const w = new W.World();
  assert(w.water(7800, 2200));
  assert(!w.water(8050, 2200));
  const p = new W.Player({
    x: 7800,
    y: 2200
  });
  w.update(p.x, p.y);
  assert.equal(p.update(.1, {}, w), 'Recovered from deep water');
  assert(W.onRoad(p.x, p.y));
});
test('Traffic spawns, density zero despawns; moving train warns ahead', () => {
  const t = new W.Traffic(),
    p = new W.Player({
      x: 1050,
      y: 1050
    });
  for (let i = 0; i < 300; i++) t.update(1 / 60, p, {
    traffic: 1
  });
  assert(t.cars.length > 0);
  assert(t.cars.length <= 18);
  assert(t.trainX > -350);
  assert(t.gateClosed(t.trainX + 600));
  assert(!t.gateClosed(t.trainX + 1000));
  t.update(.1, p, {
    traffic: 0
  });
  assert.equal(t.cars.length, 0);
});
test('Sun/moon state and complete clock cycle', () => {
  const d = new W.DayNight();
  assert(!d.night);
  d.update(24 * 12);
  assert(d.night);
  assert.equal(d.label, '21:00');
  d.update(24 * 12);
  assert.equal(d.label, '09:00');
});
test('Weather cycles and regional snow reduce grip', () => {
  const w = new W.Weather();
  w.update(131, {
    type: 'city'
  });
  assert.equal(w.kind, 'Rain');
  assert(w.grip < 1);
  w.update(0, {
    type: 'snow'
  });
  assert.equal(w.kind, 'Snow');
  assert(w.grip < 1);
});
test('Checkpoint rewards and mission advancement', () => {
  const m = new W.Missions();
  let saved = false;
  const g = {
    player: m.target(),
    coins: 0,
    xp: 0,
    toast() {},
    save() {
      saved = true;
    }
  };
  m.update(1, g);
  assert(g.coins > 0);
  assert.equal(g.xp, 120);
  assert.equal(m.index, 1);
  assert(saved);
});
test('Save round trip, bad JSON, bad position and preference persistence', () => {
  const s = {
    player: new W.Player(),
    owned: ['compact'],
    coins: 470,
    xp: 390,
    settings: W.DEFAULTS,
    missions: {
      index: 2
    },
    discovered: [0, 1]
  };
  assert(W.Save.write(s));
  assert.equal(W.Save.load().coins, 470);
  assert.equal(W.Save.load().missions.index, 2);
  W.Save.writeSettings({
    ...W.DEFAULTS,
    quality: 'low'
  });
  assert.equal(W.Save.loadSettings().quality, 'low');
  data.set(W.Save.key, '{bad');
  assert.equal(W.Save.load(), null);
  W.Save.write({
    ...s,
    player: {
      ...s.player,
      x: -1
    }
  });
  assert.equal(W.Save.load(), null);
});
test('Blocked storage fails gracefully', () => {
  env.localStorage.setItem = () => {
    throw Error('blocked');
  };
  assert.equal(W.Save.write({}), false);
  assert.equal(W.Save.writeSettings(W.DEFAULTS), false);
});
console.log(passed + ' system checks passed. Browser/device checks are separate.');
