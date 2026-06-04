import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp,
  Megaphone,
  Award,
  Wallet,
  MessageSquare,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Calendar,
  BookOpen,
  XCircle,
  Check,
  X,
  PieChart,
  Activity,
  Compass,
  Briefcase,
  ClipboardList
} from 'lucide-react';
import AIRiskPanel from './AIRiskPanel';


export default function PrincipalDashboard() {
  const { 
    students, 
    teachers, 
    journalEntries,
    parentQAs,
    addAnnouncement, 
    createFeeItem,
    answerParentQuestion,
    leaveRequests,
    approveLeaveRequest,
    lessonPlans,
    reviewLessonPlan,
    conductLogs,
    teacherEvaluations,
    assignments,
    submissions,
    attendanceLogs,
    clubs,
    clubApplications,
    careerTestScores,
    reviewClubApplication,
    approveClubBudget,
    mockExamHistory,
    teacherLeaveRequests,
    approveTeacherLeaveRequest,
    cafeteriaRegistrations,
    cafeteriaFeedback,
    studentWallets,
    wellnessLogs,
    wellnessAppointments
  } = useContext(AppContext);

  // Sub tab control
  const [subTab, setSubTab] = useState('overview'); // overview, finance, qa_notices, leaves, lesson_plans, teacher_ratings
  const [leaveTab, setLeaveTab] = useState('student'); // student, teacher
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planFeedback, setPlanFeedback] = useState('');

  // Teacher Rating state
  const [selectedTeacherForRating, setSelectedTeacherForRating] = useState(null);

  
  // Finance form states
  const [feeName, setFeeName] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeClass, setFeeClass] = useState('All'); // All, 12A1, 12A2, 11A1, 10A1
  const [feeDeadline, setFeeDeadline] = useState('2026-06-20');

  // Announcement form states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');

  // QA answer override state
  const [qaReplies, setQaReplies] = useState({});

  // Thi đua approval signature state
  const [thiDuaApproved, setThiDuaApproved] = useState(false);

  // Mock Exam States
  const [pMockSearch, setPMockSearch] = useState('');
  const [pMockClassFilter, setPMockClassFilter] = useState('ALL');
  const [pMockBlockFilter, setPMockBlockFilter] = useState('ALL');

  // Club ERP budgets state
  const [clubBudgets, setClubBudgets] = useState({});

  // Calculations
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const allAttempts = mockExamHistory || [];
  
  const topScorers = [...allAttempts]
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  // Expected vs Collected fees aggregate
  let totalFeesCount = 0;
  let paidFeesCount = 0;
  students.forEach(s => {
    s.feeStatus.forEach(f => {
      totalFeesCount++;
      if (f.paid) paidFeesCount++;
    });
  });
  const feePaidPercentage = totalFeesCount > 0 ? Math.round((paidFeesCount / totalFeesCount) * 100) : 0;

  // GPA calculation
  let totalGpaSum = 0;
  students.forEach(s => {
    const subjects = Object.values(s.grades);
    const avg = subjects.reduce((a, b) => a + b, 0) / subjects.length;
    totalGpaSum += avg;
  });
  const schoolAvgGpa = totalStudents > 0 ? (totalGpaSum / totalStudents).toFixed(2) : 0;

  // Thi đua weekly points calculation (Calculate 12A1 dynamically, mock others)
  const getRatingValue = (r) => {
    if (r === 'A') return 10;
    if (r === 'B') return 8;
    if (r === 'C') return 6;
    return 4;
  };
  const entries12A1 = journalEntries.filter(j => j.class === '12A1');
  const points12A1 = entries12A1.reduce((acc, curr) => acc + getRatingValue(curr.rating), 0);
  const score12A1 = entries12A1.length > 0 ? parseFloat((points12A1 / entries12A1.length).toFixed(1)) : 9.3;

  const classRankings = [
    { name: '12A1', score: score12A1, teacher: 'Thầy Triết' },
    { name: '12A2', score: 9.0, teacher: 'Cô Vân' },
    { name: '11A1', score: 8.5, teacher: 'Thầy Duy' },
    { name: '10A1', score: 7.0, teacher: 'Cô Hà' }
  ].sort((a, b) => b.score - a.score);

  // Conduct points calculations
  const getStudentConductSummaries = () => {
    return students.map(s => {
      const logs = conductLogs ? conductLogs.filter(l => l.studentId === s.id) : [];
      const score = 100 + logs.reduce((sum, curr) => sum + curr.points, 0);
      return { student: s, score };
    });
  };
  const studentConductScores = getStudentConductSummaries();
  const topConduct = [...studentConductScores].sort((a, b) => b.score - a.score).slice(0, 3);
  const warnedConduct = studentConductScores.filter(s => s.score < 100);

  // Extract unique Fee templates and aggregate collection rates
  const getFinanceLedger = () => {
    const ledger = {};
    students.forEach(s => {
      s.feeStatus.forEach(f => {
        if (!ledger[f.name]) {
          ledger[f.name] = { name: f.name, amount: f.amount, expected: 0, collected: 0, unpaid: 0 };
        }
        ledger[f.name].expected += f.amount;
        if (f.paid) {
          ledger[f.name].collected += f.amount;
        } else {
          ledger[f.name].unpaid += f.amount;
        }
      });
    });
    return Object.values(ledger);
  };

  const financeLedger = getFinanceLedger();

  // Attendance calculations
  const todayLogs = attendanceLogs ? attendanceLogs.filter(l => l.date === '2026-06-03') : [];
  const presentToday = todayLogs.filter(l => l.status === 'present').length;
  const lateToday = todayLogs.filter(l => l.status === 'late').length;
  const totalStudentsCount = students.length;
  const totalPresentAndLate = presentToday + lateToday;
  const attendancePct = totalStudentsCount > 0 ? Math.round((totalPresentAndLate / totalStudentsCount) * 100) : 0;

  // Class-wise attendance rate calculator
  const getClassAttendanceStats = (className) => {
    const classStudents = students.filter(s => s.class === className);
    if (classStudents.length === 0) return { pct: 0, present: 0, late: 0, total: 0 };
    const classLogs = todayLogs.filter(l => classStudents.some(s => s.id === l.studentId));
    const pres = classLogs.filter(l => l.status === 'present').length;
    const lat = classLogs.filter(l => l.status === 'late').length;
    const total = classStudents.length;
    const pct = Math.round(((pres + lat) / total) * 100);
    return { pct, present: pres, late: lat, total };
  };

  // RIASEC counts aggregator
  const getRiasecCounts = () => {
    const counts = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    if (!careerTestScores) return counts;
    careerTestScores.forEach(score => {
      const categories = ['R', 'I', 'A', 'S', 'E', 'C'];
      let maxVal = -1;
      let maxCat = 'R';
      categories.forEach(cat => {
        if (score[cat] > maxVal) {
          maxVal = score[cat];
          maxCat = cat;
        }
      });
      counts[maxCat]++;
    });
    return counts;
  };
  const riasecCounts = getRiasecCounts();

  // Handlers
  const handleAnnounceSubmit = (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annContent.trim()) return;
    addAnnouncement(annTitle, annContent, 'Hiệu Trưởng');
    setAnnTitle('');
    setAnnContent('');
    alert('Đã phát hành thông báo toàn trường thành công!');
  };

  const handleCreateFeeSubmit = (e) => {
    e.preventDefault();
    if (!feeName.trim() || !feeAmount) return;
    createFeeItem(feeName, parseFloat(feeAmount), feeClass, feeDeadline);
    setFeeName('');
    setFeeAmount('');
    alert(`Đã ban hành khoản thu "${feeName}" tới phụ huynh nhóm: ${feeClass === 'All' ? 'Toàn trường' : `Lớp ${feeClass}`}!`);
  };

  const handleOverrideAnswerQA = (qaId) => {
    const replyText = qaReplies[qaId];
    if (!replyText || !replyText.trim()) return;
    answerParentQuestion(qaId, `[BGH phản hồi]: ${replyText}`);
    setQaReplies(prev => ({ ...prev, [qaId]: '' }));
    alert('Đã gửi phản hồi chính thức của BGH tới phụ huynh!');
  };

  const handleBghLeaveApproval = (requestId, status) => {
    approveLeaveRequest(requestId, status);
    alert(`BGH đã ${status === 'approved' ? 'chấp thuận' : 'từ chối'} đơn xin nghỉ phép!`);
  };

  const handleBghTeacherLeaveApproval = (requestId, status) => {
    approveTeacherLeaveRequest(requestId, status);
    alert(`BGH đã ${status === 'approved' ? 'duyệt' : 'từ chối'} đơn xin nghỉ phép của giáo viên!`);
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlan) return;
    reviewLessonPlan(selectedPlan.plan.id, selectedPlan.status, planFeedback);
    setSelectedPlan(null);
    setPlanFeedback('');
    alert(`Đã duyệt giáo án của giáo viên ${selectedPlan.plan.teacherName}!`);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Hệ Thống Giám Sát Ban Giám Hiệu</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Quản trị học vụ, điều phối tài chính, duyệt sổ sách học đường tập trung.</p>
        </div>
      </div>

      {/* Sub tabs nav */}
      <div className="tabs-container" style={{ marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        <button onClick={() => setSubTab('overview')} className={`tab-btn ${subTab === 'overview' ? 'active' : ''}`}>
          Tổng Quan & Thi Đua
        </button>
        <button onClick={() => setSubTab('attendance_monitor')} className={`tab-btn ${subTab === 'attendance_monitor' ? 'active' : ''}`}>
          Giám Sát Chuyên Cần
        </button>
        <button onClick={() => setSubTab('clubs_erp')} className={`tab-btn ${subTab === 'clubs_erp' ? 'active' : ''}`}>
          ERP Câu Lạc Bộ ({clubs.filter(c => c.status === 'pending').length + clubApplications.filter(a => a.status === 'pending').length})
        </button>
        <button onClick={() => setSubTab('career_psychology')} className={`tab-btn ${subTab === 'career_psychology' ? 'active' : ''}`}>
          Hướng Nghiệp & Tâm Lý
        </button>
        <button onClick={() => setSubTab('finance')} className={`tab-btn ${subTab === 'finance' ? 'active' : ''}`}>
          Quản Lý Tài Chính ({financeLedger.length})
        </button>
        <button onClick={() => setSubTab('qa_notices')} className={`tab-btn ${subTab === 'qa_notices' ? 'active' : ''}`}>
          Hỏi Đáp & Phát Ngôn ({parentQAs.length})
        </button>
        <button onClick={() => setSubTab('leaves')} className={`tab-btn ${subTab === 'leaves' ? 'active' : ''}`}>
          Duyệt Nghỉ Phép ({(leaveRequests ? leaveRequests.filter(l => l.status === 'pending').length : 0) + (teacherLeaveRequests ? teacherLeaveRequests.filter(l => l.status === 'pending').length : 0)})
        </button>
        <button onClick={() => setSubTab('lesson_plans')} className={`tab-btn ${subTab === 'lesson_plans' ? 'active' : ''}`}>
          Duyệt Giáo Án ({lessonPlans ? lessonPlans.filter(p => p.status === 'pending').length : 0})
        </button>
        <button onClick={() => setSubTab('teacher_ratings')} className={`tab-btn ${subTab === 'teacher_ratings' ? 'active' : ''}`}>
          Đánh Giá Giáo Viên ({teachers.length})
        </button>
        <button onClick={() => setSubTab('assignments')} className={`tab-btn ${subTab === 'assignments' ? 'active' : ''}`}>
          Thống Kê Bài Tập
        </button>
        <button onClick={() => setSubTab('mock_exams')} className={`tab-btn ${subTab === 'mock_exams' ? 'active' : ''}`}>
          Thống Kê Thi Thử
        </button>
      </div>

      {/* Overview Subtab content */}
      {subTab === 'overview' && (
        <div>
          {/* Grid Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG HỌC SINH</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>{totalStudents} học sinh</div>
              </div>
              <div className="stat-icon"><Users size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG GIÁO VIÊN</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>{totalTeachers} giáo viên</div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'var(--accent-secondary-glow)' }}><GraduationCap size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>THU HỌC PHÍ TRƯỜNG</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>{feePaidPercentage}% hoàn tất</div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)' }}><DollarSign size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ĐIỂM TRUNG BÌNH CHUNG</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>{schoolAvgGpa} / 10</div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-info)', background: 'rgba(14, 165, 233, 0.1)' }}><TrendingUp size={20} /></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* SVG budget flow chart */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Dòng tài chính học kỳ (VND)</h2>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', height: '220px', gap: '20px', paddingBottom: '20px', borderBottom: '1px solid var(--border-card)' }}>
                {[
                  { label: 'Expected Revenue', value: totalFeesCount * 1200000, color: 'linear-gradient(to top, #94a3b8, #cbd5e1)' },
                  { label: 'Actual Collected', value: paidFeesCount * 1200000, color: 'linear-gradient(to top, var(--accent-primary), #a78bfa)' }
                ].map((bar, i) => {
                  const maxVal = totalFeesCount * 1200000 || 10000000;
                  const pct = Math.round((bar.value / maxVal) * 100) || 50;
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>{formatCurrency(bar.value)}</div>
                      <div style={{
                        width: '70%',
                        height: `${pct * 1.6}px`,
                        background: bar.color,
                        borderRadius: '8px 8px 0 0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        transition: 'height 0.8s ease'
                      }}></div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 600 }}>{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Thi đua class ranking */}
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25rem', margin: 0 }}>
                    <Award size={18} color="var(--accent-primary)" />
                    <span>Bảng Xếp Hạng Thi Đua Tuần 35</span>
                  </h2>
                  {thiDuaApproved ? (
                    <span className="badge badge-success" style={{ gap: '2px', fontSize: '0.75rem' }}>
                      <CheckCircle size={10} /> Đã duyệt
                    </span>
                  ) : (
                    <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>Đợi duyệt</span>
                  )}
                </div>
 
                {/* SVG horizontal bar chart */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  {classRankings.map((cRank, idx) => {
                    const widthPct = (cRank.score / 10) * 100;
                    return (
                      <div key={cRank.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>#{idx+1} Lớp {cRank.name} ({cRank.teacher})</span>
                          <strong style={{ color: 'var(--accent-primary)' }}>{cRank.score} điểm</strong>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${widthPct}%`, 
                            height: '100%', 
                            background: idx === 0 ? 'linear-gradient(to right, var(--accent-secondary), #34d399)' : 'linear-gradient(to right, var(--accent-primary), #818cf8)',
                            borderRadius: '99px' 
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
 
              {!thiDuaApproved ? (
                <button onClick={() => { setThiDuaApproved(true); alert('Ban Giám Hiệu đã phê duyệt và ký đóng dấu bảng xếp hạng thi đua tuần thành công!'); }} className="btn btn-primary" style={{ width: '100%' }}>
                  Duyệt và ký tên bảng thi đua
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed var(--accent-secondary)', borderRadius: '10px' }}>
                  <CheckCircle size={16} color="var(--accent-secondary)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-secondary)' }}>BGH đã ký phê duyệt điện tử sổ thi đua</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Conduct Scores BGH Board */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
            {/* Top disciplined students */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <Award size={18} color="var(--accent-secondary)" />
                <span>Bảng Vàng Thi Đua Cá Nhân (Top rèn luyện)</span>
              </h2>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Học Sinh</th>
                    <th>Lớp</th>
                    <th>Điểm Rèn Luyện</th>
                    <th>Xếp Loại</th>
                  </tr>
                </thead>
                <tbody>
                  {topConduct.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600 }}>{item.student.name}</td>
                      <td><span className="badge badge-success">Lớp {item.student.class}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{item.score}</td>
                      <td><span className="badge badge-success">Tốt</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Disciplined warning lists */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <XCircle size={18} color="var(--accent-danger)" />
                <span>Nhật ký rèn luyện cần lưu ý (Dưới 100 điểm)</span>
              </h2>
              {warnedConduct.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không có học sinh nào bị trừ điểm rèn luyện.
                </div>
              ) : (
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Học Sinh</th>
                      <th>Lớp</th>
                      <th>Điểm Hiện Tại</th>
                      <th>Nhật ký gần nhất</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warnedConduct.map((item, idx) => {
                      const logs = conductLogs.filter(l => l.studentId === item.student.id);
                      const lastLog = logs.length > 0 ? logs[logs.length - 1] : { reason: 'Chưa có' };
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.student.name}</td>
                          <td><span className="badge badge-danger">Lớp {item.student.class}</span></td>
                          <td style={{ fontWeight: 700, color: 'var(--accent-danger)' }}>{item.score}</td>
                          <td style={{ fontSize: '0.85rem', maxWidth: '160px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={lastLog.reason}>
                            {lastLog.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Căng tin & Sức khỏe Tâm lý Học đường */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', marginTop: '20px' }}>
            {/* Canteen statistics */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <span>🍱 Báo Cáo Căng Tin & Suất Ăn Bán Trú</span>
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SUẤT ĂN ĐÃ ĐĂNG KÝ</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: '4px' }}>
                    {(cafeteriaRegistrations || []).length} suất ăn
                  </div>
                </div>
                <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '12px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TỔNG DƯ VÍ HỌC SINH</span>
                  <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                      Object.values(studentWallets || {}).reduce((sum, w) => sum + (w.balance || 0), 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Menu and feedback summary */}
              <div style={{ fontSize: '0.85rem' }}>
                <strong style={{ display: 'block', marginBottom: '8px' }}>Nhận xét/Đánh giá suất ăn từ học sinh:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                  {(cafeteriaFeedback && cafeteriaFeedback.length > 0) ? (
                    cafeteriaFeedback.map((fb, idx) => (
                      <div key={idx} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.04)', padding: '8px 12px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600 }}>
                          <span>{fb.studentName || 'Học sinh'}</span>
                          <span style={{ color: '#f59e0b' }}>{'★'.repeat(fb.rating)}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{fb.comment}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Chưa có phản hồi món ăn nào.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Stress level distribution */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <span>🧠 Chỉ Số Sức Khỏe Tâm Lý & Stress Học Đường</span>
              </h2>

              {/* Stress logs count */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Phân bổ Stress học sinh toàn trường:</span>
                <span className="badge badge-info">{(wellnessLogs || []).length} lượt ghi nhận</span>
              </div>

              {/* Progress stress bar charts */}
              {(() => {
                const logs = wellnessLogs || [];
                const highStress = logs.filter(l => l.stressLevel >= 7).length;
                const midStress = logs.filter(l => l.stressLevel >= 4 && l.stressLevel < 7).length;
                const lowStress = logs.filter(l => l.stressLevel < 4).length;
                const total = logs.length || 1;

                const highPct = Math.round((highStress / total) * 100);
                const midPct = Math.round((midStress / total) * 100);
                const lowPct = Math.round((lowStress / total) * 100);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>Căng thẳng cao (Stress 7-10)</span>
                        <strong>{highStress} HS ({highPct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${highPct}%`, height: '100%', background: '#ef4444', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>Áp lực trung bình (Stress 4-6)</span>
                        <strong>{midStress} HS ({midPct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${midPct}%`, height: '100%', background: '#f59e0b', borderRadius: '4px' }} />
                      </div>
                    </div>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>Tâm trạng thoải mái (Stress 1-3)</span>
                        <strong>{lowStress} HS ({lowPct}%)</strong>
                      </div>
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${lowPct}%`, height: '100%', background: '#10b981', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Consultation queue */}
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '12px' }}>
                <strong style={{ fontSize: '0.82rem', display: 'block', marginBottom: '6px' }}>Lịch hẹn tư vấn tâm lý đang chờ duyệt:</strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(wellnessAppointments && wellnessAppointments.filter(a => a.status === 'pending').length > 0) ? (
                    wellnessAppointments.filter(a => a.status === 'pending').map((app, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', border: '1px solid rgba(0,0,0,0.04)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.78rem' }}>
                        <span>Lịch ngày {app.date.split('-').reverse().join('/')} ({app.timeSlot})</span>
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>Đang chờ</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Không có ca tư vấn nào đang chờ.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* AI Academic & Operational Risk Prediction */}
          <div style={{ marginTop: '24px' }}>
            <AIRiskPanel />
          </div>
        </div>
      )}

      {/* Finance manager view */}
      {subTab === 'finance' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '20px' }}>
          {/* Create Fee Form */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25rem' }}>
              <Wallet size={18} color="var(--accent-primary)" />
              <span>Ban hành Khoản thu mới</span>
            </h2>

            <form onSubmit={handleCreateFeeSubmit}>
              <div className="form-group">
                <label className="form-label">Tên khoản thu chi tiết</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={feeName}
                  onChange={e => setFeeName(e.target.value)}
                  placeholder="Ví dụ: Tiền đồng phục hè khối 12..."
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Số tiền đóng góp (VND)</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={feeAmount}
                  onChange={e => setFeeAmount(e.target.value)}
                  placeholder="Ví dụ: 350000"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Đối tượng thu học phí</label>
                <select 
                  className="form-control"
                  value={feeClass}
                  onChange={e => setFeeClass(e.target.value)}
                >
                  <option value="All">Toàn bộ học sinh trường</option>
                  <option value="12A1">Riêng lớp 12A1</option>
                  <option value="12A2">Riêng lớp 12A2</option>
                  <option value="11A1">Riêng lớp 11A1</option>
                  <option value="10A1">Riêng lớp 10A1</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Hạn đóng tiền</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={feeDeadline}
                  onChange={e => setFeeDeadline(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Ban hành thông báo nộp phí</button>
            </form>
          </div>

          {/* Active Ledger table */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25rem' }}>
              <FileSpreadsheet size={18} color="var(--accent-primary)" />
              <span>Sổ thu tài chính học phí toàn trường</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {financeLedger.map((item, idx) => {
                const collectPct = item.expected > 0 ? Math.round((item.collected / item.expected) * 100) : 0;
                return (
                  <div key={idx} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.95rem' }}>{item.name}</strong>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mức đóng: {formatCurrency(item.amount)}</span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      <span>Đã thu: {formatCurrency(item.collected)} ({collectPct}%)</span>
                      <span>Chưa đóng: {formatCurrency(item.unpaid)}</span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ 
                        width: `${collectPct}%`, 
                        height: '100%', 
                        background: 'linear-gradient(to right, var(--accent-primary), #3b82f6)',
                        borderRadius: '99px' 
                      }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Announcements & Q&A Oversight tab */}
      {subTab === 'qa_notices' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          {/* Post notification */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Megaphone size={18} color="var(--accent-primary)" />
              <span>Đăng thông báo khẩn</span>
            </h2>
            <form onSubmit={handleAnnounceSubmit}>
              <div className="form-group">
                <label className="form-label">Tiêu đề thông báo</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={annTitle}
                  onChange={e => setAnnTitle(e.target.value)}
                  placeholder="Nhập tiêu đề..." 
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Nội dung chi tiết</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={annContent}
                  onChange={e => setAnnContent(e.target.value)}
                  placeholder="Nhập nội dung..." 
                  style={{ resize: 'none' }}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Phát hành thông báo</button>
            </form>
          </div>

          {/* Q&A School-wide oversight */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '1.25rem' }}>
              <MessageSquare size={18} color="var(--accent-primary)" />
              <span>Giám sát hỏi đáp phụ huynh toàn trường ({parentQAs.length})</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {parentQAs.map(qa => (
                <div key={qa.id} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-card)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    <span>PH em <strong>{qa.studentName}</strong> • {qa.parentName}</span>
                    <span className={`badge ${qa.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                      {qa.status === 'pending' ? 'Đang chờ' : 'Đã phản hồi'}
                    </span>
                  </div>

                  <p style={{ fontWeight: 500, fontSize: '0.9rem', marginBottom: '10px' }}>{qa.question}</p>

                  {qa.reply ? (
                    <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.04)', borderLeft: '3px solid var(--accent-secondary)', borderRadius: '6px', fontSize: '0.85rem' }}>
                      {qa.reply}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="BGH trả lời thay giáo viên..." 
                        value={qaReplies[qa.id] || ''}
                        onChange={e => setQaReplies({...qaReplies, [qa.id]: e.target.value})}
                        style={{ fontSize: '0.8rem' }}
                      />
                      <button onClick={() => handleOverrideAnswerQA(qa.id)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }}>Phản hồi</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Leave Approval school-wide tab */}
      {subTab === 'leaves' && (
        <div className="glass-panel animate-fade">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <span>Phê Duyệt Đơn Nghỉ Phép Toàn Trường</span>
          </h2>

          {/* Segmented Control / Tabs */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <button 
              onClick={() => setLeaveTab('student')} 
              className={`btn ${leaveTab === 'student' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px' }}
            >
              Nghỉ Phép Học Sinh ({leaveRequests ? leaveRequests.filter(l => l.status === 'pending').length : 0})
            </button>
            <button 
              onClick={() => setLeaveTab('teacher')} 
              className={`btn ${leaveTab === 'teacher' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 16px', fontSize: '0.9rem', borderRadius: '8px' }}
            >
              Nghỉ Phép Giáo Viên ({teacherLeaveRequests ? teacherLeaveRequests.filter(l => l.status === 'pending').length : 0})
            </button>
          </div>

          {leaveTab === 'student' ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Học Sinh</th>
                    <th>Lớp</th>
                    <th>Phụ Huynh</th>
                    <th>Ngày Xin Nghỉ</th>
                    <th>Lý Do Xin Nghỉ</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác BGH</th>
                  </tr>
                </thead>
                <tbody>
                  {!leaveRequests || leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        Không có đơn nghỉ phép nào được gửi.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map(leave => (
                      <tr key={leave.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{leave.id}</td>
                        <td style={{ fontWeight: 600 }}>{leave.studentName}</td>
                        <td><span className="badge badge-success">Lớp {leave.class}</span></td>
                        <td>{leave.parentName}</td>
                        <td style={{ fontWeight: 600 }}>{leave.date}</td>
                        <td style={{ maxWidth: '280px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={leave.reason}>
                          {leave.reason}
                        </td>
                        <td>
                          <span className={`badge ${
                            leave.status === 'pending' 
                              ? 'badge-warning' 
                              : leave.status === 'approved' 
                              ? 'badge-success' 
                              : 'badge-danger'
                          }`}>
                            {leave.status === 'pending' && 'Đang chờ duyệt'}
                            {leave.status === 'approved' && 'BGH Đã đồng ý'}
                            {leave.status === 'rejected' && 'BGH Từ chối'}
                          </span>
                        </td>
                        <td>
                          {leave.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                onClick={() => handleBghLeaveApproval(leave.id, 'approved')} 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e2f8f0', color: '#0f766e', borderColor: '#ccfbf1', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Check size={12} /> Duyệt
                              </button>
                              <button 
                                onClick={() => handleBghLeaveApproval(leave.id, 'rejected')} 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <X size={12} /> Từ chối
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Giáo Viên</th>
                    <th>Môn Học</th>
                    <th>Lớp CN</th>
                    <th>Giáo Viên Dạy Thay</th>
                    <th>Ngày Nghỉ</th>
                    <th>Lý Do</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác BGH</th>
                  </tr>
                </thead>
                <tbody>
                  {!teacherLeaveRequests || teacherLeaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                        Không có đơn xin nghỉ phép nào từ giáo viên.
                      </td>
                    </tr>
                  ) : (
                    teacherLeaveRequests.map(req => {
                      const originalTeacher = teachers.find(t => t.id === req.teacherId);
                      return (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{req.id}</td>
                          <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                          <td>{originalTeacher ? originalTeacher.subject : 'N/A'}</td>
                          <td><span className="badge badge-info">Lớp {originalTeacher ? originalTeacher.classJoined : 'N/A'}</span></td>
                          <td style={{ fontWeight: 600 }}>{req.substituteTeacherName}</td>
                          <td style={{ fontWeight: 600 }}>{req.date}</td>
                          <td style={{ maxWidth: '240px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={req.reason}>
                            {req.reason}
                          </td>
                          <td>
                            <span className={`badge ${
                              req.status === 'pending' 
                                ? 'badge-warning' 
                                : req.status === 'approved' 
                                ? 'badge-success' 
                                : 'badge-danger'
                            }`}>
                              {req.status === 'pending' && 'Đang chờ duyệt'}
                              {req.status === 'approved' && 'BGH Đã duyệt'}
                              {req.status === 'rejected' && 'BGH Từ chối'}
                            </span>
                          </td>
                          <td>
                            {req.status === 'pending' ? (
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button 
                                  onClick={() => handleBghTeacherLeaveApproval(req.id, 'approved')} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e2f8f0', color: '#0f766e', borderColor: '#ccfbf1', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Check size={12} /> Duyệt
                                </button>
                                <button 
                                  onClick={() => handleBghTeacherLeaveApproval(req.id, 'rejected')} 
                                  className="btn btn-secondary" 
                                  style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <X size={12} /> Từ chối
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Đã xử lý</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Lesson plans BGH review tab */}
      {subTab === 'lesson_plans' && (
        <div className="glass-panel animate-fade">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <BookOpen size={18} color="var(--accent-primary)" />
            <span>Phê Duyệt Giáo Án Giáo Viên Toàn Trường</span>
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Mã GA</th>
                  <th>Giáo Viên</th>
                  <th>Bộ Môn</th>
                  <th>Tên Giáo Án</th>
                  <th>Ngày Nộp</th>
                  <th>Trạng Thái</th>
                  <th>Ý kiến BGH</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {!lessonPlans || lessonPlans.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      Không có giáo án nào được nộp.
                    </td>
                  </tr>
                ) : (
                  lessonPlans.map(plan => (
                    <tr key={plan.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{plan.id}</td>
                      <td style={{ fontWeight: 600 }}>{plan.teacherName}</td>
                      <td><span className="badge badge-info">{plan.subject}</span></td>
                      <td style={{ fontWeight: 600 }}>{plan.title}</td>
                      <td>{plan.date}</td>
                      <td>
                        <span className={`badge ${
                          plan.status === 'pending' 
                            ? 'badge-warning' 
                            : plan.status === 'approved' 
                            ? 'badge-success' 
                            : 'badge-danger'
                        }`}>
                          {plan.status === 'pending' && 'Chờ kiểm duyệt'}
                          {plan.status === 'approved' && 'Đã phê duyệt'}
                          {plan.status === 'rejected' && 'Yêu cầu sửa đổi'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={plan.feedback || 'Chưa có ý kiến'}>
                        {plan.feedback || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có</span>}
                      </td>
                      <td>
                        {plan.status === 'pending' ? (
                          <button 
                            onClick={() => { setSelectedPlan({ plan, status: 'approved' }); setPlanFeedback(''); }} 
                            className="btn btn-primary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          >
                            Duyệt & Góp ý
                          </button>
                        ) : (
                          <button 
                            onClick={() => { setSelectedPlan({ plan, status: plan.status }); setPlanFeedback(plan.feedback); }} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          >
                            Xem & Sửa
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lesson Plan Review Modal */}
      {selectedPlan && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Đánh giá & Phê duyệt Giáo án</h2>
            
            <div style={{ background: 'rgba(79, 70, 229, 0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(79, 70, 229, 0.1)', marginBottom: '18px', fontSize: '0.9rem', color: '#1e293b' }}>
              <div>Giáo viên nộp: <strong>{selectedPlan.plan.teacherName}</strong></div>
              <div>Bộ môn: <strong>{selectedPlan.plan.subject}</strong></div>
              <div>Tên bài học: <strong>{selectedPlan.plan.title}</strong></div>
              <div>Ngày nộp: <strong>{selectedPlan.plan.date}</strong></div>
            </div>

            <form onSubmit={handleReviewSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn hành động duyệt</label>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '14px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="review_status" 
                      checked={selectedPlan.status === 'approved'} 
                      onChange={() => setSelectedPlan({ ...selectedPlan, status: 'approved' })} 
                    />
                    <span style={{ color: 'var(--accent-secondary)', fontWeight: 600 }}>Phê duyệt giáo án</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="review_status" 
                      checked={selectedPlan.status === 'rejected'} 
                      onChange={() => setSelectedPlan({ ...selectedPlan, status: 'rejected' })} 
                    />
                    <span style={{ color: 'var(--accent-danger)', fontWeight: 600 }}>Yêu cầu sửa đổi</span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nhận xét, đóng góp ý kiến (Feedback)</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={planFeedback}
                  onChange={e => setPlanFeedback(e.target.value)}
                  placeholder="Nhập nội dung nhận xét chi tiết, góp ý nâng cao chất lượng bài giảng..." 
                  style={{ resize: 'none', background: 'white', color: '#1e293b', borderColor: '#cbd5e1' }}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setSelectedPlan(null)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Xác nhận đánh giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Ratings subtab pane */}
      {subTab === 'teacher_ratings' && (
        <div className="glass-panel animate-fade">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <Award size={18} color="var(--accent-primary)" />
            <span>Kết quả Đánh giá Giáo viên từ Phụ huynh & Học sinh</span>
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Mã GV</th>
                  <th>Ảnh</th>
                  <th>Họ và Tên</th>
                  <th>Bộ Môn Phụ Trách</th>
                  <th>Điểm Đánh Giá trung bình</th>
                  <th>Số Phiếu Khảo Sát</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map(teacher => {
                  const evals = teacherEvaluations ? teacherEvaluations.filter(e => e.teacherId === teacher.id) : [];
                  const avgRating = evals.length > 0 
                    ? (evals.reduce((sum, e) => sum + e.rating, 0) / evals.length).toFixed(1) 
                    : '0.0';
                  
                  return (
                    <tr key={teacher.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{teacher.id}</td>
                      <td>
                        <img 
                          src={teacher.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'} 
                          alt={teacher.name} 
                          style={{ 
                            width: '38px', 
                            height: '38px', 
                            borderRadius: '50%', 
                            objectFit: 'cover', 
                            border: '2px solid rgba(79, 70, 229, 0.1)'
                          }} 
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>{teacher.name}</td>
                      <td><span className="badge badge-info">{teacher.subject}</span></td>
                      <td>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#f59e0b' }}>
                          ⭐ {avgRating} / 5.0
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{evals.length} phiếu</td>
                      <td>
                        <button 
                          onClick={() => setSelectedTeacherForRating({ teacher, evals })} 
                          className="btn btn-primary" 
                          style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                        >
                          Xem nhận xét
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {subTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
          {/* Stats Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG SỐ BÀI TẬP ĐÃ GIAO</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>{assignments ? assignments.length : 0} bài tập</div>
              </div>
              <div className="stat-icon"><BookOpen size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỔNG BÀI LÀM HỌC SINH NỘP</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>{submissions ? submissions.length : 0} lượt nộp</div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'var(--accent-secondary-glow)' }}><CheckCircle size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>TỶ LỆ HOÀN THÀNH BÀI</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>
                  {(() => {
                    const totalExpected = (assignments || []).reduce((sum, curr) => {
                      const classSize = students.filter(s => s.class === curr.classTarget).length;
                      return sum + classSize;
                    }, 0);
                    const totalSubmitted = submissions ? submissions.length : 0;
                    return totalExpected > 0 ? `${Math.round((totalSubmitted / totalExpected) * 100)}%` : '0%';
                  })()}
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)' }}><TrendingUp size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ĐIỂM TRUNG BÌNH BÀI LÀM</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>
                  {(() => {
                    const graded = submissions ? submissions.filter(s => s.status === 'graded') : [];
                    return graded.length > 0 ? `${(graded.reduce((sum, curr) => sum + curr.grade, 0) / graded.length).toFixed(1)} / 10` : '—';
                  })()}
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-info)', background: 'rgba(14, 165, 233, 0.1)' }}><Award size={20} /></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            {/* List of assignments across the school */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Danh sách bài tập toàn trường</h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {assignments && assignments.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Chưa có bài tập nào được tạo trên toàn hệ thống.
                  </div>
                ) : (
                  assignments && assignments.map(a => {
                    const subs = submissions ? submissions.filter(s => s.assignmentId === a.id) : [];
                    const classSize = students.filter(s => s.class === a.classTarget).length;
                    const pct = classSize > 0 ? Math.round((subs.length / classSize) * 100) : 0;

                    return (
                      <div key={a.id} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-card)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                          <span className="badge badge-info">{a.classTarget} - {a.subject}</span>
                          <span style={{ color: 'var(--text-muted)' }}>Hạn nộp: {a.deadline}</span>
                        </div>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '6px 0' }}>{a.title}</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                          <span>Giao bởi: {a.teacherName}</span>
                          <span>Đã nộp: {subs.length}/{classSize} ({pct}%)</span>
                        </div>
                        {/* mini completion progress bar */}
                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden', marginTop: '8px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-primary)', borderRadius: '99px' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Submissions stats breakdown by subjects */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Thống kê chi tiết môn học</h2>
              
              {(() => {
                const subjectStats = {};
                (assignments || []).forEach(a => {
                  if (!subjectStats[a.subject]) {
                    subjectStats[a.subject] = { subject: a.subject, assignmentsCount: 0, submissionsCount: 0, expectedCount: 0, gradesSum: 0, gradedCount: 0 };
                  }
                  subjectStats[a.subject].assignmentsCount++;
                  const classSize = students.filter(s => s.class === a.classTarget).length;
                  subjectStats[a.subject].expectedCount += classSize;
                  
                  const subs = submissions ? submissions.filter(s => s.assignmentId === a.id) : [];
                  subjectStats[a.subject].submissionsCount += subs.length;
                  
                  subs.forEach(s => {
                    if (s.status === 'graded') {
                      subjectStats[a.subject].gradesSum += s.grade;
                      subjectStats[a.subject].gradedCount++;
                    }
                  });
                });

                const statsList = Object.values(subjectStats);
                if (statsList.length === 0) {
                  return (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Chưa có dữ liệu thống kê môn học.
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {statsList.map(stat => {
                      const completionRate = stat.expectedCount > 0 ? Math.round((stat.submissionsCount / stat.expectedCount) * 100) : 0;
                      const avgGrade = stat.gradedCount > 0 ? (stat.gradesSum / stat.gradedCount).toFixed(1) : '—';
                      
                      return (
                        <div key={stat.subject} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{stat.subject}</strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stat.assignmentsCount} bài đã giao</span>
                          </div>
                          
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            <div>
                              <span>Tỷ lệ hoàn thành:</span>
                              <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1.05rem', marginTop: '2px' }}>{completionRate}%</div>
                            </div>
                            <div>
                              <span>Điểm trung bình bài làm:</span>
                              <div style={{ fontWeight: 700, color: 'var(--accent-secondary)', fontSize: '1.05rem', marginTop: '2px' }}>{avgGrade} / 10</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MOCK EXAMS MONITOR TAB */}
      {subTab === 'mock_exams' && (
        <div className="animate-fade">
          
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="glass-panel stat-card" style={{ background: 'white' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>LƯỢT THI TOÀN TRƯỜNG</span>
                <div style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  {allAttempts.length} lượt
                </div>
              </div>
              <div className="stat-icon"><ClipboardList size={24} /></div>
            </div>

            <div className="glass-panel stat-card" style={{ background: 'white' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ĐIỂM TRUNG BÌNH CHUNG</span>
                <div style={{ fontSize: '2rem', marginTop: '6px', color: '#10b981', fontWeight: 'bold' }}>
                  {(() => {
                    if (allAttempts.length === 0) return '0.0';
                    const sum = allAttempts.reduce((acc, curr) => acc + curr.score, 0);
                    return (sum / allAttempts.length).toFixed(1);
                  })()}/10
                </div>
              </div>
              <div className="stat-icon"><Award size={24} /></div>
            </div>

            <div className="glass-panel stat-card" style={{ background: 'white' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>THỦ KHOA LÂM THỜI</span>
                <div style={{ fontSize: '2rem', marginTop: '6px', color: '#f59e0b', fontWeight: 'bold' }}>
                  {(() => {
                    if (allAttempts.length === 0) return '0.0';
                    return Math.max(...allAttempts.map(h => h.score)).toFixed(1);
                  })()}/10
                </div>
              </div>
              <div className="stat-icon"><Award size={24} /></div>
            </div>
          </div>

          {/* SVG Comparison & Top Scorers Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            
            {/* Class comparison SVG chart */}
            <div className="glass-panel" style={{ padding: '24px', background: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>
                So sánh Điểm trung bình thi thử giữa các Lớp (Khối 12)
              </h3>
              
              {(() => {
                const classes = ['12A1', '12A2'];
                const data = classes.map(c => {
                  const cAttempts = allAttempts.filter(h => h.class === c);
                  const avg = cAttempts.length > 0 
                    ? (cAttempts.reduce((acc, curr) => acc + curr.score, 0) / cAttempts.length)
                    : 0;
                  return { class: c, avg: parseFloat(avg.toFixed(1)) };
                });

                const chartWidth = 350;
                const chartHeight = 180;
                const barWidth = 60;
                const gap = 60;
                const maxVal = 10;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ maxWidth: '400px' }}>
                      {/* Grid Lines */}
                      {[0, 2, 4, 6, 8, 10].map(val => {
                        const y = chartHeight - (val / maxVal) * chartHeight;
                        return (
                          <g key={val}>
                            <line x1="40" y1={y} x2={chartWidth - 20} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                            <text x="15" y={y + 4} fontSize="9" fill="#64748b" textAnchor="middle">{val}</text>
                          </g>
                        );
                      })}

                      {/* Bars */}
                      {data.map((item, idx) => {
                        const barHeight = (item.avg / maxVal) * chartHeight;
                        const x = 70 + idx * (barWidth + gap);
                        const y = chartHeight - barHeight;
                        
                        return (
                          <g key={item.class}>
                            <defs>
                              <linearGradient id={`grad-principal-${item.class}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={item.class === '12A1' ? '#6366f1' : '#10b981'} />
                                <stop offset="100%" stopColor={item.class === '12A1' ? '#4f46e5' : '#059669'} stopOpacity="0.8" />
                              </linearGradient>
                            </defs>
                            <rect
                              x={x}
                              y={y}
                              width={barWidth}
                              height={barHeight}
                              rx="8"
                              fill={`url(#grad-principal-${item.class})`}
                            />
                            <text
                              x={x + barWidth / 2}
                              y={y - 8}
                              fontSize="11"
                              fontWeight="bold"
                              fill={item.class === '12A1' ? '#4f46e5' : '#059669'}
                              textAnchor="middle"
                            >
                              {item.avg > 0 ? item.avg.toFixed(1) : 'Chưa thi'}
                            </text>
                            <text
                              x={x + barWidth / 2}
                              y={chartHeight + 20}
                              fontSize="11"
                              fontWeight="600"
                              fill="#1e293b"
                              textAnchor="middle"
                            >
                              Lớp {item.class}
                            </text>
                          </g>
                        );
                      })}
                      
                      <line x1="40" y1={chartHeight} x2={chartWidth - 20} y2={chartHeight} stroke="#cbd5e1" strokeWidth="2" />
                    </svg>
                  </div>
                );
              })()}
            </div>

            {/* Bảng Vàng Danh Vọng (Top scorers) */}
            <div className="glass-panel" style={{ padding: '24px', background: 'white' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Award size={18} color="#f59e0b" /> Bảng Vàng Danh Vọng (Top 5 Điểm Cao)
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {topScorers.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>Chưa có lượt thi thử nào.</p>
                ) : (
                  topScorers.map((attempt, idx) => (
                    <div 
                      key={attempt.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        padding: '12px 16px', 
                        background: idx === 0 ? 'rgba(245, 158, 11, 0.06)' : '#f8fafc', 
                        borderRadius: '12px',
                        border: idx === 0 ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ 
                          width: '24px', 
                          height: '24px', 
                          borderRadius: '50%', 
                          background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#e2e8f0', 
                          color: idx <= 2 ? 'white' : '#64748b',
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          {idx + 1}
                        </span>
                        <div>
                          <strong style={{ display: 'block', color: '#1e293b', fontSize: '0.88rem' }}>{attempt.studentName}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Lớp {attempt.class} • Khối {attempt.block} • {attempt.title || 'Đề thi thử'}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: idx === 0 ? '#f59e0b' : 'var(--accent-primary)' }}>
                        {attempt.score.toFixed(1)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* School-wide attempt ledger */}
          <div className="glass-panel" style={{ padding: '24px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                Nhật ký Kết quả Thi Thử Toàn trường
              </h3>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Tìm học sinh..."
                  className="form-control"
                  value={pMockSearch}
                  onChange={e => setPMockSearch(e.target.value)}
                  style={{ width: '200px', fontSize: '0.85rem', padding: '8px 12px' }}
                />

                <select
                  className="form-control"
                  value={pMockClassFilter}
                  onChange={e => setPMockClassFilter(e.target.value)}
                  style={{ width: '120px', fontSize: '0.85rem', padding: '8px 12px' }}
                >
                  <option value="ALL">Tất cả Lớp</option>
                  <option value="12A1">Lớp 12A1</option>
                  <option value="12A2">Lớp 12A2</option>
                </select>
                
                <select
                  className="form-control"
                  value={pMockBlockFilter}
                  onChange={e => setPMockBlockFilter(e.target.value)}
                  style={{ width: '120px', fontSize: '0.85rem', padding: '8px 12px' }}
                >
                  <option value="ALL">Tất cả Khối</option>
                  <option value="A00">Khối A00</option>
                  <option value="A01">Khối A01</option>
                  <option value="B00">Khối B00</option>
                  <option value="C00">Khối C00</option>
                  <option value="D01">Khối D01</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Học sinh</th>
                    <th style={{ padding: '12px 8px' }}>Lớp</th>
                    <th style={{ padding: '12px 8px' }}>Khối thi</th>
                    <th style={{ padding: '12px 8px' }}>Tên Đề thi</th>
                    <th style={{ padding: '12px 8px' }}>Ngày thi</th>
                    <th style={{ padding: '12px 8px' }}>Thời gian</th>
                    <th style={{ padding: '12px 8px' }}>Số câu đúng</th>
                    <th style={{ padding: '12px 8px' }}>Điểm số</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = allAttempts.filter(h => {
                      const matchSearch = h.studentName.toLowerCase().includes(pMockSearch.toLowerCase());
                      const matchClass = pMockClassFilter === 'ALL' || h.class === pMockClassFilter;
                      const matchBlock = pMockBlockFilter === 'ALL' || h.block === pMockBlockFilter;
                      return matchSearch && matchClass && matchBlock;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="8" style={{ padding: '24px 8px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                            Không tìm thấy kết quả nào phù hợp.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(attempt => (
                      <tr key={attempt.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '0.88rem', color: '#1e293b' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{attempt.studentName}</td>
                        <td style={{ padding: '12px 8px' }}>{attempt.class}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                            {attempt.block}
                          </span>
                        </td>
                        <td style={{ padding: '12px 8px' }}>{attempt.title || `Đề thi Khối ${attempt.block}`}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{attempt.date.split('-').reverse().join('/')}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{attempt.timeSpent}</td>
                        <td style={{ padding: '12px 8px' }}>{attempt.correctAnswers} / {attempt.totalQuestions}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <strong style={{ 
                            color: attempt.score >= 8 ? '#10b981' : attempt.score >= 5 ? '#f59e0b' : '#ef4444',
                            fontSize: '0.95rem'
                          }}>
                            {attempt.score.toFixed(1)}
                          </strong>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Attendance Monitor subtab pane */}
      {subTab === 'attendance_monitor' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px' }}>
              <h2 style={{ marginBottom: '20px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <Activity size={18} color="var(--accent-primary)" />
                <span>Tỷ Lệ Chuyên Cần Toàn Trường Hôm Nay</span>
              </h2>
              
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="180" height="180" viewBox="0 0 180 180">
                  <defs>
                    <linearGradient id="attendance-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="var(--accent-primary)" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="14" />
                  <circle cx="90" cy="90" r="75" fill="none" stroke="url(#attendance-grad)" strokeWidth="14"
                          strokeDasharray={2 * Math.PI * 75}
                          strokeDashoffset={(2 * Math.PI * 75) * (1 - attendancePct / 100)}
                          strokeLinecap="round" transform="rotate(-90 90 90)"
                          style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                </svg>
                <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'Outfit, sans-serif' }}>
                    {attendancePct}%
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CÓ MẶT</span>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '20px', marginTop: '24px', width: '100%', justifyContent: 'space-around', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-secondary)' }}>{presentToday}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Đi học đúng giờ</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-warning)' }}>{lateToday}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vào lớp muộn</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--accent-danger)' }}>{totalStudentsCount - presentToday - lateToday}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Vắng mặt</div>
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <PieChart size={18} color="var(--accent-primary)" />
                <span>Thống Kê Tỷ Lệ Theo Lớp Học</span>
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {['12A1', '12A2', '11A1', '10A1'].map(className => {
                  const stats = getClassAttendanceStats(className);
                  return (
                    <div key={className} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Lớp {className}</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{stats.pct}% ({stats.present + stats.late}/{stats.total})</span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div style={{ width: '100%', height: '8px', background: 'rgba(0,0,0,0.04)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ 
                          width: `${stats.pct}%`, 
                          height: '100%', 
                          background: 'linear-gradient(to right, var(--accent-secondary), #3b82f6)',
                          borderRadius: '99px'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RFID SIMULATION LOGS */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Activity size={18} color="var(--accent-secondary)" />
              <span>Nhật Ký Quẹt Thẻ RFID Cổng Trường (Mô phỏng thời gian thực)</span>
            </h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Mã Học Sinh</th>
                    <th>Họ Tên</th>
                    <th>Lớp</th>
                    <th>Thời Gian Ghi Nhận</th>
                    <th>Trạng Thái</th>
                    <th>Thiết Bị Cổng</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceLogs && attendanceLogs.slice().reverse().slice(0, 10).map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{log.studentId}</td>
                      <td style={{ fontWeight: 600 }}>{log.studentName}</td>
                      <td>
                        <span className="badge badge-info">
                          Lớp {students.find(s => s.id === log.studentId)?.class || '12A1'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700 }}>{log.checkInTime}</td>
                      <td>
                        <span className={`badge ${log.status === 'present' ? 'badge-success' : 'badge-warning'}`}>
                          {log.status === 'present' ? 'Có mặt' : 'Đi muộn'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>RFID_GATE_01</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Clubs ERP Oversight subtab pane */}
      {subTab === 'clubs_erp' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CLB ĐANG HOẠT ĐỘNG</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>
                  {clubs.filter(c => c.status === 'active').length} CLB
                </div>
              </div>
              <div className="stat-icon"><Users size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>CLB ĐANG ĐỢI DUYỆT</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>
                  {clubs.filter(c => c.status === 'pending').length} đề xuất
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-warning)', background: 'rgba(245, 158, 11, 0.1)' }}><HelpCircle size={20} /></div>
            </div>

            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ĐƠN XIN GIA NHẬP ĐỢI DUYỆT</span>
                <div style={{ fontSize: '1.8rem', marginTop: '6px', fontWeight: 'bold' }}>
                  {clubApplications.filter(a => a.status === 'pending').length} đơn nộp
                </div>
              </div>
              <div className="stat-icon" style={{ color: 'var(--accent-secondary)', background: 'var(--accent-secondary-glow)' }}><CheckCircle size={20} /></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
            {/* Club proposals and budget oversight */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <Wallet size={18} color="var(--accent-primary)" />
                <span>Danh Sách Đề Xuất & Cấp Ngân Sách CLB</span>
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {clubs.map(club => (
                  <div key={club.id} style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '1.05rem' }}>{club.name}</strong>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{club.desc}</p>
                      </div>
                      <span className={`badge ${club.status === 'active' ? 'badge-success' : 'badge-warning'}`}>
                        {club.status === 'active' ? 'Đang hoạt động' : 'Chờ cấp ngân sách'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '12px 0 16px 0', padding: '10px 0', borderTop: '1px dashed var(--border-card)', borderBottom: '1px dashed var(--border-card)' }}>
                      <div>Thành viên: <strong style={{ color: 'var(--text-primary)' }}>{club.membersCount} học sinh</strong></div>
                      <div>Dự trù đề xuất: <strong style={{ color: 'var(--accent-primary)' }}>{formatCurrency(club.budgetExpected)}</strong></div>
                      {club.budgetApproved > 0 && (
                        <div>Ngân sách phê chuẩn: <strong style={{ color: 'var(--accent-secondary)' }}>{formatCurrency(club.budgetApproved)}</strong></div>
                      )}
                    </div>

                    {club.status === 'pending' || club.budgetApproved === 0 ? (
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input 
                            type="number" 
                            className="form-control" 
                            placeholder="Số tiền cấp duyệt (VND)..."
                            value={clubBudgets[club.id] || ''}
                            onChange={e => setClubBudgets({...clubBudgets, [club.id]: e.target.value})}
                            style={{ paddingRight: '45px', fontSize: '0.9rem' }}
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const val = clubBudgets[club.id];
                            if (!val || val <= 0) return alert('Vui lòng nhập số tiền hợp lệ!');
                            approveClubBudget(club.id, parseFloat(val));
                            setClubBudgets(prev => ({ ...prev, [club.id]: '' }));
                            alert(`Đã duyệt thành lập và cấp ngân sách ${formatCurrency(val)} cho ${club.name}!`);
                          }} 
                          className="btn btn-primary"
                          style={{ padding: '8px 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                        >
                          Duyệt & Cấp Ngân Sách
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-secondary)', fontWeight: 600 }}>
                        <CheckCircle size={14} /> CLB đã được phê duyệt và giải ngân hoạt động.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Club student applications review */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <CheckCircle size={18} color="var(--accent-secondary)" />
                <span>Xét Duyệt Học Sinh Gia Nhập CLB</span>
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {clubApplications.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không có đơn gia nhập câu lạc bộ nào cần xử lý.
                  </div>
                ) : (
                  clubApplications.map(app => (
                    <div key={app.id} style={{ padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-card)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{app.studentName}</strong>
                        <span className={`badge ${app.status === 'pending' ? 'badge-warning' : app.status === 'approved' ? 'badge-success' : 'badge-danger'}`}>
                          {app.status === 'pending' && 'Đang chờ'}
                          {app.status === 'approved' && 'Đã đồng ý'}
                          {app.status === 'rejected' && 'Đã từ chối'}
                        </span>
                      </div>
                      
                      <div style={{ fontSize: '0.85rem', margin: '6px 0' }}>
                        Đăng ký tham gia: <strong style={{ color: 'var(--accent-primary)' }}>{app.clubName}</strong>
                      </div>
                      
                      <p style={{ fontStyle: 'italic', fontSize: '0.85rem', background: 'rgba(0,0,0,0.02)', padding: '8px', borderRadius: '6px', margin: '8px 0', color: '#475569' }}>
                        "{app.introduction}"
                      </p>

                      {app.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                          <button 
                            onClick={() => {
                              reviewClubApplication(app.id, 'approved');
                              alert(`Đã duyệt đồng ý cho học sinh ${app.studentName} gia nhập CLB!`);
                            }}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: '#e2f8f0', color: '#0f766e', borderColor: '#ccfbf1' }}
                          >
                            Chấp thuận
                          </button>
                          <button 
                            onClick={() => {
                              reviewClubApplication(app.id, 'rejected');
                              alert(`Đã từ chối đơn gia nhập CLB của học sinh ${app.studentName}!`);
                            }}
                            className="btn btn-secondary"
                            style={{ flex: 1, padding: '6px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca' }}
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Counselor and Career Guidance Psychology Report subtab pane */}
      {subTab === 'career_psychology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
            
            {/* RIASEC vertical SVG column chart */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <Compass size={18} color="var(--accent-primary)" />
                <span>Báo Cáo Phân Bổ Định Hướng Nghề Nghiệp RIASEC Toàn Trường</span>
              </h2>
              
              <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '16px 12px 10px 12px', borderRadius: '12px', border: '1px solid var(--border-card)' }}>
                <svg width="100%" height="240" viewBox="0 0 600 240" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="grad-r" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" /><stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" /></linearGradient>
                    <linearGradient id="grad-i" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" /><stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" /></linearGradient>
                    <linearGradient id="grad-a" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" /><stop offset="100%" stopColor="#a855f7" stopOpacity="0.9" /></linearGradient>
                    <linearGradient id="grad-s" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#10b981" stopOpacity="0.4" /><stop offset="100%" stopColor="#10b981" stopOpacity="0.9" /></linearGradient>
                    <linearGradient id="grad-e" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.9" /></linearGradient>
                    <linearGradient id="grad-c" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#64748b" stopOpacity="0.4" /><stop offset="100%" stopColor="#64748b" stopOpacity="0.9" /></linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0, 1, 2, 3].map((val, idx) => {
                    const y = 200 - val * 55;
                    return (
                      <g key={idx}>
                        <line x1="40" y1={y} x2="560" y2={y} stroke="rgba(0,0,0,0.04)" strokeDasharray="4 4" />
                        <text x="30" y={y + 4} fontSize="10" fill="var(--text-secondary)" textAnchor="end">{val}</text>
                      </g>
                    );
                  })}

                  {/* X axis line */}
                  <line x1="40" y1="200" x2="560" y2="200" stroke="var(--border-card)" strokeWidth="1.5" />

                  {/* Columns */}
                  {['R', 'I', 'A', 'S', 'E', 'C'].map((cat, idx) => {
                    const label = { R: 'Realistic', I: 'Investigative', A: 'Artistic', S: 'Social', E: 'Enterprising', C: 'Conventional' }[cat];
                    const count = riasecCounts[cat] || (cat === 'I' ? 1 : 0); // fallback mock value to show visually if low data
                    const barHeight = count * 55;
                    const x = 70 + idx * 82;
                    const y = 200 - barHeight;

                    return (
                      <g key={cat} style={{ transition: 'all 0.3s ease' }}>
                        <rect 
                          x={x} 
                          y={y} 
                          width="46" 
                          height={barHeight} 
                          fill={`url(#grad-${cat.toLowerCase()})`} 
                          rx="6" 
                          ry="6"
                        />
                        {/* Count text label above bar */}
                        {count > 0 && (
                          <text x={x + 23} y={y - 8} textAnchor="middle" fontSize="12" fontWeight="bold" fill="var(--text-primary)">
                            {count} HS
                          </text>
                        )}
                        <text x={x + 23} y="218" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">
                          {cat}
                        </text>
                        <text x={x + 23} y="230" textAnchor="middle" fontSize="8" fill="var(--text-secondary)">
                          {label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div style={{ marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.01)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                <strong>Chú thích RIASEC:</strong> 
                <span style={{ marginLeft: '6px' }}>
                  <strong>R</strong>: Thực tế | <strong>I</strong>: Nghiên cứu | <strong>A</strong>: Nghệ thuật | <strong>S</strong>: Xã hội | <strong>E</strong>: Quản lý | <strong>C</strong>: Nghiệp vụ nghiệp vụ.
                </span>
              </div>
            </div>

            {/* AI Stress and counselor oversight report */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <Briefcase size={18} color="var(--accent-secondary)" />
                <span>Nhật Ký Tư Vấn AI Counselor & Chỉ Số Áp Lực Học Đường</span>
              </h2>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { name: 'Nguyễn Hoàng Nam', class: '12A1', stress: 'Mức độ áp lực: Trung bình (6/10)', topic: 'Lo âu chuẩn bị thi Tốt Nghiệp THPT & Đại Học', status: 'Đang theo dõi', statusColor: 'badge-warning', summary: 'Nam đã thực hiện 3 phiên tư vấn AI Counselor về việc phân bổ thời gian tự học và phương pháp giải tỏa áp lực thi cử. AI khuyên học sinh nên nghỉ ngơi sau mỗi 45 phút học.' },
                  { name: 'Lê Mai Chi', class: '12A1', stress: 'Mức độ áp lực: Thấp (3/10)', topic: 'Cân bằng giữa các hoạt động ngoại khóa & học tập', status: 'Ổn định', statusColor: 'badge-success', summary: 'Đã hoàn thành bảng hỏi RIASEC và nhận gợi ý nghề nghiệp thuộc nhóm I (Nghiên cứu) & A (Nghệ thuật). Đang điều phối tốt hoạt động CLB Robotics.' },
                  { name: 'Phan Minh Triết', class: '12A1', stress: 'Mức độ áp lực: Khá cao (8/10)', topic: 'Mâu thuẫn định hướng ngành nghề với phụ huynh', status: 'Cần can thiệp', statusColor: 'badge-danger', summary: 'Học sinh chia sẻ áp lực lớn từ kỳ vọng gia đình. Đề xuất GVCN/Chuyên gia tâm lý học đường liên hệ tư vấn trực tiếp trực tiếp với phụ huynh để tháo gỡ.' }
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name} ({item.class})</span>
                      <span className={`badge ${item.statusColor}`} style={{ fontSize: '0.75rem' }}>{item.status}</span>
                    </div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                      {item.stress}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Chuyên đề: <strong>{item.topic}</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', lineHeight: '1.4', color: '#475569', background: 'white', padding: '8px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.03)' }}>
                      {item.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            
          </div>
        </div>
      )}

      {/* Teacher Ratings Details Modal */}
      {selectedTeacherForRating && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: '600px' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Ý kiến khảo sát: Thầy/Cô {selectedTeacherForRating.teacher.name}</h2>

            <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', paddingRight: '6px' }}>
              {selectedTeacherForRating.evals.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có nhận xét nào cho giáo viên này.
                </div>
              ) : (
                selectedTeacherForRating.evals.map(ev => (
                  <div key={ev.id} style={{ padding: '14px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.02)', border: '1px solid rgba(0,0,0,0.06)', color: '#1e293b' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                        {ev.raterName} 
                        <span className={`badge ${ev.raterRole === 'student' ? 'badge-success' : 'badge-info'}`} style={{ marginLeft: '8px', fontSize: '0.75rem' }}>
                          {ev.raterRole === 'student' ? 'Học sinh' : 'Phụ huynh'}
                        </span>
                      </span>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        {'⭐'.repeat(ev.rating)}
                      </span>
                    </div>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem', margin: '8px 0 4px 0', color: '#334155' }}>
                      "{ev.comment}"
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ngày gửi: {ev.date}</span>
                  </div>
                ))
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedTeacherForRating(null)} 
                className="btn btn-secondary" 
                style={{ padding: '10px 24px' }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
