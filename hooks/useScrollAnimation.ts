import { useEffect, useRef } from 'react';

// Shared observer instance
let observer: IntersectionObserver | null = null;
const callbacks = new Map<Element, () => void>();

const getObserver = () => {
  if (typeof window === 'undefined') return null;

  if (!observer) {
    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const callback = callbacks.get(entry.target);
            if (callback) {
              callback();
              // Once visible, we don't need to observe it anymore for entrance animation
              getObserver()?.unobserve(entry.target);
              callbacks.delete(entry.target);
            }
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px', // Pre-load slightly before coming into view
      }
    );
  }
  return observer;
};

export const useScrollAnimation = () => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element || typeof window === 'undefined') return;

    // Fallback if IntersectionObserver is not available
    if (!('IntersectionObserver' in window)) {
      element.classList.add('is-visible');
      return;
    }

    const obs = getObserver();
    if (!obs) return;

    // Register callback for this specific element
    callbacks.set(element, () => {
      element.classList.add('is-visible');
      // Adding will-change for performance hint during animation, remove after
      element.style.willChange = 'transform, opacity';
      const cleanup = () => {
        element.style.willChange = 'auto';
        element.removeEventListener('transitionend', cleanup);
      };
      element.addEventListener('transitionend', cleanup);
    });

    obs.observe(element);

    return () => {
      obs.unobserve(element);
      callbacks.delete(element);
    };
  }, []);

  return elementRef;
};