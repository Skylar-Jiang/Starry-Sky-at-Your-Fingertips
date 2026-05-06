import { useEffect, useMemo, useState } from "react";
import MainScene from "./components/MainScene";
import DiaryModal from "./components/DiaryModal";
import StarDetailModal from "./components/StarDetailModal";
import { createEmotionRecord } from "./utils/record";
import { clearRecords, loadRecords, saveRecords } from "./utils/storage";

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

  useEffect(() => {
    const savedRecords = loadRecords();
    setRecords(savedRecords);
    const latestStarred = [...savedRecords].reverse().find((record) => record.star);
    if (latestStarred) setCurrentEmotion(latestStarred.emotion);
  }, []);

  const starredRecords = useMemo(
    () => records.filter((record) => !record.deleted && record.star),
    [records]
  );

  function handleOpenDiary() {
    setRecentCompletedEmotion("");
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

    setRecords(nextRecords);
    saveRecords(nextRecords);
    setPendingRecord(null);
    setCurrentEmotion(targetRecord.emotion);
    setRecentCompletedEmotion(targetRecord.emotion);
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
    setIsDiaryOpen(false);
    setDiaryText("");
    setDiaryEmotion("calm");
    setDiaryError("");
    setFlowPhase("idle");
  }

  return (
    <>
      <MainScene
        records={records}
        starredRecords={starredRecords}
        currentEmotion={currentEmotion}
        flowPhase={flowPhase}
        pendingRecord={pendingRecord}
        recentCompletedEmotion={recentCompletedEmotion}
        onOpenDiary={handleOpenDiary}
        onSubmitDiary={handleCreateRecord}
        onFlowPhaseChange={setFlowPhase}
        onThrowComplete={handleThrowComplete}
        onRecoveryComplete={handleRecoveryComplete}
        onCancelPendingRecord={handleCancelPendingRecord}
        onSelectStar={handleSelectStar}
        onClearRecords={handleClearRecords}
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
