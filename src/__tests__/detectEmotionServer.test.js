import { describe, expect, test } from "vitest";
import {
  buildOpenRouterEmotionRequest,
  createClientEmotionResponse,
  normalizeOpenRouterEmotionResult
} from "../../server/detectEmotion.js";

describe("detect emotion backend helpers", () => {
  test("builds an OpenRouter request with JSON schema output and six existing emotions", () => {
    const request = buildOpenRouterEmotionRequest("今天我终于松了一口气，想把这份安静交给星空。", "test-model");

    expect(request.model).toBe("test-model");
    expect(request.response_format).toMatchObject({
      type: "json_schema",
      json_schema: expect.objectContaining({ name: "emotion_detection" })
    });
    expect(request.messages[0].content).toContain("输出必须是严格 JSON");
    expect(request.messages[1].content).toContain('"key": "happy"');
    expect(request.messages[1].content).toContain('"key": "anxious"');
  });

  test("accepts only known emotions with enough confidence", () => {
    const result = normalizeOpenRouterEmotionResult({
      status: "ok",
      emotion: "happy",
      confidence: 0.86,
      reason: "语气明亮"
    });

    expect(createClientEmotionResponse(result)).toEqual({
      status: "ok",
      emotion: "happy",
      confidence: 0.86,
      message: "小伙伴感觉到了，你的这封信里藏着一点「开心」。"
    });
  });

  test("keeps low confidence or unknown emotions uncertain", () => {
    expect(
      normalizeOpenRouterEmotionResult({
        status: "ok",
        emotion: "happy",
        confidence: 0.42,
        reason: "线索不足"
      })
    ).toMatchObject({ status: "uncertain", emotion: null, confidence: 0.42 });

    expect(
      normalizeOpenRouterEmotionResult({
        status: "ok",
        emotion: "lonely",
        confidence: 0.91,
        reason: "模型越界"
      })
    ).toMatchObject({ status: "uncertain", emotion: null });
  });
});
