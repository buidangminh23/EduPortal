import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Bus, Navigation, Clipboard, ArrowRight, Play
} from 'lucide-react';

export default function BusTracker() {
  const { currentRole, selectedStudentId, students, busRoutes, busScanLogs, simulateBusMove, parentRegisterBusRoute } = useContext(AppContext);
  
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const isStudent = currentRole === 'student';
  const isParent = currentRole === 'parent';
  const isAdmin = currentRole === 'admin' || currentRole === 'teacher';

  const [selectedRouteId, setSelectedRouteId] = useState(busRoutes?.[0]?.id || '');

  const handleRegister = (e) => {
    e.preventDefault();
    if (!student || !selectedRouteId) return;
    parentRegisterBusRoute(student.id, selectedRouteId);
    alert('Đăng ký xe bus đưa đón học sinh thành công!');
  };

  // Find registered route for this student
  const registeredRoute = busRoutes?.find(r => r.studentsRegistered.includes(student?.id));
  const myScanLogs = busScanLogs?.filter(log => log.studentId === student?.id) || [];

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.4rem', color: '#1e293b' }}>
          🚌 Hệ Thống Theo Dõi Xe Bus Học Đường
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Theo dõi hành trình di chuyển trực quan, quét mã lên xuống và đăng ký tuyến xe học sinh đưa đón.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        {/* Left Side: Route Map & Simulation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* REGISTERED ROUTE TRACKER MAP */}
          {(isStudent || isParent) && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Navigation size={18} /> Tuyến xe của con đang theo học
              </h4>

              {registeredRoute ? (
                <div>
                  {/* Route Quick Info Card */}
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: 16, 
                    background: '#fff', 
                    padding: 14, 
                    borderRadius: 14, 
                    border: '1px solid rgba(0,0,0,0.04)',
                    marginBottom: 20
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Bus size={20} color="var(--accent-primary)" />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tên Tuyến Xe</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{registeredRoute.name}</div>
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Biển kiểm soát</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{registeredRoute.plateNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Tài xế phụ trách</div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{registeredRoute.driverName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Trạng thái</div>
                      <span className={`badge ${registeredRoute.status === 'driving' ? 'badge-info' : 'badge-success'}`}>
                        {registeredRoute.status === 'driving' ? 'Đang chạy' : 'Đang chờ'}
                      </span>
                    </div>
                  </div>

                  {/* Live Interactive 2D GPS Map */}
                  <div style={{ background: '#09090b', borderRadius: 16, padding: '16px', border: '1px solid rgba(255, 255, 255, 0.1)', marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: '0.82rem', color: '#a1a1aa', fontWeight: 600 }}>🗺️ Live GPS Tracker Map (Bản đồ di chuyển thời gian thực)</span>
                      <span className="animate-pulse" style={{ fontSize: '0.72rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ width: 6, height: 6, background: '#10b981', borderRadius: '50%' }}></span> ĐANG TRUYỀN TÍN HIỆU
                      </span>
                    </div>

                    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
                      <svg viewBox="0 0 600 220" style={{ width: '100%', height: 'auto', background: '#18181b', borderRadius: 12 }}>
                        {/* Map grids */}
                        <defs>
                          <pattern id="busGrid" width="30" height="30" patternUnits="userSpaceOnUse">
                            <circle cx="1" cy="1" r="1" fill="rgba(255,255,255,0.04)" />
                          </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#busGrid)" />

                        {/* Road coordinates mapping */}
                        {/* Coordinates of stops: Stop 0 (60,160) -> Stop 1 (170,50) -> Stop 2 (300,50) -> Stop 3 (430,160) -> Stop 4 (540,110) */}
                        {/* Draw road paths */}
                        <path 
                          d="M 60 160 Q 115 105 170 50 T 300 50 Q 365 105 430 160 Q 485 135 540 110" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.08)" 
                          strokeWidth="10" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        <path 
                          d="M 60 160 Q 115 105 170 50 T 300 50 Q 365 105 430 160 Q 485 135 540 110" 
                          fill="none" 
                          stroke="#6366f1" 
                          strokeWidth="3" 
                          strokeDasharray="5,6" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />

                        {/* Draw decorative elements (Trees, Buildings) */}
                        {/* School building icon at the end */}
                        <g transform="translate(525, 65)">
                          <rect width="30" height="25" fill="#f43f5e" rx="3" />
                          <polygon points="10,0 20,0 30,12 0,12" fill="#be123c" />
                          <rect x="11" y="15" width="8" height="10" fill="#fee2e2" />
                          <text x="15" y="-6" fill="#f43f5e" fontSize="8" fontWeight="bold" textAnchor="middle">TRƯỜNG HỌC</text>
                        </g>

                        {/* Draw stops */}
                        {[
                          { x: 60, y: 160, name: 'Trạm 1' },
                          { x: 170, y: 50, name: 'Trạm 2' },
                          { x: 300, y: 50, name: 'Trạm 3' },
                          { x: 430, y: 160, name: 'Trạm 4' },
                          { x: 540, y: 110, name: 'Trường học' }
                        ].map((stopCoord, index) => {
                          const stopName = registeredRoute.stops[index] || stopCoord.name;
                          const isCurrent = registeredRoute.currentStopIndex === index;
                          const isPassed = registeredRoute.currentStopIndex >= index;
                          const pinColor = isCurrent ? '#10b981' : (isPassed ? '#6366f1' : '#52525b');

                          return (
                            <g key={index}>
                              {/* Glowing current indicator */}
                              {isCurrent && (
                                <circle cx={stopCoord.x} cy={stopCoord.y} r="18" fill="rgba(16, 185, 129, 0.15)" className="animate-pulse" />
                              )}
                              {/* Stop circle node */}
                              <circle 
                                cx={stopCoord.x} 
                                cy={stopCoord.y} 
                                r="8" 
                                fill={pinColor} 
                                stroke="#1e1e24" 
                                strokeWidth="2.5" 
                              />
                              {/* Stop Name tooltip/label */}
                              <text 
                                x={stopCoord.x} 
                                y={index % 2 === 0 ? stopCoord.y + 20 : stopCoord.y - 14} 
                                fill={isCurrent ? '#f8fafc' : '#a1a1aa'} 
                                fontSize="9" 
                                fontWeight={isCurrent ? 'bold' : 'normal'} 
                                textAnchor="middle"
                              >
                                {stopName}
                              </text>
                            </g>
                          );
                        })}

                        {/* Interpolate Bus Location dynamically along path */}
                        {(() => {
                          const busPositions = [
                            { x: 60, y: 160 },
                            { x: 170, y: 50 },
                            { x: 300, y: 50 },
                            { x: 430, y: 160 },
                            { x: 540, y: 110 }
                          ];
                          const activePos = busPositions[registeredRoute.currentStopIndex] || busPositions[0];

                          return (
                            <g 
                              transform={`translate(${activePos.x - 12}, ${activePos.y - 12})`}
                              style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
                            >
                              {/* Bus Glow */}
                              <circle cx="12" cy="12" r="14" fill="rgba(245, 158, 11, 0.35)" />
                              {/* Bus Icon Container */}
                              <rect width="24" height="24" rx="6" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                              <svg x="4" y="4" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="12" rx="2" />
                                <circle cx="7.5" cy="18.5" r="2.5" />
                                <circle cx="16.5" cy="18.5" r="2.5" />
                              </svg>
                            </g>
                          );
                        })()}
                      </svg>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '30px 10px', 
                  color: 'var(--text-muted)', 
                  border: '1px dashed rgba(0,0,0,0.06)',
                  borderRadius: 12,
                  fontSize: '0.82rem'
                }}>
                  Con của bạn chưa đăng ký tuyến xe bus học đường nào. 🚌
                </div>
              )}
            </div>
          )}

          {/* BUS ROUTE REGISTRATION SELECTOR */}
          {(isStudent || isParent) && !registeredRoute && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bus size={18} /> Đăng ký tuyến xe bus đưa đón mới
              </h4>
              <form onSubmit={handleRegister} style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ fontSize: '0.8rem' }}>Chọn tuyến xe buýt</label>
                  <select
                    value={selectedRouteId}
                    onChange={e => setSelectedRouteId(e.target.value)}
                    className="form-control"
                    style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                  >
                    {busRoutes?.map(route => (
                      <option key={route.id} value={route.id}>
                        {route.name} - Biển: {route.plateNumber} ({route.stops.length} điểm đón)
                      </option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ height: 42, padding: '0 24px', gap: 6 }}
                >
                  Đăng Ký Ngay <ArrowRight size={14} />
                </button>
              </form>
            </div>
          )}

          {/* ADMIN SIMULATION VIEW */}
          {isAdmin && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Bus size={18} /> Quản trị và Giả lập Tuyến xe Bus đưa đón toàn trường
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {busRoutes?.map(route => (
                  <div 
                    key={route.id} 
                    style={{ 
                      padding: 16, 
                      borderRadius: 14, 
                      background: '#fff', 
                      border: '1px solid rgba(0,0,0,0.04)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center' 
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{route.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                        BKS: <strong>{route.plateNumber}</strong> | Tài xế: <strong>{route.driverName}</strong>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                        Lộ trình: {route.stops.join(' ➔ ')}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: 4 }}>
                        Trạm hiện tại: <span className="badge badge-info">{route.stops[route.currentStopIndex]}</span> | Học sinh đăng ký: {route.studentsRegistered.length}
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => simulateBusMove(route.id)}
                      className="btn btn-primary"
                      style={{ 
                        padding: '8px 16px', 
                        fontSize: '0.8rem', 
                        gap: 6,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        border: 'none'
                      }}
                    >
                      <Play size={14} /> Đi chuyển tiếp trạm
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Scan History logs */}
        <div>
          <div className="glass-panel" style={{ padding: 16, background: 'rgba(255,255,255,0.6)', height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clipboard size={16} /> Lịch sử quét mã đưa đón
            </h4>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420 }}>
              {myScanLogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '40px 10px' }}>
                  Chưa ghi nhận lịch sử quét thẻ hôm nay.
                </div>
              ) : (
                myScanLogs.map(log => (
                  <div 
                    key={log.id} 
                    style={{ 
                      padding: 10, 
                      borderRadius: 12, 
                      background: '#fff', 
                      border: '1px solid rgba(0,0,0,0.03)',
                      fontSize: '0.78rem' 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontWeight: 700 }}>
                      <span style={{ color: log.direction === 'boarding' ? '#10b981' : '#ef4444' }}>
                        {log.direction === 'boarding' ? '🟢 LÊN XE' : '🔴 XUỐNG XE'}
                      </span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{log.time}</span>
                    </div>
                    <div style={{ color: 'var(--text-secondary)' }}>Học sinh: {log.studentName}</div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                      Trạm đón: {log.stopName}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
