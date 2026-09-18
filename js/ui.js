'use strict';
WD.UI = class {
  constructor(game) {
    this.g = game;
    this.panel = document.getElementById('panel');
    this.menu = document.getElementById('menu');
    this.body = document.getElementById('panelBody');
    this.last = 0;
    document.querySelectorAll('[data-panel]').forEach(b => b.onclick = () => this.open(b.dataset.panel));
    document.getElementById('closePanel').onclick = () => this.close();
    this.panel.addEventListener('cancel', e => {
      e.preventDefault();
      this.close();
    });
    this.menu.addEventListener('cancel', e => e.preventDefault());
    document.getElementById('play').onclick = () => {
      if (game.hasSave) {
        this.open('new');
        return;
      }
      game.start(false);
    };
    document.getElementById('continue').onclick = () => game.start(true);
    document.getElementById('continue').disabled = !game.hasSave;
    this.menu.showModal();
  }
  open(name) {
    this.g.input?.clear();
    this.g.paused = true;
    document.getElementById('touch').hidden = true;
    this.body.replaceChildren();
    document.getElementById('panelTitle').textContent = {
      map: 'World atlas',
      garage: 'Garage & collection',
      settings: 'Settings',
      controls: 'How to drive',
      pause: 'Take a break',
      new: 'Start a new journey',
      tutorial: 'Your first drive',
      reset: 'Reset saved progress'
    } [name] || name;
    if (!this.panel.open) this.panel.showModal();
    if (name === 'map') {
      this.body.innerHTML = '<p class="muted">North is up · gold circle = checkpoint · white dot = you · red line = railway</p><canvas id="worldmap" width="840" height="700" aria-label="Map of thirty world districts"></canvas><p class="muted">Roads connect every district. Crossing corridors through water act as bridges.</p>';
      this.drawMap(document.getElementById('worldmap'), true);
    }
    if (name === 'garage') {
      this.garage();
      if (!this.g.started) {
        this.body.querySelectorAll('button,input').forEach(el => el.disabled = true);
        const note = document.createElement('p');
        note.textContent = 'Collection preview — choose Play or Continue to customize your cars.';
        this.body.prepend(note);
      }
    }
    if (name === 'controls' || name === 'tutorial') {
      this.body.innerHTML = '<p><b>W / ↑</b> accelerate · <b>S / ↓</b> brake, then reverse<br><b>A D / ← →</b> steer · <b>Space</b> handbrake<br><b>H</b> horn · <b>C</b> camera zoom · <b>M</b> map<br><b>G</b> garage · <b>P / Esc</b> pause</p><p>On phones, hold the steering and pedal buttons together. Head toward the gold checkpoint for coins and XP. North is at the top of the map. Off-road surfaces reduce speed.</p><p>Garage menu offers vehicle changes, repair and fuel. Visit Energy Stop or Roadside Garage for free service when near the sign. Recovery is always free, so you cannot become stranded.</p>';
      this.button(name === 'tutorial' ? 'Got it / Skip tutorial' : 'Back', () => {
        this.g.tutorial = true;
        this.close();
        this.g.save();
      });
    }
    if (name === 'pause') {
      this.button('Resume', () => this.close());
      for (const [label, target] of [
          ['World map', 'map'],
          ['Garage', 'garage'],
          ['Controls', 'controls'],
          ['Settings', 'settings']
        ]) this.button(label, () => this.open(target));
      this.button('Save game', () => this.g.toast(this.g.save() ? 'Game saved' : 'Saving unavailable in this browser'));
      this.button('Recover to safe road', () => {
        this.g.recover();
        this.close();
      });
      this.button('Restart / New game', () => this.open('new'));
    }
    if (name === 'settings') this.settings();
    if (name === 'new' || name === 'reset') {
      this.body.innerHTML = '<p>This replaces your saved cars, coins, discoveries and mission progress. Continue?</p>';
      this.button('Cancel', () => this.close());
      this.button('Start new game', () => {
        WD.Save.reset();
        this.panel.close();
        this.g.start(false);
      });
    }
  }
  button(text, fn) {
    const b = document.createElement('button');
    b.textContent = text;
    b.onclick = fn;
    b.style.margin = '6px';
    this.body.appendChild(b);
    return b;
  }
  close() {
    this.panel.close();
    this.g.paused = !this.g.started;
    this.g.input.clear();
    document.activeElement?.blur();
    document.getElementById('touch').hidden = !(this.g.started && this.g.input.mobile);
  }
  garage() {
    const g = this.g,
      v = WD.vehicle(g.player.car);
    this.body.innerHTML = '<p id="balance"></p><label>Car color <input id="carColor" type="color"></label><p class="muted">Stats shown for every car: speed, acceleration, brakes, handling, durability, capacity and off-road rating. Selecting a car preserves your fuel percentage.</p>';
    document.getElementById('balance').textContent = 'Coins: ' + g.coins + ' · Current: ' + v.name;
    const color = document.getElementById('carColor');
    color.value = g.player.color;
    color.oninput = () => {
      g.player.color = color.value;
      g.save();
    };
    this.button('Repair — 60 coins', () => {
      if (g.coins < 60) {
        g.toast('Not enough coins — recovery is free');
        return;
      }
      g.coins -= 60;
      g.player.health = 100;
      g.save();
      this.open('garage');
    });
    this.button('Refuel / charge — 40 coins', () => {
      if (g.coins < 40) {
        g.toast('Not enough coins — recovery is free');
        return;
      }
      g.coins -= 40;
      g.player.fuel = WD.vehicle(g.player.car).fuel;
      g.save();
      this.open('garage');
    });
    this.button('Free roadside recovery', () => {
      g.recover();
      this.close();
    });
    const grid = document.createElement('div');
    grid.className = 'garage-grid';
    this.body.appendChild(grid);
    for (const car of WD.VEHICLES) {
      const owned = g.owned.includes(car.id),
        card = document.createElement('article');
      card.className = 'car-card' + (car.id === v.id ? ' selected' : '');
      card.innerHTML = '<h3>' + car.name + '</h3><p>' + car.type + '</p><p>Top ' + Math.round(car.speed * .42) + ' km/h · Accel ' + car.accel + ' · Brake ' + car.brake + '<br>Handling ' + car.handling + ' · Durability ' + car.durability + '<br>Capacity ' + car.fuel + ' · Off-road ' + Math.round(car.offroad * 100) + '%</p>';
      const b = document.createElement('button');
      b.textContent = owned ? (car.id === v.id ? 'Selected' : 'Drive this car') : 'Buy — ' + car.cost + ' coins';
      b.disabled = car.id === v.id || (!owned && g.coins < car.cost);
      b.onclick = () => {
        if (!owned) {
          if (g.coins < car.cost) return;
          g.coins -= car.cost;
          g.owned.push(car.id);
        }
        const ratio = g.player.fuel / WD.vehicle(g.player.car).fuel;
        g.player.car = car.id;
        g.player.fuel = ratio * car.fuel;
        g.player.speed = 0;
        g.save();
        this.open('garage');
      };
      card.appendChild(b);
      grid.appendChild(card);
    }
  }
  settings() {
    const g = this.g;
    const specs = [
      ['music', 'Music volume', 0, 1, .05],
      ['sound', 'Sound volume', 0, 1, .05],
      ['traffic', 'Traffic density', 0, 1.5, .5],
      ['controls', 'Mobile control size', 45, 80, 1]
    ];
    for (const [key, label, min, max, step] of specs) {
      const row = document.createElement('label');
      row.textContent = label;
      const input = document.createElement('input');
      input.type = 'range';
      input.min = min;
      input.max = max;
      input.step = step;
      input.value = g.settings[key];
      input.setAttribute('aria-label', label);
      input.oninput = () => {
        g.settings[key] = Number(input.value);
        g.applySettings();
        g.saveSettings();
      };
      row.appendChild(input);
      this.body.appendChild(row);
    }
    const row = document.createElement('label');
    row.textContent = 'Graphics quality';
    const s = document.createElement('select');
    s.setAttribute('aria-label', 'Graphics quality');
    for (const q of ['low', 'medium', 'high']) {
      const o = document.createElement('option');
      o.value = q;
      o.textContent = q;
      s.appendChild(o);
    }
    s.value = g.settings.quality;
    s.onchange = () => {
      g.settings.quality = s.value;
      g.applySettings();
      g.saveSettings();
    };
    row.appendChild(s);
    this.body.appendChild(row);
    for (const [key, title] of [
        ['weather', 'Weather effects'],
        ['shake', 'Screen shake']
      ]) {
      const row = document.createElement('label');
      row.textContent = title;
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = g.settings[key];
      input.onchange = () => {
        g.settings[key] = input.checked;
        g.saveSettings();
      };
      row.appendChild(input);
      this.body.appendChild(row);
    }
    this.button('Reset save / New game', () => this.open('reset'));
  }
  hud(time) {
    if (time - this.last < .15) return;
    this.last = time;
    const g = this.g,
      p = g.player,
      v = WD.vehicle(p.car),
      r = WD.regionAt(p.x, p.y);
    document.getElementById('region').textContent = r.name;
    document.getElementById('sky').textContent = g.day.label + ' · ' + g.weather.kind + ' · ' + g.direction();
    document.getElementById('speed').textContent = Math.round(Math.abs(p.speed) * .42);
    document.getElementById('stats').textContent = (v.id === 'electric' ? 'Battery ' : 'Fuel ') + Math.round(p.fuel / v.fuel * 100) + '% · Health ' + Math.round(p.health) + '% | ' + g.coins + ' coins | Lv ' + (1 + Math.floor(g.xp / 300)) + ' · ' + g.xp + ' XP';
    const m = g.missions.current,
      t = g.missions.target();
    document.getElementById('missionText').textContent = m.name + ' → ' + Math.round(Math.hypot(t.x - p.x, t.y - p.y) / 10) + ' m' + (m.seconds ? ' · ' + Math.max(0, Math.ceil(m.seconds - g.missions.elapsed)) + 's' : '');
    this.drawMap(document.getElementById('mini'), false);
  }
  drawMap(canvas, full) {
    const ctx = canvas.getContext('2d'),
      p = this.g.player;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    if (full) ctx.scale(canvas.width / WD.WIDTH, canvas.height / WD.HEIGHT);
    else {
      ctx.translate(80, 80);
      ctx.scale(.09, .09);
      ctx.translate(-p.x, -p.y);
    }
    for (const r of WD.REGIONS) {
      const x = r.id % 6 * 1400,
        y = Math.floor(r.id / 6) * 1400;
      ctx.fillStyle = r.color;
      ctx.fillRect(x, y, 1400, 1400);
      if (full) {
        ctx.strokeStyle = '#172b3580';
        ctx.lineWidth = 12;
        ctx.strokeRect(x, y, 1400, 1400);
        ctx.fillStyle = '#10282c';
        ctx.font = 'bold 100px Arial';
        ctx.fillText(r.name, x + 50, y + 180);
      }
    }
    ctx.strokeStyle = '#465552';
    ctx.lineWidth = 70;
    for (let x = 350; x < WD.WIDTH; x += 700) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, WD.HEIGHT);
      ctx.stroke();
    }
    for (let y = 350; y < WD.HEIGHT; y += 700) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WD.WIDTH, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#a95345';
    ctx.lineWidth = 25;
    ctx.beginPath();
    ctx.moveTo(0, 2100);
    ctx.lineTo(WD.WIDTH, 2100);
    ctx.stroke();
    const t = this.g.missions.target();
    ctx.strokeStyle = '#ffe56c';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 70, 0, Math.PI * 2);
    ctx.stroke();
    if (!full) {
      ctx.fillStyle = '#efa263';
      for (const c of this.g.traffic.cars) ctx.fillRect(c.x - 20, c.y - 20, 40, 40);
    }
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, full ? 50 : 35, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x + Math.cos(p.angle) * 100, p.y + Math.sin(p.angle) * 100);
    ctx.stroke();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.fillText('N ↑', 10, 16);
  }
};
