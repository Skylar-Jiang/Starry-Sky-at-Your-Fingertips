import { useEffect, useState } from "react";
import { resolveSceneSize } from "../utils/starCoordinates";

function getViewportFallback() {
  if (typeof window === "undefined") return resolveSceneSize();
  return resolveSceneSize({
    width: window.innerWidth,
    height: window.innerHeight
  });
}

export function useElementSize(ref) {
  const [size, setSize] = useState(getViewportFallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    function updateSize() {
      const rect = element.getBoundingClientRect();
      const fallback = getViewportFallback();
      setSize(resolveSceneSize({
        width: rect.width || fallback.width,
        height: rect.height || fallback.height
      }));
    }

    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return size;
}
