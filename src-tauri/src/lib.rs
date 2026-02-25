use tauri::Manager;

mod tray;

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

      // Setup system tray
      tray::setup_tray(app.handle())?;

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
