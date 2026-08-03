import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Video, VideoOff, ShieldAlert, RefreshCw, Bell, Info, Play, Square } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { appMode } from '../../lib/appMode';
import { cameraAccess, CAMERA_DENIAL } from '../../lib/cameras/cameraAccess';
import { CAMERA_SERVER_URL, listCameras, listEvents, requestTicket, startWhep } from '../../lib/cameras/cameraClient';

/** How often the wall asks the server what the analyser has seen. */
const EVENT_POLL_MS = 15_000;

const LEVEL_TONE = {
  alert: { bg: 'var(--coral-soft)', fg: '#991b1b', label: 'Cảnh báo' },
  warning: { bg: 'var(--amber-soft)', fg: '#92400e', label: 'Lưu ý' },
  info: { bg: 'var(--surface-soft)', fg: 'var(--text-secondary)', label: 'Ghi nhận' }
};

const DENIAL_COPY = {
  [CAMERA_DENIAL.ROLE]: {
    title: 'Mục này chỉ dành cho Ban Giám Hiệu',
    detail: 'Tài khoản của bạn không có quyền xem camera. Máy chủ cũng từ chối, không chỉ giao diện này.'
  },
  [CAMERA_DENIAL.DEMO]: {
    title: 'Bản demo không nối camera thật',
    detail: 'Ở bản demo, ai cũng chọn được vai Ban Giám Hiệu, nên nối vào camera của trường đồng nghĩa với việc mở camera cho cả internet. Camera chỉ hoạt động trên bản cài đặt thật của trường (có tài khoản Supabase).'
  },
  [CAMERA_DENIAL.UNCONFIGURED]: {
    title: 'Bản cài đặt chưa xác định là thật hay demo',
    detail: 'Đặt VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY rồi dựng lại, camera mới bật.'
  },
  [CAMERA_DENIAL.NO_SERVER]: {
    title: 'Chưa khai báo máy chủ trong trường',
    detail: 'Camera đi qua máy chủ đặt tại trường. Đặt VITE_SERVER_URL trỏ tới máy đó rồi dựng lại.'
  }
};

function Notice({ title, detail, tone = 'info' }) {
  const palette = tone === 'warn'
    ? { bg: 'var(--amber-soft)', fg: '#92400e', border: 'var(--amber)' }
    : { bg: 'var(--surface-soft)', fg: 'var(--text-secondary)', border: 'var(--line)' };

  return (
    <div style={{
      display: 'flex', gap: '10px', padding: '14px 16px', borderRadius: '14px',
      background: palette.bg, border: `1px solid ${palette.border}`
    }}>
      <ShieldAlert size={18} color={palette.fg} style={{ flexShrink: 0, marginTop: '2px' }} />
      <div>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{title}</div>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: palette.fg, lineHeight: 1.55 }}>{detail}</p>
      </div>
    </div>
  );
}

