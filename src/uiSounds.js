const preferenceKey = "essenplan-ui-sounds";
let audioContext;

export function getUiSoundsEnabled() {
  try {
    const preference = window.localStorage.getItem(preferenceKey);
    return preference === null ? true : preference === "on";
  } catch {
    return true;
  }
}

export function setUiSoundsEnabled(enabled) {
  try {
    window.localStorage.setItem(preferenceKey, enabled ? "on" : "off");
  } catch {
    // Audio remains usable for this session if browser storage is unavailable.
  }
}

export function playUiSound(type, enabled = getUiSoundsEnabled()) {
  if (!enabled || typeof window === "undefined") return;

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) return;

  try {
    audioContext ||= new AudioContextConstructor();
    if (audioContext.state === "suspended") {
      audioContext.resume().catch(() => {});
    }

    const now = audioContext.currentTime;
    const patterns = {
      tap: [[520, 0, 0.045, 0.025]],
      success: [
        [523.25, 0, 0.09, 0.045],
        [659.25, 0.075, 0.11, 0.04],
        [783.99, 0.15, 0.16, 0.035],
      ],
      error: [
        [392, 0, 0.1, 0.035],
        [311.13, 0.09, 0.14, 0.03],
      ],
      like: [
        [587.33, 0, 0.08, 0.035],
        [783.99, 0.07, 0.12, 0.03],
      ],
      dislike: [
        [392, 0, 0.1, 0.03],
        [329.63, 0.08, 0.11, 0.025],
      ],
    };

    for (const [frequency, offset, duration, volume] of patterns[type] || patterns.tap) {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const start = now + offset;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(start);
      oscillator.stop(start + duration + 0.015);
    }
  } catch {
    // Sound is decorative and must never interrupt an app action.
  }
}
