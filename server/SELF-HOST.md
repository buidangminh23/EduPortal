# Dựng cơ sở dữ liệu ngay tại trường

Mục đích: dữ liệu học sinh **không rời khỏi trường**, không tốn phí hằng tháng, và không sửa một dòng code nào của ứng dụng.

Supabase là mã nguồn mở. Bản tự dựng bên trong chính là **PostgreSQL**, kèm sẵn phần đăng nhập (GoTrue) và lớp REST (PostgREST) — đúng những thứ ứng dụng đang gọi. Đổi từ đám mây sang máy trường chỉ là đổi một địa chỉ.

> Cùng chạy trên máy 24/7 đã mua cho camera: MediaMTX, `eduportal-server`, và Supabase. Một máy 16 nhân/64GB gánh cả ba cho một trường là nhẹ nhàng — Postgres ghi 1000 bài thi nộp cùng lúc trong dưới một giây.

---

## 1. Cài

```bash
git clone --depth 1 https://github.com/supabase/supabase /opt/supabase
cd /opt/supabase/docker
cp .env.example .env
```

Sửa `.env` — **bắt buộc đổi hết**, để nguyên là để ngỏ cửa:

```bash
POSTGRES_PASSWORD=          # openssl rand -hex 24
JWT_SECRET=                 # openssl rand -hex 32
ANON_KEY=                   # sinh từ JWT_SECRET, xem tài liệu Supabase
SERVICE_ROLE_KEY=           # sinh từ JWT_SECRET
DASHBOARD_USERNAME=         # trang quản trị, đừng để mặc định
DASHBOARD_PASSWORD=
SITE_URL=https://eduportal.truong-cua-ban.edu.vn
```

```bash
docker compose up -d
```

## 2. Nạp cấu trúc bảng

```bash
cd /opt/eduportal
psql "$DB_URL" -f supabase/migrations/001_identity.sql
psql "$DB_URL" -f supabase/migrations/002_tutor.sql
psql "$DB_URL" -f supabase/migrations/003_conversations.sql
psql "$DB_URL" -f supabase/migrations/004_review_golden.sql
psql "$DB_URL" -f supabase/migrations/005_fix_profile_recursion.sql
psql "$DB_URL" -f supabase/migrations/006_academics.sql
psql "$DB_URL" -f supabase/migrations/007_mock_exams.sql
psql "$DB_URL" -f supabase/migrations/008_mock_exam_idempotency.sql
psql "$DB_URL" -f supabase/migrations/009_policy_indexes.sql
psql "$DB_URL" -f supabase/migrations/010_profile_privilege_guard.sql
psql "$DB_URL" -f supabase/migrations/011_conduct_results.sql
```

Chạy đúng thứ tự: 005 định nghĩa `can_view_student` / `can_edit_student`, và 006, 007, 011 đều dựa vào hai hàm đó để quyết định ai đọc được điểm của ai.

Chạy đủ cả mười một, không dừng ở 007. 008 thêm cột `local_id` mà mã nguồn nộp bài thi ghi vào — thiếu nó thì mọi bài thi nộp lên đều lỗi. 010 là bản vá bảo mật: thiếu nó thì bất kỳ tài khoản nào đã đăng nhập, kể cả học sinh, cũng tự đặt mình thành `admin` được bằng một dòng lệnh trong trình duyệt, và admin thì xem được toàn bộ điểm, học phí, hồ sơ tư vấn tâm lý lẫn camera. 011 là bảng kết quả rèn luyện: thiếu nó thì mức giáo viên chủ nhiệm đánh giá nằm lại đúng trên chiếc máy đã gõ nó — học bạ mở ở máy khác trống mục rèn luyện, và danh hiệu không xét được vì danh hiệu cần cả kết quả học tập lẫn kết quả rèn luyện.

Xong thì chạy `psql "$DB_URL" -f supabase/tests/rls_check.sql`. File này đóng vai từng nhóm người dùng rồi tự báo lỗi nếu phân quyền sai — trong đó có phép thử "học sinh tự đặt mình thành admin". Phải chạy hết mà không báo lỗi nào; nếu nó dừng giữa chừng thì có migration chưa chạy.

