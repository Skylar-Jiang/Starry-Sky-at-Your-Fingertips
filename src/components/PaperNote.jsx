export default function PaperNote({ record, isFolded = false, isThrowing = false, onFold, onThrow, onCancel }) {
  if (!record) return null;

  return (
    <aside className="paper-flow" aria-live="polite">
      {!isFolded ? (
        <div className="paper-note-scene">
          <div className="letter-paper">
            <img src="/assets/objects/paper_flat.png" alt="" aria-hidden="true" />
            <p>{record.text}</p>

            <div className="paper-button-row">
              <button className="paper-overlay-button" type="button" onClick={() => onCancel?.(record.id)}>
                取消
              </button>
              <button className="paper-overlay-button" type="button" onClick={onFold}>
                折成纸团
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={isThrowing ? "paper-ball-scene is-throwing" : "paper-ball-scene"}>
          <img
            src="/assets/objects/paper_ball.png"
            alt="纸团"
            className={`paper-ball-img ${isThrowing ? "throwing-animation" : ""}`}
            onClick={onThrow}
          />
          {!isThrowing ? <p className="paper-throw-hint">点击纸团，用力投向星空吧！</p> : null}
        </div>
      )}
    </aside>
  );
}
