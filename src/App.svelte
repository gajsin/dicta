<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import "./lib/styles/theme.css";
  import HistoryView from "./lib/components/HistoryView.svelte";
  import SettingsPanel from "./lib/components/SettingsPanel.svelte";
  import FloatingWidget from "./lib/components/FloatingWidget.svelte";
  import type { WidgetPayload } from "./lib/services/widgetBroadcaster";
  import TopBar from "./lib/components/TopBar.svelte";
  import AboutView from "./lib/components/AboutView.svelte";
  import CommandPalette from "./lib/components/CommandPalette.svelte";
  import Toast from "./lib/components/ui/Toast.svelte";
  import { invoke } from "@tauri-apps/api/core";
  import { getCurrentWindow } from "@tauri-apps/api/window";
  import { listen } from "@tauri-apps/api/event";
  import { loadSettings, type AppSettingsPatch } from "./lib/utils/settings";
  import { AppSettingsController } from "./lib/settings/AppSettingsController.svelte";
  import { HistoryController } from "./lib/history/HistoryController.svelte";
  import { RecordingController } from "./lib/recording/RecordingController.svelte";
  import type { ThemeMode } from "./lib/settings/model";
  import { hydrateAndRevealMainWindow } from "./lib/window/startup";
  import {
    resolveActualTheme,
    applyAccentColor,
    type AccentThemeChange,
  } from "./lib/utils/accentTheme";

  const currentWindow = (() => {
    try {
      return getCurrentWindow();
    } catch {
      return {
        label: "main",
        minimize: () => Promise.resolve(),
        hide: () => Promise.resolve(),
      } as ReturnType<typeof getCurrentWindow>;
    }
  })();
  const windowLabel = currentWindow?.label || "main";

  const initialSettings = loadSettings();
  const tauriInternals =
    typeof window !== "undefined"
      ? window.__TAURI_INTERNALS__
      : undefined;
  const isTauriRuntime = Boolean(
    tauriInternals?.invoke && tauriInternals?.transformCallback,
  );
  const appSettings = new AppSettingsController({
    initialSettings,
    isTauriRuntime,
    windowLabel,
  });

  $effect(() => {
    applyAccentColor(
      appSettings.current.accentColor,
      appSettings.current.accentOpacity,
      false,
    );
  });

  let searchQuery = $state("");

  let availableDevices = $state<Array<{ name: string; isDefault: boolean }>>(
    [],
  );

  // Active View inside main window
  let currentView = $state<"history" | "settings" | "about">("history");

  // Command Palette Visibility
  let showCommandPalette = $state(false);

  let toastTimeoutId = $state<number | undefined>(undefined);

  let notificationToast = $state("");

  const showToast = (msg: string) => {
    notificationToast = msg;
    if (toastTimeoutId !== undefined) clearTimeout(toastTimeoutId);
    toastTimeoutId = window.setTimeout(() => {
      notificationToast = "";
      toastTimeoutId = undefined;
    }, 3500);
  };

  const history = new HistoryController({ onNotice: showToast });
  const recording = new RecordingController({
    isTauriRuntime,
    windowLabel,
    getSettings: () => appSettings.current,
    onHistoryItem: (text, durationSec, rawText) => {
      if (appSettings.current.saveHistory) {
        history.add(text, durationSec, rawText);
      }
    },
    onOpenSettings: () => {
      currentView = "settings";
    },
  });

  $effect(() => {
    if (typeof document !== "undefined") {
      const actual = resolveActualTheme(appSettings.current.theme);
      if (actual === "dark") {
        document.documentElement.classList.add("theme-dark");
        document.documentElement.classList.remove("theme-light");
      } else {
        document.documentElement.classList.add("theme-light");
        document.documentElement.classList.remove("theme-dark");
      }
    }
  });

  const toggleTheme = async () => {
    const theme = appSettings.current.theme;
    const nextMode: ThemeMode =
      theme === "system" ? "light" : theme === "light" ? "dark" : "system";
    try {
      await appSettings.setTheme(nextMode);
      recording.broadcast();
    } catch (error) {
      console.error("[Dicta] Failed to update theme:", error);
      showToast("Не удалось сохранить тему");
    }
  };

  const refreshDevices = async () => {
    if (isTauriRuntime) {
      try {
        const devices = await invoke<
          Array<{ name: string; isDefault: boolean }>
        >("get_microphone_devices");
        availableDevices = devices;
      } catch (err) {
        console.error("[Dicta] Failed to fetch microphones:", err);
      }
    }
  };

  const handleCopyTranscriptText = async (text: string) => {
    try {
      if (isTauriRuntime) {
        await invoke("copy_and_paste", { text, paste: false });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        throw new Error("Clipboard API недоступен");
      }
      showToast("Текст скопирован — вставьте через Ctrl+V");
    } catch (error) {
      console.error("[Dicta] Clipboard write failed:", error);
      showToast("Не удалось скопировать текст");
    }
  };

  const handleSaveSettingsFromChild = async (
    newSettings: AppSettingsPatch,
  ) => {
    await appSettings.update(newSettings);
    recording.broadcast();
  };

  const handleGlobalKeyDown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      showCommandPalette = !showCommandPalette;
    }
  };

  onMount(() => {
    let mediaQuery: MediaQueryList | null = null;
    let handleMediaChange: () => void = () => {};

    if (typeof window !== "undefined" && window.matchMedia) {
      mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      handleMediaChange = () => {
        if (appSettings.current.theme === "system") {
          const actual = resolveActualTheme("system");
          document.documentElement.classList.toggle("theme-dark", actual === "dark");
          document.documentElement.classList.toggle("theme-light", actual === "light");
        }
      };
      mediaQuery.addEventListener("change", handleMediaChange);
    }

    const noop = Promise.resolve(() => {});

    let unlistenAccentTauri = isTauriRuntime
      ? listen<AccentThemeChange | string>("accent-color-changed", (e) => {
          const change = typeof e.payload === "string"
            ? { color: e.payload, opacity: 100 }
            : e.payload;
          applyAccentColor(change.color, change.opacity, false);
        })
      : noop;
    const unlistenSettings = isTauriRuntime
      ? listen("settings-updated", () => {
          void appSettings.reloadFromServer().catch((error) => {
            console.error("[Dicta] Failed to reload settings:", error);
          });
        })
      : noop;
    const unlistenNavigate = isTauriRuntime
      ? listen<string>("navigate-view", (event) => {
          if (
            windowLabel === "main" &&
            (event.payload === "history" ||
              event.payload === "settings" ||
              event.payload === "about")
          ) {
            currentView = event.payload;
          }
        })
      : noop;

    let unlistenLevel = noop;
    let unlistenTrigger = noop;
    let unlistenToggle = noop;
    let unlistenSyncReq = noop;
    let unlistenDeviceError = noop;
    let unlistenTimeout = noop;
    let unlistenAction = noop;

    if (windowLabel === "main") {
      unlistenLevel = isTauriRuntime
        ? listen<number>("audio-level", (e) => {
            recording.setAudioLevel(e.payload);
          })
        : noop;

      unlistenTrigger = isTauriRuntime
        ? listen("trigger-recording", () => {
            void recording.toggle();
          })
        : noop;

      unlistenToggle = isTauriRuntime
        ? listen("toggle-recording", () => {
            void recording.toggle();
          })
        : noop;

      unlistenSyncReq = isTauriRuntime
        ? listen("request-widget-sync", () => {
            recording.broadcast();
          })
        : noop;

      unlistenDeviceError = isTauriRuntime
        ? listen<string>("recording-device-error", (e) => {
            recording.handleDeviceError(e.payload);
          })
        : noop;

      unlistenTimeout = isTauriRuntime
        ? listen<string>("recording-timeout", (e) => {
            recording.handleRecordingTimeout(e.payload);
          })
        : noop;

      unlistenAction = isTauriRuntime
        ? listen<string>("widget-action", (e) => {
            recording.handleWidgetAction(e.payload);
          })
        : noop;
    }

    let unlistenWidgetUpdate: Promise<() => void> = Promise.resolve(() => {});

    if (windowLabel === "settings") {
      currentView = "settings";
    }

    if (windowLabel === "overlay") {
      document.documentElement.style.background = "transparent";
      document.body.style.background = "transparent";

      unlistenWidgetUpdate = isTauriRuntime
        ? listen<WidgetPayload>("widget-update", (e) => {
            recording.applyWidgetUpdate(e.payload);
            if (
              e.payload.theme === "light" ||
              e.payload.theme === "dark" ||
              e.payload.theme === "system"
            ) {
              appSettings.apply({ theme: e.payload.theme });
            }
            if (e.payload.hotkey !== undefined)
              appSettings.apply({ hotkey: e.payload.hotkey });
          })
        : noop;
    }

    history.load();

    void hydrateAndRevealMainWindow(
      () => appSettings.reloadFromServer(),
      windowLabel === "main" && isTauriRuntime,
    ).catch((error) => {
      console.error("[Dicta] Failed to reveal main window:", error);
    });

    refreshDevices();
    return () => {
      if (mediaQuery && handleMediaChange) {
        mediaQuery.removeEventListener("change", handleMediaChange);
      }
      unlistenAccentTauri.then((f) => f()).catch(console.error);
      unlistenSettings.then((f) => f()).catch(console.error);
      unlistenNavigate.then((f) => f()).catch(console.error);
      unlistenLevel.then((f) => f()).catch(console.error);
      unlistenTrigger.then((f) => f()).catch(console.error);
      unlistenToggle.then((f) => f()).catch(console.error);
      unlistenSyncReq.then((f) => f()).catch(console.error);
      unlistenDeviceError.then((f) => f()).catch(console.error);
      unlistenTimeout.then((f) => f()).catch(console.error);
      unlistenAction.then((f) => f()).catch(console.error);
      unlistenWidgetUpdate.then((f) => f()).catch(console.error);
    };
  });

  onDestroy(() => {
    recording.dispose();
    if (toastTimeoutId !== undefined) {
      clearTimeout(toastTimeoutId);
    }
  });
