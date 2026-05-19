import { useEffect, useMemo, useState } from "react";
import MainScene from "./components/MainScene";
import DiaryModal from "./components/DiaryModal";
import StarDetailModal from "./components/StarDetailModal";
import DriftStarDetailModal from "./components/DriftStarDetailModal";
import { createEmotionRecord } from "./utils/record";
import { clearRecords, loadRecords, saveRecords } from "./utils/storage";
import { loadCachedDriftStars, saveCachedDriftStars, clearDriftCache } from "./utils/driftStorage";
import { chooseNextConstellationKey } from "./utils/constellationSelection";
import { projectConstellationNodes } from "./utils/constellationProjection";
import { getEnvironmentComposition } from "./config/environmentCompositionConfig";
import {
  getConstellationByKey,
  getRandomConstellationKey,
  zodiacConstellations
} from "./config/presetConstellationConfig";
import { emotionOptionKeys } from "./config/emotionConfig";
import { hasEnoughLetterContent } from "./utils/letterContent";

const visualEmotionKeys = new Set(emotionOptionKeys);
const selectableEmotionKeys = new Set(emotionOptionKeys);

const AI_SHORT_LETTER_MESSAGE = "再和小伙伴多说一点吧，它还没有听清你的心声。";
const AI_UNCERTAIN_MESSAGE = "小伙伴还没有完全听清你的心声，再和它多说说你的想法吧。";
const AI_ERROR_MESSAGE = "小伙伴现在有点听不清，稍后再试一次吧。";

function getRequestedEmotion() {
  if (typeof window === "undefined") return "";
  const emotion = new URLSearchParams(window.location.search).get("emotion") || "";
  return visualEmotionKeys.has(emotion) ? emotion : "";
}

function getRequestedConstellationKey() {
  if (typeof window === "undefined") return "";
  const key = new URLSearchParams(window.location.search).get("constellation") || "";
  return zodiacConstellations.some((constellation) => constellation.key === key) ? key : "";
}

function getRequestedSceneKey() {
  if (typeof window === "undefined") return "lullaby";
  return new URLSearchParams(window.location.search).get("scene") || "lullaby";
}

function buildConstellationDemoRecords(constellationKey = "pisces", emotion = "calm", sceneKey = "lullaby") {
  const constellation = getConstellationByKey(constellationKey);
  const composition = getEnvironmentComposition(emotion, sceneKey);
  const viewportWidth = typeof window === "undefined" ? 1365 : window.innerWidth;
  const viewportHeight = typeof window === "undefined" ? 768 : window.innerHeight;
  const projectedNodes = projectConstellationNodes(
    constellation,
    composition.skyBounds,
    viewportWidth,
    viewportHeight
  );

  return projectedNodes.slice(0, 4).map((point, index) => ({
    id: `visual_constellation_${index}`,
    text: `第 ${index + 1} 颗星星`,
    emotion: "calm",
    createdAt: `2026-05-11 20:0${index}:00`,
    star: {
      id: `visual_star_${index}`,
      x: point.x,
      y: point.y,
      constellationKey: constellation.key,
      constellationNodeId: point.id,
      constellationIndex: index
    },
    title: "",
    aiSuggestedEmotion: "",
    aiFeedback: "这颗星星已经被你安放好了。",
    favorite: false,
    deleted: false,
    audioUrl: "",
    imageUrl: "",
    diaryBookId: "default",
    gestureCreated: false
  }));
}

