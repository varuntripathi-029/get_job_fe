import { useEffect, type RefObject } from "react";
import { gsap } from "gsap";

interface MagicCardOptions {
  /** How many drifting particles to spawn on hover. 0 disables them. */
  particleCount?: number;
  /** 3D tilt toward the cursor. Off by default — it fights a CSS hover-lift. */
  enableTilt?: boolean;
  /** Subtle pull toward the cursor. Uses transform, so drop hover-lift if on. */
  enableMagnetism?: boolean;
  /** Ripple from the click point. */
  clickEffect?: boolean;
  /** Master switch, e.g. to skip the effect on a variant. */
  enabled?: boolean;
}

const isReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const isCoarsePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;

/**
 * The per-card half of the MagicBento effect: hover particles, optional tilt
 * and magnetism, and a click ripple, attached to an existing element by ref.
 *
 * The cursor border-glow and spotlight are driven separately and globally by
 * <GlobalSpotlight />. This keeps card components as they are — they just add
 * the `magic-card` class and call this hook — rather than being wrapped.
 *
 * Skipped entirely for reduced-motion and touch: no hover there, and the moving
 * parts are pure decoration. The static border glow (CSS) still applies.
 */
export function useMagicCard(
  ref: RefObject<HTMLElement | null>,
  {
    particleCount = 8,
    enableTilt = false,
    enableMagnetism = false,
    clickEffect = true,
    enabled = true,
  }: MagicCardOptions = {},
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || isReducedMotion() || isCoarsePointer()) return;

    const particles: HTMLDivElement[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    let hovered = false;
    let magnetTween: gsap.core.Tween | null = null;

    const spawnParticles = () => {
      const { width, height } = el.getBoundingClientRect();
      for (let i = 0; i < particleCount; i++) {
        const timeout = setTimeout(() => {
          if (!hovered) return;
          const particle = document.createElement("div");
          particle.className = "magic-particle";
          particle.style.left = `${Math.random() * width}px`;
          particle.style.top = `${Math.random() * height}px`;
          el.appendChild(particle);
          particles.push(particle);

          gsap.fromTo(
            particle,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.3, ease: "back.out(1.7)" },
          );
          gsap.to(particle, {
            x: (Math.random() - 0.5) * 80,
            y: (Math.random() - 0.5) * 80,
            rotation: Math.random() * 360,
            duration: 2 + Math.random() * 2,
            ease: "none",
            repeat: -1,
            yoyo: true,
          });
          gsap.to(particle, {
            opacity: 0.3,
            duration: 1.5,
            ease: "power2.inOut",
            repeat: -1,
            yoyo: true,
          });
        }, i * 90);
        timeouts.push(timeout);
      }
    };

    const clearParticles = () => {
      timeouts.forEach(clearTimeout);
      timeouts.length = 0;
      magnetTween?.kill();
      particles.forEach((particle) => {
        gsap.to(particle, {
          scale: 0,
          opacity: 0,
          duration: 0.3,
          ease: "back.in(1.7)",
          onComplete: () => particle.remove(),
        });
      });
      particles.length = 0;
    };

    const onEnter = () => {
      hovered = true;
      if (particleCount > 0) spawnParticles();
    };

    const onLeave = () => {
      hovered = false;
      clearParticles();
      if (enableTilt || enableMagnetism) {
        gsap.to(el, {
          rotateX: 0,
          rotateY: 0,
          x: 0,
          y: 0,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const onMove = (event: MouseEvent) => {
      if (!enableTilt && !enableMagnetism) return;
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const cx = rect.width / 2;
      const cy = rect.height / 2;

      if (enableTilt) {
        gsap.to(el, {
          rotateX: ((y - cy) / cy) * -6,
          rotateY: ((x - cx) / cx) * 6,
          duration: 0.15,
          ease: "power2.out",
          transformPerspective: 1000,
        });
      }
      if (enableMagnetism) {
        magnetTween = gsap.to(el, {
          x: (x - cx) * 0.03,
          y: (y - cy) * 0.03,
          duration: 0.3,
          ease: "power2.out",
        });
      }
    };

    const onClick = (event: MouseEvent) => {
      if (!clickEffect) return;
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height),
      );

      const ripple = document.createElement("div");
      ripple.className = "magic-ripple";
      ripple.style.width = `${maxDistance * 2}px`;
      ripple.style.height = `${maxDistance * 2}px`;
      ripple.style.left = `${x - maxDistance}px`;
      ripple.style.top = `${y - maxDistance}px`;
      el.appendChild(ripple);

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
          onComplete: () => ripple.remove(),
        },
      );
    };

    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.addEventListener("mousemove", onMove);
    el.addEventListener("click", onClick);

    return () => {
      hovered = false;
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("click", onClick);
      clearParticles();
      gsap.set(el, { clearProps: "transform" });
    };
  }, [ref, particleCount, enableTilt, enableMagnetism, clickEffect, enabled]);
}
