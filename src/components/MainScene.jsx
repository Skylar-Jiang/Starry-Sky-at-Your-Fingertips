import { BookOpen, Hand, Sparkles, Telescope, Trash2, WandSparkles } from "lucide-react";
import { useState } from "react";
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
import { useAmbientAudio } from "../hooks/useAmbientAudio";

export default function MainScene({
  records,
  starredRecords,
  currentEmotion,
  pendingRecord,
  recentCompletedEmotion,
  onOpenDiary,
  onThrowComplete,
  onCancelPendingRecord,
  onSelectStar,
  onClearRecords
}) {
  const [isObservingSky, setIsObservingSky] = useState(false);
  const [isEnvironmentOpen, setIsEnvironmentOpen] = useState(false);
  const [isGestureOpen, setIsGestureOpen] = useState(false);
  const [emotionFilter, setEmotionFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const ambientAudio = useAmbientAudio();
  const config = emotionConfig[currentEmotion] || emotionConfig.calm;
  const visibleStarredRecords = isObservingSky
    ? filterRecordsByDateRange(filterRecordsByEmotion(starredRecords, emotionFilter), dateFilter)
    : starredRecords;

  return (
    <main className={`main-scene emotion-${currentEmotion}`}>
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
            <StarLayer records={starredRecords} onSelectStar={onSelectStar} />
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
            <RecoveryInteractionLayer
              emotion={currentEmotion}
              active={!pendingRecord && recentCompletedEmotion === currentEmotion}
            />
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
          records={records}
          onThrowComplete={onThrowComplete}
          onCancel={onCancelPendingRecord}
        />
      </section>

      {isEnvironmentOpen ? (
        <EnvironmentPanel
          emotion={currentEmotion}
          audio={ambientAudio}
          onClose={() => setIsEnvironmentOpen(false)}
        />
      ) : null}
      {isGestureOpen ? <GestureExperimentPanel onClose={() => setIsGestureOpen(false)} /> : null}
    </main>
  );
}
