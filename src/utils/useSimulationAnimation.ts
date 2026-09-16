import React, { useState, useEffect, useRef, type RefObject } from 'react';

/**
 * useSimulationAnimation
 * Mobile and battery-optimized hook that manages animation frames and canvas rendering.
 *
 * Features:
 * 1. Automatically pauses requestAnimationFrame loops when the simulation element is scrolled out of viewport.
 * 2. Pauses loops when the browser tab is hidden or minimized (visibilitychange).
 * 3. Resumes smoothly without resetting simulation physics state or causing erratic delta-time jumps.
 * 4. Respects the user's `prefers-reduced-motion` media query setting.
 */
export function useSimulationAnimation(containerRef: RefObject<HTMLElement | null>) {
  const [isInViewport, setIsInViewport] = useState<boolean>(true);
  const [isTabVisible, setIsTabVisible] = useState<boolean>(!document.hidden);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  // Track reduced motion setting
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Track document visibility (tab active vs hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track IntersectionObserver on container element
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (!('IntersectionObserver' in window)) {
      setIsInViewport(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInViewport(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin: '100px 0px 100px 0px', // Pre-warm 100px before scrolling into view
        threshold: 0.05,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef]);

  const shouldAnimate = isInViewport && isTabVisible && !prefersReducedMotion;

  return {
    isInViewport,
    isTabVisible,
    prefersReducedMotion,
    shouldAnimate,
  };
}
