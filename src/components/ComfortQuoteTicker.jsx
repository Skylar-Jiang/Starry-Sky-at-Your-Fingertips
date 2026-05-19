import { useEffect, useMemo, useState } from "react";
import { getComfortQuotes } from "../config/comfortQuotes";

export default function ComfortQuoteTicker({ currentEmotion, quiet = false }) {
  const quotes = useMemo(() => getComfortQuotes(currentEmotion), [currentEmotion]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [quotes]);

  useEffect(() => {
    if (quiet || quotes.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % quotes.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, [quiet, quotes.length]);

  return (
    <aside className={`comfort-quote-ticker ${quiet ? "is-quiet" : ""}`} aria-live="polite">
      <span aria-hidden="true" />
      <p key={quotes[index]}>{quotes[index]}</p>
    </aside>
  );
}
