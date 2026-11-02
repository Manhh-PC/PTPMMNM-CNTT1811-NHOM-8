/* Coordinates are calculated from the image rectangle, never from its padded container. */
(function (root) {
  'use strict';

  const clamp = v => Math.min(1, Math.max(0, v));
  const point = (clientX, clientY, rect) => ({
    x: clamp((clientX - rect.left) / rect.width),
    y: clamp((clientY - rect.top) / rect.height)
  });
  const rectangle = (a, b) => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y)
  });
  const display = (a, width, height) => ({
    x: a.x * width,
    y: a.y * height,
    w: (a.w || 0) * width,
    h: (a.h || 0) * height
  });
  const geometry = {
    point,
    rectangle,
    display
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = geometry;else root.PixelGeometry = geometry;
})(typeof window !== 'undefined' ? window : this);
