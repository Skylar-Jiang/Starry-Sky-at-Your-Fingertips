import { useEffect, useState } from "react";
import { Send } from "lucide-react";
import { createStarPlacement } from "../utils/starPlacement";

export default function PaperNote({ record, records = [], onThrowComplete }) {
  const [isFolded, setIsFolded] = useState(false);
  const [isThrowing, setIsThrowing] = useState(false);

  useEffect(() => {
    setIsFolded(false);
    setIsThrowing(false);
  }, [record?.id]);

  if (!record) return null;

  function handleThrow() {
    if (isThrowing) return;

    setIsThrowing(true);

    window.setTimeout(() => {
      onThrowComplete({
        recordId: record.id,
        star: createStarPlacement({
          viewportWidth: typeof window === "undefined" ? 1200 : window.innerWidth,
          viewportHeight: typeof window === "undefined" ? 800 : window.innerHeight,
          existingStars: records
        })
      });
      setIsFolded(false);
      setIsThrowing(false);
    }, 800);
  }

  return (
    <aside className="paper-flow" aria-live="polite">
      {!isFolded ? (
        <div className="paper-note">
          <p className="paper-state">等待折成纸团</p>
          <div className="letter-paper">
            <img src="/assets/objects/paper_flat.png" alt="" aria-hidden="true" />
            <p>{record.text}</p>
          </div>
          <button className="secondary-button" type="button" onClick={() => setIsFolded(true)}>
            折成纸团
          </button>
        </div>
      ) : (
        <div className={isThrowing ? "paper-ball is-throwing" : "paper-ball"}>
          <img
            src="/assets/objects/paper_ball.png"
            alt="纸团"
            className={`paper-ball-img ${isThrowing ? "throwing-animation" : ""}`}
            onClick={handleThrow}
          />
          {!isThrowing ? <p className="paper-throw-hint">点击纸团，投向星空</p> : null}
          {!isThrowing ? (
            <button className="primary-button" type="button" onClick={handleThrow}>
              <Send size={17} />
              投向星空
            </button>
          ) : null}
        </div>
      )}
    </aside>
  );
}
