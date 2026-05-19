import { createClient } from "@supabase/supabase-js";
import { emotionOptionKeys } from "../src/config/emotionConfig.js";
import { DEFAULT_OPENROUTER_BASE_URL, DEFAULT_OPENROUTER_MODEL } from "./detectEmotion.js";

const VALID_EMOTIONS = new Set(emotionOptionKeys);
const REPLY_EMOTION_ALIASES = {
  sad: "verySad",
  "难过": "verySad",
  "非常难过": "verySad",
  "平静": "calm",
  "开心": "happy",
  "委屈": "wronged",
  "生气": "angry",
  "焦虑": "anxious"
};
const emotionReplyHints = {
  happy: "替对方接住这份开心，像一起珍藏一颗发亮的小星星。",
  calm: "回应得安静、轻柔，像陪对方在星空下坐一会儿。",
  wronged: "承认对方的委屈，不评判、不催促，让它先被看见。",
  angry: "接住对方发热的边界感，提醒它可以慢慢降温。",
  verySad: "非常轻地陪伴，不劝快点好起来，不给医疗建议。",
  anxious: "帮对方把担心放慢一点，语气稳定、具体、短。"
};

function createSupabaseClient(env = process.env) {
  const url = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const key = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  return createClient(url, key);
}

export async function fetchRandomDriftingStars(limit = 5, env = process.env) {
  const supabase = createSupabaseClient(env);

  if (!supabase) {
    return { status: "ok", stars: [] };
  }

  const { data, error } = await supabase
    .from("drifting_stars")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(Math.max(1, Math.min(limit, 20)));

  if (error) {
    console.error("[drift-star-service] fetch failed:", error.message);
    return { status: "error", stars: [], message: "暂时无法获取漂流星星" };
  }

  const shuffled = (data || []).sort(() => Math.random() - 0.5).slice(0, limit);
  return { status: "ok", stars: shuffled };
}

export async function publishDriftingStar(payload, env = process.env) {
  const supabase = createSupabaseClient(env);

  if (!supabase) {
    return { status: "error", star: null, message: "漂流服务暂未配置" };
  }

  const text = String(payload?.text || "").trim();
  const emotion = String(payload?.emotion || "calm").trim();

  if (!text) {
    return { status: "error", star: null, message: "漂流内容不能为空" };
  }

  if (!VALID_EMOTIONS.has(emotion)) {
    return { status: "error", star: null, message: "无效的情绪类型" };
  }

  const record = {
    text,
    emotion,
    author_id: payload?.authorId || "anonymous",
    constellation_key: payload?.constellationKey || null,
    star_x: payload?.starX != null ? Number(payload.starX) : null,
    star_y: payload?.starY != null ? Number(payload.starY) : null,
    is_public: payload?.isPublic !== false,
    drift_count: 0
  };

  const { data, error } = await supabase.from("drifting_stars").insert(record).select().single();

  if (error) {
    console.error("[drift-star-service] publish failed:", error.message);
    return { status: "error", star: null, message: "发布失败，请稍后再试" };
  }

  return { status: "ok", star: data, message: "星星已经放入漂流瓶了" };
}

export async function pickupDriftingStar(starId, env = process.env) {
  const supabase = createSupabaseClient(env);

  if (!supabase) {
    return { status: "error", message: "漂流服务暂未配置" };
  }

  const { data, error } = await supabase
    .rpc("increment_drift_count", { star_id: starId });

  if (error) {
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("drifting_stars")
      .select("drift_count")
      .eq("id", starId)
      .single();

    if (fallbackError || !fallbackData) {
      return { status: "error", message: "这颗星星找不到了" };
    }

    const { error: updateError } = await supabase
      .from("drifting_stars")
      .update({ drift_count: (fallbackData.drift_count || 0) + 1 })
      .eq("id", starId);

    if (updateError) {
      return { status: "error", message: "捡起失败，请稍后再试" };
    }
  }

  return { status: "ok", message: "送它继续漂流了" };
}

