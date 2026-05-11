import { BookOpen, Hand, Sparkles, Telescope, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { emotionConfig } from "../config/emotionConfig";
import CharacterActor from "./CharacterActor";
import CompanionLayer from "./CompanionLayer";
import ConstellationView from "./ConstellationView";
import EnvironmentPanel from "./EnvironmentPanel";
import GestureExperimentPanel from "./GestureExperimentPanel";
import ObservationPanel from "./ObservationPanel";
import PaperNote from "./PaperNote";
import RecoveryInteractionLayer from "./RecoveryInteractionLayer";
import SceneEffects from "./SceneEffects";
import StarLayer from "./StarLayer";
import { filterRecordsByDateRange, filterRecordsByEmotion } from "../utils/recordFilters";
import { createStarPlacement } from "../utils/starPlacement";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { getRecommendedAudioPreset } from "../config/audioConfig";
import { getDefaultEnvironmentSceneKey } from "../config/sceneAssetConfig";

export default function MainScene({
  records,
  starredRecords,
  currentEmotion,
  flowPhase,
  pendingRecord,
  recentCompletedEmotion,
  recentCompletedStar,
  onOpenDiary,
  onSubmitDiary,
  onFlowPhaseChange,
  onThrowComplete,
  onRecoveryComplete,
  onCancelPendingRecord,
  onSelectStar,
  onClearRecords,
  onInjectDemoData
}) {
  const [isObservingSky, setIsObservingSky] = useState(false);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  const [isGestureOpen, setIsGestureOpen] = useState(false);
  const [isPendingRecordFolded, setIsPendingRecordFolded] = useState(false);
  const [isPendingRecordThrowing, setIsPendingRecordThrowing] = useState(false);
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedEnvironmentSceneKey, setSelectedEnvironmentSceneKey] = useState(() =>
    getDefaultEnvironmentSceneKey(currentEmotion, getRecommendedAudioPreset(currentEmotion))
  );
  const ambientAudio = useAmbientAudio();
  const config = emotionConfig[currentEmotion] || emotionConfig.calm;
  const visibleStarredRecords = isObservingSky
    ? filterRecordsByDateRange(filterRecordsByEmotion(starredRecords, emotionFilter), dateFilter)
    : starredRecords;

  useEffect(() => {
    setIsPendingRecordFolded(false);
    setIsPendingRecordThrowing(false);
  }, [pendingRecord?.id]);

  useEffect(() => {
    setSelectedEnvironmentSceneKey(getDefaultEnvironmentSceneKey(currentEmotion, getRecommendedAudioPreset(currentEmotion)));
  }, [currentEmotion]);

  function handleFoldPendingRecord() {
    if (!pendingRecord || isPendingRecordThrowing) return;
    setIsPendingRecordFolded(true);
    onFlowPhaseChange("paperFolded");
  }

  function handleThrowPendingRecord() {
    if (!pendingRecord || !isPendingRecordFolded || isPendingRecordThrowing) return;

    setIsPendingRecordThrowing(true);
    onFlowPhaseChange("throwing");

    window.setTimeout(() => {
      onThrowComplete({
        recordId: pendingRecord.id,
        star: createStarPlacement({
          viewportWidth: typeof window === "undefined" ? 1200 : window.innerWidth,
          viewportHeight: typeof window === "undefined" ? 800 : window.innerHeight,
          existingStars: records,
          emotion: pendingRecord.emotion
        })
      });
      setIsPendingRecordFolded(false);
      setIsPendingRecordThrowing(false);
    }, 800);
  }

  function simulatePinch() {
    if (flowPhase === "idle" || flowPhase === "calm") {
      onOpenDiary();
      return;
    }

    if (flowPhase === "writing") {
      onSubmitDiary();
      return;
    }

    if (flowPhase === "paperReady") {
      return;
    }

    if (flowPhase === "paperFolded") {
      handleThrowPendingRecord();
      return;
    }

    if (flowPhase === "recoveryPrompt") {
      onRecoveryComplete();
    }
  }

  function simulateFold() {
    handleFoldPendingRecord();
  }

  const isRecoveryActive = flowPhase === "recoveryPrompt";

  return (
    <main className={`main-scene emotion-${currentEmotion} ${isRecoveryActive ? "is-recovery-active" : ""}`}>
      <img className="scene-background-image" src={config.background} alt="" aria-hidden="true" />
      <div className="scene-overlay" />
      <SceneEffects emotion={currentEmotion} />

      <section className="scene-content" aria-label="指尖星空主界面">
        <div className="scene-header">
          <div>
            <p className="eyebrow">Fingertip Starry Sky</p>
            <h1>指尖星空</h1>
          </div>
          <div className="header-actions">
            <button className="icon-text-button" type="button" onClick={onClearRecords}>
              <Trash2 size={17} />
              清空测试数据
            </button>
            <button className="demo-seed-button" type="button" onClick={onInjectDemoData} aria-label="注入演示数据">
              <span aria-hidden="true">•</span>
            </button>
            <button className="icon-text-button" type="button" onClick={() => setIsGestureOpen(true)} aria-label="手势实验">
              <Hand size={17} />
              手势实验
            </button>
            <button
              className="primary-button compact-record-button"
              type="button"
              onClick={onOpenDiary}
              aria-label="顶部记录情绪"
            >
              <BookOpen size={18} />
              记录情绪
            </button>
          </div>
        </div>

        <div className="sky-region">
          <RecoveryInteractionLayer
            emotion={recentCompletedEmotion}
            active={isRecoveryActive}
            targetStar={recentCompletedStar}
            onComplete={onRecoveryComplete}
          />
          {isObservingSky ? (
            <ObservationPanel
              totalCount={starredRecords.length}
              records={visibleStarredRecords}
              emotionFilter={emotionFilter}
              dateFilter={dateFilter}
              onEmotionFilterChange={setEmotionFilter}
              onDateFilterChange={setDateFilter}
            />
          ) : null}
          {isObservingSky ? (
            <ConstellationView records={visibleStarredRecords} onSelectStar={onSelectStar} />
          ) : (
            <>
              <StarLayer records={starredRecords} onSelectStar={onSelectStar} />
              <MainConstellationHint records={starredRecords} />
            </>
          )}
          <div className="constellation-hint">已保存 {records.length} 条记录</div>
        </div>

        <div className="planet-stage">
          <div className="planet-copy">
            <Sparkles size={24} />
            <p>把今天写成纸条，折起来，交给这片星空。</p>
          </div>

          <div className="scene-visuals" aria-label="情绪角色画面">
            <CharacterActor emotion={currentEmotion} />
            <CompanionLayer emotion={currentEmotion} />
          </div>

          <div className="stage-actions" aria-label="主操作">
            <button className="stage-action is-primary" type="button" onClick={onOpenDiary}>
              <BookOpen size={30} />
              <span>记录情绪</span>
            </button>
            <button
              className={isObservingSky ? "stage-action is-active" : "stage-action"}
              type="button"
              onClick={() => setIsObservingSky((value) => !value)}
              aria-label="观测星空"
            >
              <Telescope size={30} />
              <span>观测星空</span>
              <small>{isObservingSky ? "返回主星空" : "点击星星回看"}</small>
            </button>
            <button
              className="stage-action"
              type="button"
              onClick={() => setIsEnvironmentOpen(true)}
              aria-label="改变环境"
            >
              <WandSparkles size={30} />
              <span>改变环境</span>
              <small>{config.label}场景</small>
            </button>
          </div>
        </div>

        <PaperNote
          record={pendingRecord}
          isFolded={isPendingRecordFolded}
          isThrowing={isPendingRecordThrowing}
          onFold={handleFoldPendingRecord}
          onThrow={handleThrowPendingRecord}
          onCancel={onCancelPendingRecord}
        />
      </section>

      {isEnvironmentOpen ? (
        <EnvironmentPanel
          emotion={currentEmotion}
          audio={ambientAudio}
          selectedSceneKey={selectedEnvironmentSceneKey}
          onSelectScene={(scene) => {
            setSelectedEnvironmentSceneKey(scene.key);
            ambientAudio.setSelectedPreset(scene.audioPreset);
          }}
          onClose={() => setIsEnvironmentOpen(false)}
        />
      ) : null}
      {isGestureOpen ? (
        <GestureExperimentPanel
          onClose={() => setIsGestureOpen(false)}
          flowPhase={flowPhase}
          onSimulatePinch={simulatePinch}
          onSimulateFold={simulateFold}
        />
      ) : null}
    </main>
  );
}

function MainConstellationHint({ records }) {
  const groups = Object.values(
    records.reduce((acc, record) => {
      if (!record.star) return acc;
      const group = acc[record.emotion] || { emotion: record.emotion, records: [] };
      group.records.push(record);
      acc[record.emotion] = group;
      return acc;
    }, {})
  );
  const activeGroup = groups.find((group) => group.records.length >= 3);

  if (!activeGroup) return null;

  const points = activeGroup.records
    .slice(0, 5)
    .map((record) => `${record.star.x},${record.star.y}`)
    .join(" ");
  const strengthClass = activeGroup.records.length >= 4 ? "is-stronger" : "";

  return (
    <div className={`main-constellation-hint ${strengthClass}`} aria-label="星座提示">
      <svg viewBox="0 0 1200 440" aria-hidden="true">
        <polyline points={points} />
      </svg>
      <p>它们正在慢慢连成一条温柔的路。</p>
    </div>
  );
}
