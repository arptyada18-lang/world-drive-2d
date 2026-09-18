'use strict';
window.WD = {};
WD.VEHICLES = [
  ['compact', 'City Compact', 'Hatchback', 270, 125, 3.0, 100, 65, .55, 0],
  ['sedan', 'Vista', 'Sedan', 310, 138, 2.8, 115, 72, .55, 250],
  ['suv', 'Ridge', 'SUV', 290, 130, 2.6, 150, 90, .84, 400],
  ['sport', 'Vector', 'Sports car', 395, 190, 3.4, 90, 70, .43, 750],
  ['super', 'Comet', 'Supercar', 470, 220, 3.2, 85, 80, .35, 1400],
  ['muscle', 'Rumble', 'Muscle car', 365, 180, 2.5, 130, 85, .55, 650],
  ['electric', 'Volt', 'Electric car', 345, 185, 3.1, 110, 95, .6, 600],
  ['pickup', 'Trail', 'Pickup truck', 275, 120, 2.5, 155, 95, .88, 400],
  ['jeep', 'Scout', 'Jeep', 265, 135, 3.2, 140, 80, .94, 450],
  ['offroad', 'Crawler', 'Off-road', 250, 145, 3.0, 180, 100, 1, 650],
  ['taxi', 'Metro Cab', 'Taxi', 300, 135, 3, 110, 85, .55, 300],
  ['patrol', 'Blue Watch', 'Fictional patrol', 350, 165, 3.1, 140, 85, .7, 850],
  ['medic', 'Care One', 'Fictional ambulance', 280, 125, 2.4, 165, 100, .6, 800],
  ['bus', 'City Liner', 'Bus', 235, 95, 1.8, 230, 145, .4, 1000],
  ['truck', 'Freighter', 'Truck', 225, 90, 1.7, 250, 150, .6, 950],
  ['van', 'Parcel', 'Delivery van', 275, 115, 2.5, 145, 100, .6, 350],
  ['tractor', 'Harvest', 'Tractor', 150, 90, 2.2, 190, 110, 1, 300]
].map(([id, name, type, speed, accel, handling, durability, fuel, offroad, cost]) => ({
  id,
  name,
  type,
  speed,
  accel,
  handling,
  durability,
  fuel,
  offroad,
  cost,
  brake: accel * 2,
  length: ['bus', 'truck'].includes(id) ? 62 : 40,
  width: ['bus', 'truck'].includes(id) ? 28 : 22
}));
WD.vehicle = id => WD.VEHICLES.find(v => v.id === id) || WD.VEHICLES[0];
WD.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
WD.paintCar = function(ctx, x, y, angle, color, v, lights = false) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const l = v.length,
    w = v.width;
  ctx.fillStyle = '#0005';
  ctx.fillRect(-l / 2 + 4, -w / 2 + 5, l, w);
  ctx.fillStyle = '#142328';
  ctx.fillRect(-l * .34, -w * .65, l * .2, w * 1.3);
  ctx.fillRect(l * .18, -w * .65, l * .2, w * 1.3);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(-l / 2, -w / 2, l, w, 5);
  ctx.fill();
  ctx.fillStyle = '#15323b';
  ctx.fillRect(-l * .15, -w * .4, l * .25, w * .8);
  ctx.fillStyle = '#8dd9e0';
  ctx.fillRect(l * .12, -w * .38, l * .13, w * .76);
  ctx.fillStyle = '#ffeab0';
  ctx.fillRect(l / 2 - 4, -w / 2 + 2, 4, 5);
  ctx.fillRect(l / 2 - 4, w / 2 - 7, 4, 5);
  ctx.fillStyle = '#e86559';
  ctx.fillRect(-l / 2, -w / 2 + 2, 3, 5);
  ctx.fillRect(-l / 2, w / 2 - 7, 3, 5);
  if (lights) {
    ctx.fillStyle = '#fff7bb20';
    ctx.beginPath();
    ctx.moveTo(l / 2, -w / 2);
    ctx.lineTo(l / 2 + 120, -50);
    ctx.lineTo(l / 2 + 120, 50);
    ctx.lineTo(l / 2, w / 2);
    ctx.fill();
  }
  ctx.restore();
};
