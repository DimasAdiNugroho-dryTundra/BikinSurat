use crate::db::{AppSetting, DbState, DocumentHistoryItem, DraftItem, TemplateItem, VariableItem};
use chrono::{Datelike, Local};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, Deserialize)]
pub struct RecordHistoryPayload {
    pub template_id: String,
    pub document_number: Option<String>,
    pub document_title: String,
    pub recipient_name: Option<String>,
    pub filled_values_json: String,
    pub rendered_preview_html: String,
    pub export_format: String,
    pub file_path: Option<String>,
}

#[tauri::command]
pub fn get_templates(state: State<'_, DbState>) -> Result<Vec<TemplateItem>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, judul, deskripsi, kategori, konten_json, konten_html, 
                    ukuran_kertas, orientasi, margin_atas_mm, margin_bawah_mm, 
                    margin_kiri_mm, margin_kanan_mm, kop_surat_html, catatan_kaki_html, 
                    apakah_favorit, pola_penomoran, counter_terakhir, apakah_draf, tahun_penomoran, dibuat_pada, diperbarui_pada 
             FROM templat_surat 
             ORDER BY apakah_favorit DESC, judul ASC",
        )
        .map_err(|e| e.to_string())?;

    let template_iter = stmt
        .query_map([], |row| {
            Ok(TemplateItem {
                id: row.get(0)?,
                judul: row.get(1)?,
                deskripsi: row.get(2)?,
                kategori: row.get(3)?,
                konten_json: row.get(4)?,
                konten_html: row.get(5)?,
                ukuran_kertas: row.get(6)?,
                orientasi: row.get(7)?,
                margin_atas_mm: row.get(8)?,
                margin_bawah_mm: row.get(9)?,
                margin_kiri_mm: row.get(10)?,
                margin_kanan_mm: row.get(11)?,
                kop_surat_html: row.get(12)?,
                catatan_kaki_html: row.get(13)?,
                apakah_favorit: row.get::<_, i32>(14)? == 1,
                pola_penomoran: row.get(15)?,
                counter_terakhir: row.get::<_, i32>(16).unwrap_or(0),
                apakah_draf: Some(row.get::<_, i32>(17).unwrap_or(0) == 1),
                tahun_penomoran: Some(row.get::<_, i32>(18).unwrap_or(2026)),
                dibuat_pada: row.get(19)?,
                diperbarui_pada: row.get(20)?,
                variabel: None,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut templates = Vec::new();
    for t in template_iter {
        let mut tmpl = t.map_err(|e| e.to_string())?;

        // Query variables for each template
        let mut var_stmt = conn
            .prepare(
                "SELECT id, templat_id, kunci_variabel, label_input, tipe_variabel, 
                        wajib_diisi, nilai_bawaan, konfigurasi_json, urutan_tampil 
                 FROM variabel_surat 
                 WHERE templat_id = ?1 
                 ORDER BY urutan_tampil ASC",
            )
            .map_err(|e| e.to_string())?;

        let var_iter = var_stmt
            .query_map(params![tmpl.id], |r| {
                Ok(VariableItem {
                    id: r.get(0)?,
                    templat_id: r.get(1)?,
                    kunci_variabel: r.get(2)?,
                    label_input: r.get(3)?,
                    tipe_variabel: r.get(4)?,
                    wajib_diisi: r.get::<_, i32>(5)? == 1,
                    nilai_bawaan: r.get(6)?,
                    konfigurasi_json: r.get(7)?,
                    urutan_tampil: r.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut vars = Vec::new();
        for v in var_iter {
            vars.push(v.map_err(|e| e.to_string())?);
        }
        tmpl.variabel = Some(vars);
        templates.push(tmpl);
    }

    Ok(templates)
}

#[tauri::command]
pub fn get_template_by_id(id: String, state: State<'_, DbState>) -> Result<Option<TemplateItem>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, judul, deskripsi, kategori, konten_json, konten_html, 
                    ukuran_kertas, orientasi, margin_atas_mm, margin_bawah_mm, 
                    margin_kiri_mm, margin_kanan_mm, kop_surat_html, catatan_kaki_html, 
                    apakah_favorit, pola_penomoran, counter_terakhir, apakah_draf, tahun_penomoran, dibuat_pada, diperbarui_pada 
             FROM templat_surat 
             WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let mut rows = stmt
        .query_map(params![id], |row| {
            Ok(TemplateItem {
                id: row.get(0)?,
                judul: row.get(1)?,
                deskripsi: row.get(2)?,
                kategori: row.get(3)?,
                konten_json: row.get(4)?,
                konten_html: row.get(5)?,
                ukuran_kertas: row.get(6)?,
                orientasi: row.get(7)?,
                margin_atas_mm: row.get(8)?,
                margin_bawah_mm: row.get(9)?,
                margin_kiri_mm: row.get(10)?,
                margin_kanan_mm: row.get(11)?,
                kop_surat_html: row.get(12)?,
                catatan_kaki_html: row.get(13)?,
                apakah_favorit: row.get::<_, i32>(14)? == 1,
                pola_penomoran: row.get(15)?,
                counter_terakhir: row.get::<_, i32>(16).unwrap_or(0),
                apakah_draf: Some(row.get::<_, i32>(17).unwrap_or(0) == 1),
                tahun_penomoran: Some(row.get::<_, i32>(18).unwrap_or(2026)),
                dibuat_pada: row.get(19)?,
                diperbarui_pada: row.get(20)?,
                variabel: None,
            })
        })
        .map_err(|e| e.to_string())?;

    if let Some(res) = rows.next() {
        let mut tmpl = res.map_err(|e| e.to_string())?;

        // Query variables
        let mut var_stmt = conn
            .prepare(
                "SELECT id, templat_id, kunci_variabel, label_input, tipe_variabel, 
                        wajib_diisi, nilai_bawaan, konfigurasi_json, urutan_tampil 
                 FROM variabel_surat 
                 WHERE templat_id = ?1 
                 ORDER BY urutan_tampil ASC",
            )
            .map_err(|e| e.to_string())?;

        let var_iter = var_stmt
            .query_map(params![tmpl.id], |r| {
                Ok(VariableItem {
                    id: r.get(0)?,
                    templat_id: r.get(1)?,
                    kunci_variabel: r.get(2)?,
                    label_input: r.get(3)?,
                    tipe_variabel: r.get(4)?,
                    wajib_diisi: r.get::<_, i32>(5)? == 1,
                    nilai_bawaan: r.get(6)?,
                    konfigurasi_json: r.get(7)?,
                    urutan_tampil: r.get(8)?,
                })
            })
            .map_err(|e| e.to_string())?;

        let mut vars = Vec::new();
        for v in var_iter {
            vars.push(v.map_err(|e| e.to_string())?);
        }
        tmpl.variabel = Some(vars);
        Ok(Some(tmpl))
    } else {
        Ok(None)
    }
}

#[tauri::command]
pub fn save_template(payload: TemplateItem, state: State<'_, DbState>) -> Result<String, String> {
    let mut conn = state.conn.lock().map_err(|e| e.to_string())?;
    let tx = conn.transaction().map_err(|e| e.to_string())?;

    let tmpl_id = if payload.id.is_empty() {
        Uuid::new_v4().to_string()
    } else {
        payload.id.clone()
    };

    let is_draft_int = if payload.apakah_draf.unwrap_or(false) { 1 } else { 0 };
    let tahun = payload.tahun_penomoran.unwrap_or(2026);

    tx.execute(
        "INSERT INTO templat_surat (
            id, judul, deskripsi, kategori, konten_json, konten_html, 
            ukuran_kertas, orientasi, margin_atas_mm, margin_bawah_mm, 
            margin_kiri_mm, margin_kanan_mm, kop_surat_html, catatan_kaki_html, apakah_favorit, diperbarui_pada
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, CURRENT_TIMESTAMP)
            margin_kiri_mm, margin_kanan_mm, kop_surat_html, catatan_kaki_html, apakah_favorit, pola_penomoran, counter_terakhir, diperbarui_pada
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, CURRENT_TIMESTAMP)
            margin_kiri_mm, margin_kanan_mm, kop_surat_html, catatan_kaki_html, 
            apakah_favorit, pola_penomoran, counter_terakhir, apakah_draf, tahun_penomoran, diperbarui_pada
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, CURRENT_TIMESTAMP)
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, datetime('now', 'localtime'))
        ON CONFLICT(id) DO UPDATE SET 
            judul = excluded.judul,
            deskripsi = excluded.deskripsi,
            kategori = excluded.kategori,
            konten_json = excluded.konten_json,
            konten_html = excluded.konten_html,
            ukuran_kertas = excluded.ukuran_kertas,
            orientasi = excluded.orientasi,
            margin_atas_mm = excluded.margin_atas_mm,
            margin_bawah_mm = excluded.margin_bawah_mm,
            margin_kiri_mm = excluded.margin_kiri_mm,
            margin_kanan_mm = excluded.margin_kanan_mm,
            kop_surat_html = excluded.kop_surat_html,
            catatan_kaki_html = excluded.catatan_kaki_html,
            apakah_favorit = excluded.apakah_favorit,
            pola_penomoran = excluded.pola_penomoran,
            counter_terakhir = excluded.counter_terakhir,
            apakah_draf = excluded.apakah_draf,
            tahun_penomoran = excluded.tahun_penomoran,
            diperbarui_pada = datetime('now', 'localtime')",
        params![
            tmpl_id,
            payload.judul,
            payload.deskripsi,
            payload.kategori,
            payload.konten_json,
            payload.konten_html,
            payload.ukuran_kertas,
            payload.orientasi,
            payload.margin_atas_mm,
            payload.margin_bawah_mm,
            payload.margin_kiri_mm,
            payload.margin_kanan_mm,
            payload.kop_surat_html,
            payload.catatan_kaki_html,
            if payload.apakah_favorit { 1 } else { 0 },
            payload.pola_penomoran,
            payload.counter_terakhir,
            is_draft_int,
            tahun,
        ],
    )
    .map_err(|e| e.to_string())?;

    // If variables provided, replace them
    if let Some(vars) = payload.variabel {
        tx.execute("DELETE FROM variabel_surat WHERE templat_id = ?1", params![tmpl_id])
            .map_err(|e| e.to_string())?;

        for (idx, v) in vars.iter().enumerate() {
            let var_id = if v.id.is_empty() {
                Uuid::new_v4().to_string()
            } else {
                v.id.clone()
            };

            tx.execute(
                "INSERT INTO variabel_surat (
                    id, templat_id, kunci_variabel, label_input, tipe_variabel, 
                    wajib_diisi, nilai_bawaan, konfigurasi_json, urutan_tampil
                ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
                params![
                    var_id,
                    tmpl_id,
                    v.kunci_variabel,
                    v.label_input,
                    v.tipe_variabel,
                    if v.wajib_diisi { 1 } else { 0 },
                    v.nilai_bawaan,
                    v.konfigurasi_json,
                    idx as i32 + 1,
                ],
            )
            .map_err(|e| e.to_string())?;
        }
    }

    tx.commit().map_err(|e| e.to_string())?;
    Ok(tmpl_id)
}

#[tauri::command]
pub fn delete_template(id: String, state: State<'_, DbState>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM templat_surat WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_settings(state: State<'_, DbState>) -> Result<Vec<AppSetting>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare("SELECT kunci, nilai, deskripsi, diperbarui_pada FROM pengaturan_aplikasi ORDER BY kunci ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(AppSetting {
                kunci: r.get(0)?,
                nilai: r.get(1)?,
                deskripsi: r.get(2)?,
                diperbarui_pada: r.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut settings = Vec::new();
    for s in rows {
        settings.push(s.map_err(|e| e.to_string())?);
    }
    Ok(settings)
}

#[tauri::command]
pub fn update_setting(key: String, value: String, state: State<'_, DbState>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute(
        "UPDATE pengaturan_aplikasi SET nilai = ?1, diperbarui_pada = CURRENT_TIMESTAMP WHERE kunci = ?2",
        params![value, key],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

fn to_roman(num: u32) -> &'static str {
    match num {
        1 => "I",
        2 => "II",
        3 => "III",
        4 => "IV",
        5 => "V",
        6 => "VI",
        7 => "VII",
        8 => "VIII",
        9 => "IX",
        10 => "X",
        11 => "XI",
        12 => "XII",
        _ => "I",
    }
}

#[tauri::command]
pub fn fetch_next_document_number(
    template_id: Option<String>,
    format_pattern: Option<String>,
    state: State<'_, DbState>,
) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    // Read current sequence and configured year
    let (next_val, pattern, configured_year) = if let Some(ref t_id) = template_id {
        let tmpl_data: Result<(i32, Option<String>, Option<i32>), rusqlite::Error> = conn.query_row(
            "SELECT counter_terakhir, pola_penomoran, tahun_penomoran FROM templat_surat WHERE id = ?1",
            params![t_id],
            |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
        );

        if let Ok((counter, pat_opt, year_opt)) = tmpl_data {
            let next_val = counter + 1;
            let _ = conn.execute(
                "UPDATE templat_surat SET counter_terakhir = ?1, diperbarui_pada = CURRENT_TIMESTAMP WHERE id = ?2",
                params![next_val, t_id],
            );
            let pat = format_pattern
                .filter(|p| !p.trim().is_empty())
                .or_else(|| pat_opt.filter(|p| !p.trim().is_empty()))
                .unwrap_or_else(|| "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}".to_string());
            (next_val, pat, year_opt)
        } else {
            let (next_val, pat) = fallback_global_counter(&conn, format_pattern)?;
            (next_val, pat, None)
        }
    } else {
        let (next_val, pat) = fallback_global_counter(&conn, format_pattern)?;
        (next_val, pat, None)
    };

    let now = Local::now();
    let year = match configured_year {
        Some(y) if y > 1900 => y.to_string(),
        _ => now.year().to_string(),
    };
    let month_num = now.month();
    let month_roman = to_roman(month_num);
    let month_pad = format!("{:02}", month_num);
    let day_pad = format!("{:02}", now.day());
    let formatted_number = format!("{:03}", next_val);

    let result = pattern
        .replace("{{NOMOR}}", &formatted_number)
        .replace("{{TAHUN}}", &year)
        .replace("{{BULAN_ROMAWI}}", month_roman)
        .replace("{{BULAN}}", &month_pad)
        .replace("{{HARI}}", &day_pad);

    Ok(result)
}

fn fallback_global_counter(
    conn: &rusqlite::Connection,
    format_pattern: Option<String>,
) -> Result<(i32, String), String> {
    let current_val_str: String = conn
        .query_row(
            "SELECT nilai FROM pengaturan_aplikasi WHERE kunci = 'penomoran_urutan_terakhir'",
            [],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| "0".to_string());

    let current_val: i32 = current_val_str.parse().unwrap_or(0);
    let next_val = current_val + 1;

    // Update sequence
    conn.execute(
        "UPDATE pengaturan_aplikasi SET nilai = ?1, diperbarui_pada = CURRENT_TIMESTAMP WHERE kunci = 'penomoran_urutan_terakhir'",
        params![next_val.to_string()],
    )
    .map_err(|e| e.to_string())?;

    // Determine pattern
    let pattern = if let Some(p) = format_pattern {
        if p.trim().is_empty() {
            conn.query_row(
                "SELECT nilai FROM pengaturan_aplikasi WHERE kunci = 'format_penomoran_default'",
                [],
                |r| r.get(0),
            )
            .unwrap_or_else(|_| "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}".into())
        } else {
            p
        }
    } else {
        conn.query_row(
            "SELECT nilai FROM pengaturan_aplikasi WHERE kunci = 'format_penomoran_default'",
            [],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| "{{NOMOR}}/SK-DIR/{{BULAN_ROMAWI}}/{{TAHUN}}".into())
    };

    Ok((next_val, pattern))
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SaveDraftPayload {
    pub id: Option<String>,
    pub templat_id: String,
    pub judul_draf: String,
    pub nilai_isian_json: String,
    pub hasil_pratinjau_html: Option<String>,
}

#[tauri::command]
pub fn get_drafts(state: State<'_, DbState>) -> Result<Vec<DraftItem>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, templat_id, judul_draf, nilai_isian_json, hasil_pratinjau_html, dibuat_pada, diperbarui_pada 
             FROM draf_surat 
             ORDER BY diperbarui_pada DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(DraftItem {
                id: r.get(0)?,
                templat_id: r.get(1)?,
                judul_draf: r.get(2)?,
                nilai_isian_json: r.get(3)?,
                hasil_pratinjau_html: r.get(4)?,
                dibuat_pada: r.get(5)?,
                diperbarui_pada: r.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for item in rows {
        items.push(item.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn save_draft(payload: SaveDraftPayload, state: State<'_, DbState>) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let draft_id = payload
        .id
        .filter(|s| !s.trim().is_empty())
        .unwrap_or_else(|| Uuid::new_v4().to_string());

    conn.execute(
        "INSERT INTO draf_surat (
            id, templat_id, judul_draf, nilai_isian_json, hasil_pratinjau_html, dibuat_pada, diperbarui_pada
        ) VALUES (?1, ?2, ?3, ?4, ?5, datetime('now', 'localtime'), datetime('now', 'localtime'))
        ON CONFLICT(id) DO UPDATE SET
            templat_id = excluded.templat_id,
            judul_draf = excluded.judul_draf,
            nilai_isian_json = excluded.nilai_isian_json,
            hasil_pratinjau_html = excluded.hasil_pratinjau_html,
            diperbarui_pada = datetime('now', 'localtime')",
        params![
            draft_id,
            payload.templat_id,
            payload.judul_draf,
            payload.nilai_isian_json,
            payload.hasil_pratinjau_html,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(draft_id)
}

#[tauri::command]
pub fn delete_draft(id: String, state: State<'_, DbState>) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM draf_surat WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_document_history(state: State<'_, DbState>) -> Result<Vec<DocumentHistoryItem>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id, templat_id, nomor_surat, judul_dokumen, nama_penerima, 
                    nilai_isian_json, hasil_pratinjau_html, format_ekspor, lokasi_berkas, dibuat_pada 
             FROM riwayat_dokumen 
             ORDER BY dibuat_pada DESC 
             LIMIT 100",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |r| {
            Ok(DocumentHistoryItem {
                id: r.get(0)?,
                templat_id: r.get(1)?,
                nomor_surat: r.get(2)?,
                judul_dokumen: r.get(3)?,
                nama_penerima: r.get(4)?,
                nilai_isian_json: r.get(5)?,
                hasil_pratinjau_html: r.get(6)?,
                format_ekspor: r.get(7)?,
                lokasi_berkas: r.get(8)?,
                dibuat_pada: r.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut items = Vec::new();
    for item in rows {
        items.push(item.map_err(|e| e.to_string())?);
    }
    Ok(items)
}

#[tauri::command]
pub fn record_document_history(
    payload: RecordHistoryPayload,
    state: State<'_, DbState>,
) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let history_id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO riwayat_dokumen (
            id, templat_id, nomor_surat, judul_dokumen, nama_penerima, 
            nilai_isian_json, hasil_pratinjau_html, format_ekspor, lokasi_berkas, dibuat_pada
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, datetime('now', 'localtime'))",
        params![
            history_id,
            payload.template_id,
            payload.document_number,
            payload.document_title,
            payload.recipient_name,
            payload.filled_values_json,
            payload.rendered_preview_html,
            payload.export_format,
            payload.file_path,
        ],
    )
    .map_err(|e| e.to_string())?;

    Ok(history_id)
}

