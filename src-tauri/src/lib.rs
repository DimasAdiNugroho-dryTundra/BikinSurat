pub mod commands;
pub mod db;

use db::{init_db, DbState};
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let conn = match init_db() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to initialize database: {}", e);
            panic!("Database initialization error: {}", e);
        }
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(DbState {
            conn: Mutex::new(conn),
        })
        .invoke_handler(tauri::generate_handler![
            commands::get_templates,
            commands::get_template_by_id,
            commands::save_template,
            commands::delete_template,
            commands::get_settings,
            commands::update_setting,
            commands::fetch_next_document_number,
            commands::get_document_history,
            commands::record_document_history,
            commands::get_drafts,
            commands::save_draft,
            commands::delete_draft,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

