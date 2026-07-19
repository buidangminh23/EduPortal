// ── Client WebRTC signaling cho EduMeet ──
// Nối tới backend (server/src/signaling.js) qua WebSocket, trao đổi offer/answer/ICE,
// và tạo RTCPeerConnection dạng mesh với từng peer. Media đi thẳng P2P (hoặc qua TURN).
//
// Dùng: const sig = createSignaling({ wsUrl, room, getLocalStream, handlers });
//       ...; sig.close();

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
// TODO: thêm TURN khi có (giữ dữ liệu qua được NAT/tường lửa trường học):
// ICE_SERVERS.push({ urls: TURN_URL, username: TURN_USER, credential: TURN_PASS });

export function createSignaling({ wsUrl, room, getLocalStream, handlers = {} }) {
  const pcs = new Map(); // peerId -> RTCPeerConnection
  let ws;
  let closed = false;

  const send = (obj) => {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
  };

  function makePc(peerId) {
    if (pcs.has(peerId)) return pcs.get(peerId);
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const local = getLocalStream && getLocalStream();
    if (local) local.getTracks().forEach((t) => pc.addTrack(t, local));
    pc.onicecandidate = (e) => {
      if (e.candidate) send({ type: 'candidate', to: peerId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      handlers.onRemoteStream && handlers.onRemoteStream(peerId, e.streams[0]);
    };
    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) removePeer(peerId);
    };
    pcs.set(peerId, pc);
    return pc;
  }

  function removePeer(peerId) {
    const pc = pcs.get(peerId);
    if (pc) { try { pc.close(); } catch { /* noop */ } pcs.delete(peerId); }
    handlers.onPeerLeft && handlers.onPeerLeft(peerId);
  }

  async function callPeer(peerId) {
    const pc = makePc(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    send({ type: 'offer', to: peerId, sdp: offer });
  }

  try {
    ws = new WebSocket(`${wsUrl}/rtc?room=${encodeURIComponent(room)}`);
  } catch {
    handlers.onStatus && handlers.onStatus('error');
    return { close() {} };
  }

  ws.onopen = () => handlers.onStatus && handlers.onStatus('connected');
  ws.onclose = () => { if (!closed) handlers.onStatus && handlers.onStatus('disconnected'); };
  ws.onerror = () => handlers.onStatus && handlers.onStatus('error');

  ws.onmessage = async (ev) => {
    let msg;
    try { msg = JSON.parse(ev.data); } catch { return; }
    try {
      if (msg.type === 'welcome') {
        // Ta là người mới -> chủ động gọi tới mọi peer đang có
        for (const pid of msg.peers || []) {
          handlers.onPeerPresence && handlers.onPeerPresence(pid, true);
          await callPeer(pid);
        }
      } else if (msg.type === 'peer-joined') {
        handlers.onPeerPresence && handlers.onPeerPresence(msg.peerId, true);
        // peer mới sẽ gửi offer tới ta
      } else if (msg.type === 'peer-left') {
        removePeer(msg.peerId);
      } else if (msg.type === 'offer') {
        const pc = makePc(msg.from);
        await pc.setRemoteDescription(msg.sdp);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        send({ type: 'answer', to: msg.from, sdp: answer });
        handlers.onPeerPresence && handlers.onPeerPresence(msg.from, true);
      } else if (msg.type === 'answer') {
        const pc = pcs.get(msg.from);
        if (pc) await pc.setRemoteDescription(msg.sdp);
      } else if (msg.type === 'candidate') {
        const pc = pcs.get(msg.from);
        if (pc && msg.candidate) { try { await pc.addIceCandidate(msg.candidate); } catch { /* noop */ } }
      }
    } catch (err) {
      console.warn('Signaling xử lý lỗi:', err.message);
    }
  };

  return {
    close() {
      closed = true;
      for (const [, pc] of pcs) { try { pc.close(); } catch { /* noop */ } }
      pcs.clear();
      if (ws) { try { ws.close(); } catch { /* noop */ } }
    }
  };
}
