import { X } from "lucide-react";
import { getEmotionLabel } from "../config/emotionConfig";
import { getEnvironmentScenes } from "../config/sceneAssetConfig";
import EnvironmentAudioControls from "./EnvironmentAudioControls";

export default function EnvironmentPanel({ emotion, audio, selectedSceneKey, onSelectScene, onClose }) {
  const sceneOptions = getEnvironmentScenes(emotion);
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

        <div className="environment-preview-grid" aria-label={`${label}星空场景变体`}>
          {sceneOptions.map((scene) => (
            <button
              key={scene.key}
              className={selectedSceneKey === scene.key ? "environment-scene-card is-selected" : "environment-scene-card"}
              type="button"
              onClick={() => onSelectScene(scene)}
              aria-label={scene.label}
            >
              <img src={scene.image} alt={`${label}${scene.label}场景`} />
              <span>{scene.label}</span>
              <small>{scene.description}</small>
            </button>
          ))}
        </div>

        <EnvironmentAudioControls emotion={emotion} audio={audio} />
      </section>
    </div>
  );
}
