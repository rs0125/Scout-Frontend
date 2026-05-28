import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useViewport, BREAKPOINTS } from './useViewport';

const setViewport = (width, height = 800) => {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true });
};

describe('useViewport', () => {
  beforeEach(() => {
    setViewport(1024, 768);
    vi.useFakeTimers();
  });

  it('VP-1: width 375 is mobile', () => {
    setViewport(375, 800);
    const { result } = renderHook(() => useViewport());
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.isDesktop).toBe(false);
  });

  it('VP-2: width 768 is tablet', () => {
    setViewport(768, 1024);
    const { result } = renderHook(() => useViewport());
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.isDesktop).toBe(false);
  });

  it('VP-3: width 1024 is desktop', () => {
    setViewport(1024, 800);
    const { result } = renderHook(() => useViewport());
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current.isDesktop).toBe(true);
    expect(result.current.isLarge).toBe(false);
  });

  it('VP-4: width 1500 is large', () => {
    setViewport(1500, 900);
    const { result } = renderHook(() => useViewport());
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current.isLarge).toBe(true);
    expect(result.current.isDesktop).toBe(true);
  });

  it('VP-5: resize bursts coalesce to a single state update after 150ms', () => {
    setViewport(1024, 768);
    const { result } = renderHook(() => useViewport());

    act(() => {
      setViewport(375, 800);
      window.dispatchEvent(new Event('resize'));
      setViewport(500, 800);
      window.dispatchEvent(new Event('resize'));
      setViewport(700, 800);
      window.dispatchEvent(new Event('resize'));
    });

    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(result.current.width).toBe(700);
    expect(result.current.isMobile).toBe(true);
  });

  it('VP-6: width > height yields landscape orientation', () => {
    setViewport(1024, 600);
    const { result } = renderHook(() => useViewport());
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(result.current.orientation).toBe('landscape');

    act(() => {
      setViewport(600, 1024);
      window.dispatchEvent(new Event('resize'));
      vi.advanceTimersByTime(160);
    });
    expect(result.current.orientation).toBe('portrait');
  });

  it('VP-7: getResponsiveValue precedence is large > desktop > tablet > mobile > default', () => {
    setViewport(1500, 900);
    const { result } = renderHook(() => useViewport());
    act(() => {
      vi.advanceTimersByTime(160);
    });

    expect(
      result.current.getResponsiveValue({
        mobile: 'm',
        tablet: 't',
        desktop: 'd',
        large: 'L',
      })
    ).toBe('L');

    expect(
      result.current.getResponsiveValue({ mobile: 'm', default: 'def' })
    ).toBe('def');
  });

  it('exports BREAKPOINTS constants', () => {
    expect(BREAKPOINTS).toMatchObject({ mobile: 320, tablet: 768, desktop: 1024, large: 1440 });
  });
});
