use tauri::{Emitter, Manager};

use crate::config::AppState;
use crate::platform::simulate_ctrl_v;
use crate::window_overlay::{
    apply_overlay_geometry, ensure_overlay_exists, raise_overlay_native, OverlayDiagnostics,
};

pub fn show_main_window(app: &tauri::AppHandle) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or_else(|| "Главное окно Dicta не найдено".to_string())?;
    window
        .unminimize()
        .map_err(|error| format!("Не удалось развернуть главное окно: {error}"))?;
    window
        .show()
        .map_err(|error| format!("Не удалось показать главное окно: {error}"))?;
    window
        .set_focus()
        .map_err(|error| format!("Не удалось сфокусировать главное окно: {error}"))
}

#[cfg(windows)]
fn get_active_monitor_by_cursor(app: &tauri::AppHandle) -> Option<tauri::Monitor> {
    use windows::Win32::Foundation::POINT;
    use windows::Win32::UI::WindowsAndMessaging::GetCursorPos;
    let mut pt = POINT { x: 0, y: 0 };
    unsafe {
        if GetCursorPos(&mut pt).is_ok() {
            return app
                .monitor_from_point(pt.x as f64, pt.y as f64)
                .ok()
                .flatten();
        }
    }
    None
}

#[tauri::command]
pub async fn show_overlay(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<OverlayDiagnostics, String> {
    let recreated = app.get_webview_window("overlay").is_none();
    let overlay = ensure_overlay_exists(&app)?;

    #[cfg(windows)]
    let active_monitor = get_active_monitor_by_cursor(&app);
    #[cfg(not(windows))]
    let active_monitor = None;

    let monitor_opt = active_monitor
        .or_else(|| {
            app.get_webview_window("main")
                .and_then(|w| w.current_monitor().ok().flatten())
        })
        .or_else(|| overlay.current_monitor().ok().flatten())
        .or_else(|| app.primary_monitor().ok().flatten());

    apply_overlay_geometry(&overlay, &state.settings, monitor_opt.as_ref());

    if let Err(e) = overlay.set_skip_taskbar(true) {
        eprintln!("[Dicta] show_overlay: set_skip_taskbar failed: {}", e);
    }
    overlay
        .show()
        .map_err(|e| format!("Не удалось показать overlay: {e}"))?;
    let _ = app.emit("request-widget-sync", ());
    let (native_visible, native_topmost, native_cloaked) = raise_overlay_native(&overlay)?;

    let tauri_visible = overlay
        .is_visible()
        .map_err(|e| format!("Не удалось проверить видимость overlay: {e}"))?;
    let minimized = overlay.is_minimized().unwrap_or(false);
    let monitor_found = overlay.current_monitor().ok().flatten().is_some();
    let position = overlay.outer_position().ok().map(|p| (p.x, p.y));
    let size = overlay.inner_size().ok().map(|s| (s.width, s.height));

    eprintln!(
        "[Dicta] Overlay visible={native_visible}, topmost={native_topmost}, recreated={recreated}"
    );

    Ok(OverlayDiagnostics {
        recreated,
        tauri_visible,
        native_visible,
        native_topmost,
        native_cloaked,
        minimized,
        monitor_found,
        position,
        size,
    })
}

#[tauri::command]
pub async fn hide_overlay(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
    state.settings_persistence.flush()
}

#[tauri::command]
pub async fn hide_to_tray(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.hide();
    }
    state.settings_persistence.flush()
}

#[tauri::command]
pub async fn show_from_tray(app: tauri::AppHandle) -> Result<(), String> {
    show_main_window(&app)
}

#[tauri::command]
pub async fn reveal_main_window(app: tauri::AppHandle) -> Result<(), String> {
    show_main_window(&app)
}

#[tauri::command]
pub async fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    show_main_window(&app)?;
    let _ = app.emit("navigate-view", "settings");
    Ok(())
}

#[tauri::command]
pub async fn open_history_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.unminimize();
        let _ = w.show();
        let _ = w.set_focus();
        let _ = app.emit("navigate-view", "history");
    }
    Ok(())
}

#[tauri::command]
pub async fn copy_and_paste(
    text: String,
    paste: Option<bool>,
    app: tauri::AppHandle,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;

    let text_clone = text.clone();
    let write_res = if let Some(window) = app.get_webview_window("main") {
        window.clipboard().write_text(text_clone)
    } else {
        app.clipboard().write_text(text_clone)
    };

    write_res.map_err(|error| {
        eprintln!("[Dicta] Clipboard write failed: {error}");
        format!("Не удалось записать текст в буфер обмена: {error}")
    })?;

    if paste.unwrap_or(true) {
        tokio::time::sleep(std::time::Duration::from_millis(150)).await;
        simulate_ctrl_v().map_err(|error| {
            eprintln!("[Dicta] Paste simulation failed: {error}");
            format!("Не удалось вставить текст: {error}")
        })?;
        if let Some(overlay) = app.get_webview_window("overlay") {
            let _ = raise_overlay_native(&overlay);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn exit_app(app: tauri::AppHandle, state: tauri::State<'_, AppState>) {
    if let Err(error) = state.settings_persistence.flush() {
        eprintln!("[Dicta] Failed to flush settings before exit: {error}");
    }
    app.exit(0);
}
