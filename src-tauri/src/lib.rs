use std::sync::atomic::{AtomicBool, Ordering};
use tauri::Manager;

mod tray;

static MINIMIZE_ON_CLOSE: AtomicBool = AtomicBool::new(false);

#[tauri::command]
fn set_minimize_on_close(enabled: bool) {
  MINIMIZE_ON_CLOSE.store(enabled, Ordering::Relaxed);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
      // Bring existing window to front when a second instance is launched
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
      }
      // Forward deep-link URLs from the second instance's CLI args
      use tauri_plugin_deep_link::DeepLinkExt;
      app.deep_link().handle_cli_arguments(args.into_iter());
    }))
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_http::init())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_autostart::init(
      tauri_plugin_autostart::MacosLauncher::LaunchAgent,
      None,
    ))
    .plugin(tauri_plugin_window_state::Builder::new().build())
    .invoke_handler(tauri::generate_handler![set_minimize_on_close])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Register deep-link scheme at runtime (needed for Windows/Linux)
      #[cfg(any(target_os = "windows", target_os = "linux"))]
      {
        use tauri_plugin_deep_link::DeepLinkExt;
        let _ = app.deep_link().register("kazahana");
      }

      // Open devtools in release builds for debugging
      #[cfg(feature = "devtools")]
      if let Some(window) = app.get_webview_window("main") {
        window.open_devtools();
      }

      // Setup system tray
      tray::setup_tray(app.handle())?;

      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { api, .. } = event {
        if MINIMIZE_ON_CLOSE.load(Ordering::Relaxed) {
          api.prevent_close();
          let _ = window.hide();
        }
      }
    })
    .build(tauri::generate_context!())
    .expect("error while building tauri application")
    .run(|_app, _event| {
      // macOS: restore window when Dock icon is clicked
      #[cfg(target_os = "macos")]
      if let tauri::RunEvent::Reopen { .. } = _event {
        if let Some(window) = _app.get_webview_window("main") {
          let _ = window.show();
          let _ = window.unminimize();
          let _ = window.set_focus();
        }
      }
    });
}
