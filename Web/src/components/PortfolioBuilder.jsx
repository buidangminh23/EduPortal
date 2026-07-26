import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Shield, Globe, Lock, CheckCircle, Award as Medal, Plus, Trash, ShieldAlert
} from 'lucide-react';

export default function PortfolioBuilder() {
  const { currentRole, selectedStudentId, setSelectedStudentId, students, studentPortfolios, updatePortfolioAchievements, signPortfolioBgh, togglePortfolioPublic } = useContext(AppContext);
  
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  const isStudent = currentRole === 'student';
  const isAdmin = currentRole === 'admin';
  const isTeacher = currentRole === 'teacher';
  const canEdit = isAdmin || isTeacher;

  // Student editor achievements state
  const [newAchievement, setNewAchievement] = useState('');
  
  // Find portfolio
  const portfolio = studentPortfolios?.find(p => p.studentId === student?.id) || {
    studentId: student?.id,
    studentName: student?.name || 'Học sinh',
    extracurricularAchievements: [],
    blockchainSignature: null,
    isPublic: false
  };

  const handleAddAchievement = () => {
    if (!newAchievement.trim()) return;
    const currentList = [...portfolio.extracurricularAchievements, newAchievement.trim()];
    updatePortfolioAchievements(student.id, currentList);
    setNewAchievement('');
  };

  const handleDeleteAchievement = (idx) => {
    const currentList = portfolio.extracurricularAchievements.filter((_, i) => i !== idx);
    updatePortfolioAchievements(student.id, currentList);
  };

  const handleTogglePublic = () => {
    togglePortfolioPublic(student.id);
  };

  const handleBghSign = (studentId) => {
    signPortfolioBgh(studentId, 'Hiệu trưởng BGH');
    alert(`Đã ký số học bạ số thành công cho em ${student?.name}!`);
  };

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 1000, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.4rem', color: '#1e293b' }}>
            🎓 Hồ Sơ Thành Tích & Chữ Ký Số Học Bạ
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Hồ sơ năng lực học sinh tích hợp công nghệ xác thực chữ ký điện tử blockchain chống giả mạo.
          </p>
        </div>
        <button 
          onClick={() => window.print()} 
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}
        >
          <span>Xuất học bạ PDF</span>
        </button>
      </div>

      {/* Student Selector for Teachers and Admin */}
      {(isTeacher || isAdmin) && (
        <div style={{ 
          background: 'rgba(79, 70, 229, 0.03)', 
          border: '1px solid rgba(79, 70, 229, 0.08)',
          borderRadius: '14px', 
          padding: '16px', 
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <label htmlFor="select-portfolio-student" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Chọn học sinh quản lý:</label>
          <select
            id="select-portfolio-student"
            aria-label="Chọn học sinh quản lý"
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="form-control"
            style={{ padding: '6px 12px', width: 'auto', fontSize: '0.85rem', background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
          >
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        
        {/* LEFT PANEL: Student view OR Teacher/Admin portfolio editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* STUDENT CV VIEWER & VISIBILITY CONFIG */}
          {isStudent && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                Cấu hình hiển thị hồ sơ
              </h3>

              {/* Toggle Public Switch */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                background: '#fff', 
                padding: '10px 14px', 
                borderRadius: 12, 
                border: '1px solid rgba(0,0,0,0.04)',
                marginBottom: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {portfolio.isPublic ? <Globe size={18} color="#047857" /> : <Lock size={18} color="var(--text-muted)" />}
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Cấu hình công khai hồ sơ</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {portfolio.isPublic ? 'Hồ sơ đang ở chế độ xem công khai toàn trường.' : 'Chỉ có học sinh và Ban giám hiệu có quyền truy cập.'}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleTogglePublic} 
                  aria-label={portfolio.isPublic ? 'Chuyển Riêng Tư' : 'Công Khai'}
                  className={`btn ${portfolio.isPublic ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  {portfolio.isPublic ? 'Chuyển Riêng Tư' : 'Công Khai'}
                </button>
              </div>

              {/* Read-only notification box */}
              <div style={{ 
                background: 'rgba(79, 70, 229, 0.05)', 
                border: '1px solid rgba(79, 70, 229, 0.15)', 
                borderRadius: 12, 
                padding: 14, 
                marginBottom: 16,
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start'
              }}>
                <ShieldAlert size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  <strong>Quyền cập nhật thành tích:</strong> Chỉ có Giáo viên và Ban Giám Hiệu mới có thẩm quyền thêm/xóa hoạt động ngoại khóa hoặc giải thưởng trên học bạ điện tử của bạn. Vui lòng liên hệ Giáo viên chủ nhiệm để gửi yêu cầu cập nhật.
                </div>
              </div>

              {/* Achievements read-only list */}
              <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                Hoạt động ngoại khóa đã ghi nhận:
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {portfolio.extracurricularAchievements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Chưa ghi nhận thành tích nào.
                  </div>
                ) : (
                  portfolio.extracurricularAchievements.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        padding: '10px 14px', 
                        background: '#fff', 
                        border: '1px solid rgba(0,0,0,0.03)', 
                        borderRadius: 10 
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>🏆 {item}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TEACHER/ADMIN CV EDITOR FORM */}
          {canEdit && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={18} /> Cập nhật hoạt động & Thành tích ngoại khóa
              </h3>

              {/* Achievements add form */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <input 
                  type="text" 
                  aria-label="Nhập tên hoạt động ngoại khóa hoặc giải thưởng"
                  value={newAchievement}
                  onChange={e => setNewAchievement(e.target.value)}
                  placeholder="Ví dụ: Đạt giải Nhất cuộc thi Tin học trẻ 2026..."
                  className="form-control"
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                />
                <button 
                  onClick={handleAddAchievement} 
                  aria-label="Thêm thành tích"
                  className="btn btn-primary"
                  style={{ gap: 4, height: 42, padding: '0 16px', flexShrink: 0 }}
                >
                  <Plus size={16} /> Thêm
                </button>
              </div>

              {/* Achievements items list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {portfolio.extracurricularAchievements.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Chưa cập nhật thành tích nào cho em {student?.name}.
                  </div>
                ) : (
                  portfolio.extracurricularAchievements.map((item, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '10px 14px', 
                        background: '#fff', 
                        border: '1px solid rgba(0,0,0,0.03)', 
                        borderRadius: 10 
                      }}
                    >
                      <span style={{ fontSize: '0.82rem', color: '#1e293b' }}>🏆 {item}</span>
                      <button 
                        onClick={() => handleDeleteAchievement(idx)} 
                        aria-label="Xóa thành tích này"
                        className="btn" 
                        style={{ padding: 4, color: '#ef4444', background: 'transparent' }}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ADMIN STUDENT PORTFOLIO VERIFICATION ROSTER */}
          {isAdmin && (
            <div className="glass-panel" style={{ padding: 20, background: 'rgba(255,255,255,0.6)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={18} /> Phê duyệt & Ký chữ ký điện tử Blockchain
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {students.map(std => {
                  const stdPort = studentPortfolios?.find(p => p.studentId === std.id) || {
                    studentId: std.id,
                    studentName: std.name,
                    extracurricularAchievements: [],
                    blockchainSignature: null
                  };
                  const isSigned = stdPort.blockchainSignature !== null;
                  
                  return (
                    <div 
                      key={std.id} 
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{std.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          Mã số: <strong>{std.id}</strong> | Lớp: <strong>{std.class}</strong>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          Hoạt động ngoại khóa ({stdPort.extracurricularAchievements.length}): {stdPort.extracurricularAchievements.join('; ') || 'Chưa cập nhật'}
                        </div>
                        {isSigned && (
                          <div style={{ fontSize: '0.72rem', color: '#047857', display: 'flex', alignItems: 'center', gap: 4, marginTop: 6, fontWeight: 700 }}>
                            <CheckCircle size={12} /> Học bạ số đã được niêm phong chữ ký điện tử.
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handleBghSign(std.id)}
                        disabled={isSigned || stdPort.extracurricularAchievements.length === 0}
                        aria-label={isSigned ? 'Đã Ký Số' : 'Ký Số Blockchain'}
                        className="btn btn-primary"
                        style={{ 
                          fontSize: '0.8rem', 
                          padding: '8px 16px', 
                          background: isSigned ? 'rgba(4, 120, 87, 0.15)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                          color: isSigned ? '#047857' : 'white',
                          border: 'none',
                          fontWeight: 700
                        }}
                      >
                        {isSigned ? 'Đã Ký Số' : 'Ký Số Blockchain'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Glowing Digital CV Card / Stamp Seal rendering */}
        <div>
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              body * {
                visibility: hidden;
              }
              .print-area, .print-area * {
                visibility: visible;
              }
              .print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100% !important;
                background: white !important;
                border: 2px solid #1e293b !important;
                box-shadow: none !important;
                color: black !important;
                padding: 40px !important;
                border-radius: 16px !important;
              }
            }
          `}} />
          <div className="glass-panel print-area" style={{ 
            padding: 20, 
            background: 'rgba(255,255,255,0.7)', 
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
            backdropFilter: 'blur(10px)',
            borderRadius: 16,
            minHeight: 460,
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Hologram glowing backdrop */}
            <div style={{
              position: 'absolute',
              top: '-15%',
              right: '-15%',
              width: '60%',
              height: '50%',
              background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}></div>

            {/* Resume Card Content */}
            <div style={{ flex: 1, zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ 
                  width: 38, 
                  height: 38, 
                  borderRadius: '50%', 
                  background: 'linear-gradient(135deg, #818cf8, #4f46e5)', 
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '1rem'
                }}>
                  {student?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#1e293b' }}>Học bạ Số điện tử</h3>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Lớp {student?.class} | Trường THPT Nguyễn Du</div>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 10, marginBottom: 12 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Họ và tên học sinh:</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{student?.name}</div>
              </div>

              {/* Student Academic Grades */}
              {student?.grades && (
                <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>Điểm học tập Kỳ II:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {Object.entries(student.grades).map(([sub, val]) => (
                      <div key={sub} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.03)', padding: '6px', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                          {sub === 'Math' ? 'Toán' : sub === 'Literature' ? 'Văn' : sub === 'Physics' ? 'Lý' : 'Anh'}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-ink)' }}>{val.toFixed(1)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Attendance and Conduct */}
              <div style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: 10, marginBottom: 12, display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                <div>Hạnh kiểm: <strong style={{ color: '#059669' }}>Tốt</strong></div>
                <div>Chuyên cần: <strong>175/175 buổi</strong></div>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 8 }}>
                  <Medal size={14} /> Hoạt Động & Giải Thưởng:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {portfolio.extracurricularAchievements.length === 0 ? (
                    <div style={{ fontSize: '0.78rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>Chưa cập nhật thành tích nào trên học bạ số.</div>
                  ) : (
                    portfolio.extracurricularAchievements.map((item, idx) => (
                      <div key={idx} style={{ fontSize: '0.78rem', color: '#334155', lineHeight: '1.3' }}>
                        • {item}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Blockchain secure seal stamp at the bottom of the CV card */}
            {portfolio.blockchainSignature ? (
              <div style={{ 
                marginTop: 20, 
                borderTop: '1px dashed rgba(99,102,241,0.2)', 
                paddingTop: 12,
                zIndex: 2,
                position: 'relative'
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#065f46' }}>Xác thực học bạ Blockchain</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', marginTop: 1 }}>Ký bởi: {portfolio.blockchainSignature.signedBy}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Ngày ký: {portfolio.blockchainSignature.date}</div>
                    <div style={{ 
                      fontSize: '0.58rem', 
                      fontFamily: 'monospace', 
                      wordBreak: 'break-all', 
                      color: 'var(--accent-primary)',
                      background: '#fff',
                      padding: 4,
                      borderRadius: 4,
                      border: '1px solid rgba(99,102,241,0.1)',
                      marginTop: 4
                    }}>
                      Hash: {portfolio.blockchainSignature.hash}
                    </div>
                  </div>
                </div>
                
                {/* Red Circular Stamp graphic overlay */}
                <div style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -10,
                  width: 65,
                  height: 65,
                  border: '2px solid rgba(220, 38, 38, 0.45)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: 'rotate(-15deg)',
                  fontSize: '0.55rem',
                  fontWeight: 800,
                  color: 'rgba(220, 38, 38, 0.45)',
                  textAlign: 'center',
                  textTransform: 'uppercase',
                  pointerEvents: 'none',
                  lineHeight: '1.1',
                  background: 'rgba(255,255,255,0.7)',
                  boxShadow: '0 0 5px rgba(220, 38, 38, 0.05)'
                }}>
                  <div style={{ border: '1px dashed rgba(220, 38, 38, 0.35)', borderRadius: '50%', width: 55, height: 55, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ĐÃ DUYỆT BGH
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ 
                marginTop: 20, 
                borderTop: '1px dashed rgba(0,0,0,0.06)', 
                paddingTop: 12, 
                fontSize: '0.72rem', 
                color: '#f59e0b',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(245, 158, 11, 0.04)',
                padding: 10,
                borderRadius: 8,
                zIndex: 2
              }}>
                <ShieldAlert size={16} />
                Chưa ký chữ ký điện tử niêm phong.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
