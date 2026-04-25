import { useState } from "react";
import { Send } from "lucide-react";
import AssetPlaceholder from "./AssetPlaceholder";
import { createStarPlacement } from "../utils/starPlacement";

export default function PaperNote({ record, records = [], onThrowComplete }) {
  const [isFolded, setIsFolded] = useState(false);

  if (!record) return null;

  function handleThrow() {
    onThrowComplete({
      recordId: record.id,
      star: createStarPlacement({
        viewportWidth: typeof window === "undefined" ? 1200 : window.innerWidth,
        viewportHeight: typeof window === "undefined" ? 800 : window.innerHeight,
        existingStars: records
      })
    });
    setIsFolded(false);
  }

  return (
    <aside className="paper-flow" aria-live="polite">
      {!isFolded ? (
        <div className="paper-note">
          <p className="paper-state">等待折成纸团</p>
          <AssetPlaceholder fileName="assets/objects/paper_flat.png" label="纸张" />
          <p>{record.text}</p>
          <button className="secondary-button" type="button" onClick={() => setIsFolded(true)}>
            折成纸团
          </button>
        </div>
      ) : (
        <div className="paper-ball">
          <AssetPlaceholder fileName="assets/objects/paper_ball.png" label="纸团" className="paper-ball-asset" />
          <button className="primary-button" type="button" onClick={handleThrow}>
            <Send size={17} />
            投向星空
          </button>
        </div>
      )}
    </aside>
  );
}
