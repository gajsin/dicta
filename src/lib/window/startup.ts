import { invoke } from '@tauri-apps/api/core';

export async function hydrateAndRevealMainWindow(
  reloadSettings: () => Promise<void>,
  shouldReveal: boolean,
): Promise<void> {
  try {
    await reloadSettings();
  } catch (error) {
    console.error('[Dicta] Failed to load settings:', error);
  }
  if (!shouldReveal) return;

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => resolve());
  });
  await invoke('reveal_main_window');
}
