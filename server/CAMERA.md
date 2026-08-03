# Camera giám sát — dựng trên máy đặt tại trường

Chỉ tài khoản **Ban Giám Hiệu** xem được. Việc chặn quyền nằm ở máy chủ này, không nằm ở giao diện: web chỉ ẩn nút, còn ai gọi thẳng API vẫn bị hỏi Supabase xem có đúng vai `admin` không.

## Đường đi của hình ảnh

```
Camera IP (rtsp://…)
      │  chỉ trong mạng LAN của trường
      ▼
MediaMTX  ── hỏi ──▶  eduportal-server  ── hỏi ──▶  Supabase (ai đây, vai gì?)
      │              (vé còn hạn không?)
      │ WebRTC
      ▼
Trình duyệt của Ban Giám Hiệu
```

Trình duyệt **không phát được RTSP**, nên phải có MediaMTX đổi sang WebRTC. Vercel không chạy được phần này (serverless, không giữ kết nối dài) — đó là lý do cần một máy chạy 24/7 trong trường.

## 1. Khai báo camera

Tạo `server/data/cameras.json` (tệp này **không commit** — nó chứa mật khẩu camera):

```json
{
  "cameras": [
    {
      "id": "san-truong",
      "name": "Sân trường",
      "location": "Khu A",
      "source": "rtsp://admin:MatKhau@192.168.1.64:554/Streaming/Channels/101"
    },
    {
      "id": "cong-chinh",
      "name": "Cổng chính",
      "location": "Mặt đường",
      "source": "rtsp://admin:MatKhau@192.168.1.65:554/Streaming/Channels/101",
      "enabled": true
    }
  ]
}
```

- `id`: chữ thường, số, gạch ngang. Đây là thứ AI dùng để gọi tên camera, nên đặt xong thì đừng đổi.
- Đường `rtsp://` của Hikvision thường là `/Streaming/Channels/101` (luồng chính) và `/102` (luồng phụ, nhẹ hơn — nên dùng cho tường nhiều camera).
- Dahua/KBVision: `/cam/realmonitor?channel=1&subtype=0`.
- Bỏ một camera khỏi tường: `"enabled": false`, không cần xoá dòng.

## 2. MediaMTX

Tải MediaMTX (một tệp chạy được, không cần cài) rồi tạo `mediamtx.yml`:

```yaml
# Hỏi eduportal-server trước mỗi lượt xem
authMethod: http
authHTTPAddress: http://127.0.0.1:8080/api/cameras/authorize

webrtc: yes
webrtcAddress: :8889

paths:
  # Tên path = "cam-" + id trong cameras.json
  cam-san-truong:
    source: rtsp://admin:MatKhau@192.168.1.64:554/Streaming/Channels/101
    sourceOnDemand: yes      # chỉ kéo luồng khi có người xem
  cam-cong-chinh:
    source: rtsp://admin:MatKhau@192.168.1.65:554/Streaming/Channels/101
    sourceOnDemand: yes
```

`sourceOnDemand` quan trọng: không ai xem thì không tốn băng thông và không quay vòng ổ cứng.

## 3. Biến môi trường của server

Thêm vào `server/.env`:

```bash
CAMERA_CONFIG_FILE=./data/cameras.json
CAMERA_RELAY_URL=http://192.168.1.10:8889     # địa chỉ MediaMTX, máy trong trường
CAMERA_TICKET_SECRET=                          # openssl rand -hex 32
CAMERA_TICKET_TTL_SECONDS=120
CAMERA_EVENT_KEY=                              # openssl rand -hex 24, cho lớp AI
CAMERA_ACCESS_LOG=./data/camera-access.log
CAMERA_ALLOWED_ROLES=admin

# Để server tự hỏi Supabase xem người gọi là ai
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
```

Không có `CAMERA_TICKET_SECRET` hoặc `SUPABASE_URL` thì API trả `503 camera_not_configured` — **không** mở camera cho ai cả.

## 4. Phía web

`Web/.env`:

```bash
VITE_SERVER_URL=http://192.168.1.10:8080
```

Camera **không hiện** trên bản demo (`VITE_DEMO_MODE=true`), vì ở đó ai cũng chọn được vai Ban Giám Hiệu.

> Trình duyệt chặn WebRTC/fetch từ trang HTTPS sang địa chỉ HTTP. Nếu web chạy trên `https://`, máy chủ trong trường cũng phải có HTTPS (chứng chỉ nội bộ, hoặc Cloudflare Tunnel).

## 5. Cắm AI vào

Đây là chỗ để tự làm thêm. Bên phân tích (model chạy cùng máy, box của hãng, script Python — gì cũng được) đọc luồng **từ MediaMTX**, không đọc thẳng từ camera:

```
rtsp://192.168.1.10:8554/cam-san-truong
```

Nhìn thấy gì thì POST về đây:

```bash
curl -X POST http://127.0.0.1:8080/api/camera-events \
  -H "Content-Type: application/json" \
  -H "x-camera-event-key: $CAMERA_EVENT_KEY" \
  -d '{
        "cameraId": "san-truong",
        "label": "Có người trèo tường",
        "level": "alert",
        "confidence": 0.82,
        "note": "Khu vực sau nhà xe"
      }'
```

- `level`: `info` · `warning` · `alert` — quyết định màu trên tường camera.
- `confidence`: 0…1, được thì gửi, không có thì bỏ trống.
- Sự kiện về camera không có trong `cameras.json` bị từ chối (`400`), để một model cấu hình sai không bắn cảnh báo ma.

Tường camera tự hỏi lại mỗi 15 giây. **Không phải sửa gì bên web khi thêm AI.**

Ghi nhận chỉ nằm trong bộ nhớ (200 sự kiện gần nhất) và mất khi khởi động lại — có chủ ý: đây là thông báo, không phải hồ sơ. Thứ cần lưu (đoạn ghi hình, biên bản) thuộc về đầu ghi, và lưu lại toàn bộ nhật ký hành vi của học sinh cả ngày là trách nhiệm pháp lý mà trường không yêu cầu.

## 6. Nhật ký xem

`data/camera-access.log`, mỗi lượt một dòng:

```json
{"at":"2026-08-03T07:12:04.001Z","action":"watch","cameraId":"san-truong","viewerId":"…","viewId":"…","ip":"192.168.1.23","outcome":"allowed"}
{"at":"2026-08-03T07:13:40.882Z","action":"/cameras","outcome":"denied","reason":"role:teacher","viewerId":"…"}
```

Camera trường quay học sinh — dữ liệu cá nhân của trẻ vị thành niên theo Nghị định 13/2023. Câu hỏi "ai đã xem camera này?" phải có câu trả lời, và tệp này là câu trả lời đó. Nên sao lưu định kỳ và **không** cấp quyền xoá cho tài khoản dùng hằng ngày.
