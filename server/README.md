# EduPortal Server — khung backend cho EduMeet

Khung (scaffold) máy chủ cho các tính năng EduMeet **không thể chạy chỉ bằng frontend**:

1. **WebRTC signaling** — cho video/âm thanh nhiều người thật.
2. **AI nội bộ** — phiên âm (Whisper) + tóm tắt (Qwen), giữ dữ liệu học sinh trong hệ thống.

> Đây là **khung có thể chạy ngay** (endpoint + signaling hoạt động), với các bản **mô phỏng** ở chỗ cần model/hạ tầng thật. Mỗi chỗ cần nối đều có `TODO` và biến `.env`.

---

## Chạy thử

```bash
cd server
cp .env.example .env
npm install
npm run dev      # hoặc: npm start
```

Kiểm tra:
```bash
curl http://localhost:8080/health
# {"ok":true,"service":"eduportal-server"}

curl -X POST http://localhost:8080/api/summarize \
  -H "Content-Type: application/json" \
  -d '{"transcript":"Buổi học ôn tích phân, đa số hiểu bài."}'
# -> JSON topics/keyPoints/actions (mô phỏng cho tới khi cấu hình LLM_URL)
```

---

## Cấu trúc

```
server/
├── src/
│   ├── index.js          # Express + HTTP + WebSocket bootstrap
│   ├── signaling.js      # WebRTC signaling (chuyển tiếp offer/answer/ICE theo phòng)
│   ├── routes/ai.js      # POST /api/transcribe, POST /api/summarize
│   └── lib/
│       ├── whisper.js    # transcribe() — nối faster-whisper / whisper.cpp
│       └── llm.js        # summarize() — nối Qwen qua Ollama/vLLM
├── .env.example
└── package.json
```

---

## Nối AI thật (chạy trên máy 117M)

### 1. Whisper (phiên âm)
Dựng một Whisper server nội bộ, ví dụ [`faster-whisper-server`](https://github.com/fedirz/faster-whisper-server) (dùng GPU), rồi đặt trong `.env`:
```
WHISPER_URL=http://localhost:8000/v1/audio/transcriptions
```
Chỉnh `src/lib/whisper.js` cho khớp định dạng request của server bạn chọn (đa số nhận multipart `file`).

### 2. Qwen (tóm tắt) qua Ollama
```bash
ollama pull qwen2.5:14b
```
`.env`:
```
LLM_URL=http://localhost:11434/api/chat
LLM_MODEL=qwen2.5:14b
```
Xong là `/api/summarize` trả tóm tắt thật thay vì mô phỏng.

---

## STUN/TURN cho WebRTC

- **STUN** (miễn phí, đủ cho mạng thường): `stun:stun.l.google.com:19302`.
- **TURN** (bắt buộc khi vượt NAT/tường lửa trường học): tự dựng [`coturn`](https://github.com/coturn/coturn), rồi cấu hình `TURN_URL/TURN_USER/TURN_PASS`.

> Lưu ý quy mô: signaling hiện là **mesh** (mỗi peer nối mọi peer) — hợp nhóm nhỏ. Lớp 30–40 HS nên đổi sang **SFU** (mediasoup / LiveKit) để không nghẽn băng thông.

---

## Nối từ frontend (EduMeet.jsx)

**Tóm tắt AI** — thay hàm `generateSummary` mô phỏng bằng gọi API:
```js
const res = await fetch(`${SERVER}/api/summarize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ audioBase64 }) // hoặc { transcript }
});
setSummary(await res.json());
```

**Video nhiều người** — tại chỗ đã đánh dấu trong grid, nối `RTCPeerConnection`:
```js
const ws = new WebSocket(`${WS}/rtc?room=${classId}`);
const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
// ws 'welcome'/'peer-joined' -> tạo offer; 'offer'/'answer'/'candidate' -> pc.setRemote / addIceCandidate
// pc.ontrack -> gắn stream vào ô video của peer tương ứng
```

---

## Triển khai

Backend này **cần máy chủ chạy Node** (VPS hoặc máy 117M) — **không** deploy lên Vercel static như frontend. Frontend trỏ tới server qua biến môi trường (vd `VITE_SERVER_URL`).
