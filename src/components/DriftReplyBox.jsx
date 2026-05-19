import { useEffect, useState } from "react";
import { microInteractionConfig } from "../config/microInteractionConfig";
import { loadDriftReplies, saveDriftReply } from "../utils/driftReplyStorage";

export default function DriftReplyBox({ starId }) {
  const [text, setText] = useState("");
  const [replies, setReplies] = useState([]);
  const [message, setMessage] = useState("");
  const maxLength = microInteractionConfig.drift.replyMaxLength;

  useEffect(() => {
    setReplies(loadDriftReplies(starId));
    setText("");
    setMessage("");
  }, [starId]);

  function handleSubmit() {
    const trimmed = text.trim();
    if (!trimmed) {
      setMessage("先写下一句想送出的回复。");
      return;
    }
    const nextReplies = saveDriftReply(starId, trimmed.slice(0, maxLength));
    setReplies(nextReplies);
    setText("");
    setMessage("这盏小灯已经留在它身边。");
  }

  return (
    <div className="drift-reply-box">
      <label htmlFor={`drift-reply-${starId}`}>给这颗星星回一句话</label>
      <textarea
        id={`drift-reply-${starId}`}
        value={text}
        maxLength={maxLength}
        onChange={(event) => setText(event.target.value)}
        placeholder="写一句想送给这颗星星的话..."
        aria-label="给这颗星星回一句话"
      />
      <div className="drift-reply-actions">
        <span>{text.length}/{maxLength}</span>
        <button className="secondary-button" type="button" onClick={handleSubmit}>
          送出回复
        </button>
      </div>
      {message ? <p className="drift-reply-message">{message}</p> : null}
      {replies.length > 0 ? (
        <div className="drift-reply-list">
          {replies.map((reply) => (
            <p key={reply.id}>你刚刚送出的回复：{reply.text}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
