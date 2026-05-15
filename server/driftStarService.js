import { createClient } from "@supabase/supabase-js";
import { emotionOptionKeys } from "../src/config/emotionConfig.js";

const VALID_EMOTIONS = new Set(emotionOptionKeys);

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
