import { emotionConfig } from "../config/emotionConfig";

export default function PaperNote({
  record,
  emotion,
  targetStar,
  isFolded = false,
  isThrowing = false,
  onFold,
  onThrow,
  onCancel,
  gesturePointer = null
}) {
  if (!record) return null;
  const config = emotionConfig[emotion || record.emotion] || emotionConfig.calm;

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
        <div
          className={`${isThrowing ? "paper-ball-scene is-throwing" : "paper-ball-scene"} ${
            gesturePointer && !isThrowing ? "is-gesture-grabbed" : ""
          }`}
          style={
            gesturePointer && !isThrowing
              ? { "--gesture-grab-x": `${gesturePointer.x}px`, "--gesture-grab-y": `${gesturePointer.y}px` }
              : null
          }
        >
          {isThrowing && targetStar ? (
            <span
              className="paper-meteor-trail"
              aria-hidden="true"
              style={{
                "--meteor-color": config.starColor,
                "--meteor-target-x": `${targetStar.x}px`,
                "--meteor-target-y": `${targetStar.y}px`
              }}
            />
          ) : null}
          <img
            src="/assets/objects/paper_ball.png"
            alt="纸团"
            className={`paper-ball-img ${isThrowing ? "throwing-animation" : ""}`}
            onClick={onThrow}
          />
          {!isThrowing ? (
            <p className="paper-throw-hint">
              {gesturePointer ? "已抓住。手可以放稳，向上推一下或点击投出。" : "点击纸团，用力投向星空吧！"}
            </p>
          ) : null}
        </div>
      )}
    </aside>
  );
}
