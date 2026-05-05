import { Heart, Trash2, X } from "lucide-react";
import { getEmotionConstellationConfigs } from "../utils/constellationGroups";
import { getEmotionLabel } from "../config/emotionConfig";

export default function StarDetailModal({ record, onClose, onToggleFavorite, onDelete }) {
  if (!record) return null;
  const constellation = getEmotionConstellationConfigs().find((item) => item.emotion === record.emotion);
  const recordDate = record.createdAt?.slice(0, 10) || "未知日期";

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
            <dt>星座</dt>
            <dd>{constellation?.label || "散星"}</dd>
          </div>
          <div>
            <dt>日期</dt>
            <dd>{recordDate}</dd>
          </div>
          <div>
            <dt>时间</dt>
            <dd>{record.createdAt}</dd>
          </div>
        </dl>

        <p className="detail-text">{record.text}</p>
        <p className="detail-feedback">{record.aiFeedback}</p>
        {record.audioUrl ? <button className="secondary-button detail-audio-button">播放录音</button> : null}
        <div className="detail-actions">
          <button
            className={record.favorite ? "secondary-button is-favorite" : "secondary-button"}
            type="button"
            onClick={() => onToggleFavorite(record.id)}
            aria-label={record.favorite ? "取消收藏" : "收藏星星"}
          >
            <Heart size={17} />
            {record.favorite ? "已收藏" : "收藏"}
          </button>
          <button className="secondary-button danger-button" type="button" onClick={() => onDelete(record.id)} aria-label="删除星星">
            <Trash2 size={17} />
            删除
          </button>
        </div>
      </section>
    </div>
  );
}
