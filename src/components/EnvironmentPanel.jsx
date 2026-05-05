import { X } from "lucide-react";
import { getEmotionLabel } from "../config/emotionConfig";
import { getSceneAssets } from "../config/sceneAssetConfig";
import EnvironmentAudioControls from "./EnvironmentAudioControls";

export default function EnvironmentPanel({ emotion, audio, onClose }) {
  const assets = getSceneAssets(emotion);
  const label = getEmotionLabel(emotion);

  return (
    <div className="modal-backdrop environment-backdrop">
      <section className="environment-panel" role="dialog" aria-label="环境面板">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Environment</p>
            <h2>改变环境</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭环境面板">
            <X size={20} />
          </button>
        </div>

        <div className="environment-preview-grid">
          <figure>
            <img src={assets.fox} alt="狐狸样式预览" />
            <figcaption>{label}狐狸</figcaption>
          </figure>
          <figure>
            <img src={assets.rose} alt="玫瑰状态预览" />
            <figcaption>{label}玫瑰</figcaption>
          </figure>
        </div>

        <EnvironmentAudioControls emotion={emotion} audio={audio} />
      </section>
    </div>
  );
}
