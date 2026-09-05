import { useEffect } from "react";
import { gsap } from "gsap";

const SPOTLIGHT_RADIUS = 300;

/**
 * A single cursor-following spotlight for the whole app. It drives the border
 * glow on every `.magic-card` on the page by writing their --glow-* variables,
 * and fades a soft radial highlight in as the cursor nears a card.
 *
 * Mounted once at the app shell. The card list is read live on each frame, so
 * cards that mount and unmount as you navigate are picked up automatically.
 * Skipped for reduced-motion and touch, where a cursor glow means nothing.
 */
export function GlobalSpotlight() {
  useEffect(() => {
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      window.matchMedia("(pointer: coarse)").matches
    ) {
      return;
    }

    const spotlight = document.createElement("div");
    spotlight.className = "global-spotlight";
    document.body.appendChild(spotlight);

    const proximity = SPOTLIGHT_RADIUS * 0.5;
    const fadeDistance = SPOTLIGHT_RADIUS * 0.75;
    let frame = 0;

    const clearGlow = () => {
      document
        .querySelectorAll<HTMLElement>(".magic-card")
        .forEach((card) => card.style.setProperty("--glow-intensity", "0"));
    };

    const onMove = (event: MouseEvent) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const cards = document.querySelectorAll<HTMLElement>(".magic-card");
        if (cards.length === 0) {
          gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: "power2.out" });
          return;
        }

        let minDistance = Infinity;
        cards.forEach((card) => {
          const rect = card.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const distance =
            Math.hypot(event.clientX - centerX, event.clientY - centerY) -
            Math.max(rect.width, rect.height) / 2;
          const effective = Math.max(0, distance);
          minDistance = Math.min(minDistance, effective);

          let intensity = 0;
          if (effective <= proximity) intensity = 1;
          else if (effective <= fadeDistance) {
            intensity = (fadeDistance - effective) / (fadeDistance - proximity);
          }

          const relX = ((event.clientX - rect.left) / rect.width) * 100;
          const relY = ((event.clientY - rect.top) / rect.height) * 100;
          card.style.setProperty("--glow-x", `${relX}%`);
          card.style.setProperty("--glow-y", `${relY}%`);
          card.style.setProperty("--glow-intensity", `${intensity}`);
        });

        gsap.to(spotlight, {
          left: event.clientX,
          top: event.clientY,
          duration: 0.1,
          ease: "power2.out",
        });

        const targetOpacity =
          minDistance <= proximity
            ? 0.8
            : minDistance <= fadeDistance
              ? ((fadeDistance - minDistance) / (fadeDistance - proximity)) * 0.8
              : 0;
        gsap.to(spotlight, {
          opacity: targetOpacity,
          duration: targetOpacity > 0 ? 0.2 : 0.5,
          ease: "power2.out",
        });
      });
    };

    const onLeave = () => {
      clearGlow();
      gsap.to(spotlight, { opacity: 0, duration: 0.3, ease: "power2.out" });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);

    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
      spotlight.remove();
    };
  }, []);

  return null;
}
