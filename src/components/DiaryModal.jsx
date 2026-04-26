import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import EmotionSelector from "./EmotionSelector";

export default function DiaryModal({ isOpen, onClose, onSubmit }) {
  const [text, setText] = useState("");
  const [emotion, setEmotion] = useState("calm");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) setError("");
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSubmit(event) {
    event.preventDefault();

    if (!text.trim()) {
      setError("请先写下一点想交给星空的话。");
      return;
    }

    onSubmit({ text: text.trim(), emotion });
    setText("");
    setEmotion("calm");
    setError("");
  }

  return (
    <div className="modal-backdrop">
      <form className="diary-modal paper-writing-modal" onSubmit={handleSubmit} role="dialog" aria-label="记录情绪">
        <button className="icon-button paper-close-button" type="button" onClick={onClose} aria-label="关闭">
          <X size={20} />
        </button>

        <p className="paper-state">等待折成纸团</p>

        <div className="writing-paper">
          <img src="/assets/objects/paper_flat.png" alt="信纸" />
          <label className="visually-hidden" htmlFor="diary-text">
            想交给星空的话
          </label>
          <textarea
            id="diary-text"
            className="paper-textarea"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="今天有点累，但我想把它交给星空"
            rows={8}
            autoFocus
          />
        </div>

        <EmotionSelector value={emotion} onChange={setEmotion} />

        {error ? <p className="form-error paper-form-error">{error}</p> : null}

        <div className="modal-actions paper-actions">
          <button className="secondary-button" type="button" onClick={onClose}>
            取消
          </button>
          <button className="primary-button" type="submit">
            <Check size={18} />
            完成
          </button>
        </div>
      </form>
    </div>
  );
}
