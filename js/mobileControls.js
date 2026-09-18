'use strict';
WD.Input = class {
  constructor(game) {
    this.keys = {};
    this.pointers = new Map();
    this.mobile = matchMedia('(pointer:coarse)').matches;
    document.body.classList.toggle('mobile', this.mobile);
    const mapping = {
      KeyW: 'gas',
      ArrowUp: 'gas',
      KeyS: 'brake',
      ArrowDown: 'brake',
      KeyA: 'left',
      ArrowLeft: 'left',
      KeyD: 'right',
      ArrowRight: 'right',
      Space: 'handbrake',
      KeyH: 'horn'
    };
    addEventListener('keydown', e => {
      if (['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(e.target.tagName)) return;
      if (mapping[e.code]) {
        e.preventDefault();
        this.keys[e.code] = mapping[e.code];
      }
      if (e.repeat) return;
      const panel = {
        KeyM: 'map',
        KeyG: 'garage',
        KeyP: 'pause',
        Escape: 'pause'
      } [e.code];
      if (panel) {
        e.preventDefault();
        if (game.ui.panel.open) game.ui.close();
        else if (game.started) game.ui.open(panel);
      }
      if (e.code === 'KeyC') game.cameraMode = 1 - game.cameraMode;
    });
    addEventListener('keyup', e => {
      delete this.keys[e.code];
    });
    for (const button of document.querySelectorAll('[data-key]')) {
      button.addEventListener('pointerdown', e => {
        e.preventDefault();
        button.setPointerCapture(e.pointerId);
        this.pointers.set(e.pointerId, button.dataset.key);
        button.classList.add('active');
        game.audio.start();
      });
      const up = e => {
        this.pointers.delete(e.pointerId);
        button.classList.remove('active');
      };
      button.addEventListener('pointerup', up);
      button.addEventListener('pointercancel', up);
      button.addEventListener('lostpointercapture', up);
      button.addEventListener('contextmenu', e => e.preventDefault());
    }
    addEventListener('blur', () => {
      this.clear();
      if (game.started && !game.ui.panel.open) game.ui.open('pause');
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.clear();
        if (game.started && !game.ui.panel.open) game.ui.open('pause');
        game.save();
      }
    });
  }
  get state() {
    const all = [...Object.values(this.keys), ...this.pointers.values()];
    return Object.fromEntries(all.map(k => [k, true]));
  }
  clear() {
    this.keys = {};
    this.pointers.clear();
    document.querySelectorAll('[data-key]').forEach(b => b.classList.remove('active'));
  }
}
