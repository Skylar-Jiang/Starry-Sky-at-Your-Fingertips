import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { getEmotionLabel } from "../config/emotionConfig";

export default function DriftStarDetailModal({ star, onClose, onPickup }) {
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [pickupError, setPickupError] = useState("");

  if (!star) return null;

  const recordDate = star.created_at ? String(star.created_at).slice(0, 10) : "未知日期";
  const recordTime = star.created_at ? String(star.created_at).slice(11, 19) : "";
  const driftCount = Number(star.drift_count) || 0;

  async function handlePickup() {
    if (isPickingUp || !onPickup) return;
    setIsPickingUp(true);
    setPickupError("");
    try {
      const result = await onPickup(star.id);
      if (result && result.error) {
        setPickupError(result.error);
      }
    } catch (error) {
      setPickupError("送出失败了，稍后再试吧");
    } finally {
      setIsPickingUp(false);
    }
  }

  function handleClose() {
    setPickupError("");
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <section className="star-detail-modal" role="dialog" aria-label="漂流星星详情" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">🫧 漂流而来的星星</p>
            <h2>来自某片遥远的星空</h2>
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={handleClose}
            aria-label="关闭漂流星星详情"
          >
            <X size={20} />
          </button>
        </div>

        <dl className="detail-meta">
          <div>
            <dt>情绪</dt>
            <dd>{getEmotionLabel(star.emotion)}</dd>
          </div>
          <div>
            <dt>漂流次数</dt>
            <dd>已漂流 {driftCount} 次</dd>
          </div>
          <div>
            <dt>日期</dt>
            <dd>{recordDate}</dd>
          </div>
        </dl>

        <p className="detail-text">{star.text}</p>

        <div className="drift-star-footer">
          <p className="drift-star-hint">
            <Sparkles size={14} />
            这颗星星从别人的夜空漂流到了这里
          </p>
        </div>

        {pickupError && (
          <p style={{ color: "#ffb2b2", fontSize: "0.85rem", fontWeight: 800, margin: "8px 0" }}>
            {pickupError}
          </p>
        )}

        <div className="detail-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={handlePickup}
            disabled={isPickingUp}
            aria-label="送它继续漂流"
          >
            <Sparkles size={17} />
            {isPickingUp ? "送出中..." : "送它继续漂流"}
          </button>
        </div>
      </section>
    </div>
  );
}
