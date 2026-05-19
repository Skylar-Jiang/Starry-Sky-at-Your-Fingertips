import { Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { getEmotionLabel } from "../config/emotionConfig";
import DriftReplyBox from "./DriftReplyBox";

function getSourceType(star) {
  if (star?.sourceType) return star.sourceType;
  if (star?.driftDirection === "sent") return "sentDrift";
  if (star?.driftDirection === "received") return "receivedDrift";
  if (star?.author_id || star?.is_public) return "receivedDrift";
  return "local";
}

const sourceCopy = {
  sentDrift: {
    eyebrow: "🫧 正在漂流",
    title: "你送去漂流的星星",
    hint: "这颗心情碎片正在星河里慢慢漂流。",
    footer: "这是你送出的星星，正在等待远方回应。也许有一天，它会被另一片星空温柔读到。",
    canReply: false
  },
  receivedDrift: {
    eyebrow: "🫧 漂流而来的星星",
    title: "来自某片遥远的星空",
    hint: "这颗星星从别人的夜空漂流到了这里。",
    footer: "你可以给它留下一盏很小的灯。",
    canReply: true
  },
  demoReceivedDrift: {
    eyebrow: "🫧 漂流而来的星星",
    title: "来自某片遥远的星空",
    hint: "这颗星星从别人的夜空漂流到了这里。",
    footer: "你可以给它留下一盏很小的灯。",
    canReply: true
  },
  local: {
    eyebrow: "星星回看",
    title: "你的星星",
    hint: "这颗星星保存在你的夜空里。",
    footer: "",
    canReply: false
  }
};

export default function DriftStarDetailModal({ star, onClose, onPickup, onRemove }) {
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [pickupError, setPickupError] = useState("");

  if (!star) return null;

  const sourceType = getSourceType(star);
  const copy = sourceCopy[sourceType] || sourceCopy.receivedDrift;
  const recordDate = star.created_at ? String(star.created_at).slice(0, 10) : "未知日期";
  const driftCount = Number(star.drift_count) || 0;

  async function handlePickup() {
    if (isPickingUp || !onPickup || sourceType === "sentDrift") return;
    setIsPickingUp(true);
    setPickupError("");
    try {
      const result = await onPickup(star.id);
      if (result?.error) setPickupError(result.error);
    } catch (error) {
      setPickupError("送出失败了，稍后再试好吗？");
    } finally {
      setIsPickingUp(false);
    }
  }

  async function handleRemove() {
    if (isRemoving || !onRemove || sourceType !== "sentDrift") return;
    setIsRemoving(true);
    setPickupError("");
    try {
      const result = await onRemove(star.id);
      if (result?.error) setPickupError(result.error);
    } catch (error) {
      setPickupError("收回失败了，稍后再试好吗？");
    } finally {
      setIsRemoving(false);
    }
  }

  function handleClose() {
    setPickupError("");
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={handleClose}>
      <section className="star-detail-modal drift-detail-modal" role="dialog" aria-label="漂流星星详情" onClick={(e) => e.stopPropagation()}>
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{copy.eyebrow}</p>
            <h2>{copy.title}</h2>
          </div>
          <button className="icon-button" type="button" onClick={handleClose} aria-label="关闭漂流星星详情">
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
          <p className={`drift-star-hint drift-source-${sourceType}`}>
            <Sparkles size={14} />
            {copy.hint}
          </p>
          {copy.footer ? <p className="drift-source-note">{copy.footer}</p> : null}
        </div>

        {copy.canReply ? <DriftReplyBox star={star} /> : null}

        {pickupError ? <p className="drift-pickup-error">{pickupError}</p> : null}

        {sourceType === "sentDrift" ? (
          <div className="detail-actions">
            <button className="secondary-button danger-button" type="button" onClick={handleRemove} disabled={isRemoving} aria-label="收回这只漂流瓶">
              <Trash2 size={17} />
              {isRemoving ? "收回中..." : "收回这只漂流瓶"}
            </button>
          </div>
        ) : null}

        {sourceType !== "sentDrift" ? (
          <div className="detail-actions">
            <button className="secondary-button" type="button" onClick={handlePickup} disabled={isPickingUp} aria-label="送它继续漂流">
              <Sparkles size={17} />
              {isPickingUp ? "送出中..." : "送它继续漂流"}
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}
