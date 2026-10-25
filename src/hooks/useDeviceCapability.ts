import { useState, useEffect, useCallback } from 'react';

export interface DeviceCapability {
  isMobile: boolean;
  isTouch: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  viewportWidth: number;
  viewportHeight: number;
  visualViewportHeight: number;
  isKeyboardOpen: boolean;
  keyboardHeight: number;
  hasNotch: boolean;
  orientation: 'portrait' | 'landscape';
  prefersReducedMotion: boolean;
}

/**
 * Robust device capability and responsive viewport detection hook.
 * Combines viewport dimensions, pointer coarse capability, touch support,
 * Visual Viewport API, and accessibility motion preferences.
 */
export function useDeviceCapability(): DeviceCapability {
  const checkCapability = useCallback((): DeviceCapability => {
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTouch: false,
        isTablet: false,
        isDesktop: true,
        viewportWidth: 1280,
        viewportHeight: 800,
        visualViewportHeight: 800,
        isKeyboardOpen: false,
        keyboardHeight: 0,
        hasNotch: false,
        orientation: 'landscape',
        prefersReducedMotion: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const orientation: 'portrait' | 'landscape' = width > height ? 'landscape' : 'portrait';

    // Check pointer capability (coarse = finger touch screen, fine = mouse pointer)
    const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const hasTouchEvents = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const isTouch = hasCoarsePointer || hasTouchEvents;

    // Accessibility: prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mobile viewport threshold: <= 768px or coarse pointer in portrait
    const isMobileWidth = width <= 768;
    const isTabletWidth = width > 768 && width <= 1024;

    const isMobile = isMobileWidth || (isTouch && orientation === 'portrait' && width <= 820);
    const isTablet = !isMobile && (isTabletWidth || (isTouch && width <= 1024));
    const isDesktop = !isMobile && !isTablet;

    // Visual Viewport tracking for soft keyboard detection
    const vv = window.visualViewport;
    const visualViewportHeight = vv ? Math.round(vv.height) : height;
    const heightDiff = height - visualViewportHeight;
    // On mobile devices, a keyboard opening shrinks the visual viewport by >= 140px
    const isKeyboardOpen = isMobile && heightDiff > 140;
    const keyboardHeight = isKeyboardOpen ? Math.max(0, heightDiff) : 0;

    // Detection of display notches / safe-area insets
    const hasNotch = isMobile && (
      (window.screen?.height && window.screen.height > 800) ||
      CSS.supports('padding-top: env(safe-area-inset-top)')
    );

    return {
      isMobile,
      isTouch,
      isTablet,
      isDesktop,
      viewportWidth: width,
      viewportHeight: height,
      visualViewportHeight,
      isKeyboardOpen,
      keyboardHeight,
      hasNotch,
      orientation,
      prefersReducedMotion,
    };
  }, []);

  const [capability, setCapability] = useState<DeviceCapability>(checkCapability);

  useEffect(() => {
    let timeoutId: number | null = null;

    const handleResize = () => {
      if (timeoutId) cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(() => {
        setCapability(checkCapability());
      });
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });

    const motionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionMedia.addEventListener?.('change', handleResize);

    // Track visual viewport changes (e.g. mobile soft keyboard show/hide, pinch zoom)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize, { passive: true });
      window.visualViewport.addEventListener('scroll', handleResize, { passive: true });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      motionMedia.removeEventListener?.('change', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
        window.visualViewport.removeEventListener('scroll', handleResize);
      }
      if (timeoutId) cancelAnimationFrame(timeoutId);
    };
  }, [checkCapability]);

  return capability;
}
