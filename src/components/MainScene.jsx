import { BookOpen, Hand, Music, Sparkles, Telescope, Trash2, WandSparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { emotionConfig } from "../config/emotionConfig";
import { getRecommendedAudioPreset } from "../config/audioConfig";
import { getDefaultEnvironmentSceneKey } from "../config/sceneAssetConfig";
import { getEnvironmentComposition } from "../config/environmentCompositionConfig";
import { filterRecordsByDateRange, filterRecordsByEmotion } from "../utils/recordFilters";
import { createStarPlacement } from "../utils/starPlacement";
import { useAmbientAudio } from "../hooks/useAmbientAudio";
import { useElementSize } from "../hooks/useElementSize";
import BaseSkyLayer from "./BaseSkyLayer";
import ConstellationView from "./ConstellationView";
import EnvironmentPanel from "./EnvironmentPanel";
import GestureExperimentPanel from "./GestureExperimentPanel";
import ObservationPanel from "./ObservationPanel";
import PaperNote from "./PaperNote";
import PresetConstellationLayer from "./PresetConstellationLayer";
import RecoveryInteractionLayer from "./RecoveryInteractionLayer";
import SceneCharacterLayer from "./SceneCharacterLayer";
import SceneEffectLayer from "./SceneEffectLayer";
import SceneEnvironmentLayer from "./SceneEnvironmentLayer";
import StarLayer from "./StarLayer";
import DriftStarLayer from "./DriftStarLayer";

const visualSceneKeys = new Set(["rain", "campfire", "waves", "lullaby"]);

function getRequestedSceneKey() {
  if (typeof window === "undefined") return "";
  const sceneKey = new URLSearchParams(window.location.search).get("scene") || "";
  return visualSceneKeys.has(sceneKey) ? sceneKey : "";
}

function getRequestedObserveState() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("observe") === "1";
}

