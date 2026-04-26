import { BookOpen, Sparkles, Telescope, Trash2, WandSparkles } from "lucide-react";
import { emotionConfig } from "../config/emotionConfig";
import CharacterActor from "./CharacterActor";
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

          <div className="scene-visuals" aria-label="情绪角色画面">
            <CharacterActor emotion={currentEmotion} />
            <div className="companion-placeholders" aria-hidden="true">
              <span>{config.fox.replace("/assets/", "assets/")}</span>
              <span>{config.rose.replace("/assets/", "assets/")}</span>
            </div>
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
