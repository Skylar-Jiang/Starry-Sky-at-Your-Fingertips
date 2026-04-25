import { X } from "lucide-react";
import { getEmotionLabel } from "../config/emotionConfig";

export default function StarDetailModal({ record, onClose }) {
  if (!record) return null;

  return (
    <div className="modal-backdrop">
      <section className="star-detail-modal" role="dialog" aria-label="星星详情">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">星星回看</p>
            <h2>这颗星星保存着</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭星星详情">
            <X size={20} />
          </button>
        </div>

        <dl className="detail-meta">
          <div>
            <dt>情绪</dt>
            <dd>{getEmotionLabel(record.emotion)}</dd>
          </div>
          <div>
            <dt>时间</dt>
            <dd>{record.createdAt}</dd>
          </div>
        </dl>

        <p className="detail-text">{record.text}</p>
        <p className="detail-feedback">{record.aiFeedback}</p>
      </section>
    </div>
  );
}
