import { MessageCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { microInteractionConfig } from "../config/microInteractionConfig";
import { loadDriftReplies, saveDriftReply } from "../utils/driftReplyStorage";

const fallbackAiReply = "我读到了这封瓶中信。它不用立刻变好，也不用被解释清楚，先被温柔地看见就够了。";
const replyEmotionAliases = {
  sad: "verySad"
};

export default function DriftReplyBox({ star }) {
  const starId = star?.id;
  const [text, setText] = useState("");
  const [replies, setReplies] = useState([]);
  const [message, setMessage] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiStatus, setAiStatus] = useState("idle");
  const maxLength = microInteractionConfig.drift.replyMaxLength;

  useEffect(() => {
    setReplies(loadDriftReplies(starId));
    setText("");
    setMessage("");
    setAiReply(star?.ai_reply || "");
    setAiStatus("idle");
  }, [starId, star?.ai_reply]);

  async function handleGenerateAiReply() {
    if (!star || aiStatus === "loading") return;

    setAiStatus("loading");
    setMessage("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(`/api/drifting-stars/${star.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: star.text,
          emotion: replyEmotionAliases[star.emotion] || star.emotion,
          driftCount: star.drift_count
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.reply) {
        setMessage(data.message || "暂时没有等到星空回信。");
        setAiStatus("error");
        return;
      }

      setAiReply(data.reply);
      setText(data.reply.slice(0, maxLength));
      setAiStatus("ready");
      setMessage(data.source === "local" ? "已生成一封本地温柔回信。" : "AI 回信已经写好了。");
    } catch (error) {
      clearTimeout(timeoutId);
      setAiReply(fallbackAiReply);
      setText(fallbackAiReply.slice(0, maxLength));
      setAiStatus("ready");
      setMessage("网络慢了一点，先给你一封备用回信。");
    }
  }

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
      <div className="drift-ai-reply-panel" aria-label="AI 回信">
        <div className="drift-ai-reply-heading">
          <MessageCircle size={16} />
          <span>星空回信</span>
        </div>
        <p>{aiReply || "可以请星空先替你写一小段回应，再按自己的心意修改后送出。"}</p>
        <button
          className="secondary-button drift-ai-reply-button"
          type="button"
          onClick={handleGenerateAiReply}
          disabled={aiStatus === "loading"}
        >
          <Sparkles size={16} />
          {aiStatus === "loading" ? "回信中..." : aiReply ? "再写一封 AI 回信" : "生成 AI 回信"}
        </button>
      </div>

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
