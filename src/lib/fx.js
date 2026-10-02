export const reducedMotion = () =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Canvas can't read CSS custom properties, so the palette lives here too.
// Keep in sync with :root in app.css.
export const INK = {
  bone: '#ece8dd',
  hot: '#ff4a1c',
  dim: '#8a877e',
};
