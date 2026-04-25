import { afterEach, describe, expect, test, vi } from "vitest";
import { createRecordId, createStarId } from "../utils/id";
import { getCurrentTimeText } from "../utils/time";
import { createEmotionRecord } from "../utils/record";
import { createStarPlacement } from "../utils/starPlacement";
import { loadRecords, saveRecords, clearRecords } from "../utils/storage";

describe("技术 A 工具函数", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("生成符合约定的 record 和 star id", () => {
    expect(createRecordId()).toMatch(/^record_\d+_[a-z0-9]+$/);
    expect(createStarId()).toMatch(/^star_\d+_[a-z0-9]+$/);
  });

  test("按 YYYY-MM-DD HH:mm:ss 输出当前时间", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-25T21:00:00"));
    expect(getCurrentTimeText()).toBe("2026-04-25 21:00:00");
    vi.useRealTimers();
  });

  test("新建完整 record，star 初始为 null", () => {
    const record = createEmotionRecord({
      text: "把情绪交给星空",
      emotion: "calm"
    });

    expect(record).toMatchObject({
      text: "把情绪交给星空",
      emotion: "calm",
      star: null,
      title: "",
      aiSuggestedEmotion: "",
      aiFeedback: "这颗星星已经替你收下了今天的心情。",
      favorite: false,
      deleted: false,
      audioUrl: "",
      imageUrl: "",
      diaryBookId: "default",
      gestureCreated: false
    });
    expect(record.id).toMatch(/^record_/);
    expect(record.createdAt).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  test("localStorage 读写失败或数据异常时安全降级", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    clearRecords();
    expect(loadRecords()).toEqual([]);

    saveRecords([{ id: "record_1" }]);
    expect(loadRecords()).toEqual([{ id: "record_1" }]);

    localStorage.setItem("fingertip_starry_sky_records", "{");
    expect(loadRecords()).toEqual([]);

    clearRecords();
    expect(loadRecords()).toEqual([]);
  });

  test("星星位置分散在天空安全区，并避开已有星星", () => {
    const existingStars = [
      { star: { x: 500, y: 180 } },
      { star: { x: 760, y: 260 } }
    ];

    const star = createStarPlacement({
      viewportWidth: 1200,
      viewportHeight: 800,
      existingStars,
      random: () => 0.5
    });

    expect(star.x).toBeGreaterThanOrEqual(120);
    expect(star.x).toBeLessThanOrEqual(1080);
    expect(star.y).toBeGreaterThanOrEqual(96);
    expect(star.y).toBeLessThanOrEqual(440);

    for (const record of existingStars) {
      const distance = Math.hypot(star.x - record.star.x, star.y - record.star.y);
      expect(distance).toBeGreaterThanOrEqual(86);
    }
  });
});
