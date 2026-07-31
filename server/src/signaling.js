// ── WebRTC signaling ──
// Máy chủ này CHỈ chuyển tiếp offer/answer/ICE giữa các peer trong cùng phòng.
// Media (video/audio) đi thẳng peer-to-peer giữa các trình duyệt (hoặc qua TURN),
// KHÔNG đi qua máy chủ này.
//
// Mô hình hiện tại là "mesh" (mỗi peer nối tới mọi peer) — đủ cho nhóm nhỏ / demo.
// Lớp đông (30-40 HS) nên chuyển sang SFU (mediasoup / LiveKit) để không nghẽn.

const rooms = new Map(); // roomId -> Map<peerId, ws>

function send(ws, obj) {
  if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}

export function attachSignaling(wss) {
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const roomId = url.searchParams.get('room') || 'default';
    // TODO: thay bằng id người dùng đã xác thực (JWT/session) thay vì id ngẫu nhiên.
    const peerId = url.searchParams.get('peer') || `peer-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e6)}`;

    if (!rooms.has(roomId)) rooms.set(roomId, new Map());
    const room = rooms.get(roomId);

    // Gửi cho người mới danh sách peer đang có; báo cho phòng có người mới vào.
    send(ws, { type: 'welcome', peerId, peers: [...room.keys()] });
    for (const [, peer] of room) send(peer, { type: 'peer-joined', peerId });
    room.set(peerId, ws);

    ws.on('message', (data) => {
      let msg;
      try { msg = JSON.parse(data); } catch { return; }
      // Định tuyến offer/answer/candidate tới đúng 1 peer đích (msg.to)
      if (['offer', 'answer', 'candidate'].includes(msg.type) && msg.to) {
        const target = room.get(msg.to);
        if (target) send(target, { ...msg, from: peerId });
      }
    });

    ws.on('close', () => {
      room.delete(peerId);
      for (const [, peer] of room) send(peer, { type: 'peer-left', peerId });
      if (room.size === 0) rooms.delete(roomId);
    });
  });
}
