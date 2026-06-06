import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Award, UserCheck, BookOpen, HelpCircle, Calendar, Sparkles, ArrowRight } from 'lucide-react';

const SUBJECT_KEYS = ['Math', 'Literature', 'Physics', 'English'];

const getClassification = (gpaScore) => {
  const val = parseFloat(gpaScore);
  if (val >= 8.0) return 'Giỏi';
  if (val >= 6.5) return 'Khá';
  if (val >= 5.0) return 'Trung bình';
  return 'Yếu';
};

const getSubjectName = (key) => {
  if (key === 'Math') return 'Toán học';
  if (key === 'Literature') return 'Ngữ văn';
  if (key === 'Physics') return 'Vật lý';
  if (key === 'English') return 'Tiếng Anh';
  return key;
};

export default function OverviewTab({ student, setActiveTab }) {
  const { tutorChat, attendanceLogs } = useContext(AppContext);
  const [selectedGradeYear, setSelectedGradeYear] = useState(null);

  const gradeHistory = student?.gradeHistory || [];
  const availableGradeYears = gradeHistory.length > 0
    ? gradeHistory.map(h => ({ gradeLevel: h.gradeLevel, class: h.class, schoolYear: h.schoolYear }))
    : null;

  const activeHistoryEntry = selectedGradeYear
    ? gradeHistory.find(h => h.gradeLevel === selectedGradeYear) || null
    : null;

  const activeSem1Grades = activeHistoryEntry ? activeHistoryEntry.sem1 : (student?.gradesSem1 || {});
  const activeSem2Grades = activeHistoryEntry ? activeHistoryEntry.sem2 : (student?.grades || {});

  const sem1GradesArray = Object.values(activeSem1Grades);
  const sem1Gpa = sem1GradesArray.length > 0
    ? (sem1GradesArray.reduce((a, b) => a + b, 0) / sem1GradesArray.length).toFixed(2)
    : '0.00';

  const sem2GradesArray = Object.values(activeSem2Grades);
  const sem2Gpa = sem2GradesArray.length > 0
    ? (sem2GradesArray.reduce((a, b) => a + b, 0) / sem2GradesArray.length).toFixed(2)
    : '0.00';

  const wholeYearGrades = {};
  SUBJECT_KEYS.forEach(sub => {
    const s1 = activeSem1Grades[sub] || 0;
    const s2 = activeSem2Grades[sub] || 0;
    wholeYearGrades[sub] = parseFloat(((s1 + s2 * 2) / 3).toFixed(2));
  });
  const wholeYearGradesArray = Object.values(wholeYearGrades);
  const wholeYearGpa = wholeYearGradesArray.length > 0
    ? (wholeYearGradesArray.reduce((a, b) => a + b, 0) / wholeYearGradesArray.length).toFixed(2)
    : '0.00';

  const tutorMsgCount = tutorChat.filter(m => m.sender === 'user').length;
  const myAttendance = attendanceLogs ? attendanceLogs.filter(l => l.studentId === student.id) : [];

  return (
    <div className="animate-fade">
      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
              GPA {activeHistoryEntry ? `LỚP ${activeHistoryEntry.gradeLevel}` : 'TỔNG KẾT CẢ NĂM'}
            </span>
            <div style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--accent-secondary)', fontWeight: 'bold' }}>{wholeYearGpa}/10</div>
          </div>
          <div className="stat-icon"><Award size={24} /></div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>TỶ LỆ CHUYÊN CẦN THÁNG 6</span>
            <div style={{ fontSize: '2rem', marginTop: '6px', fontWeight: 'bold' }}>
              {myAttendance.length > 0 ? `${Math.round((myAttendance.filter(l => l.status !== 'absent').length / 3) * 100)}%` : '100%'}
            </div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'var(--accent-secondary-glow)' }}><UserCheck size={24} /></div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>BÀI GIẢNG ĐÃ XEM</span>
            <div style={{ fontSize: '2rem', marginTop: '6px', fontWeight: 'bold' }}>3 video</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--accent-info)', background: 'var(--accent-primary-glow)' }}><BookOpen size={24} /></div>
        </div>

        <div className="glass-panel stat-card">
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>TRAO ĐỔI VỚI GIA SƯ AI</span>
            <div style={{ fontSize: '2rem', marginTop: '6px', fontWeight: 'bold' }}>{tutorMsgCount} câu hỏi</div>
          </div>
          <div className="stat-icon" style={{ color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)' }}><HelpCircle size={24} /></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginBottom: '30px' }}>
        {/* Weekly Timetable preview */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <span>Thời khóa biểu hôm nay</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { time: '07:30 - 08:15', sub: 'Toán học', room: 'Phòng 402', t: 'Thầy Triết' },
              { time: '08:25 - 09:10', sub: 'Ngữ văn', room: 'Phòng 402', t: 'Cô Vân' },
              { time: '09:20 - 10:05', sub: 'Vật lý', room: 'Phòng thực hành Lý', t: 'Thầy Duy' },
              { time: '10:20 - 11:05', sub: 'Tiếng Anh', room: 'Phòng 402', t: 'Cô Hà' }
            ].map((slot, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)', borderRadius: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>{slot.time}</span>
                <div style={{ flex: 1, paddingLeft: '24px' }}>
                  <div style={{ fontWeight: 600 }}>{slot.sub}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{slot.t}</div>
                </div>
                <span className="badge badge-info">{slot.room}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Academic profile progress */}
        <div className="glass-panel">
          <h2 style={{ margin: 0, fontSize: '1.25rem', marginBottom: availableGradeYears ? '16px' : '20px' }}>Chi tiết kết quả học tập</h2>

          {/* Year selector – full-width prominent tab bar */}
          {availableGradeYears && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '10px', fontWeight: 600 }}>
                📅 Chọn năm học để xem điểm
              </div>
              <div style={{
                display: 'flex',
                gap: '0',
                background: 'rgba(0,0,0,0.12)',
                borderRadius: '12px',
                padding: '4px',
                width: 'fit-content',
                border: '1px solid var(--border-card)'
              }}>
                {availableGradeYears.map(yr => {
                  const isActive = (selectedGradeYear === yr.gradeLevel) || (selectedGradeYear === null && yr.gradeLevel === student.grade);
                  return (
                    <button
                      key={yr.gradeLevel}
                      id={`grade-year-btn-${yr.gradeLevel}`}
                      aria-label={`Xem kết quả lớp ${yr.gradeLevel}`}
                      onClick={() => setSelectedGradeYear(yr.gradeLevel)}
                      style={{
                        padding: '10px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        background: isActive
                          ? 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)'
                          : 'transparent',
                        color: isActive ? '#fff' : 'var(--text-secondary)',
                        fontSize: '0.9rem',
                        fontWeight: isActive ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.25s ease',
                        boxShadow: isActive ? '0 2px 10px rgba(99,102,241,0.4)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        minWidth: '90px'
                      }}
                    >
                      <span style={{ fontWeight: isActive ? 800 : 600 }}>Lớp {yr.gradeLevel}</span>
                      <span style={{ fontSize: '0.68rem', opacity: isActive ? 0.9 : 0.55, fontWeight: 400 }}>{yr.schoolYear}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extra info for historical years */}
          {activeHistoryEntry && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', background: 'rgba(16,185,129,0.06)', borderRadius: '10px', border: '1px solid rgba(16,185,129,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Lớp</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-secondary)' }}>{activeHistoryEntry.class}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(99,102,241,0.06)', borderRadius: '10px', border: '1px solid rgba(99,102,241,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Danh hiệu</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--accent-primary)' }}>{activeHistoryEntry.achievement}</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(245,158,11,0.06)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Xếp hạng</div>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f59e0b' }}>#{activeHistoryEntry.rank} trong lớp</div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(239,68,68,0.05)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Vắng mặt</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: activeHistoryEntry.attendance.absences > 2 ? '#ef4444' : 'var(--accent-secondary)' }}>
                  {activeHistoryEntry.attendance.absences} buổi
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: '4px' }}>({activeHistoryEntry.attendance.absencesExcused} có phép)</span>
                </div>
              </div>
              <div style={{ padding: '14px', background: 'rgba(59,130,246,0.06)', borderRadius: '10px', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Hạnh kiểm</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#3b82f6' }}>{activeHistoryEntry.conduct.year}</div>
              </div>
            </div>
          )}

          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Môn học</th>
                  <th style={{ textAlign: 'center' }}>Học kì I</th>
                  <th style={{ textAlign: 'center' }}>Học kì II</th>
                  <th style={{ textAlign: 'center' }}>Cả năm</th>
                </tr>
              </thead>
              <tbody>
                {SUBJECT_KEYS.map(sub => {
                  const score1 = activeSem1Grades[sub] ?? 0;
                  const score2 = activeSem2Grades[sub] ?? 0;
                  const scoreAll = parseFloat(((score1 + score2 * 2) / 3).toFixed(2));

                  return (
                    <tr key={sub}>
                      <td style={{ fontWeight: 600 }}>{getSubjectName(sub)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{score1.toFixed(1)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-primary)' }}>{score2.toFixed(1)}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-secondary)' }}>{scoreAll.toFixed(1)}</td>
                    </tr>
                  );
                })}
                {/* GPA Row */}
                <tr style={{ borderTop: '2px solid var(--border-color)', background: 'rgba(99, 102, 241, 0.05)' }}>
                  <td style={{ fontWeight: 700 }}>Điểm trung bình (GPA)</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{sem1Gpa}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-primary)' }}>{sem2Gpa}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--accent-secondary)', fontSize: '1.05rem' }}>{wholeYearGpa}</td>
                </tr>
                {/* Classification Row */}
                <tr style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <td style={{ fontWeight: 700 }}>Xếp loại học lực</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    <span className={`badge ${parseFloat(sem1Gpa) >= 8.0 ? 'badge-success' : parseFloat(sem1Gpa) >= 6.5 ? 'badge-warning' : 'badge-danger'}`}>
                      {getClassification(sem1Gpa)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    <span className={`badge ${parseFloat(sem2Gpa) >= 8.0 ? 'badge-success' : parseFloat(sem2Gpa) >= 6.5 ? 'badge-warning' : 'badge-danger'}`}>
                      {getClassification(sem2Gpa)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>
                    <span className={`badge ${parseFloat(wholeYearGpa) >= 8.0 ? 'badge-success' : parseFloat(wholeYearGpa) >= 6.5 ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '6px 12px' }}>
                      {getClassification(wholeYearGpa)}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
        <div className="glass-panel glass-panel-hover" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('tutor')}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem', fontWeight: 700 }}>
            <Sparkles size={16} color="var(--accent-primary)" />
            <span>Gia sư AI 24/7</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Hỏi đáp giải bài tập Toán, Lý, Hóa, Văn, Anh trực tuyến bất cứ lúc nào.
          </p>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Vào phòng gia sư <ArrowRight size={14} />
          </span>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('lectures')}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem', fontWeight: 700 }}>
            <BookOpen size={16} color="var(--accent-secondary)" />
            <span>Thư viện bài giảng số</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Hệ thống video giảng dạy trực quan, ôn luyện chuyên đề thi THPT Quốc gia.
          </p>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Mở thư viện video <ArrowRight size={14} />
          </span>
        </div>

        <div className="glass-panel glass-panel-hover" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('meet')}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '1rem', fontWeight: 700 }}>
            <BookOpen size={16} color="var(--accent-info)" />
            <span>Phòng học trực tuyến EduMeet</span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
            Tham gia phòng họp video học trực tuyến cùng thầy cô và bạn bè.
          </p>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-info)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            Vào phòng họp ngay <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}