function CameraTile({ camera, alerts }) {
  const videoRef = useRef(null);
  const connectionRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | connecting | live | error
  const [error, setError] = useState(null);

  const stop = useCallback(() => {
    if (connectionRef.current) {
      connectionRef.current.close();
      connectionRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setState('idle');
  }, []);

  const start = useCallback(() => {
    setState('connecting');
    setError(null);

    requestTicket(camera.id)
      .then(ticket => startWhep(ticket.url, { video: videoRef.current }))
      .then(connection => {
        connectionRef.current = connection;
        setState('live');
      })
      .catch(err => {
        setError(err.message);
        setState('error');
      });
  }, [camera.id]);

  // Closing the tab has to close the stream too: a relay still sending pictures
  // to nobody is a camera nobody knows is being watched.
  useEffect(() => stop, [stop]);

  const latest = alerts[0];

  return (
    <div style={{
      borderRadius: '14px', overflow: 'hidden',
      border: `1px solid ${latest?.level === 'alert' ? 'var(--coral)' : 'var(--line)'}`,
      background: 'var(--surface-soft)'
    }}>
      <div style={{ position: 'relative', aspectRatio: '16 / 9', background: '#0b0f14' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: state === 'live' ? 'block' : 'none' }}
        />

        {state !== 'live' && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#94a3b8'
          }}>
            {state === 'connecting'
              ? <><RefreshCw size={22} className="animate-spin" /><span style={{ fontSize: '0.78rem' }}>Đang kết nối…</span></>
              : state === 'error'
                ? <><VideoOff size={22} color="#f87171" /><span style={{ fontSize: '0.75rem', color: '#fca5a5', textAlign: 'center', padding: '0 12px' }}>{error}</span></>
                : <><VideoOff size={22} /><span style={{ fontSize: '0.78rem' }}>Chưa mở</span></>}
          </div>
        )}

        {state === 'live' && (
          <span style={{
            position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: '5px',
            padding: '3px 9px', borderRadius: '99px', background: 'rgba(15,23,42,0.75)',
            color: '#fca5a5', fontSize: '0.68rem', fontWeight: 700
          }}>
            ● TRỰC TIẾP
          </span>
        )}
      </div>

      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>{camera.name}</div>
            {camera.location && (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>{camera.location}</div>
            )}
          </div>

          <button
            onClick={state === 'live' ? stop : start}
            className={state === 'live' ? 'btn' : 'btn btn-primary'}
            style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}
            disabled={state === 'connecting'}
          >
            {state === 'live' ? <><Square size={13} /> Dừng</> : <><Play size={13} /> Xem</>}
          </button>
        </div>

        {latest && (
          <div style={{
            marginTop: '8px', padding: '6px 9px', borderRadius: '8px', fontSize: '0.74rem', lineHeight: 1.45,
            background: LEVEL_TONE[latest.level].bg, color: LEVEL_TONE[latest.level].fg
          }}>
            <strong>{LEVEL_TONE[latest.level].label}:</strong> {latest.label}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CameraWallTab() {
  const { role } = useAuth();
  const access = useMemo(
    () => cameraAccess({ role, appMode, serverUrl: CAMERA_SERVER_URL }),
    [role]
  );

  const [cameras, setCameras] = useState([]);
  const [events, setEvents] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!access.allowed) return undefined;

    let alive = true;
    listCameras()
      .then(data => { if (alive) setCameras(data.cameras || []); })
      .catch(err => { if (alive) setLoadError(err); })
      .finally(() => { if (alive) setLoaded(true); });

    return () => { alive = false; };
  }, [access.allowed]);

  useEffect(() => {
    if (!access.allowed) return undefined;

    let alive = true;
    const poll = () => {
      listEvents()
        .then(data => { if (alive) setEvents(data.events || []); })
        .catch(() => { /* the wall keeps working when the analyser is quiet */ });
    };

    poll();
    const timer = setInterval(poll, EVENT_POLL_MS);
    return () => { alive = false; clearInterval(timer); };
  }, [access.allowed]);

  const alertsByCamera = useMemo(() => {
    return events.reduce((acc, event) => {
      acc[event.cameraId] = [...(acc[event.cameraId] || []), event];
      return acc;
    }, {});
  }, [events]);

  if (!access.allowed) {
    const copy = DENIAL_COPY[access.reason];
    return (
      <div className="glass-panel animate-fade" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Video size={20} color="var(--accent-primary)" /> Camera giám sát
        </h2>
        <Notice title={copy.title} detail={copy.detail} tone="warn" />
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Video size={20} color="var(--accent-primary)" /> Camera giám sát
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {loaded ? `${cameras.length} camera · chỉ Ban Giám Hiệu xem được · mỗi lượt xem đều được ghi nhật ký` : 'Đang tải danh sách camera…'}
          </p>
        </div>
      </div>

      {loadError && (
        <Notice
          tone="warn"
          title={loadError.code === 'camera_not_configured' ? 'Máy chủ trong trường chưa cấu hình camera' : 'Không lấy được danh sách camera'}
          detail={loadError.message}
        />
      )}

      {loaded && !loadError && cameras.length === 0 && (
        <Notice
          title="Chưa khai báo camera nào"
          detail="Thêm camera vào tệp cameras.json trên máy chủ của trường (id, tên, vị trí, địa chỉ rtsp) rồi tải lại trang."
        />
      )}

      {cameras.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {cameras.map(camera => (
            <CameraTile key={camera.id} camera={camera} alerts={alertsByCamera[camera.id] || []} />
          ))}
        </div>
      )}

      <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--surface-soft)', border: '1px solid var(--line)' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Bell size={15} color="var(--accent-primary)" /> AI ghi nhận
        </h3>

        {events.length === 0 ? (
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
            Chưa có ghi nhận nào. Phần này hiện những gì lớp AI gửi về; khi chưa cắm AI thì nó trống,
            và camera vẫn xem bình thường.
          </p>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '7px' }}>
            {events.slice(0, 12).map((event, index) => {
              const tone = LEVEL_TONE[event.level];
              const camera = cameras.find(item => item.id === event.cameraId);

              return (
                <li key={`${event.cameraId}-${event.at}-${index}`} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', fontSize: '0.8rem' }}>
                  <span style={{ padding: '1px 8px', borderRadius: '99px', background: tone.bg, color: tone.fg, fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                    {tone.label}
                  </span>
                  <span style={{ color: 'var(--text-primary)' }}>{event.label}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    · {camera?.name || event.cameraId} · {new Date(event.at).toLocaleTimeString('vi-VN')}
                    {event.confidence !== null && event.confidence !== undefined ? ` · ${Math.round(event.confidence * 100)}%` : ''}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p style={{
        display: 'flex', gap: '8px', margin: 0, padding: '10px 12px', borderRadius: '10px',
        background: 'var(--surface-soft)', border: '1px solid var(--line)',
        fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.55
      }}>
        <Info size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
        <span>
          Hình ảnh đi thẳng từ máy chủ trong trường tới máy này, không qua bên thứ ba. Mỗi lần mở camera
          đều ghi lại người xem, camera nào và lúc nào — camera trường quay học sinh, nên phải trả lời được
          câu hỏi &ldquo;ai đã xem&rdquo;.
        </span>
      </p>
    </div>
  );
}
