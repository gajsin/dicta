#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod audio;
mod commands;
mod config;
mod platform;
mod settings_persistence;
mod shortcut;
mod transcription;
mod window_overlay;

use std::sync::{Arc, Mutex};
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{Emitter, Manager};

use commands::window::show_main_window;
use config::{load_settings_from_file, save_settings_to_file, AppState, Settings};
use settings_persistence::SettingsPersistence;
use shortcut::{register_global_hotkey, DEFAULT_HOTKEY};
use window_overlay::{attach_overlay_moved_handler, set_autostart_internal, update_window_state};

const TRAY_ID: &str = "main";

fn tray_icon_for_theme(theme: tauri::Theme) -> tauri::image::Image<'static> {
    let bytes = match theme {
        tauri::Theme::Dark => include_bytes!("../icons/tray_dark_32.png").as_slice(),
        _ => include_bytes!("../icons/tray_light_32.png").as_slice(),
    };

    tauri::image::Image::from_bytes(bytes).expect("Failed to load tray icon")
}

fn update_tray_icon(app: &tauri::AppHandle, theme: tauri::Theme) {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        if let Err(error) = tray.set_icon(Some(tray_icon_for_theme(theme))) {
            eprintln!("[Dicta] Failed to update tray icon: {error}");
        }
    }
}

