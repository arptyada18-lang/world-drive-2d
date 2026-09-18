'use strict';
try {
  window.worldDrive = new WD.Game();
} catch (error) {
  console.error(error);
  document.getElementById('loading').textContent = 'Could not start World Drive 2D. Refresh in a current browser. ' + error.message;
}