Kiểm tra phân quyền đã bật:

```bash
psql "$DB_URL" -f supabase/tests/rls_check.sql
```

## 3. Trỏ ứng dụng về

`Web/.env`:

```bash
VITE_SUPABASE_URL=https://db.truong-cua-ban.edu.vn
VITE_SUPABASE_ANON_KEY=   # ANON_KEY ở bước 1
VITE_SERVER_URL=https://api.truong-cua-ban.edu.vn
```

Dựng lại (`npm run build`) là xong. **Không sửa code**: [db/index.js](../Web/src/lib/db/index.js) chọn kho lưu trữ theo biến môi trường, nên có `VITE_SUPABASE_URL` là ứng dụng nói chuyện với Postgres, không có thì chạy trong trình duyệt như bản demo.

> Trang web chạy `https://` không gọi được máy chủ `http://` — trình duyệt chặn. Máy trong trường phải có HTTPS: chứng chỉ nội bộ, hoặc Cloudflare Tunnel (miễn phí, không cần IP tĩnh, không phải mở cổng router).

## 4. Sao lưu — phần không được bỏ

Tự dựng nghĩa là **không ai giữ hộ bản sao**. Mất bảng điểm cả trường là sự cố không có đường lùi.

```bash
sudo cp scripts/backup-db.sh scripts/restore-check.sh /opt/eduportal/server/scripts/
sudo tee /etc/eduportal-backup.env >/dev/null <<'EOF'
DB_URL=postgresql://postgres:MAT_KHAU@127.0.0.1:5432/postgres
BACKUP_DIR=/var/backups/eduportal
KEEP_DAYS=30
EOF

# 1h sáng mỗi ngày
sudo crontab -e
0 1 * * * . /etc/eduportal-backup.env && /opt/eduportal/server/scripts/backup-db.sh >> /var/log/eduportal-backup.log 2>&1
```

`backup-db.sh` từ chối coi là thành công khi:
- không có `pg_dump`;
- `pg_dump` báo lỗi;
- tệp tạo ra nhỏ bất thường (< 50KB — dấu hiệu database rỗng hoặc kết nối nhầm);
- `pg_restore --list` không đọc được tệp.

Và chỉ xoá bản cũ **sau khi** bản mới đã qua hết các kiểm tra trên. Thoát với mã khác 0 để cron gửi cảnh báo — sao lưu hỏng mà im lặng còn tệ hơn không sao lưu, vì mình tưởng là có.

**Mỗi học kỳ khôi phục thử một lần:**

```bash
. /etc/eduportal-backup.env && ./scripts/restore-check.sh
```

Nó nạp bản mới nhất vào một database tạm, đếm số dòng bốn bảng cốt lõi (`profiles`, `assessment_records`, `attendance_records`, `mock_exam_results`), rồi xoá database tạm đi. Chưa từng khôi phục thử thì chưa biết mình có bản sao lưu hay chỉ có một tệp.

**Một bản phải nằm ngoài trường.** Sao lưu để cạnh máy chủ thì cháy phòng máy là mất cả hai. Ổ cứng rời mang về hằng tuần, hoặc `rclone` mã hoá rồi đẩy lên đám mây. Script sẽ nhắc cho tới khi:

```bash
touch /var/backups/eduportal/.offsite-configured
```

## 5. Hai việc nữa nên làm sớm

- **Tách đĩa.** Database và chỗ ghi hình camera không nên nằm chung ổ: camera ghi 24/7 làm ổ bận và mòn nhanh, kéo theo Postgres chậm.
- **Ghi lại mật khẩu ở nơi khác.** `POSTGRES_PASSWORD` và `JWT_SECRET` chỉ nằm trong `.env` trên đúng cái máy đó. Máy hỏng mà không ai có mật khẩu thì bản sao lưu cũng không giải mã ra được gì.