fn recover_invalid_settings(
    settings_path: &Option<std::path::PathBuf>,
    error: &str,
) -> Option<Settings> {
    eprintln!("[Dicta] Invalid settings: {error}");
    if let Some(path) = settings_path {
        if path.exists() {
            let backup_path = path.with_extension(format!(
                "invalid-{}.json",
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .map(|duration| duration.as_secs())
                    .unwrap_or(0)
            ));
            match std::fs::copy(path, &backup_path) {
                Ok(_) => eprintln!(
                    "[Dicta] Invalid settings backup created at {:?}",
                    backup_path
                ),
                Err(backup_error) => {
                    eprintln!("[Dicta] Failed to back up invalid settings: {backup_error}")
                }
            }
        }
    }

    let fallback = Settings::default();
    match save_settings_to_file(&fallback, settings_path) {
        Ok(()) => Some(fallback),
        Err(save_error) => {
            eprintln!("[Dicta] Failed to restore default settings: {save_error}");
            None
        }
    }
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            eprintln!("[Dicta] Second instance attempted — focusing existing window");
            let _ = show_main_window(app);
        }))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            eprintln!("[Dicta] App setup starting...");

            let mut initial_settings_path = None;
            if let Ok(appdata) = std::env::var("APPDATA") {
                let path = std::path::PathBuf::from(appdata)
                    .join("Dicta")
                    .join("settings.json");
                eprintln!("[Dicta] Settings file: {:?}", path);
                initial_settings_path = Some(path);
            }

            let initial_settings = match load_settings_from_file(&initial_settings_path) {
                Ok(settings) => settings,
                Err(error) => recover_invalid_settings(&initial_settings_path, &error),
            };
            if let Some(ref s) = initial_settings {
                if let Err(error) = set_autostart_internal(s.autostart) {
                    eprintln!("[Dicta] Failed to apply saved autostart setting: {error}");
                }
            }
            let initial_hotkey = initial_settings
                .as_ref()
                .map(|s| s.hotkey.clone())
                .unwrap_or_else(|| DEFAULT_HOTKEY.to_string());

            let shared_settings_path = Arc::new(Mutex::new(initial_settings_path));
            let shared_settings = Arc::new(Mutex::new(initial_settings));
            let settings_persistence = SettingsPersistence::new(
                Arc::clone(&shared_settings),
                Arc::clone(&shared_settings_path),
            );
            let app_state = AppState {
                settings_path: shared_settings_path,
                settings: shared_settings,
                settings_persistence,
                active_hotkey: Mutex::new(None),
                recording: Mutex::new(None),
                loopback: Mutex::new(None),
                last_audio: Mutex::new(None),
            };

            app.manage(app_state);

            let state = app.state::<AppState>();
            let app_handle = app.handle().clone();
            let mut active_hotkey_label = initial_hotkey.clone();
            if let Err(error) =
                register_global_hotkey(app_handle.clone(), initial_hotkey.clone(), &state)
            {
                eprintln!("[Dicta] Failed to register saved hotkey on startup: {error}");
                if initial_hotkey != DEFAULT_HOTKEY
                    && register_global_hotkey(app_handle, DEFAULT_HOTKEY.to_string(), &state)
                        .is_ok()
                {
                    active_hotkey_label = DEFAULT_HOTKEY.to_string();
                    let updated = {
                        let mut settings_guard =
                            state.settings.lock().unwrap_or_else(|e| e.into_inner());
                        if let Some(settings) = settings_guard.as_mut() {
                            settings.hotkey = active_hotkey_label.clone();
                            true
                        } else {
                            false
                        }
                    };
                    if updated {
                        if let Err(save_error) = state.settings_persistence.flush() {
                            eprintln!("[Dicta] Failed to persist fallback hotkey: {save_error}");
                        }
                    }
                    eprintln!("[Dicta] Falling back to global hotkey {DEFAULT_HOTKEY}");
                }
            }

            // ── Tray Menu Setup ──
            let ready_item = MenuItem::with_id(app, "ready", "Dicta готова", false, None::<&str>)?;
            let start_item = MenuItem::with_id(
                app,
                "start",
                format!("Начать диктовку {active_hotkey_label}"),
                true,
                None::<&str>,
            )?;
            let history_item =
                MenuItem::with_id(app, "history", "Открыть историю", true, None::<&str>)?;
            let settings_item =
                MenuItem::with_id(app, "settings", "Настройки", true, None::<&str>)?;
            let quit_item = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>)?;

            let menu = Menu::with_items(
                app,
                &[
                    &ready_item,
                    &start_item,
                    &history_item,
                    &settings_item,
                    &quit_item,
                ],
            )?;

            let system_theme = app
                .get_webview_window("main")
                .and_then(|window| window.theme().ok())
                .unwrap_or(tauri::Theme::Light);
            let tray_icon = tray_icon_for_theme(system_theme);

            let _tray = TrayIconBuilder::with_id(TRAY_ID)
                .icon(tray_icon)
                .menu(&menu)
                .show_menu_on_left_click(false)
                .tooltip("Dicta — голосовой ввод")
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        button_state: tauri::tray::MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        let _ = show_main_window(app);
                    }
                })
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "start" => {
                        let _ = app.emit("trigger-recording", ());
                    }
                    "history" => {
                        if show_main_window(app).is_ok() {
                            let _ = app.emit("navigate-view", "history");
                        }
                    }
                    "settings" => {
                        if show_main_window(app).is_ok() {
                            let _ = app.emit("navigate-view", "settings");
                        }
                    }
                    "quit" => {
                        let state = app.state::<AppState>();
                        if let Err(error) = state.settings_persistence.flush() {
                            eprintln!("[Dicta] Failed to flush settings before exit: {error}");
                        }
                        app.exit(0);
                    }
                    _ => {}
                })
                .build(app)?;
            eprintln!("[Dicta] Tray icon created");

            // ── Main window configuration & bounds persistence ──
            if let Some(window) = app.get_webview_window("main") {
                let mut has_position = false;
                {
                    let guard = state.settings.lock().unwrap_or_else(|e| e.into_inner());
                    if let Some(ref s) = *guard {
                        if let (Some(x), Some(y)) = (s.window_x, s.window_y) {
                            if x > -10000 && y > -10000 {
                                let _ = window.set_position(tauri::Position::Physical(
                                    tauri::PhysicalPosition::new(x, y),
                                ));
                                has_position = true;
                            }
                        }
                        if let (Some(w), Some(h)) = (s.window_width, s.window_height) {
                            if w >= 200.0 && h >= 300.0 {
                                let _ = window
                                    .set_size(tauri::Size::Logical(tauri::LogicalSize::new(w, h)));
                            } else {
                                eprintln!("[Dicta] Invalid saved size {}x{}, using defaults", w, h);
                                let _ = window.set_size(tauri::Size::Logical(
                                    tauri::LogicalSize::new(960.0, 620.0),
                                ));
                            }
                        }
                    }
                }
                if !has_position {
                    let _ = window.center();
                }

                let w = window.clone();
                let app_handle_for_events = app.handle().clone();
                window.on_window_event(move |event| {
                    let state = app_handle_for_events.state::<AppState>();
                    match event {
                        tauri::WindowEvent::CloseRequested { api, .. } => {
                            eprintln!("[Dicta] Close → hide main");
                            api.prevent_close();
                            let _ = w.hide();

                            if let Err(error) = state.settings_persistence.flush() {
                                eprintln!("[Dicta] Failed to save settings on close: {error}");
                            }
                        }
                        tauri::WindowEvent::Moved(pos) => {
                            update_window_state(
                                &w,
                                &state.settings,
                                &state.settings_persistence,
                                Some(*pos),
                                None,
                            );
                        }
                        tauri::WindowEvent::Resized(size) => {
                            update_window_state(
                                &w,
                                &state.settings,
                                &state.settings_persistence,
                                None,
                                Some(*size),
                            );
                        }
                        tauri::WindowEvent::Focused(false) => {
                            if let Err(error) = state.settings_persistence.flush() {
                                eprintln!("[Dicta] Failed to save settings on blur: {error}");
                            }
                        }
                        tauri::WindowEvent::ThemeChanged(theme) => {
                            update_tray_icon(&app_handle_for_events, *theme);
                        }
                        _ => {}
                    }
                });
            }

            attach_overlay_moved_handler(app.handle());

            eprintln!("[Dicta] Setup complete");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::copy_and_paste,
            commands::open_data_folder,
            commands::check_provider_api_key,
            commands::delete_provider_api_key,
            commands::hide_to_tray,
            commands::show_from_tray,
            commands::reveal_main_window,
            commands::open_settings_window,
            commands::open_history_window,
            commands::start_recording,
            commands::cancel_recording,
            commands::sync_settings,
            commands::load_settings,
            commands::show_overlay,
            commands::hide_overlay,
            commands::stop_recording_and_transcribe,
            commands::retry_transcription,
            commands::exit_app,
            commands::get_microphone_devices,
            commands::start_loopback,
            commands::stop_loopback
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
