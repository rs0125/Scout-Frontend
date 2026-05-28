import { describe, it, expect, beforeEach, vi } from 'vitest';

const getRoot = () => document.getElementById('app-toast-root');
const getToasts = () => Array.from(document.querySelectorAll('.toast'));

// toast.js caches its container in module scope. Reset between tests so
// document.body.innerHTML cleanup doesn't leave the cache pointing at a
// detached node.
const loadToast = async () => {
  vi.resetModules();
  return import('./toast');
};

describe('toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('TOAST-1: lazily creates the toast root with aria-live=polite and renders an info toast by default', async () => {
    const { showToast } = await loadToast();
    showToast('hello');
    const root = getRoot();
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute('aria-live', 'polite');

    const toasts = getToasts();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]).toHaveClass('toast--info');
    expect(toasts[0]).toHaveTextContent('hello');
  });

  it('TOAST-2: applies the requested type class', async () => {
    const { showToast } = await loadToast();
    showToast('boom', { type: 'error' });
    expect(getToasts()[0]).toHaveClass('toast--error');

    showToast('yay', { type: 'success' });
    const toasts = getToasts();
    expect(toasts[toasts.length - 1]).toHaveClass('toast--success');
  });

  it('TOAST-3: auto-dismisses after duration with an out-animation grace period', async () => {
    const { showToast } = await loadToast();
    showToast('auto', { duration: 1000 });
    expect(getToasts()).toHaveLength(1);

    vi.advanceTimersByTime(1000);
    expect(getToasts()[0]).toHaveClass('toast--out');

    vi.advanceTimersByTime(220);
    expect(getToasts()).toHaveLength(0);
  });

  it('TOAST-4: clicking dismisses immediately and cancels the timer', async () => {
    const { showToast } = await loadToast();
    showToast('click-me', { duration: 5000 });
    const toast = getToasts()[0];

    toast.click();
    expect(toast).toHaveClass('toast--out');

    vi.advanceTimersByTime(220);
    expect(getToasts()).toHaveLength(0);

    vi.advanceTimersByTime(5000);
  });

  it('TOAST-5: multi-line text uses pre-wrap whitespace', async () => {
    const { showToast } = await loadToast();
    showToast('line1\nline2');
    expect(getToasts()[0]).toHaveStyle({ whiteSpace: 'pre-wrap' });
  });

  it('TOAST-6: destroyAllToasts empties the container but keeps it mounted', async () => {
    const { showToast, destroyAllToasts } = await loadToast();
    showToast('a');
    showToast('b');
    expect(getToasts()).toHaveLength(2);

    destroyAllToasts();
    expect(getToasts()).toHaveLength(0);
    expect(getRoot()).toBeInTheDocument();
  });
});
