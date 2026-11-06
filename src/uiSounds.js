const soundPreferenceKey = "essenplan-ui-sounds";
const soundVolumeKey = "essenplan-ui-sound-volume";
const musicPreferenceKey = "essenplan-ui-music";
const musicVolumeKey = "essenplan-ui-music-volume";
let audioContext;
let musicTimer;
let musicStep = 0;
let musicMaster;

const musicPhrase = [
  { note: 60, length: 1 },
  { note: 64, length: 1 },
  { note: 67, length: 2 },
  { note: 64, length: 1 },
  { note: 62, length: 1 },
  { note: 65, length: 2 },
  { note: 69, length: 1 },
  { note: 67, length: 1 },
  { note: 64, length: 2 },
  { note: 59, length: 1 },
  { note: 62, length: 1 },
  { note: 67, length: 2 },
  { note: 60, length: 1 },
  { note: 64, length: 1 },
  { note: 67, length: 1 },
  { note: 72, length: 1 },
  { note: 69, length: 2 },
  { note: 67, length: 2 },
];
const chordProgression = [
  [48, 55, 60, 64],
  [45, 52, 57, 60],
  [41, 48, 53, 57],
  [43, 50, 55, 59],
];

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return null;
  audioContext ||= new AudioContextConstructor();
  if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
  return audioContext;
}

function normalizedVolume(value, fallback = 1) {
  const volume = Number(value);
  return Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : fallback;
}

function readPreference(key, fallback) {
  try {
    const preference = window.localStorage.getItem(key);
    return preference === null ? fallback : preference === "on";
  } catch {
    return fallback;
  }
}

function readVolume(key) {
  try {
    const storedVolume = window.localStorage.getItem(key);
    return storedVolume === null ? 1 : normalizedVolume(storedVolume);
  } catch {
    return 1;
  }
}

function saveVolume(key, value) {
  const volume = normalizedVolume(value);
  try {
    window.localStorage.setItem(key, String(volume));
  } catch {
    return volume;
  }
  return volume;
}

export function getUiSoundsEnabled() {
  return readPreference(soundPreferenceKey, true);
}

export function setUiSoundsEnabled(enabled) {
  try {
    window.localStorage.setItem(soundPreferenceKey, enabled ? "on" : "off");
  } catch {
    return;
  }
}

export function getUiSoundVolume() {
  return readVolume(soundVolumeKey);
}

export function setUiSoundVolume(volume) {
  return saveVolume(soundVolumeKey, volume);
}

export function getUiMusicEnabled() {
  return readPreference(musicPreferenceKey, true);
}

export function setUiMusicEnabled(enabled) {
  try {
    window.localStorage.setItem(musicPreferenceKey, enabled ? "on" : "off");
  } catch {
    return;
  }
}

export function getUiMusicVolume() {
  return readVolume(musicVolumeKey);
}

export function saveUiMusicVolume(volume) {
  return saveVolume(musicVolumeKey, volume);
}

function midiFrequency(note) {
  return 440 * 2 ** ((note - 69) / 12);
}

function playTone(context, destination, note, start, duration, level, type, softness = 0.06) {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const filter = context.createBiquadFilter();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(midiFrequency(note), start);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(type === "triangle" ? 2800 : 2100, start);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(level, start + softness);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(filter);
  filter.connect(envelope);
  envelope.connect(destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.025);
}

export function playUiSound(type, enabled = getUiSoundsEnabled(), volume = getUiSoundVolume()) {
  if (!enabled) return;
  const context = getAudioContext();
  if (!context) return;

  const patterns = {
    tap: [[76, 0, 0.1, 0.13, "sine"]],
    select: [[72, 0, 0.13, 0.12, "sine"], [79, 0.045, 0.18, 0.075, "triangle"]],
    success: [
      [72, 0, 0.18, 0.11, "sine"],
      [76, 0.07, 0.2, 0.09, "triangle"],
      [79, 0.14, 0.28, 0.075, "sine"],
    ],
    error: [[67, 0, 0.16, 0.1, "sine"], [63, 0.1, 0.23, 0.08, "triangle"]],
    like: [[76, 0, 0.16, 0.1, "sine"], [81, 0.08, 0.2, 0.07, "triangle"]],
    dislike: [[69, 0, 0.17, 0.09, "sine"], [65, 0.09, 0.2, 0.07, "triangle"]],
    delete: [[74, 0, 0.11, 0.08, "sine"], [69, 0.07, 0.15, 0.07, "sine"]],
  };
  const selectedPattern = patterns[type] || patterns.tap;
  const volumeLevel = normalizedVolume(volume);

  try {
    for (const [note, offset, duration, level, tone] of selectedPattern) {
      playTone(
        context,
        context.destination,
        note,
        context.currentTime + offset,
        duration,
        level * volumeLevel,
        tone,
        0.012
      );
    }
  } catch {
    return;
  }
}

function playMusicStep() {
  if (!audioContext || !musicMaster) return;
  const context = audioContext;
  const step = musicPhrase[musicStep % musicPhrase.length];
  const beat = musicStep % 4;
  const chord = chordProgression[Math.floor(musicStep / 4) % chordProgression.length];
  const start = context.currentTime + 0.025;
  const duration = step.length * 0.72;

  playTone(context, musicMaster, step.note, start, duration, 0.075, "triangle", 0.045);
  playTone(context, musicMaster, step.note + 12, start, duration * 0.62, 0.018, "sine", 0.06);
  if (beat === 0) {
    chord.forEach((note, index) => {
      playTone(
        context,
        musicMaster,
        note,
        start,
        2.6,
        index === 0 ? 0.038 : 0.022,
        "sine",
        0.3
      );
    });
  }
  musicStep += 1;
}

export function startUiMusic(volume = getUiMusicVolume()) {
  if (musicTimer) return true;
  const context = getAudioContext();
  if (!context) return false;

  try {
    musicMaster = context.createGain();
    musicMaster.gain.setValueAtTime(normalizedVolume(volume), context.currentTime);
    musicMaster.connect(context.destination);
    musicStep = 0;
    playMusicStep();
    musicTimer = window.setInterval(playMusicStep, 720);
    return true;
  } catch {
    stopUiMusic();
    return false;
  }
}

export function setUiMusicVolume(volume) {
  if (!musicMaster || !audioContext) return;
  musicMaster.gain.setTargetAtTime(
    normalizedVolume(volume),
    audioContext.currentTime,
    0.12
  );
}

export function stopUiMusic() {
  if (musicTimer) window.clearInterval(musicTimer);
  musicTimer = undefined;
  if (musicMaster && audioContext) {
    const previousMaster = musicMaster;
    musicMaster = undefined;
    previousMaster.gain.setTargetAtTime(0.0001, audioContext.currentTime, 0.08);
    window.setTimeout(() => previousMaster.disconnect(), 600);
  }
}
