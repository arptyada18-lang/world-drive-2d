'use strict';
WD.SECTOR = 1400;
WD.COLS = 6;
WD.ROWS = 5;
WD.WIDTH = 8400;
WD.HEIGHT = 7000;
WD.REGIONS = [
  ['Mega City', '#739584', 'city', 'Central Tower'],
  ['Small City', '#819a88', 'city', 'Lantern Square'],
  ['Village', '#99ac69', 'village', 'Green Valley'],
  ['Forest', '#568563', 'forest', 'Emerald Forest'],
  ['Dense Forest', '#356747', 'forest', 'Deepwood'],
  ['Highway', '#96a779', 'road', 'Northway'],
  ['Expressway', '#9aa879', 'road', 'Horizon Route'],
  ['Railway Zone', '#92958c', 'rail', 'Crossing East'],
  ['Railway Station', '#92968e', 'rail', 'Grand Station'],
  ['Beach', '#d6c392', 'beach', 'Sunset Beach'],
  ['Coastal Road', '#b2b98d', 'coast', 'Seabreeze'],
  ['Sea Area', '#318f9b', 'sea', 'Ocean Causeway'],
  ['River', '#7ba383', 'river', 'Blue River'],
  ['Lake', '#77a182', 'lake', 'Mirror Lake'],
  ['Bridge', '#358996', 'sea', 'Ocean Bridge'],
  ['Farm Area', '#aab265', 'farm', 'Golden Fields'],
  ['Desert', '#ceac77', 'desert', 'Amber Dunes'],
  ['Mountain Road', '#8f9998', 'mountain', 'Eagle Mountain'],
  ['Snow Area', '#c5d7d9', 'snow', 'Frost Pass'],
  ['Industrial Zone', '#878f8b', 'industry', 'Foundry'],
  ['Airport Area', '#8eab96', 'airport', 'Horizon Airport'],
  ['Port', '#759999', 'port', 'Bluewater Port'],
  ['Residential Area', '#93ac8a', 'village', 'Meadow Homes'],
  ['Market Area', '#b1a087', 'city', 'Market Square'],
  ['Petrol Station', '#9cab87', 'fuel', 'Energy Stop'],
  ['Garage', '#8aa58c', 'garage', 'Roadside Garage'],
  ['Car Showroom', '#9aaa94', 'city', 'Motor Plaza'],
  ['Parking Area', '#939b94', 'parking', 'Park & Ride'],
  ['Tunnel', '#747f7c', 'mountain', 'Stone Tunnel'],
  ['Off-road Dirt', '#b1976c', 'dirt', 'Dust Trails']
].map(([name, color, type, landmark], i) => ({
  id: i,
  name,
  color,
  type,
  landmark,
  x: (i % 6) * 1400 + 700,
  y: Math.floor(i / 6) * 1400 + 700
}));
WD.regionAt = (x, y) => WD.REGIONS[WD.clamp(Math.floor(y / 1400), 0, 4) * 6 + WD.clamp(Math.floor(x / 1400), 0, 5)];
WD.roadDistance = (v) => Math.abs(((v % 700) + 700) % 700 - 350);
WD.onRoad = (x, y) => WD.roadDistance(x) < 62 || WD.roadDistance(y) < 62;
WD.safeRoad = (x, y) => ({
  x: WD.clamp(Math.round((x - 350) / 700) * 700 + 350, 350, 8050),
  y: WD.clamp(Math.round((y - 350) / 700) * 700 + 350, 350, 6650)
});
WD.World = class {
  constructor() {
    this.chunks = new Map();
  }
  chunk(cx, cy) {
    const key = cx + ',' + cy;
    if (this.chunks.has(key)) return this.chunks.get(key);
    const r = WD.regionAt(cx * 1400 + 1, cy * 1400 + 1);
    let seed = (cx + 1) * 7919 + (cy + 1) * 1223;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const props = [];
    for (let i = 0; i < 75; i++) {
      const x = cx * 1400 + 80 + random() * 1240,
        y = cy * 1400 + 80 + random() * 1240;
      if (WD.roadDistance(x) < 105 || WD.roadDistance(y) < 105 || Math.abs(y - 2100) < 75) continue;
      const tree = ['forest', 'village', 'farm'].includes(r.type);
      props.push({
        x,
        y,
        w: tree ? 22 + random() * 18 : 45 + random() * 55,
        h: tree ? 28 : 40 + random() * 65,
        tree,
        tone: random()
      });
    }
    const c = {
      cx,
      cy,
      r,
      props
    };
    this.chunks.set(key, c);
    return c;
  }
  update(x, y) {
    const cx = Math.floor(x / 1400),
      cy = Math.floor(y / 1400);
    for (let j = cy - 1; j <= cy + 1; j++)
      for (let i = cx - 1; i <= cx + 1; i++)
        if (i >= 0 && j >= 0 && i < 6 && j < 5) this.chunk(i, j);
    for (const [k, c] of this.chunks)
      if (Math.abs(c.cx - cx) > 1 || Math.abs(c.cy - cy) > 1) this.chunks.delete(k);
  }
  water(x, y) {
    if (WD.onRoad(x, y)) return false;
    const t = WD.regionAt(x, y).type;
    return t === 'sea' || (t === 'beach' && x % 1400 > 900) || (t === 'coast' && x % 1400 > 1100) || (t === 'river' && Math.abs(x % 1400 - 700) < 130) || (t === 'lake' && Math.hypot(x % 1400 - 700, y % 1400 - 700) < 330);
  }
  collide(x, y) {
    if (this.water(x, y)) return 'water';
    for (const c of this.chunks.values())
      for (const p of c.props) {
        if (['sea', 'beach', 'coast', 'lake', 'river', 'road', 'airport', 'parking'].includes(c.r.type)) continue;
        if (Math.abs(x - p.x) < p.w / 2 + 12 && Math.abs(y - p.y) < p.h / 2 + 12) return 'solid';
      }
    return false;
  }
  surface(x, y) {
    if (WD.onRoad(x, y)) return 1;
    const t = WD.regionAt(x, y).type;
    return t === 'snow' ? .45 : ['desert', 'dirt'].includes(t) ? .5 : .65;
  }
  draw(ctx, bounds, time, night, quality, signalTime = time) {
    for (const c of this.chunks.values()) {
      const ox = c.cx * 1400,
        oy = c.cy * 1400;
      if (ox > bounds.x + bounds.w || oy > bounds.y + bounds.h || ox + 1400 < bounds.x || oy + 1400 < bounds.y) continue;
      const r = c.r;
      ctx.fillStyle = r.color;
      ctx.fillRect(ox, oy, 1400, 1400);
      if (['sea', 'beach', 'coast', 'river', 'lake'].includes(r.type)) {
        ctx.fillStyle = '#368e9b';
        if (r.type === 'lake') {
          ctx.beginPath();
          ctx.arc(ox + 700, oy + 700, 330, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const start = r.type === 'sea' ? 0 : r.type === 'river' ? 570 : r.type === 'coast' ? 1100 : 900;
          ctx.fillRect(ox + start, oy, r.type === 'river' ? 260 : 1400 - start, 1400);
        }
        ctx.strokeStyle = '#b6e4dc40';
        for (let i = 0; i < 20; i++) {
          const x = ox + 800 + Math.sin(i * 17) * 400,
            y = oy + i * 70 + Math.sin(time + i) * 8;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 55, y + 3);
          ctx.stroke();
        }
      }
      if (r.type === 'farm') {
        ctx.strokeStyle = '#777e37';
        ctx.lineWidth = 8;
        for (let y = oy + 60; y < oy + 1400; y += 35) {
          ctx.beginPath();
          ctx.moveTo(ox, y);
          ctx.lineTo(ox + 1400, y);
          ctx.stroke();
        }
      }
      // Wide shoulders distinguish paved streets from rough tracks.
      if (['city', 'industry', 'village'].includes(r.type)) {
        ctx.fillStyle = '#afbaa180';
        for (let i = 350; i < 1400; i += 700) {
          ctx.fillRect(ox+i-82, oy, 164, 1400);
          ctx.fillRect(ox, oy+i-82, 1400, 164);
        }
      }
      const dirt = ['dirt', 'forest', 'village', 'desert', 'farm'].includes(r.type);
      ctx.fillStyle = dirt ? '#8c8270' : '#405055';
      for (let i = 350; i < 1400; i += 700) {
        ctx.fillRect(ox + i - 68, oy, 136, 1400);
        ctx.fillRect(ox, oy + i - 68, 1400, 136);
      }
      ctx.strokeStyle = dirt ? '#d4bc85' : '#e4d7a0';
      ctx.lineWidth = 2;
      ctx.setLineDash([23, 20]);
      for (let i = 350; i < 1400; i += 700) {
        ctx.beginPath();
        ctx.moveTo(ox + i, oy);
        ctx.lineTo(ox + i, oy + 1400);
        ctx.moveTo(ox, oy + i);
        ctx.lineTo(ox + 1400, oy + i);
        ctx.stroke();
      }
      ctx.setLineDash([]);
      for (let i = 350; i < 1400; i += 700)
        for (let j = 350; j < 1400; j += 700) {
          ctx.fillStyle = '#405055';
          ctx.fillRect(ox + i - 64, oy + j - 64, 128, 128);
          ctx.fillStyle = '#e2e9da99';
          for (let k = -45; k <= 45; k += 15) ctx.fillRect(ox + i + k, oy + j - 84, 8, 28);
          ctx.fillStyle = Math.floor(signalTime / 6) % 2 ? '#eab664' : '#8be2a1';
          ctx.fillRect(ox + i + 72, oy + j + 68, 8, 13);
          if (night) {
            ctx.fillStyle = '#ffeca81c';
            ctx.beginPath();
            ctx.arc(ox + i - 78, oy + j - 78, 65, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      if (r.type === 'airport') {
        ctx.fillStyle = '#35464a';
        ctx.fillRect(ox + 550, oy + 80, 200, 1100);
        ctx.fillStyle = '#eeeecc';
        for (let y = oy + 100; y < oy + 1150; y += 90) ctx.fillRect(ox + 642, y, 14, 40);
      }
      if (r.id === 8) {
        ctx.fillStyle = '#d3c5a3';
        ctx.fillRect(ox + 400, oy + 745, 650, 75);
        ctx.fillStyle = '#547a80';
        ctx.fillRect(ox + 510, oy + 755, 320, 45);
      }
      if (r.type === 'parking') {
        ctx.strokeStyle = '#d2d7c4';
        for (let y = oy + 80; y < oy + 280; y += 40)
          for (let x = ox + 80; x < ox + 260; x += 40) ctx.strokeRect(x, y, 35, 35);
      }
      if (!['sea', 'beach', 'coast', 'lake', 'river', 'road', 'airport', 'parking'].includes(r.type))
        for (const p of c.props) {
          if (p.x < bounds.x - 100 || p.x > bounds.x + bounds.w + 100 || p.y < bounds.y - 100 || p.y > bounds.y + bounds.h + 100) continue;
          ctx.fillStyle = '#142e2a35';
          ctx.fillRect(p.x - p.w / 2 + 7, p.y - p.h / 2 + 9, p.w, p.h);
          if (p.tree) {
            ctx.fillStyle = p.tone > .5 ? '#2e6047' : '#3d7551';
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.w / 1.5, 0, Math.PI * 2);
            ctx.fill();
            if (quality !== 'low') {
              ctx.fillStyle = '#79a478';
              ctx.beginPath();
              ctx.arc(p.x - 7, p.y - 9, p.w / 3, 0, Math.PI * 2);
              ctx.fill();
            }
          } else {
            ctx.fillStyle = r.type === 'snow' ? '#e2eeee' : r.type === 'desert' ? '#9c855d' : p.tone > .5 ? '#c6beb0' : '#6a8285';
            ctx.fillRect(p.x - p.w / 2, p.y - p.h / 2, p.w, p.h);
            ctx.fillStyle = night ? '#ffc976' : '#24424b';
            ctx.fillRect(p.x - p.w / 2 + 8, p.y - p.h / 2 + 8, p.w - 16, 7);
            if (quality !== 'low' && !['desert','mountain'].includes(r.type)) {
              ctx.strokeStyle = '#ffffff30'; ctx.lineWidth = 2;
              ctx.strokeRect(p.x-p.w/2+4,p.y-p.h/2+4,p.w-8,p.h-8);
              ctx.fillStyle = night ? '#ffe39b' : '#314b50';
              for (let wx=12; wx<p.w-10; wx+=16)
                ctx.fillRect(p.x-p.w/2+wx,p.y+p.h/2-12,7,5);
              ctx.fillStyle='#425b5a40';
              ctx.fillRect(p.x-8,p.y-5,16,12);
            }
          }
        }
      ctx.fillStyle = '#1d343bdd';
      ctx.fillRect(ox + 440, oy + 255, 250, 36);
      ctx.fillStyle = '#f3f1d9';
      ctx.font = 'bold 15px Arial';
      ctx.fillText(r.landmark, ox + 451, oy + 279);
      if (['fuel', 'garage'].includes(r.type)) {
        ctx.fillStyle = r.type === 'fuel' ? '#eeb757' : '#8ebdde';
        ctx.fillRect(ox + 460, oy + 380, 110, 80);
        ctx.fillStyle = '#17333b';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(r.type === 'fuel' ? 'FUEL ⚡' : 'GARAGE', ox + 465, oy + 425);
      }
      if (r.id === 28) {
        ctx.fillStyle = '#26363cc0';
        ctx.fillRect(ox + 310, oy + 480, 80, 360);
        ctx.strokeStyle = '#c8c7b0';
        ctx.lineWidth = 12;
        ctx.strokeRect(ox + 300, oy + 480, 100, 360);
      }
    }
    // Continuous rail corridor joins both railway sectors.
    ctx.fillStyle = '#7a766c';
    ctx.fillRect(bounds.x, 2068, bounds.w, 64);
    ctx.strokeStyle = '#40494d';
    ctx.lineWidth = 7;
    for (let x = Math.floor(bounds.x / 28) * 28; x < bounds.x + bounds.w; x += 28) {
      ctx.beginPath();
      ctx.moveTo(x, 2070);
      ctx.lineTo(x, 2130);
      ctx.stroke();
    }
    ctx.strokeStyle = '#c5d1cd';
    ctx.lineWidth = 3;
    for (const y of [2082, 2118]) {
      ctx.beginPath();
      ctx.moveTo(bounds.x, y);
      ctx.lineTo(bounds.x + bounds.w, y);
      ctx.stroke();
    }
  }
};
