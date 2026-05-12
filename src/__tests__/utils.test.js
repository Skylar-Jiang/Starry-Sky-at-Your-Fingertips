import { afterEach, describe, expect, test, vi } from "vitest";
import { createRecordId, createStarId } from "../utils/id";
import { getCurrentTimeText } from "../utils/time";
import { createEmotionRecord } from "../utils/record";
import { createStarPlacement } from "../utils/starPlacement";
import { projectConstellationNodes } from "../utils/constellationProjection";
import { loadRecords, saveRecords, clearRecords } from "../utils/storage";
import { emotionConfig, emotionOptionKeys } from "../config/emotionConfig";
import { constellationConfig } from "../config/constellationConfig";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import { getEnvironmentComposition, environmentCompositionConfig } from "../config/environmentCompositionConfig";
import { recoveryInteractionConfig } from "../config/recoveryInteractionConfig";
import { foregroundEmotionConfig, foregroundSceneConfig } from "../config/foregroundMatrixConfig";
import {
  filterRecordsByDateRange,
  filterRecordsByEmotion,
  groupRecordsByDate
} from "../utils/recordFilters";
import { buildEmotionConstellationGroups, emotionHasConstellation } from "../utils/constellationGroups";
import { createGestureActionDispatcher } from "../utils/gestureActions";
import { detectFiveFingerClose, detectPinch } from "../hooks/useHandGestureRecognition";

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
      aiFeedback: "这颗星星已经替你收下了今天的心情，场景正在慢慢恢复平静。",
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

  test("同情绪星星从未填预设节点中随机选择，填满后不再补星", () => {
    const existingStars = [];
    const random = () => 0.5;
    const firstFive = Array.from({ length: 5 }).map((_, index) => {
      const star = createStarPlacement({
        viewportWidth: 1200,
        viewportHeight: 800,
        existingStars,
        emotion: "happy",
        random
      });
      if (star) existingStars.push({ id: `record_${index}`, emotion: "happy", star });
      return star;
    });
    const projectedNodesById = Object.fromEntries(
      projectConstellationNodes(
        getConstellationByKey("aries"),
        null,
        1200,
        800,
        firstFive[0].constellationLayout
      ).map((node) => [node.id, node])
    );

    expect(firstFive[0]).toEqual(
      expect.objectContaining({
        x: projectedNodesById.a3.x,
        y: projectedNodesById.a3.y,
        constellationKey: "aries",
        constellationNodeId: "a3"
      })
    );
    expect(firstFive[1]).toEqual(
      expect.objectContaining({
        x: projectedNodesById.a2.x,
        y: projectedNodesById.a2.y,
        constellationKey: "aries",
        constellationNodeId: "a2"
      })
    );
    expect(firstFive[2]).toEqual(
      expect.objectContaining({
        x: projectedNodesById.a4.x,
        y: projectedNodesById.a4.y,
        constellationKey: "aries",
        constellationNodeId: "a4"
      })
    );
    expect(firstFive[3]).toEqual(
      expect.objectContaining({
        x: projectedNodesById.a1.x,
        y: projectedNodesById.a1.y,
        constellationKey: "aries",
        constellationNodeId: "a1"
      })
    );
    expect(firstFive[4]).toBeNull();
    expect(new Set(firstFive.slice(0, 4).map((star) => star.constellationNodeId)).size).toBe(4);
  });

  test("星座落点会被当前环境 skyBounds 限制", () => {
    const star = createStarPlacement({
      viewportWidth: 1200,
      viewportHeight: 800,
      emotion: "wronged",
      skyBounds: { x: 180, y: 92, width: 640, height: 210 },
      random: () => 0.5
    });

    expect(star.x).toBeGreaterThanOrEqual(180);
    expect(star.x).toBeLessThanOrEqual(820);
    expect(star.y).toBeGreaterThanOrEqual(92);
    expect(star.y).toBeLessThanOrEqual(302);
  });

  test("环境 composition 覆盖六种情绪和四种环境，并声明安全星空区域", () => {
    for (const emotion of emotionOptionKeys) {
      for (const sceneKey of ["rain", "campfire", "waves", "lullaby"]) {
        const composition = getEnvironmentComposition(emotion, sceneKey);
        expect(composition).toMatchObject({
          emotion,
          sceneKey,
          backgroundImage: expect.stringMatching(/^\/assets\/environment\/scenes\//),
          skyBounds: {
            x: expect.any(Number),
            y: expect.any(Number),
            width: expect.any(Number),
            height: expect.any(Number)
          },
          characterPlacement: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
          companionPlacement: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
          flowerPlacement: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
        });
        expect(environmentCompositionConfig[emotion][sceneKey]).toBe(composition);
      }
    }
  });

  test("前景矩阵覆盖所有心情角色和四个圆形承载场景", () => {
    for (const emotion of emotionOptionKeys) {
      expect(foregroundEmotionConfig[emotion].group).toBe(`/assets/scene-layers/emotion-groups/${emotion}_group.png`);
    }

    for (const sceneKey of ["rain", "campfire", "waves", "lullaby"]) {
      expect(foregroundSceneConfig[sceneKey].platform).toBe(`/assets/scene-layers/platforms/${sceneKey}_platform.png`);
    }
  });

  test("恢复互动配置为每种情绪提供独立点位和类型尺寸", () => {
    const pointSignatures = new Set();

    for (const emotion of ["calm", "happy", "wronged", "angry", "anxious", "verySad"]) {
      const config = recoveryInteractionConfig[emotion];
      expect(config.points).toHaveLength(config.count);
      expect(config.size).toMatch(/^clamp\(/);
      expect(config.points.every((point) => point.x >= 14 && point.x <= 86 && point.y >= 18 && point.y <= 76)).toBe(true);
      pointSignatures.add(config.points.map((point) => `${point.x}:${point.y}`).join("|"));
    }

    expect(pointSignatures.size).toBeGreaterThan(3);
  });

  test("第三阶段六情绪拥有独立角色和星座资产配置", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const projectRoot = process.cwd();

    const expectedCharacterByEmotion = {
      happy: "/assets/character/traveler_happy.png",
      calm: "/assets/character/traveler_calm.png",
      wronged: "/assets/character/traveler_wronged.png",
      angry: "/assets/character/traveler_angry.png",
      verySad: "/assets/character/traveler_sad_v2.png",
      anxious: "/assets/character/traveler_anxious.png"
    };

    for (const emotion of emotionOptionKeys) {
      const characterPath = emotionConfig[emotion].character.split("?")[0];
      expect(characterPath).toBe(expectedCharacterByEmotion[emotion]);
      expect(fs.existsSync(path.join(projectRoot, "public", characterPath))).toBe(true);
    }

    const constellations = Object.values(constellationConfig).filter((item) => item.emotion);
    expect(constellations).toHaveLength(6);

    for (const emotion of emotionOptionKeys) {
      const constellation = constellations.find((item) => item.emotion === emotion);
      expect(constellation).toMatchObject({
        minimumStars: 3,
        image: expect.stringMatching(/^\/assets\/constellations\/constellation_/)
      });
      expect(fs.existsSync(path.join(projectRoot, "public", constellation.image))).toBe(true);
    }
  });

  test("第三阶段观测工具能按情绪和日期组织星星", () => {
    const records = [
      { id: "r1", emotion: "happy", createdAt: "2026-05-05 09:00:00", star: { x: 110, y: 120 } },
      { id: "r2", emotion: "verySad", createdAt: "2026-05-05 10:00:00", star: { x: 170, y: 140 } },
      { id: "r3", emotion: "verySad", createdAt: "2026-05-04 10:00:00", star: { x: 230, y: 170 } },
      { id: "r4", emotion: "verySad", createdAt: "2026-04-28 10:00:00", star: { x: 290, y: 180 } }
    ];

    expect(filterRecordsByEmotion(records, "verySad").map((record) => record.id)).toEqual(["r2", "r3", "r4"]);
    expect(groupRecordsByDate(records).map((group) => [group.date, group.records.length])).toEqual([
      ["2026-05-05", 2],
      ["2026-05-04", 1],
      ["2026-04-28", 1]
    ]);
    expect(filterRecordsByDateRange(records, "today", new Date("2026-05-05T12:00:00")).map((record) => record.id)).toEqual([
      "r1",
      "r2"
    ]);
    expect(filterRecordsByDateRange(records, "last7", new Date("2026-05-05T12:00:00")).map((record) => record.id)).toEqual([
      "r1",
      "r2",
      "r3"
    ]);
    expect(emotionHasConstellation(records, "verySad")).toBe(true);
    expect(emotionHasConstellation(records, "happy")).toBe(false);
    expect(buildEmotionConstellationGroups(records).find((group) => group.emotion === "verySad").linePoints).toBe(
      "170,140 230,170 290,180"
    );
  });

  test("gesture dispatcher shares the same handlers for camera and simulation input", () => {
    const onPinch = vi.fn();
    const onFold = vi.fn();
    const dispatchGesture = createGestureActionDispatcher({ onPinch, onFold });

    dispatchGesture("pinch");
    dispatchGesture("fiveFingerClose");
    dispatchGesture("unknown");

    expect(onPinch).toHaveBeenCalledTimes(1);
    expect(onFold).toHaveBeenCalledTimes(1);
  });

  test("gesture geometry detects pinch and five finger close", () => {
    const openHand = Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
    openHand[0] = { x: 0.5, y: 0.7, z: 0 };
    openHand[4] = { x: 0.25, y: 0.35, z: 0 };
    openHand[8] = { x: 0.75, y: 0.25, z: 0 };
    openHand[12] = { x: 0.6, y: 0.2, z: 0 };
    openHand[16] = { x: 0.45, y: 0.25, z: 0 };
    openHand[20] = { x: 0.3, y: 0.32, z: 0 };

    const pinchedHand = openHand.map((point) => ({ ...point }));
    pinchedHand[4] = { x: 0.51, y: 0.48, z: 0 };
    pinchedHand[8] = { x: 0.53, y: 0.5, z: 0 };

    const closedHand = openHand.map((point) => ({ ...point }));
    for (const index of [4, 8, 12, 16, 20]) {
      closedHand[index] = { x: 0.5, y: 0.56, z: 0 };
    }

    expect(detectPinch(pinchedHand)).toBe(true);
    expect(detectPinch(openHand)).toBe(false);
    expect(detectFiveFingerClose(closedHand)).toBe(true);
    expect(detectFiveFingerClose(openHand)).toBe(false);
  });
});
