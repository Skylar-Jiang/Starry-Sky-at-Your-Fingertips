import { Pause, Play, Volume2 } from "lucide-react";
import { audioPresetOptions, getRecommendedAudioPreset } from "../config/audioConfig";

export default function EnvironmentAudioControls({ emotion, audio }) {
  const recommendedPreset = getRecommendedAudioPreset(emotion);

  return (
    <div className="environment-audio-controls">
      <div className="environment-preset-grid" aria-label="环境预设">
        {audioPresetOptions.map((preset) => {
          const isSelected = audio.selectedPreset === preset.key;
          const isRecommended = recommendedPreset === preset.key;

          return (
            <button
              key={preset.key}
              className={isSelected ? "environment-preset is-selected" : "environment-preset"}
              type="button"
              onClick={() => audio.setSelectedPreset(preset.key)}
              aria-label={preset.label}
            >
              <img src={preset.image} alt="" aria-hidden="true" />
              <span>{preset.label}</span>
              <small>{isRecommended ? "推荐" : preset.description}</small>
            </button>
          );
        })}
      </div>

      <div className="audio-control-row">
        <button
          className={audio.isPlaying ? "primary-button audio-play-button is-playing" : "primary-button audio-play-button"}
          type="button"
          onClick={() => (audio.isPlaying ? audio.pause() : audio.play())}
          aria-label={audio.isPlaying ? "暂停白噪音" : "播放白噪音"}
        >
          {audio.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {audio.isPlaying ? "播放中" : "播放白噪音"}
        </button>

        <label className="volume-control">
          <span>
            <Volume2 size={16} />
            环境音量
          </span>
          <input
            aria-label="环境音量"
            type="range"
            min="0"
            max="100"
            value={audio.volume}
            onChange={(event) => audio.setVolume(event.target.value)}
          />
          <output>{audio.volume}%</output>
        </label>
      </div>

      {audio.error ? <p className="audio-error">{audio.error}</p> : null}
    </div>
  );
}
