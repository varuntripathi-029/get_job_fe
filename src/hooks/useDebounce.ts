import { useEffect, useState } from "react";

/** Trails `value` by `delay` ms. Used to keep search inputs responsive while
 * the request only fires once the typing stops. */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
