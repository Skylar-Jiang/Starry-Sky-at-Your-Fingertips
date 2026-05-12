import { useEffect, useMemo, useState } from "react";
import MainScene from "./components/MainScene";
import DiaryModal from "./components/DiaryModal";
import StarDetailModal from "./components/StarDetailModal";
import { createEmotionRecord } from "./utils/record";
import { clearRecords, loadRecords, saveRecords } from "./utils/storage";
import { chooseNextConstellationKey } from "./utils/constellationSelection";
import { projectConstellationNodes } from "./utils/constellationProjection";
import { getEnvironmentComposition } from "./config/environmentCompositionConfig";
import {
  getConstellationByKey,
  getRandomConstellationKey,
  zodiacConstellations
} from "./config/presetConstellationConfig";
import { emotionOptionKeys } from "./config/emotionConfig";

const visualEmotionKeys = new Set(emotionOptionKeys);

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
  const [pendingRecord, setPendingRecord] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
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

  const starredRecords = useMemo(
    () => records.filter((record) => !record.deleted && record.star),
    [records]
  );

  function handleOpenDiary() {
    setRecentCompletedEmotion("");
    setRecentCompletedStar(null);
    setDiaryError("");
    setIsDiaryOpen(true);
    setFlowPhase("writing");
  }

  function handleCloseDiary() {
    setIsDiaryOpen(false);
    setDiaryText("");
    setDiaryEmotion("calm");
    setDiaryError("");
    if (!pendingRecord) setFlowPhase(currentEmotion === "calm" ? "calm" : "idle");
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
      />

      <DiaryModal
        isOpen={isDiaryOpen}
        text={diaryText}
        emotion={diaryEmotion}
        error={diaryError}
        onTextChange={(value) => {
          setDiaryText(value);
          if (diaryError) setDiaryError("");
        }}
        onEmotionChange={setDiaryEmotion}
        onClose={handleCloseDiary}
        onSubmit={handleCreateRecord}
      />

      <StarDetailModal
        record={selectedRecord}
        onClose={handleCloseStarDetail}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteRecord}
      />
    </>
  );
}