export default function App() {
  const [records, setRecords] = useState([]);
  const [currentEmotion, setCurrentEmotion] = useState("calm");
  const [isDiaryOpen, setIsDiaryOpen] = useState(false);
  const [flowPhase, setFlowPhase] = useState("idle");
  const [diaryText, setDiaryText] = useState("");
  const [diaryEmotion, setDiaryEmotion] = useState("calm");
  const [diaryError, setDiaryError] = useState("");
  const [aiEmotionStatus, setAiEmotionStatus] = useState("idle");
  const [aiEmotionMessage, setAiEmotionMessage] = useState("");
  const [pendingRecord, setPendingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [driftingStars, setDriftingStars] = useState([]);
  const [selectedDriftStar, setSelectedDriftStar] = useState(null);
  const [isDriftLoading, setIsDriftLoading] = useState(false);
  const [isPublishingDrift, setIsPublishingDrift] = useState(false);
  const [driftPublishError, setDriftPublishError] = useState("");
  const [showDriftPublishPrompt, setShowDriftPublishPrompt] = useState(false);
  const [recentCompletedEmotion, setRecentCompletedEmotion] = useState("");
  const [recentCompletedStar, setRecentCompletedStar] = useState(null);
  const [activeConstellationKey, setActiveConstellationKey] = useState(
    () => getRequestedConstellationKey() || getRandomConstellationKey()
  );
  const [isManualConstellation, setIsManualConstellation] = useState(Boolean(getRequestedConstellationKey()));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedEmotion = getRequestedEmotion();
    const requestedConstellation = getRequestedConstellationKey();
    if (params.get("reset") === "1") {
      clearRecords();
      setRecords([]);
      setCurrentEmotion(requestedEmotion || "calm");
      setActiveConstellationKey(requestedConstellation || getRandomConstellationKey());
      setIsManualConstellation(Boolean(requestedConstellation));
      return;
    }
    if (params.get("demo") === "constellation") {
      const demoEmotion = requestedEmotion || "calm";
      const demoRecords = buildConstellationDemoRecords(
        requestedConstellation || "pisces",
        demoEmotion,
        getRequestedSceneKey()
      );
      setRecords(demoRecords);
      setCurrentEmotion(demoEmotion);
      setActiveConstellationKey(requestedConstellation || "pisces");
      setIsManualConstellation(Boolean(requestedConstellation));
      return;
    }
    const savedRecords = loadRecords();
    setRecords(savedRecords);
    const latestStarred = [...savedRecords].reverse().find((record) => record.star);
    if (requestedEmotion) {
      setCurrentEmotion(requestedEmotion);
    } else if (latestStarred) {
      setCurrentEmotion(latestStarred.emotion);
    }
  }, []);

  useEffect(() => {
    const cached = loadCachedDriftStars();
    if (cached && cached.length > 0) {
      setDriftingStars(cached);
      return;
    }
    handleLoadDriftingStars();
  }, []);

  function buildMockDriftingStars() {
    return [
      {
        id: "mock_drift_1",
        text: "今天考完试了，感觉整个人都轻飘飘的，像云一样。",
        emotion: "calm",
        author_id: "traveler_a",
        constellation_key: "libra",
        star_x: 0.18,
        star_y: 0.22,
        drift_count: 3,
        is_public: true,
        created_at: "2026-05-13 19:30:00"
      },
      {
        id: "mock_drift_2",
        text: "和朋友吵了一架，现在有点难过，但也许明天就好了吧。",
        emotion: "sad",
        author_id: "traveler_b",
        constellation_key: "cancer",
        star_x: 0.62,
        star_y: 0.15,
        drift_count: 7,
        is_public: true,
        created_at: "2026-05-12 21:15:00"
      },
      {
        id: "mock_drift_3",
        text: "被老师表扬啦！今天的心情像星星一样亮闪闪的。",
        emotion: "happy",
        author_id: "traveler_c",
        constellation_key: "leo",
        star_x: 0.35,
        star_y: 0.55,
        drift_count: 12,
        is_public: true,
        created_at: "2026-05-11 17:45:00"
      },
      {
        id: "mock_drift_4",
        text: "明天要演讲，脑子里全是泡泡一样的担心……先把它写下来。",
        emotion: "anxious",
        author_id: "traveler_d",
        constellation_key: "gemini",
        star_x: 0.78,
        star_y: 0.38,
        drift_count: 2,
        is_public: true,
        created_at: "2026-05-13 14:20:00"
      },
      {
        id: "mock_drift_5",
        text: "有些话不知道该跟谁说，就交给这片星空吧。",
        emotion: "wronged",
        author_id: "traveler_e",
        constellation_key: "pisces",
        star_x: 0.50,
        star_y: 0.70,
        drift_count: 5,
        is_public: true,
        created_at: "2026-05-10 23:10:00"
      }
    ];
  }

  async function handleLoadDriftingStars() {
    setIsDriftLoading(true);
    try {
      const response = await fetch("/api/drifting-stars?limit=5");
      if (response.ok) {
        const data = await response.json();
        if (data?.status === "ok" && Array.isArray(data.stars) && data.stars.length > 0) {
          setDriftingStars(data.stars);
          saveCachedDriftStars(data.stars);
          return;
        }
      }
    } catch (error) {
      console.error("[drift-stars] load failed:", error);
    }
    const mockStars = buildMockDriftingStars();
    setDriftingStars(mockStars);
    saveCachedDriftStars(mockStars);
    setIsDriftLoading(false);
  }

  function handleSelectDriftStar(star) {
    setSelectedDriftStar(star);
  }

  function handleCloseDriftStar() {
    setSelectedDriftStar(null);
  }

  async function handlePickupDriftStar(starId) {
    if (starId.startsWith("mock_")) {
      setDriftingStars((prev) => prev.filter((s) => s.id !== starId));
      setSelectedDriftStar(null);
      return null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(`/api/drifting-stars/${starId}/pickup`, {
        method: "PATCH",
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { error: data.message || "送出失败了" };
      }

      setDriftingStars((prev) => prev.filter((s) => s.id !== starId));
      setSelectedDriftStar(null);
      handleLoadDriftingStars();
      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        return { error: "送出太慢了，网络可能有问题" };
      }
      console.error("[drift-stars] pickup failed:", error);
      return { error: "送出失败了，稍后再试吧" };
    }
  }

  async function handlePublishAsDrift(recordId) {
    setIsPublishingDrift(true);
    setDriftPublishError("");

    const targetRecord = recordId ? records.find((r) => r.id === recordId) : null;
    const starToPublish = targetRecord?.star || recentCompletedStar;
    const emotionToPublish = targetRecord?.emotion || recentCompletedEmotion;
    const textToPublish = targetRecord?.text || "";

    if (!starToPublish) {
      setIsPublishingDrift(false);
      return { error: "没有可发布的星星" };
    }

    const mockStar = {
      id: `mock_drift_${Date.now()}`,
      text: textToPublish || "来自指尖星空的心情碎片",
      emotion: emotionToPublish || "calm",
      constellation_key: starToPublish.constellationKey,
      star_x: starToPublish.x,
      star_y: starToPublish.y,
      drift_count: 0,
      sourceType: "sentDrift",
      driftDirection: "sent",
      is_public: true,
      created_at: new Date().toISOString().replace("T", " ").slice(0, 19)
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch("/api/drifting-stars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textToPublish || "来自指尖星空的心情碎片",
          emotion: emotionToPublish || "calm",
          constellationKey: starToPublish.constellationKey,
          starX: starToPublish.x,
          starY: starToPublish.y
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (data.message === "漂流服务暂未配置") {
          setDriftingStars((prev) => [mockStar, ...prev.slice(0, 9)]);
          handleDismissDriftPrompt();
          return null;
        }
        setIsPublishingDrift(false);
        return { error: data.message || "发布失败了" };
      }

      handleLoadDriftingStars();
      handleDismissDriftPrompt();
      return null;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === "AbortError") {
        setDriftingStars((prev) => [mockStar, ...prev.slice(0, 9)]);
        handleDismissDriftPrompt();
        return null;
      }
      console.error("[drift-stars] publish failed:", error);
      setDriftingStars((prev) => [mockStar, ...prev.slice(0, 9)]);
      handleDismissDriftPrompt();
      return null;
    } finally {
      setIsPublishingDrift(false);
    }
  }

  const starredRecords = useMemo(
    () => records.filter((record) => !record.deleted && record.star),
    [records]
  );

  function handleOpenDiary() {
    setRecentCompletedEmotion("");
    setRecentCompletedStar(null);
    setDiaryError("");
    setAiEmotionStatus("idle");
    setAiEmotionMessage("");
    setIsDiaryOpen(true);
    setFlowPhase("writing");
  }

  function handleCloseDiary() {
    setIsDiaryOpen(false);
    setDiaryText("");
    setDiaryEmotion("calm");
    setDiaryError("");
    setAiEmotionStatus("idle");
    setAiEmotionMessage("");
    if (!pendingRecord) setFlowPhase(currentEmotion === "calm" ? "calm" : "idle");
  }

  async function handleDetectDiaryEmotion() {
    const trimmedText = diaryText.trim();

    if (!hasEnoughLetterContent(trimmedText)) {
      setAiEmotionStatus("uncertain");
      setAiEmotionMessage(AI_SHORT_LETTER_MESSAGE);
      return;
    }

    setAiEmotionStatus("loading");
    setAiEmotionMessage("");

    try {
      const response = await fetch("/api/detect-emotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letterContent: trimmedText })
      });

      if (!response.ok) {
        throw new Error(`detect emotion failed with ${response.status}`);
      }

      const data = await response.json();

      if (data?.status === "ok" && selectableEmotionKeys.has(data.emotion)) {
        setDiaryEmotion(data.emotion);
        setAiEmotionStatus("success");
        setAiEmotionMessage(data.message || AI_UNCERTAIN_MESSAGE);
        return;
      }

      if (data?.status === "uncertain") {
        setAiEmotionStatus("uncertain");
        setAiEmotionMessage(data.message || AI_UNCERTAIN_MESSAGE);
        return;
      }

      throw new Error("Unexpected detect emotion response");
    } catch (error) {
      console.error(error);
      setAiEmotionStatus("error");
      setAiEmotionMessage(AI_ERROR_MESSAGE);
    }
  }

  function handleCreateRecord(data = { text: diaryText, emotion: diaryEmotion }) {
    const trimmedText = (data.text || "").trim();

    if (!trimmedText) {
      setDiaryError("请先写下一点想交给星空的话。");
      return false;
    }

    const record = createEmotionRecord({ text: trimmedText, emotion: data.emotion });
    const nextRecords = [...records, record];

    setRecords(nextRecords);
    saveRecords(nextRecords);
    setPendingRecord(record);
    setIsDiaryOpen(false);
    setDiaryText("");
    setDiaryEmotion("calm");
    setDiaryError("");
    setAiEmotionStatus("idle");
    setAiEmotionMessage("");
    setFlowPhase("paperReady");
    return true;
  }

  function handleThrowComplete(payload) {
    const targetRecord = records.find((record) => record.id === payload.recordId);

    if (!targetRecord) {
      console.warn("record not found:", payload.recordId);
      return;
    }

    const nextRecords = records.map((record) =>
      record.id === payload.recordId ? { ...record, star: payload.star } : record
    );
    const completedConstellation = getConstellationByKey(payload.star?.constellationKey);
    const completedCount = nextRecords.filter(
      (record) => !record.deleted && record.star?.constellationKey === completedConstellation.key
    ).length;

    setRecords(nextRecords);
    saveRecords(nextRecords);
    if (completedCount >= completedConstellation.requiredStarCount) {
      setActiveConstellationKey(
        chooseNextConstellationKey({
          records: nextRecords,
          currentKey: completedConstellation.key,
          skyBounds: payload.skyBounds,
          viewportWidth: payload.viewportWidth,
          viewportHeight: payload.viewportHeight
        })
      );
      setIsManualConstellation(false);
    }
    setPendingRecord(null);
    setCurrentEmotion(targetRecord.emotion);
    setRecentCompletedEmotion(targetRecord.emotion);
    setRecentCompletedStar(payload.star);
    setFlowPhase("recoveryPrompt");
  }

  function handleCancelPendingRecord(recordId) {
    const nextRecords = records.filter((record) => record.id !== recordId);
    setRecords(nextRecords);
    saveRecords(nextRecords);
    setPendingRecord(null);
    setFlowPhase("idle");
  }

  function handleRecoveryComplete() {
    setShowDriftPublishPrompt(true);
  }

  function handleDismissDriftPrompt() {
    setShowDriftPublishPrompt(false);
    setDriftPublishError("");
    setCurrentEmotion("calm");
    setRecentCompletedEmotion("");
    setRecentCompletedStar(null);
    setFlowPhase("calm");
  }

  function handleSelectStar(record) {
    setSelectedRecord(record);
  }

  function handleCloseStarDetail() {
    setSelectedRecord(null);
  }

  function handleToggleFavorite(recordId) {
    const nextRecords = records.map((record) =>
      record.id === recordId ? { ...record, favorite: !record.favorite } : record
    );
    const nextSelectedRecord = nextRecords.find((record) => record.id === recordId) || null;
    setRecords(nextRecords);
    saveRecords(nextRecords);
    setSelectedRecord(nextSelectedRecord);
  }

  function handleDeleteRecord(recordId) {
    const nextRecords = records.map((record) =>
      record.id === recordId ? { ...record, deleted: true } : record
    );
    setRecords(nextRecords);
    saveRecords(nextRecords);
    setSelectedRecord(null);
  }

  function handleClearRecords() {
    clearRecords();
    setRecords([]);
    setPendingRecord(null);
    setSelectedRecord(null);
    setCurrentEmotion("calm");
    setRecentCompletedEmotion("");
    setRecentCompletedStar(null);
    setIsDiaryOpen(false);
    setDiaryText("");
    setDiaryEmotion("calm");
    setDiaryError("");
    setAiEmotionStatus("idle");
    setAiEmotionMessage("");
    setFlowPhase("idle");
    setActiveConstellationKey(getRandomConstellationKey());
    setIsManualConstellation(false);
  }

  function handleSelectConstellation(key) {
    const selectedConstellation = getConstellationByKey(key);
    setActiveConstellationKey(selectedConstellation.key);
    setIsManualConstellation(true);
  }

  function handleInjectDemoData() {
    const demoRecords = [
      {
        id: "demo_wronged_1",
        text: "今天有一点委屈，但我想把它轻轻交给星空。",
        emotion: "wronged",
        createdAt: "2026-05-10 20:10:00",
        star: { id: "star_demo_wronged_1", x: 210, y: 126 }
      },
      {
        id: "demo_angry_1",
        text: "有一团热热的生气，需要慢慢冷下来。",
        emotion: "angry",
        createdAt: "2026-05-10 20:18:00",
        star: { id: "star_demo_angry_1", x: 410, y: 174 }
      },
      {
        id: "demo_anxious_1",
        text: "脑子里有很多泡泡一样的担心，先放在这里。",
        emotion: "anxious",
        createdAt: "2026-05-10 20:26:00",
        star: { id: "star_demo_anxious_1", x: 610, y: 132 }
      },
      {
        id: "demo_very_sad_1",
        text: "很难过的时候，也可以先被一颗小星星收住。",
        emotion: "verySad",
        createdAt: "2026-05-09 21:20:00",
        star: { id: "star_demo_very_sad_1", x: 330, y: 238 }
      },
      {
        id: "demo_happy_1",
        text: "今天有一束很轻的开心，想让它也发亮。",
        emotion: "happy",
        createdAt: "2026-05-08 19:42:00",
        star: { id: "star_demo_happy_1", x: 740, y: 218 }
      },
      {
        id: "demo_calm_1",
        text: "现在安静一点了，像星光慢慢落下来。",
        emotion: "calm",
        createdAt: "2026-05-07 22:05:00",
        star: { id: "star_demo_calm_1", x: 520, y: 284 }
      }
    ].map((record) => ({
      title: "",
      aiSuggestedEmotion: "",
      aiFeedback: "这颗星星已经被你安放好了。",
      favorite: false,
      deleted: false,
      audioUrl: "",
      imageUrl: "",
      diaryBookId: "default",
      gestureCreated: false,
      ...record
    }));

    const existingRecords = records.filter((record) => !record.id.startsWith("demo_"));
    const nextRecords = [...existingRecords, ...demoRecords];
    setRecords(nextRecords);
    saveRecords(nextRecords);
  }

  return (
    <>
      <MainScene
        records={records}
        starredRecords={starredRecords}
        currentEmotion={currentEmotion}
        flowPhase={flowPhase}
        pendingRecord={pendingRecord}
        activeConstellationKey={activeConstellationKey}
        isManualConstellation={isManualConstellation}
        recentCompletedEmotion={recentCompletedEmotion}
        recentCompletedStar={recentCompletedStar}
        driftingStars={driftingStars}
        isDriftLoading={isDriftLoading}
        onOpenDiary={handleOpenDiary}
        onSubmitDiary={handleCreateRecord}
        onFlowPhaseChange={setFlowPhase}
        onThrowComplete={handleThrowComplete}
        onRecoveryComplete={handleRecoveryComplete}
        onCancelPendingRecord={handleCancelPendingRecord}
        onSelectStar={handleSelectStar}
        onClearRecords={handleClearRecords}
        onInjectDemoData={handleInjectDemoData}
        onSelectConstellation={handleSelectConstellation}
        onSelectDriftStar={handleSelectDriftStar}
        onPublishAsDrift={handlePublishAsDrift}
        isPublishingDrift={isPublishingDrift}
        driftPublishError={driftPublishError}
        showDriftPublishPrompt={showDriftPublishPrompt}
        onDismissDriftPrompt={handleDismissDriftPrompt}
      />

      <DiaryModal
        isOpen={isDiaryOpen}
        text={diaryText}
        emotion={diaryEmotion}
        error={diaryError}
        aiEmotionStatus={aiEmotionStatus}
        aiEmotionMessage={aiEmotionMessage}
        onTextChange={(value) => {
          setDiaryText(value);
          if (diaryError) setDiaryError("");
          if (aiEmotionStatus !== "idle") {
            setAiEmotionStatus("idle");
            setAiEmotionMessage("");
          }
        }}
        onEmotionChange={setDiaryEmotion}
        onDetectEmotion={handleDetectDiaryEmotion}
        onClose={handleCloseDiary}
        onSubmit={handleCreateRecord}
      />

      <StarDetailModal
        record={selectedRecord}
        onClose={handleCloseStarDetail}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteRecord}
      />

      <DriftStarDetailModal
        star={selectedDriftStar}
        onClose={handleCloseDriftStar}
        onPickup={handlePickupDriftStar}
      />
    </>
  );
}
