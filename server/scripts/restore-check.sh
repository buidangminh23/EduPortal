#!/usr/bin/env bash
#
# Khôi phục thử bản sao lưu mới nhất vào một database tạm.
#
# Một bản sao lưu chưa từng khôi phục thử không phải bản sao lưu — nó là một
# tệp. Cách duy nhất để biết nó dùng được là nạp nó vào đâu đó và đếm xem có
# đủ bảng, đủ dòng hay không. Chạy mỗi học kỳ một lần, hoặc sau mỗi lần nâng
# cấp Postgres.
#
#   ./restore-check.sh                     # lấy bản mới nhất trong BACKUP_DIR
#   ./restore-check.sh /đường/dẫn.dump     # kiểm tra một bản cụ thể
#
set -Eeuo pipefail

DB_ADMIN_URL="${DB_ADMIN_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/eduportal}"
CHECK_DB="${CHECK_DB:-eduportal_restore_check}"

# Bảng bắt buộc phải có sau khi khôi phục. Thiếu một cái là bản sao lưu không
# đủ để dựng lại trường, dù tệp vẫn mở được.
REQUIRED_TABLES=(profiles assessment_records attendance_records mock_exam_results)

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
die() { log "LỖI: $*"; exit 1; }

DUMP="${1:-}"
if [ -z "$DUMP" ]; then
  DUMP=$(find "$BACKUP_DIR" -name 'eduportal-*.dump' -type f -printf '%T@ %p\n' 2>/dev/null \
         | sort -rn | head -1 | cut -d' ' -f2-)
  [ -n "$DUMP" ] || die "không tìm thấy bản sao lưu nào trong $BACKUP_DIR"
fi
[ -f "$DUMP" ] || die "không thấy tệp: $DUMP"

log "Kiểm tra: $DUMP"

cleanup() {
  psql "$DB_ADMIN_URL" -qc "DROP DATABASE IF EXISTS $CHECK_DB;" >/dev/null 2>&1 || true
}
trap cleanup EXIT

cleanup
psql "$DB_ADMIN_URL" -qc "CREATE DATABASE $CHECK_DB;" >/dev/null || die "không tạo được database tạm"

CHECK_URL="${DB_ADMIN_URL%/*}/$CHECK_DB"

# --no-owner: máy kiểm tra không cần có sẵn các role của máy thật.
# Cảnh báo về role thiếu là bình thường ở đây, nên -v ON_ERROR_STOP không dùng.
pg_restore --no-owner --dbname="$CHECK_URL" "$DUMP" >/dev/null 2>&1 \
  || log "pg_restore có cảnh báo (thường là role/extension) — kiểm tra tiếp phần dữ liệu"

FAILED=0
for table in "${REQUIRED_TABLES[@]}"; do
  if ! COUNT=$(psql "$CHECK_URL" -tAc "SELECT count(*) FROM $table;" 2>/dev/null); then
    log "  ✗ $table — KHÔNG có trong bản sao lưu"
    FAILED=1
    continue
  fi
  log "  ✓ $table — $COUNT dòng"
  # Một bảng tồn tại nhưng rỗng chưa chắc sai (trường mới), nên chỉ ghi nhận.
  [ "$COUNT" = "0" ] && log "    (rỗng — kiểm tra lại nếu trường đã dùng bảng này)"
done

[ "$FAILED" -eq 0 ] || die "bản sao lưu KHÔNG đủ để dựng lại. Kiểm tra lại backup-db.sh ngay."

log "Bản sao lưu khôi phục được. Ghi lại ngày kiểm tra vào sổ vận hành."
