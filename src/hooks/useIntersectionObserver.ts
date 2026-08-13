import { useEffect, useRef, useState } from "react";

/**
 * Fires once when the element first scrolls into view and then stops watching.
 *
 * One-shot on purpose: these drive entrance animations, and re-running them
 * every time a card scrolls past turns a nice reveal into a flicker.
 */
export function useIntersectionObserver<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15 },
) {
  const ref = useRef<T | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || isVisible) return;

    // Without IntersectionObserver, show the content rather than hide it.
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  return { ref, isVisible };
}
