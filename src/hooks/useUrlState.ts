import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Read/write helpers over the URL query string, which is where every filter on
 * every list page lives so that pages stay bookmarkable and shareable.
 *
 * Setting a key to `undefined`, `null` or `""` removes it, so a cleared filter
 * leaves no trace in the URL instead of leaving `?industry=` behind.
 */
export function useUrlState() {
  const [params, setParams] = useSearchParams();

  const get = useCallback((key: string, fallback = "") => params.get(key) ?? fallback, [params]);

  const getNumber = useCallback(
    (key: string, fallback: number) => {
      const raw = params.get(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    },
    [params],
  );

  const getBool = useCallback(
    (key: string, fallback = false) => {
      const raw = params.get(key);
      if (raw === null) return fallback;
      return raw === "true" || raw === "1";
    },
    [params],
  );

  const getAll = useCallback(
    (key: string): string[] => {
      const raw = params.get(key);
      return raw ? raw.split(",").filter(Boolean) : [];
    },
    [params],
  );

  /** Applies a patch of keys at once. Any change other than `page` itself
   * resets pagination — landing on page 7 of a filter you just narrowed to two
   * results is never what the user meant. */
  const patch = useCallback(
    (updates: Record<string, string | number | boolean | string[] | null | undefined>) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          for (const [key, value] of Object.entries(updates)) {
            const serialised = Array.isArray(value) ? value.join(",") : value;
            if (serialised === undefined || serialised === null || serialised === "") {
              next.delete(key);
            } else {
              next.set(key, String(serialised));
            }
          }
          if (!("page" in updates)) next.delete("page");
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  const clear = useCallback(
    (keep: string[] = []) => {
      setParams(
        (previous) => {
          const next = new URLSearchParams();
          for (const key of keep) {
            const value = previous.get(key);
            if (value) next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return useMemo(
    () => ({ params, get, getNumber, getBool, getAll, patch, clear }),
    [params, get, getNumber, getBool, getAll, patch, clear],
  );
}
