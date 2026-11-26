// Shared top-level state: phase (briefing / flying / paused / ended), selected mission, camera mode.
export const state = {
  phase: 'briefing', missionId: 1, cameraMode: 'chase', time: 0, shot: false, showControls: false,
  banner: '', bannerT: 0, mouseStick: false,
};
export function banner(text, seconds = 3) { state.banner = text; state.bannerT = seconds; }
