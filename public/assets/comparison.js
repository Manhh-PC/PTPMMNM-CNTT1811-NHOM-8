/* A distinct ordered pair and one shared split value for pointer, range and keyboard. */
(function (root) {
  'use strict';

  const clamp = n => Math.min(100, Math.max(0, Number.isFinite(Number(n)) ? Number(n) : 50));
  const validPair = (a, b) => Boolean(a && b && Number(a.id) !== Number(b.id) && Number(a.asset_id) === Number(b.asset_id) && Number(a.version_number) < Number(b.version_number));
  const splitAt = (x, rect) => rect.width > 0 ? clamp((x - rect.left) / rect.width * 100) : 50;
  function bindSlider(stage, range, initial = 50, onChange = () => {}) {
    const handle = stage.querySelector('.overlay-handle');
    let split = 50,
      activePointer = null;
    function set(value) {
      split = Math.round(clamp(value));
      stage.style.setProperty('--split', split + '%');
      range.value = String(split);
      handle.setAttribute('aria-valuenow', String(split));
      handle.setAttribute('aria-valuetext', split + '% bản cũ');
      onChange(split);
    }
    const fromPointer = e => set(splitAt(e.clientX, stage.getBoundingClientRect()));
    stage.addEventListener('pointerdown', e => {
      if (e.button !== 0 || activePointer !== null) return;
      e.preventDefault();
      activePointer = e.pointerId;
      stage.setPointerCapture(e.pointerId);
      fromPointer(e);
    });
    stage.addEventListener('pointermove', e => {
      if (e.pointerId === activePointer) fromPointer(e);
    });
    stage.addEventListener('pointerup', e => {
      if (e.pointerId !== activePointer) return;
      fromPointer(e);
      activePointer = null;
      if (stage.hasPointerCapture(e.pointerId)) stage.releasePointerCapture(e.pointerId);
    });
    const cancel = e => {
      if (e.pointerId === activePointer) activePointer = null;
    };
    stage.addEventListener('pointercancel', cancel);
    stage.addEventListener('lostpointercapture', cancel);
    range.addEventListener('input', () => set(range.value));
    range.addEventListener('change', () => set(range.value));
    handle.addEventListener('keydown', e => {
      const step = e.shiftKey ? 10 : 1;
      const values = {
        ArrowLeft: split - step,
        ArrowRight: split + step,
        Home: 0,
        End: 100
      };
      if (Object.hasOwn(values, e.key)) {
        e.preventDefault();
        set(values[e.key]);
      }
    });
    set(initial);
    return {
      set,
      get: () => split
    };
  }
  const api = {
    validPair,
    splitAt,
    clamp,
    bindSlider
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;else root.PixelComparison = api;
})(typeof window !== 'undefined' ? window : this);
