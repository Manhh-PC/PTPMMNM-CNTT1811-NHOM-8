-- Chỉ dùng cho database PixelNote cũ CHƯA có threads.display_number.
-- Sao lưu database và storage/uploads, dừng web, chạy sau 001-admin.sql.
ALTER TABLE versions ADD COLUMN next_note_number INT UNSIGNED NOT NULL DEFAULT 1;
ALTER TABLE threads ADD COLUMN display_number INT UNSIGNED NULL;
UPDATE threads t
JOIN (SELECT id, ROW_NUMBER() OVER (PARTITION BY version_id ORDER BY created_at,id) AS n FROM threads) seq ON seq.id=t.id
SET t.display_number=seq.n;
ALTER TABLE threads MODIFY display_number INT UNSIGNED NOT NULL,
  ADD UNIQUE KEY version_note_number(version_id,display_number);
UPDATE versions v SET next_note_number=1+COALESCE(
    (SELECT MAX(t.display_number) FROM threads t WHERE t.version_id=v.id),0
);

