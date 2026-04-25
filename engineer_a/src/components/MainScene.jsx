import { BookOpen, Sparkles, Telescope, Trash2, WandSparkles } from "lucide-react";
import { emotionConfig } from "../config/emotionConfig";
import AssetPlaceholder from "./AssetPlaceholder";
import PaperNote from "./PaperNote";
import SceneEffects from "./SceneEffects";
import StarLayer from "./StarLayer";

export default function MainScene({
  records,
  starredRecords,
  currentEmotion,
  pendingRecord,
  onOpenDiary,
  onThrowComplete,
  onSelectStar,
  onClearRecords
}) {
  const config = emotionConfig[currentEmotion] || emotionConfig.calm;

  return (
    <main className={`main-scene emotion-${currentEmotion}`}>
      <AssetPlaceholder
        className="scene-background-placeholder"
        fileName={config.background.replace("/assets/", "assets/")}
        label={`${config.label}背景`}
      />
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
          <StarLayer records={starredRecords} onSelectStar={onSelectStar} />
          <div className="constellation-hint">已保存 {records.length} 条记录</div>
        </div>

        <div className="planet-stage">
          <div className="planet-copy">
            <Sparkles size={24} />
            <p>把今天写成纸条，折起来，交给这片星空。</p>
          </div>

          <div className="scene-asset-map" aria-label="第一阶段美工素材占位">
            <AssetPlaceholder fileName={config.planet.replace("/assets/", "assets/")} label="小星球地面" />
            <AssetPlaceholder fileName={config.character.replace("/assets/", "assets/")} label="主角状态" />
            <AssetPlaceholder fileName={config.fox.replace("/assets/", "assets/")} label="狐狸状态" />
            <AssetPlaceholder fileName={config.rose.replace("/assets/", "assets/")} label="玫瑰状态" />
          </div>

          <div className="stage-actions" aria-label="主操作">
            <button className="stage-action is-primary" type="button" onClick={onOpenDiary}>
              <BookOpen size={30} />
              <span>记录情绪</span>
            </button>
            <button className="stage-action" type="button" aria-label="观测星空（第一阶段占位）">
              <Telescope size={30} />
              <span>观测星空</span>
              <small>点击星星回看</small>
            </button>
            <button className="stage-action" type="button" aria-label="改变环境（第一阶段占位）">
              <WandSparkles size={30} />
              <span>改变环境</span>
              <small>{config.label}场景</small>
            </button>
          </div>
        </div>

        <PaperNote record={pendingRecord} records={records} onThrowComplete={onThrowComplete} />
      </section>
    </main>
  );
}