</script>

<svelte:window onkeydown={handleGlobalKeyDown} />

<svelte:head>
  <title>Dicta</title>
</svelte:head>

<main
  class="app-root theme-{appSettings.current.theme}"
  class:overlay-root={windowLabel === "overlay"}
>
  {#if windowLabel !== "overlay"}
    <div class="window-shell">
      <!-- Unified Desktop App Toolbar Header -->
      <TopBar
        {currentView}
        onNavigateView={(v) => {
          currentView = v;
        }}
      />

      <!-- Main Workspace -->
      <div class="main-body">
        {#if currentView === "history"}
          <HistoryView
            historyList={history.items}
            bind:selectedId={history.selectedId}
            {searchQuery}
            saveHistory={appSettings.current.saveHistory}
            recordingState={recording.widgetState}
            hotkey={appSettings.current.hotkey}
            audioLevel={recording.audioLevel}
            timerSeconds={recording.timerSeconds}
            statusMessage={recording.widgetMessage}
            onStartRecording={() => recording.toggle()}
            onStopRecording={() => recording.toggle()}
            onCancelRecording={() => recording.cancel()}
            onRetry={() => recording.retry()}
            onDelete={(id) => history.delete(id)}
            onUpdateItem={(id, field, text) => history.update(id, field, text)}
            onCopyText={handleCopyTranscriptText}
            onClearHistory={() => history.clear()}
            onOpenPrivacySettings={() => {
              currentView = "settings";
            }}
          />
        {:else if currentView === "settings"}
          <SettingsPanel
            hotkey={appSettings.current.hotkey}
            sttProvider={appSettings.current.sttProvider}
            llmProvider={appSettings.current.llmProvider}
            apiKey={appSettings.current.apiKey}
            providerApiKeys={appSettings.current.providerApiKeys}
            verifiedProviders={appSettings.current.verifiedProviders}
            selectedModel={appSettings.current.selectedModel}
            selectedLanguage={appSettings.current.selectedLanguage}
            selectedDeviceId={appSettings.current.selectedDeviceId}
            postprocessEnabled={appSettings.current.postprocessEnabled}
            postprocessMode={appSettings.current.postprocessMode}
            postprocessModel={appSettings.current.postprocessModel}
            autostart={appSettings.current.autostart}
            saveHistory={appSettings.current.saveHistory}
            theme={appSettings.current.theme}
            accentColor={appSettings.current.accentColor}
            accentOpacity={appSettings.current.accentOpacity}
            {availableDevices}
            historyCount={history.items.length}
            onClearHistory={() => history.clear()}
            onSave={handleSaveSettingsFromChild}
            onClose={() => {
              currentView = "history";
            }}
          />
        {:else if currentView === "about"}
          <AboutView
            onBack={() => {
              currentView = "history";
            }}
          />
        {/if}
      </div>

      <!-- Toast Notification -->
      <Toast
        message={notificationToast}
        onUndo={history.canUndo ? () => history.undo() : undefined}
      />

      <!-- Command Palette Overlay -->
      <CommandPalette
        visible={showCommandPalette}
        historyItems={history.items}
        currentTheme={appSettings.current.theme}
        currentMode={appSettings.current.postprocessMode}
        onClose={() => {
          showCommandPalette = false;
        }}
        onNavigateView={(v) => {
          currentView = v;
        }}
        onSelectHistory={(id) => {
          history.selectedId = id;
        }}
        onToggleTheme={toggleTheme}
        onTriggerRecording={() => recording.toggle()}
        onSetMode={(m) => {
          void appSettings
            .update({
              postprocessMode: m,
              postprocessEnabled: m !== "raw",
            })
            .then(() => {
              showToast(
                `Режим изменён: ${m === "raw" ? "Как сказано" : m === "minimal" ? "Аккуратно" : m === "balanced" ? "Сбалансированно" : "Профессионально"}`,
              );
            })
            .catch((error) => {
              console.error("[Dicta] Failed to update processing mode:", error);
              showToast("Не удалось сохранить режим");
            });
        }}
      />
    </div>
  {:else if windowLabel === "overlay"}
    <!-- HUD Overlay Capsule Window -->
    <FloatingWidget
      visible={true}
      widgetState={recording.widgetState}
      audioLevel={recording.audioLevel}
      timerSeconds={recording.timerSeconds}
      message={recording.widgetMessage}
      hotkeyName={appSettings.current.hotkey}
      theme={appSettings.current.theme}
      errorActionType={recording.errorActionType}
      onStop={() => recording.sendWidgetAction("stop")}
      onCancel={() => recording.sendWidgetAction("cancel")}
      onRetry={() => recording.sendWidgetAction("retry")}
      onOpenSettings={() => recording.sendWidgetAction("open_settings")}
      onClose={() => recording.sendWidgetAction("close")}
    />
  {/if}
</main>

<style>
  .app-root {
    width: 100vw;
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg-app, #f7f8fa);
    color: var(--main-text, #15171a);
    font-family: var(--font-sans);
    overflow: hidden;
  }

  .app-root.overlay-root {
    background: transparent !important;
  }

  .window-shell {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background: var(--bg-app, #f7f8fa);
  }

  .main-body {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
    position: relative;
  }
</style>
