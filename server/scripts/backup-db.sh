#!/usr/bin/env bash
#
# Nightly backup of the school's database.
#
# Self-hosting means nobody else is keeping a copy. Losing the mark book of a
# whole school has no undo, so this script is written to fail loudly rather
# than quietly produce an empty file that looks like a backup for six months.
#
# Cron, 1am every night:
#   0 1 * * * /opt/eduportal/server/scripts/backup-db.sh >> /var/log/eduportal-backup.log 2>&1
#
set -Eeuo pipefail

# ── Cấu hình ────────────────────────────────────────────────────────────────
# Nên đặt trong /etc/eduportal-backup.env rồi: source /etc/eduportal-backup.env
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:5432/postgres}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/eduportal}"
KEEP_DAYS="${KEEP_DAYS:-30}"

# Dung lượng tối thiểu của một bản sao lưu coi là hợp lệ (byte). Một tệp
# pg_dump chỉ vài KB gần như chắc chắn là hỏng, hoặc kết nối nhầm database rỗng.
MIN_SIZE_BYTES="${MIN_SIZE_BYTES:-51200}"

stamp() { date '+%Y-%m-%d %H:%M:%S'; }
log()   { echo "[$(stamp)] $*"; }
die()   { log "LỖI: $*"; exit 1; }

trap 'die "dừng ở dòng $LINENO"' ERR

command -v pg_dump >/dev/null || die "không tìm thấy pg_dump. Cài postgresql-client."

mkdir -p "$BACKUP_DIR"
TARGET="$BACKUP_DIR/eduportal-$(date '+%Y%m%d-%H%M%S').dump"

log "Bắt đầu sao lưu → $TARGET"

# Định dạng custom (-Fc): nén sẵn, và pg_restore chọn được từng bảng khi cần
# khôi phục một phần thay vì phải nạp lại toàn bộ.
pg_dump --format=custom --no-owner --no-privileges --file="$TARGET" "$DB_URL" \
  || die "pg_dump thất bại — KHÔNG có bản sao lưu cho đêm nay"

SIZE=$(wc -c < "$TARGET")
if [ "$SIZE" -lt "$MIN_SIZE_BYTES" ]; then
  die "bản sao lưu chỉ $SIZE byte (ngưỡng $MIN_SIZE_BYTES) — nghi ngờ hỏng, giữ lại để kiểm tra: $TARGET"
fi

# Đọc thử phần mục lục. Một tệp pg_dump không liệt kê được nội dung là tệp
# không khôi phục được — biết ngay bây giờ hơn là biết vào hôm cần dùng.
pg_restore --list "$TARGET" >/dev/null || die "tệp dump đọc không được: $TARGET"

log "Xong: $TARGET ($((SIZE / 1024)) KB)"

# ── Dọn bản cũ ──────────────────────────────────────────────────────────────
# Chỉ dọn khi bản mới đã hợp lệ. Xoá trước rồi sao lưu hỏng là cách mất sạch.
DELETED=$(find "$BACKUP_DIR" -name 'eduportal-*.dump' -type f -mtime "+$KEEP_DAYS" -print -delete | wc -l)
[ "$DELETED" -gt 0 ] && log "Đã xoá $DELETED bản cũ hơn $KEEP_DAYS ngày"

# ── Nhắc việc con người phải làm ────────────────────────────────────────────
# Sao lưu nằm cùng phòng với máy chủ thì cháy phòng là mất cả hai. Script không
# tự làm được việc này vì nó cần một cái ổ cắm vào, hoặc một khoá của nơi khác.
if [ ! -f "$BACKUP_DIR/.offsite-configured" ]; then
  log "NHẮC: chưa cấu hình chép bản sao lưu ra ngoài trường."
  log "      Cháy/mất trộm phòng máy là mất luôn bản sao lưu đang nằm cạnh máy chủ."
  log "      Xem CAMERA.md mục sao lưu, xong thì: touch $BACKUP_DIR/.offsite-configured"
fi
