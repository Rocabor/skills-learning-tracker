import { useEffect } from 'react';
import type { RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let triggerElement: HTMLElement | null = null;

export const rememberFocusedElement = () => {
  const el = document.activeElement as HTMLElement | null;
  if (el && el !== document.body && el !== document.documentElement) {
    triggerElement = el;
  }
};

export const useFocusTrap = (containerRef: RefObject<HTMLElement | null>, isOpen: boolean) => {
  useEffect(() => {
    if (!isOpen) return;
    const container = containerRef.current;
    if (!container) return;

    const getFocusable = () => {
      const els = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      return Array.from(els).filter(
        (el) => el.getClientRects().length > 0 || el === document.activeElement,
      );
    };

    const focusables = getFocusable();
    if (focusables.length > 0 && !container.contains(document.activeElement)) {
      focusables[0].focus();
    } else if (focusables.length === 0) {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const els = getFocusable();
      if (els.length === 0) {
        e.preventDefault();
        return;
      }
      const first = els[0];
      const last = els[els.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (e.shiftKey && (active === first || !container.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !container.contains(active))) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      if (triggerElement && document.contains(triggerElement)) {
        triggerElement.focus();
      }
      triggerElement = null;
    };
  }, [containerRef, isOpen]);
};
