/**
 * Talking to the camera server, and playing what it allows.
 *
 * Two things live here. One is a thin wrapper over the school server's camera
 * endpoints, which always sends the signed-in user's Supabase token — the
 * server trusts that and nothing else. The other is a WHEP handshake: about
 * thirty lines of standard WebRTC that replace a video player library and cut
 * the delay from several seconds to under one, which is the difference between
 * watching a gate and reading about it.
 */

import { supabase } from '../supabase';

export const CAMERA_SERVER_URL = (import.meta.env.VITE_SERVER_URL || '').replace(/\/$/, '');

export class CameraServerError extends Error {
  constructor(message, { status, code } = {}) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function accessToken() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token || null;
}

async function call(path, { method = 'GET', baseUrl = CAMERA_SERVER_URL, signal } = {}) {
  const token = await accessToken();
  if (!token) throw new CameraServerError('Chưa đăng nhập.', { code: 'unauthenticated' });

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    signal
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new CameraServerError(body.message || `Máy chủ camera trả về ${response.status}.`, {
      status: response.status,
      code: body.error
    });
  }
  return body;
}

export const listCameras = (options) => call('/api/cameras', options);

export const requestTicket = (cameraId, options) =>
  call(`/api/cameras/${encodeURIComponent(cameraId)}/ticket`, { ...options, method: 'POST' });

export const listEvents = ({ since, ...options } = {}) =>
  call(`/api/camera-events${since ? `?since=${encodeURIComponent(since)}` : ''}`, options);

/**
 * Open a WHEP stream into a <video> element.
 *
 * @returns {Promise<RTCPeerConnection>} close it to stop watching; the relay
 *   drops the stream with it, so a forgotten tab does not hold a camera open.
 */
export async function startWhep(url, { video, signal } = {}) {
  // The relay sits on the school's own network, so there is no NAT to punch
  // through and no reason to send anything to a STUN server abroad.
  const pc = new RTCPeerConnection({ iceServers: [] });

  pc.addTransceiver('video', { direction: 'recvonly' });
  pc.addTransceiver('audio', { direction: 'recvonly' });
  pc.ontrack = (event) => {
    if (video && event.streams[0]) video.srcObject = event.streams[0];
  };

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/sdp' },
      body: offer.sdp,
      signal
    });

    if (!response.ok) {
      throw new CameraServerError(
        response.status === 401 ? 'Vé xem đã hết hạn.' : `Bộ chuyển luồng trả về ${response.status}.`,
        { status: response.status }
      );
    }

    await pc.setRemoteDescription({ type: 'answer', sdp: await response.text() });
    return pc;
  } catch (err) {
    pc.close();
    throw err;
  }
}