export async function removeDriftingStar(starId, authorId, env = process.env) {
  const supabase = createSupabaseClient(env);

  if (!supabase) {
    return { status: "error", message: "漂流服务暂未配置" };
  }

  const { error } = await supabase
    .from("drifting_stars")
    .delete()
    .eq("id", starId)
    .eq("author_id", authorId || "anonymous");

  if (error) {
    console.error("[drift-star-service] remove failed:", error.message);
    return { status: "error", message: "删除失败，请稍后再试" };
  }

  return { status: "ok", message: "星星已从漂流中收回" };
}

export async function generateDriftingStarReply(payload, env = process.env, fetchImpl = globalThis.fetch) {
  const text = String(payload?.text || "").trim();
  const emotion = normalizeReplyEmotion(payload?.emotion);

  if (!text) {
    return { status: "error", reply: "", message: "瓶中信内容为空" };
  }

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { status: "ok", reply: buildLocalDriftReply(emotion), source: "local" };
  }

  try {
    const baseUrl = env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL;
    const model = env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL;
    const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Fingertip Starry Sky"
      },
      body: JSON.stringify(buildDriftReplyRequest(text, emotion, model))
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter reply failed with ${response.status}: ${errorText.slice(0, 300)}`);
    }

    const data = await response.json();
    const parsed = parseOpenRouterReply(data);
    return { status: "ok", reply: normalizeReply(parsed?.reply, emotion), source: "openrouter" };
  } catch (error) {
    console.error("[drift-star-service] reply failed:", error.message);
    return { status: "ok", reply: buildLocalDriftReply(emotion), source: "local" };
  }
}

function buildDriftReplyRequest(text, emotion, model) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "你是指尖星空里的温柔回信者。你的任务是给一封匿名漂流瓶写一句短短的中文回应。\n" +
          "不要诊断，不要说教，不要给医疗、法律、金融建议，不要要求对方必须做什么。\n" +
          "语气要像同龄人轻轻接住对方，具体、克制、有画面感。"
      },
      {
        role: "user",
        content:
          `情绪类型：${emotion}\n` +
          `回应方向：${emotionReplyHints[emotion] || emotionReplyHints.calm}\n` +
          `瓶中信："""${text}"""\n\n` +
          "请只输出 JSON：{\"reply\":\"一句 28 到 52 个中文字符的回信\"}"
      }
    ],
    temperature: 0.7,
    max_tokens: 120,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "drift_bottle_reply",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["reply"],
          properties: {
            reply: { type: "string", minLength: 12, maxLength: 90 }
          }
        }
      }
    }
  };
}

function parseOpenRouterReply(data) {
  const content = data?.choices?.[0]?.message?.content;
  const rawText = Array.isArray(content)
    ? content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
    : content;

  if (typeof rawText !== "string") {
    throw new Error("OpenRouter reply content is not text");
  }

  return JSON.parse(rawText);
}

function normalizeReply(reply, emotion) {
  const cleanReply = String(reply || "").replace(/\s+/g, " ").trim();
  if (cleanReply.length >= 8 && cleanReply.length <= 90) return cleanReply;
  return buildLocalDriftReply(emotion);
}

function buildLocalDriftReply(emotion) {
  const replies = {
    happy: "这份开心有被好好接住。愿它像小小星光一样，陪你多亮一会儿。",
    calm: "我读到了这份安静。它不用很响，也已经在夜空里留下了柔和的光。",
    wronged: "这份委屈不是小题大做。先把它放在这里，会有人轻轻看见它。",
    angry: "心里发热的时候，先不用急着解释。你的边界，也值得被认真听见。",
    verySad: "难过可以慢一点散开。今晚先让这颗星替你守着，不必马上变好。",
    anxious: "那些打转的担心先落在这里。你可以一步一步来，不用一次想完所有事。"
  };

  return replies[emotion] || replies.calm;
}

function normalizeReplyEmotion(emotion) {
  const rawEmotion = String(emotion || "").trim();
  const normalizedEmotion = REPLY_EMOTION_ALIASES[rawEmotion] || rawEmotion;
  return VALID_EMOTIONS.has(normalizedEmotion) ? normalizedEmotion : "calm";
}
