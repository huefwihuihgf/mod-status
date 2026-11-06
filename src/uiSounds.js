const soundPreferenceKey = "essenplan-ui-sounds";
const soundVolumeKey = "essenplan-ui-sound-volume";
const musicVolumeKey = "essenplan-ui-music-volume";
let audioContext;
let musicTimer;
let musicNoteIndex = 0;
let musicGain;

const melody = [
  [523.25, 0.11],
  [659.25, 0.09],
  [783.99, 0.12],
  [659.25, 0.09],
  [587.33, 0.1],
  [698.46, 0.12],
  [783.99, 0.1],
  [659.25, 0.14],
  [493.88, 0.1],
  [587.33, 0.12],
  [659.25, 0.14],
  [587.33, 0.1],
  [523.25, 0.12],
  [587.33, 0.1],
  [698.46, 0.15],
  [523.25, 0.16],
];

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ||= new AudioContextConstructor();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

export function getUiSoundsEnabled() {
  try {
    const preference = window.localStorage.getItem(soundPreferenceKey);
    return preference === null ? true : preference === "on";
  } catch {
    return true;
  }
}

export function setUiSoundsEnabled(enabled) {
  try {
    window.localStorage.setItem(soundPreferenceKey, enabled ? "on" : "off");
  } catch {
    return;
  }
}

export function getUiSoundVolume() {
  try {
    const volume = Number(window.localStorage.getItem(soundVolumeKey));
    return Number.isFinite(volume) ? Math.min(1, Math.max(0.1, volume)) : 0.65;
  } catch {
    return 0.65;
  }
}

export function setUiSoundVolume(volume) {
  const normalizedVolume = Math.min(1, Math.max(0.1, Number(volume) || 0.1));
  try {
    window.localStorage.setItem(soundVolumeKey, String(normalizedVolume));
  } catch {
    return normalizedVolume;
  }
  return normalizedVolume;
}

export function getUiMusicVolume() {
  try {
    const volume = Number(window.localStorage.getItem(musicVolumeKey));
    return Number.isFinite(volume) ? Math.min(0.35, Math.max(0.02, volume)) : 0.12;
  } catch {
    return 0.12;
  }
}

export function saveUiMusicVolume(volume) {
  const normalizedVolume = Math.min(0.35, Math.max(0.02, Number(volume) || 0.02));
  try {
    window.localStorage.setItem(musicVolumeKey, String(normalizedVolume));
  } catch {
    return normalizedVolume;
  }
  return normalizedVolume;
}

export function playUiSound(type, enabled = getUiSoundsEnabled(), volume = getUiSoundVolume()) {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;

  const patterns = {
    tap: [[587.33, 0, 0.07, 0.13]],
    select: [[523.25, 0, 0.07, 0.12], [783.99, 0.055, 0.085, 0.1]],
    success: [
      [523.25, 0, 0.11, 0.17],
      [659.25, 0.085, 0.13, 0.15],
      [783.99, 0.17, 0.2, 0.13],
    ],
    error: [
      [392, 0, 0.14, 0.15],
      [311.13, 0.12, 0.19, 0.12],
    ],
    like: [
      [587.33, 0, 0.1, 0.15],
      [783.99, 0.075, 0.15, 0.14],
    ],
    dislike: [
      [392, 0, 0.12, 0.13],
      [329.63, 0.09, 0.15, 0.11],
    ],
    delete: [
      [440, 0, 0.08, 0.12],
      [349.23, 0.07, 0.12, 0.1],
    ],
  };

  try {
    for (const [frequency, offset, duration, level] of patterns[type] || patterns.tap) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = context.currentTime + offset;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(level * volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    }
  } catch {
    return;
  }
}

export function startUiMusic(volume = 0.2) {
  if (musicTimer) return true;
  const context = getAudioContext();
  if (!context) return false;

  try {
    musicGain = context.createGain();
    musicGain.gain.setValueAtTime(Math.min(0.35, Math.max(0.02, volume)), context.currentTime);
    musicGain.connect(context.destination);
    musicNoteIndex = 0;

    const playNote = () => {
      if (!audioContext || !musicGain) return;
      const [frequency, duration] = melody[musicNoteIndex % melody.length];
      musicNoteIndex += 1;
      const start = audioContext.currentTime;
      const oscillator = audioContext.createOscillator();
      const noteGain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      noteGain.gain.setValueAtTime(0.0001, start);
      noteGain.gain.exponentialRampToValueAtTime(0.5, start + 0.025);
      noteGain.gain.setValueAtTime(0.5, start + duration * 0.45);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(noteGain);
      noteGain.connect(musicGain);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.02);
    };

    playNote();
    musicTimer = window.setInterval(playNote, 390);
    return true;
  } catch {
    stopUiMusic();
    return false;
  }
}

export function setUiMusicVolume(volume) {
  if (!musicGain || !audioContext) return;
  musicGain.gain.setTargetAtTime(
    Math.min(0.35, Math.max(0.02, Number(volume) || 0.02)),
    audioContext.currentTime,
    0.08
  );
}

export function stopUiMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = undefined;
  if (musicGain && audioContext) {
    const previousGain = musicGain;
    musicGain = undefined;
    previousGain.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.04);
    window.setTimeout(() => previousGain.disconnect(), 300);
  }
}
