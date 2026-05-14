import { Check, Sparkles } from "lucide-react";
import EmotionSelector from "./EmotionSelector";

export default function DiaryModal({
  isOpen,
  text,
  emotion,
  error,
  aiEmotionStatus = "idle",
  aiEmotionMessage = "",
  onTextChange,
  onEmotionChange,
  onDetectEmotion,
  onClose,
  onSubmit
}) {
  if (!isOpen) return null;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit();
  }

  const isDetectingEmotion = aiEmotionStatus === "loading";

  return (
    <div className="modal-backdrop">
      <form className="paper-writing-modal" onSubmit={handleSubmit} role="dialog" aria-label="记录情绪">
        <div className="paper-writing-scene">
          <div className="writing-paper">
            <img src="/assets/objects/paper_flat.png" alt="信纸" />
            <label className="visually-hidden" htmlFor="diary-text">
              想交给星空的话
            </label>
            <textarea
              id="diary-text"
              className="paper-textarea"
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              placeholder="今天有点累，但我想把它交给星空"
              rows={8}
              autoFocus
            />

            <div className={`ai-emotion-helper is-${aiEmotionStatus}`}>
              <button
                className="ai-emotion-button"
                type="button"
                onClick={onDetectEmotion}
                disabled={isDetectingEmotion}
              >
                <Sparkles size={16} />
                {isDetectingEmotion ? "小伙伴正在认真感受中…" : "让远方的小伙伴轻轻感受一下你的心情"}
              </button>
              {aiEmotionMessage ? (
                <p className="ai-emotion-message" role="status" aria-live="polite">
                  {aiEmotionMessage}
                </p>
              ) : null}
            </div>

            <div className="paper-button-row paper-actions">
              <button className="paper-overlay-button" type="button" onClick={onClose}>
                取消
              </button>
              <button className="paper-overlay-button" type="submit">
                <Check size={16} />
                完成
              </button>
            </div>
          </div>

          <EmotionSelector value={emotion} onChange={onEmotionChange} />

          {error ? <p className="form-error paper-form-error">{error}</p> : null}
        </div>
      </form>
    </div>
  );
}
