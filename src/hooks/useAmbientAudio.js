import { useRef, useState } from "react";
import { audioPresets } from "../config/audioConfig";

export function useAmbientAudio() {
  const contextRef = useRef(null);
  const gainRef = useRef(null);
  const nodesRef = useRef([]);
  const [selectedPreset, setSelectedPresetState] = useState("rain");
  const [volume, setVolumeState] = useState(audioPresets.rain.defaultVolume);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");

  function setSelectedPreset(nextPreset) {
    setSelectedPresetState(nextPreset);
    setVolumeState(audioPresets[nextPreset]?.defaultVolume || 24);
    if (isPlaying) play(nextPreset);
  }

  function setVolume(nextVolume) {
    const normalized = clampVolume(nextVolume);
    setVolumeState(normalized);
    if (gainRef.current) {
      gainRef.current.gain.value = normalized / 100;
    }
  }

  async function play(preset = selectedPreset) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
      setError("当前浏览器暂不支持 Web Audio。");
      return;
    }

    const context = contextRef.current || new AudioContextClass();
    contextRef.current = context;
    if (context.resume) await context.resume();

    stopNodes();
    const gain = context.createGain();
    gain.gain.value = volume / 100;
    gain.connect(context.destination);
    gainRef.current = gain;

    nodesRef.current = createPresetNodes(context, preset, gain);
    setSelectedPresetState(preset);
    setIsPlaying(true);
    setError("");
  }

  function pause() {
    stopNodes();
    setIsPlaying(false);
  }

  return {
    selectedPreset,
    volume,
    isPlaying,
    error,
    setSelectedPreset,
    setVolume,
    play,
    pause
  };

  function stopNodes() {
    for (const node of nodesRef.current) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch {
        // Web Audio nodes can throw when stopped twice.
      }
    }
    nodesRef.current = [];
  }
}

function createPresetNodes(context, preset, destination) {
  if (preset === "lullaby") return createLullaby(context, destination);
  return createNoisePreset(context, preset, destination);
}

function createNoisePreset(context, preset, destination) {
  const bufferSize = 2 * (context.sampleRate || 44100);
  const buffer = context.createBuffer(1, bufferSize, context.sampleRate || 44100);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    const wave = preset === "waves" ? Math.sin(i / 8000) : 1;
    const crackle = preset === "campfire" && i % 2205 < 30 ? 1.4 : 0.36;
    data[i] = (Math.random() * 2 - 1) * wave * crackle;
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  if (filter.frequency) {
    filter.frequency.value = preset === "campfire" ? 1400 : preset === "waves" ? 620 : 950;
  }

  source.connect(filter);
  filter.connect(destination);
  source.start();
  return [source, filter];
}

function createLullaby(context, destination) {
  const oscillator = context.createOscillator();
  oscillator.type = "sine";
  oscillator.frequency.value = 220;
  oscillator.connect(destination);
  oscillator.start();
  return [oscillator];
}

function clampVolume(value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) return 0;
  return Math.min(100, Math.max(0, parsed));
}
