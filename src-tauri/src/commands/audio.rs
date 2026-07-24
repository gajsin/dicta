use crate::audio::{
    cancel_recording_internal, get_microphone_devices as audio_get_microphone_devices,
    start_loopback_internal, start_recording_internal, stop_loopback_internal,
    stop_recording_internal, AudioDevice,
};
use crate::config::AppState;
use crate::transcription::{try_transcribe_and_polish, TranscriptionOptions, TranscriptionResult};

#[tauri::command]
pub fn get_microphone_devices() -> Result<Vec<AudioDevice>, String> {
    audio_get_microphone_devices()
}

#[tauri::command]
pub fn start_recording(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
    device_label: Option<String>,
) -> Result<(), String> {
    {
        let mut last = state.last_audio.lock().unwrap_or_else(|e| e.into_inner());
        *last = None;
    }
    match start_recording_internal(app, device_label, &state.recording) {
        Ok(()) => {
            eprintln!("[Dicta] start_recording: OK");
            Ok(())
        }
        Err(e) => {
            eprintln!("[Dicta] start_recording: FAILED: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
pub fn cancel_recording(state: tauri::State<'_, AppState>) -> Result<(), String> {
    cancel_recording_internal(&state.recording)
}

#[tauri::command]
pub async fn stop_recording_and_transcribe(
    state: tauri::State<'_, AppState>,
    options: TranscriptionOptions,
) -> Result<TranscriptionResult, String> {
    let base64_audio = stop_recording_internal(&state.recording)?;
    let result = try_transcribe_and_polish(&base64_audio, &options).await;

    // Retain audio only when retry can help. Successful recordings should not
    // remain in memory for the lifetime of the application.
    if result.is_err() {
        let mut last = state.last_audio.lock().unwrap_or_else(|e| e.into_inner());
        *last = Some(base64_audio);
    }

    result
}

#[tauri::command]
pub async fn retry_transcription(
    state: tauri::State<'_, AppState>,
    options: TranscriptionOptions,
) -> Result<TranscriptionResult, String> {
    let base64_audio = {
        let mut last = state.last_audio.lock().unwrap_or_else(|e| e.into_inner());
        match last.take() {
            Some(audio) => audio,
            None => return Err("Нет записи для повторной отправки".to_string()),
        }
    };

    let result = try_transcribe_and_polish(&base64_audio, &options).await;

    if result.is_err() {
        let mut last = state.last_audio.lock().unwrap_or_else(|e| e.into_inner());
        *last = Some(base64_audio);
    }

    result
}

#[tauri::command]
pub fn start_loopback(
    state: tauri::State<'_, AppState>,
    app: tauri::AppHandle,
    device_label: Option<String>,
) -> Result<(), String> {
    match start_loopback_internal(app, device_label, &state.loopback) {
        Ok(()) => {
            eprintln!("[Dicta] start_loopback: OK");
            Ok(())
        }
        Err(e) => {
            eprintln!("[Dicta] start_loopback: FAILED: {}", e);
            Err(e)
        }
    }
}

#[tauri::command]
pub fn stop_loopback(state: tauri::State<'_, AppState>) -> Result<(), String> {
    stop_loopback_internal(&state.loopback)
}
