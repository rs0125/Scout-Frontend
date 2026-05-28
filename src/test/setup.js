import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
  // toast.js caches its container at module scope. Remove all instances
  // (resetModules in tests can create a new one while the old DOM node stays).
  document.querySelectorAll('#app-toast-root').forEach((el) => el.remove());
});

// jsdom polyfills
if (typeof window !== 'undefined') {
  window.scrollTo = () => {};
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
}
