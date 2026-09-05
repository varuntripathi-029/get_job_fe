import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";
import { gsap } from "gsap";

import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
}

interface NavPillsProps {
  items: NavItem[];
  activePath: string;
  ease?: string;
}

/**
 * The desktop nav links as React Bits PillNav pills: a brand-green circle grows
 * from the bottom to fill each pill on hover while the label swaps to an
 * on-brand copy that slides up behind it. Themed off the app's tokens so it
 * follows light/dark. Purely a hover flourish — labels stay legible with no JS
 * (touch, reduced motion), and routing is the plain NavLink underneath.
 */
export function NavPills({ items, activePath, ease = "power3.easeOut" }: NavPillsProps) {
  const circleRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const tlRefs = useRef<Array<gsap.core.Timeline | null>>([]);
  const activeTweenRefs = useRef<Array<gsap.core.Tween | null>>([]);

  useEffect(() => {
    const layout = () => {
      circleRefs.current.forEach((circle, index) => {
        if (!circle?.parentElement) return;
        const pill = circle.parentElement as HTMLElement;
        const { width: w, height: h } = pill.getBoundingClientRect();
        if (!w || !h) return; // hidden (mobile) — re-run on resize

        // Radius of a circle that, rising from the pill's bottom edge, just
        // covers the whole pill. Straight from the PillNav source.
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        circle.style.width = `${D}px`;
        circle.style.height = `${D}px`;
        circle.style.bottom = `-${delta}px`;
        gsap.set(circle, { xPercent: -50, scale: 0, transformOrigin: `50% ${originY}px` });

        const label = pill.querySelector<HTMLElement>(".pill-label");
        const hover = pill.querySelector<HTMLElement>(".pill-label-hover");
        if (label) gsap.set(label, { y: 0 });
        if (hover) gsap.set(hover, { y: h + 12, opacity: 0 });

        tlRefs.current[index]?.kill();
        const tl = gsap.timeline({ paused: true });
        tl.to(circle, { scale: 1.2, xPercent: -50, duration: 2, ease, overwrite: "auto" }, 0);
        if (label) tl.to(label, { y: -(h + 8), duration: 2, ease, overwrite: "auto" }, 0);
        if (hover) {
          gsap.set(hover, { y: Math.ceil(h + 100), opacity: 0 });
          tl.to(hover, { y: 0, opacity: 1, duration: 2, ease, overwrite: "auto" }, 0);
        }
        tlRefs.current[index] = tl;
      });
    };

    layout();
    window.addEventListener("resize", layout);
    document.fonts?.ready.then(layout).catch(() => {});
    return () => window.removeEventListener("resize", layout);
  }, [items, ease]);

  const enter = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(tl.duration(), { duration: 0.3, ease, overwrite: "auto" });
  };

  const leave = (i: number) => {
    const tl = tlRefs.current[i];
    if (!tl) return;
    activeTweenRefs.current[i]?.kill();
    activeTweenRefs.current[i] = tl.tweenTo(0, { duration: 0.2, ease, overwrite: "auto" });
  };

  return (
    <ul className="m-0 flex list-none items-center gap-4 p-0">
      {items.map((item, i) => {
        const isActive = activePath.startsWith(item.to);
        return (
          <li key={item.to} className="flex">
            <NavLink
              to={item.to}
              onMouseEnter={() => enter(i)}
              onMouseLeave={() => leave(i)}
              className={cn(
                "text-mono rounded-pill relative inline-flex cursor-pointer items-center overflow-hidden px-16 py-8 no-underline transition-colors duration-200",
                isActive ? "text-brand bg-brand-10" : "text-text-secondary",
              )}
            >
              <span
                ref={(el) => {
                  circleRefs.current[i] = el;
                }}
                aria-hidden
                className="bg-brand rounded-avatar pointer-events-none absolute bottom-0 left-1/2 z-[1] block"
                style={{ willChange: "transform" }}
              />
              <span className="relative z-[2] inline-block leading-none">
                <span
                  className="pill-label relative z-[2] inline-block leading-none"
                  style={{ willChange: "transform" }}
                >
                  {item.label}
                </span>
                <span
                  className="pill-label-hover text-text-on-brand absolute left-0 top-0 z-[3] inline-block"
                  style={{ willChange: "transform, opacity" }}
                  aria-hidden
                >
                  {item.label}
                </span>
              </span>
            </NavLink>
          </li>
        );
      })}
    </ul>
  );
}
