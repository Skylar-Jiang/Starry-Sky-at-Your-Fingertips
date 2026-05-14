import { emotionConfig, emotionOptionKeys } from "../src/config/emotionConfig.js";
import { hasEnoughLetterContent } from "../src/utils/letterContent.js";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
export const DEFAULT_OPENROUTER_MODEL = "qwen/qwen3-235b-a22b-2507";

export const AI_SHORT_LETTER_MESSAGE = "再和小伙伴多说一点吧，它还没有听清你的心声。";
export const AI_UNCERTAIN_MESSAGE = "小伙伴还没有完全听清你的心声，再和它多说说你的想法吧。";
export const AI_ERROR_MESSAGE = "小伙伴现在有点听不清，稍后再试一次吧。";

const emotionDescriptions = {
  happy: "轻盈、明亮、被好事照亮，适合表达开心、满足、期待和被温柔回应后的心情。",
  calm: "安静、放松、逐渐恢复平稳，适合表达松了一口气、想慢下来或平和陪伴。",
  wronged: "被误解、受委屈、想被接住，适合表达难以开口的小失落和需要被理解。",
  angry: "心里发热、有冲突感或边界被触碰，适合表达生气、不满和想慢慢冷静。",
  verySad: "明显难过、沉重、想暂时被收藏，适合表达伤心、低落和需要安放的悲伤。",
  anxious: "担心、紧绷、思绪绕来绕去，适合表达焦虑、压力和不确定感。"
};

export const emotionDetectionOptions = emotionOptionKeys.map((key) => ({
  key,
  label: emotionConfig[key].label,
  description: emotionDescriptions[key]
}));

export function buildOpenRouterEmotionRequest(letterContent, model = DEFAULT_OPENROUTER_MODEL) {
  return {
    model,
    messages: [
      {
        role: "system",
        content:
          "你是一个温柔、克制、善于理解文字情绪的小伙伴。\n" +
          "你的任务是根据用户写下的一封信，判断这封信最接近哪一种情绪。\n" +
          "你只能从给定的情绪列表中选择，不允许创造新的情绪。\n" +
          "如果文字太短、太模糊、缺少情绪表达，或者你无法明确判断，请返回 uncertain。\n" +
          "不要进行心理诊断，不要夸大情绪，不要给医疗建议。\n" +
          "输出必须是严格 JSON，不要输出多余解释。"
      },
      {
        role: "user",
        content:
          "请根据下面这封信，判断它最接近哪一种情绪。\n\n" +
          `可选情绪：\n${JSON.stringify(emotionDetectionOptions, null, 2)}\n\n` +
          `用户写的信：\n"""\n${letterContent}\n"""\n\n` +
          "请输出 JSON，格式如下：\n\n" +
          "如果可以明确判断：\n" +
          '{\n  "status": "ok",\n  "emotion": "必须是六个情绪 key 之一",\n  "confidence": 0 到 1 之间的小数,\n  "reason": "用一句很短的话说明判断依据，不要超过 30 个中文字"\n}\n\n' +
          "如果无法明确判断：\n" +
          '{\n  "status": "uncertain",\n  "emotion": null,\n  "confidence": 0 到 1 之间的小数,\n  "reason": "说明为什么不明确，不要超过 30 个中文字"\n}\n\n' +
          "判断规则：\n" +
          "- confidence >= 0.65 时，才可以返回 status: \"ok\"。\n" +
          "- confidence < 0.65 时，返回 status: \"uncertain\"。\n" +
          "- 如果文本少于 10 个有效文字字符，返回 uncertain；中文、英文和数字都算有效文字字符。\n" +
          "- 如果文本只是问候、无意义字符、表情、单个词，返回 uncertain。\n" +
          "- 不要输出 markdown。\n" +
          "- 不要输出 JSON 以外的任何内容。"
      }
    ],
    temperature: 0.2,
    max_tokens: 180,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "emotion_detection",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["status", "emotion", "confidence", "reason"],
          properties: {
            status: { type: "string", enum: ["ok", "uncertain"] },
            emotion: {
              anyOf: [{ type: "string", enum: emotionOptionKeys }, { type: "null" }]
            },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            reason: { type: "string", maxLength: 60 }
          }
        }
      }
    }
  };
}

export function normalizeOpenRouterEmotionResult(result) {
  const confidence = clampConfidence(result?.confidence);
  const isKnownEmotion = emotionOptionKeys.includes(result?.emotion);
  const isClear = result?.status === "ok" && isKnownEmotion && confidence >= 0.65;

  if (!isClear) {
    return {
      status: "uncertain",
      emotion: null,
      confidence,
      reason: typeof result?.reason === "string" ? result.reason : "情绪线索还不够明确"
    };
  }

  return {
    status: "ok",
    emotion: result.emotion,
    confidence,
    reason: typeof result.reason === "string" ? result.reason : ""
  };
}

export function createClientEmotionResponse(result) {
  if (result.status === "ok") {
    const label = emotionConfig[result.emotion].label;
    return {
      status: "ok",
      emotion: result.emotion,
      confidence: result.confidence,
      message: `小伙伴感觉到了，你的这封信里藏着一点「${label}」。`
    };
  }

  return {
    status: "uncertain",
    emotion: null,
    confidence: result.confidence,
    message: AI_UNCERTAIN_MESSAGE
  };
}

export async function detectEmotionWithOpenRouter({
  letterContent,
  apiKey,
  baseUrl = DEFAULT_OPENROUTER_BASE_URL,
  model = DEFAULT_OPENROUTER_MODEL,
  fetchImpl = globalThis.fetch
}) {
  const trimmedLetter = String(letterContent || "").trim();

  if (!hasEnoughLetterContent(trimmedLetter)) {
    return {
      status: "uncertain",
      emotion: null,
      confidence: 0,
      message: AI_SHORT_LETTER_MESSAGE
    };
  }

  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY");
  }

  const response = await fetchImpl(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "Fingertip Starry Sky"
    },
    body: JSON.stringify(buildOpenRouterEmotionRequest(trimmedLetter, model))
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter request failed with ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const data = await response.json();
  const parsed = parseOpenRouterContent(data);
  return createClientEmotionResponse(normalizeOpenRouterEmotionResult(parsed));
}

export async function handleDetectEmotionApiRequest(body, env = process.env) {
  try {
    return await detectEmotionWithOpenRouter({
      letterContent: body?.letterContent,
      apiKey: env.OPENROUTER_API_KEY,
      baseUrl: env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
      model: env.OPENROUTER_MODEL || DEFAULT_OPENROUTER_MODEL
    });
  } catch (error) {
    console.error("[detect-emotion]", error);
    return {
      status: "error",
      emotion: null,
      message: AI_ERROR_MESSAGE
    };
  }
}

function parseOpenRouterContent(data) {
  const content = data?.choices?.[0]?.message?.content;
  const rawText = Array.isArray(content)
    ? content.map((part) => (typeof part === "string" ? part : part?.text || "")).join("")
    : content;

  if (typeof rawText !== "string") {
    throw new Error("OpenRouter response content is not text");
  }

  return JSON.parse(rawText);
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(1, Math.max(0, number));
}