export default function MainScene({
  records,
  starredRecords,
  currentEmotion,
  flowPhase,
  pendingRecord,
  activeConstellationKey = "aries",
  isManualConstellation = false,
  recentCompletedEmotion,
  recentCompletedStar,
  driftingStars = [],
  isDriftLoading = false,
  onOpenDiary,
  onSubmitDiary,
  onFlowPhaseChange,
  onThrowComplete,
  onRecoveryComplete,
  onCancelPendingRecord,
  onSelectStar,
  onClearRecords,
  onInjectDemoData,
  onSelectConstellation,
  onSelectDriftStar,
  onPublishAsDrift,
  isPublishingDrift = false,
  driftPublishError = "",
  showDriftPublishPrompt = false,
  onDismissDriftPrompt
}) {
  const [isObservingSky, setIsObservingSky] = useState(getRequestedObserveState);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  const [isGestureOpen, setIsGestureOpen] = useState(false);
  const [isPendingRecordFolded, setIsPendingRecordFolded] = useState(false);
  const [isPendingRecordThrowing, setIsPendingRecordThrowing] = useState(false);
  const [throwTargetStar, setThrowTargetStar] = useState(null);
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedEnvironmentSceneKey, setSelectedEnvironmentSceneKey] = useState(() =>
    getRequestedSceneKey() || getDefaultEnvironmentSceneKey(currentEmotion, getRecommendedAudioPreset(currentEmotion))
  );
  const sceneCoordinateRef = useRef(null);
  const bgMusicRef = useRef(null);
  const [isBgMusicPlaying, setIsBgMusicPlaying] = useState(false);
  const sceneSize = useElementSize(sceneCoordinateRef);
  const ambientAudio = useAmbientAudio();
  const config = emotionConfig[currentEmotion] || emotionConfig.calm;
  const composition = getEnvironmentComposition(currentEmotion, selectedEnvironmentSceneKey);
  const visibleStarredRecords = isObservingSky
    ? filterRecordsByDateRange(filterRecordsByEmotion(starredRecords, emotionFilter), dateFilter)
    : starredRecords;
  useEffect(() => {
    setIsPendingRecordFolded(false);
    setIsPendingRecordThrowing(false);
    setThrowTargetStar(null);
  }, [pendingRecord?.id]);

  useEffect(() => {
    const requestedScene = getRequestedSceneKey();
    if (requestedScene) return;
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

    const sceneRect = sceneCoordinateRef.current?.getBoundingClientRect();
    const viewportWidth = Math.round(sceneRect?.width || sceneSize.width);
    const viewportHeight = Math.round(sceneRect?.height || sceneSize.height);
    const targetStar = createStarPlacement({
      viewportWidth,
      viewportHeight,
      existingStars: records,
      emotion: pendingRecord.emotion,
      skyBounds: composition.skyBounds,
      constellationKey: activeConstellationKey
    });
    if (!targetStar) {
      setIsPendingRecordThrowing(false);
      onFlowPhaseChange("paperFolded");
      return;
    }
    setThrowTargetStar(targetStar);

    window.setTimeout(() => {
      onThrowComplete({
        recordId: pendingRecord.id,
        star: targetStar,
        skyBounds: composition.skyBounds,
        viewportWidth,
        viewportHeight
      });
      setIsPendingRecordFolded(false);
      setIsPendingRecordThrowing(false);
      setThrowTargetStar(null);
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
    if (flowPhase === "paperFolded") {
      handleThrowPendingRecord();
      return;
    }
    if (flowPhase === "recoveryPrompt") onRecoveryComplete();
  }

  function simulateFold() {
    handleFoldPendingRecord();
  }

  function toggleBgMusic() {
    if (!bgMusicRef.current) return;
    if (isBgMusicPlaying) {
      bgMusicRef.current.pause();
      setIsBgMusicPlaying(false);
    } else {
      bgMusicRef.current.play().catch(() => {});
      setIsBgMusicPlaying(true);
    }
  }

  const isRecoveryActive = flowPhase === "recoveryPrompt";

  return (
    <main
      className={`main-scene emotion-${currentEmotion} scene-${selectedEnvironmentSceneKey} ${
        isRecoveryActive ? "is-recovery-active" : ""
      }`}
      data-scene-key={selectedEnvironmentSceneKey}
      data-emotion={currentEmotion}
    >
      <BaseSkyLayer />
      <SceneEnvironmentLayer composition={composition} />
      <SceneEffectLayer emotion={currentEmotion} composition={composition} />
      <div className="scene-overlay" aria-hidden="true" />
      <audio ref={bgMusicRef} src="/assets/bgm.mp4" loop preload="auto" />

      <section className="scene-content" aria-label="指尖星空主界面">
        <div className="ui-layer scene-header">
          <div>
            <p className="eyebrow">Fingertip Starry Sky</p>
            <h1>指尖星空</h1>
          </div>
          <div className="header-actions">
            <button
              className={`icon-text-button ${isBgMusicPlaying ? "is-active" : ""}`}
              type="button"
              onClick={toggleBgMusic}
              aria-label={isBgMusicPlaying ? "暂停背景音乐" : "播放背景音乐"}
            >
              <Music size={17} />
              {isBgMusicPlaying ? "暂停" : "播放"}
            </button>
            <button className="icon-text-button" type="button" onClick={onClearRecords}>
              <Trash2 size={17} />
              清空测试数据
            </button>
            <button className="demo-seed-button" type="button" onClick={onInjectDemoData} aria-label="注入演示数据">
              <span aria-hidden="true">•</span>
            </button>
            <button
              className="icon-text-button"
              type="button"
              onClick={() => onSelectDriftStar(driftingStars[0] || null)}
              aria-label="查看漂流星星"
              disabled={isDriftLoading || driftingStars.length === 0}
            >
              <Sparkles size={17} />
              漂流瓶 {driftingStars.length > 0 ? `(${driftingStars.length})` : ""}
            </button>
            <button className="icon-text-button" type="button" onClick={() => setIsGestureOpen(true)} aria-label="手势实验">
              <Hand size={17} />
              手势实验
            </button>
            <button className="primary-button compact-record-button" type="button" onClick={onOpenDiary} aria-label="顶部记录情绪">
              <BookOpen size={18} />
              记录情绪
            </button>
          </div>
        </div>

        <div className="constellation-layer sky-region">
          {!showDriftPublishPrompt && (
            <RecoveryInteractionLayer
              emotion={recentCompletedEmotion}
              active={isRecoveryActive}
              targetStar={recentCompletedStar}
              onComplete={onRecoveryComplete}
            />
          )}
          {showDriftPublishPrompt && (
            <div className="drift-publish-prompt" role="dialog" aria-label="发布漂流瓶">
              <div className="drift-publish-card">
                <Sparkles size={28} />
                <h3>要把这份心情交给远方的小伙伴吗？</h3>
                <p>你的心情会变成一颗漂流瓶，漂向别人的夜空。</p>
                {driftPublishError && (
                  <p className="drift-publish-error">{driftPublishError}</p>
                )}
                <div className="drift-publish-actions">
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={onDismissDriftPrompt}
                    disabled={isPublishingDrift}
                  >
                    只是自己留着
                  </button>
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => onPublishAsDrift(null)}
                    disabled={isPublishingDrift}
                  >
                    <Sparkles size={16} />
                    {isPublishingDrift ? "发布中..." : "发布到漂流瓶"}
                  </button>
                </div>
              </div>
            </div>
          )}
          {isObservingSky ? (
            <ObservationPanel
              totalCount={starredRecords.length}
              records={visibleStarredRecords}
              emotionFilter={emotionFilter}
              dateFilter={dateFilter}
              activeConstellationKey={activeConstellationKey}
              isManualConstellation={isManualConstellation}
              onEmotionFilterChange={setEmotionFilter}
              onDateFilterChange={setDateFilter}
              onSelectConstellation={onSelectConstellation}
            />
          ) : null}
          <div className="scene-coordinate-space" ref={sceneCoordinateRef}>
            {isObservingSky ? (
              <ConstellationView
                records={visibleStarredRecords}
                onSelectStar={onSelectStar}
                constellationKey={activeConstellationKey}
                skyBounds={composition.skyBounds}
                sceneSize={sceneSize}
              />
            ) : (
              <>
                <PresetConstellationLayer
                  records={starredRecords}
                  mode="main"
                  constellationKey={activeConstellationKey}
                  skyBounds={composition.skyBounds}
                  sceneSize={sceneSize}
                />
                <StarLayer
                  records={starredRecords}
                  onSelectStar={onSelectStar}
                  sceneSize={sceneSize}
                  skyBounds={composition.skyBounds}
                  constellationKey={activeConstellationKey}
                />
                <DriftStarLayer
                  driftingStars={driftingStars}
                  onSelectStar={onSelectDriftStar}
                  sceneSize={sceneSize}
                  skyBounds={composition.skyBounds}
                />
              </>
            )}
          </div>
          <div className="constellation-hint">已保存 {records.length} 条记录</div>
        </div>

        <div className="ui-layer planet-stage">
          <div className="planet-copy">
            <Sparkles size={24} />
            <p>把今天写成纸条，折起来，交给这片星空。</p>
          </div>

          <div className="scene-visuals" aria-label="场景角色画面">
            <SceneCharacterLayer emotion={currentEmotion} composition={composition} />
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
            <button className="stage-action" type="button" onClick={() => setIsEnvironmentOpen(true)} aria-label="改变环境">
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
          targetStar={throwTargetStar}
          emotion={pendingRecord?.emotion || currentEmotion}
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
            setIsEnvironmentOpen(false);
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
