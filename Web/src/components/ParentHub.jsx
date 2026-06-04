import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  FileText, 
  CreditCard, 
  CheckCircle, 
  AlertTriangle,
  Signature,
  RotateCcw,
  Send,
  MessageCircle,
  Calendar,
  Award,
  BookOpen,
  Sparkles,
  Utensils
} from 'lucide-react';
import VietQRPayment from './VietQRPayment';


export default function ParentHub({ activeTab, setActiveTab }) {
  const { 
    selectedStudentId, 
    students, 
    parentQAs, 
    signParentReport, 
    askParentQuestion,
    submitLeaveRequest,
    leaveRequests,
    teachers,
    conductLogs,
    teacherEvaluations,
    submitTeacherEvaluation,
    assignments,
    submissions,
    attendanceLogs,
    careerTestScores,
    cafeteriaMenu,
    cafeteriaRegistrations,
    cafeteriaFeedback,
    studentWallets,
    registerCafeteriaMeal,
    cancelCafeteriaMeal,
    topUpStudentWallet,
    updateStudentWalletLimit,
    wellnessLogs
  } = useContext(AppContext);

  // Declare all hooks at the very top level
  const [activeSubTab, setActiveSubTab] = useState('grades'); // grades, fees, qa, leaves, evaluations

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === 'dashboard') {
        setActiveSubTab('grades');
      } else if (activeTab === 'fees') {
        setActiveSubTab('fees');
      } else if (activeTab === 'qas') {
        setActiveSubTab('qa');
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const [showPayModal, setShowPayModal] = useState(null); // fee object if active
  const [qaInput, setQaInput] = useState('');
  const [leaveDate, setLeaveDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  // Part 8 States: Smart Cafeteria & Wallet
  const [topUpAmount, setTopUpAmount] = useState(200000);
  const [limitInput, setLimitInput] = useState(100000);
  const [regDate, setRegDate] = useState('2026-06-04');
  const [regMealType, setRegMealType] = useState('Standard');
  const [payViaWalletOption, setPayViaWalletOption] = useState(true);

  // Teacher Evaluation states
  const [evalTeacherId, setEvalTeacherId] = useState(teachers && teachers.length > 0 ? teachers[0].id : '');
  const [evalRating, setEvalRating] = useState(5);
  const [evalComment, setEvalComment] = useState('');
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Active student and parent data
  const student = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  const handleSubTabChange = (tab) => {
    setActiveSubTab(tab);
    if (setActiveTab) {
      if (tab === 'grades') {
        setActiveTab('dashboard');
      } else if (tab === 'fees') {
        setActiveTab('fees');
      } else if (tab === 'qa') {
        setActiveTab('qas');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  if (!student) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Không tìm thấy thông tin học sinh</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }

  const qas = parentQAs && student ? parentQAs.filter(q => q.parentName === student.parentName) : [];
  const studentLeaves = leaveRequests && student ? leaveRequests.filter(l => l.studentId === student.id) : [];
  const studentConductLogs = conductLogs && student ? conductLogs.filter(l => l.studentId === student.id) : [];
  const conductScore = 100 + studentConductLogs.reduce((acc, curr) => acc + curr.points, 0);
  const conductGrade = conductScore >= 90 ? 'Tốt' : conductScore >= 70 ? 'Khá' : conductScore >= 50 ? 'Trung bình' : 'Yếu';
  const myEvaluations = teacherEvaluations && student ? teacherEvaluations.filter(e => e.raterRole === 'parent' && e.raterName === student.parentName) : [];

  // Calculate GPA and classification for Sem 1, Sem 2, and Whole Year
  const subjectsKeys = ['Math', 'Literature', 'Physics', 'English'];
  
  const sem1GradesArray = student.gradesSem1 ? Object.values(student.gradesSem1) : [];
  const sem1Gpa = sem1GradesArray.length > 0 
    ? (sem1GradesArray.reduce((a, b) => a + b, 0) / sem1GradesArray.length).toFixed(2)
    : '0.00';

  const sem2GradesArray = student.grades ? Object.values(student.grades) : [];
  const sem2Gpa = sem2GradesArray.length > 0
    ? (sem2GradesArray.reduce((a, b) => a + b, 0) / sem2GradesArray.length).toFixed(2)
    : '0.00';

  const wholeYearGrades = {};
  subjectsKeys.forEach(sub => {
    const s1 = student.gradesSem1?.[sub] || 0;
    const s2 = student.grades?.[sub] || 0;
    wholeYearGrades[sub] = parseFloat(((s1 + s2 * 2) / 3).toFixed(2));
  });
  const wholeYearGradesArray = Object.values(wholeYearGrades);
  const wholeYearGpa = wholeYearGradesArray.length > 0
    ? (wholeYearGradesArray.reduce((a, b) => a + b, 0) / wholeYearGradesArray.length).toFixed(2)
    : '0.00';

  const getClassification = (gpaScore) => {
    const val = parseFloat(gpaScore);
    if (val >= 8.0) return 'Giỏi';
    if (val >= 6.5) return 'Khá';
    if (val >= 5.0) return 'Trung bình';
    return 'Yếu';
  };



  // Format currency helper
  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Canvas Drawing Methods for parent signature
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#3b82f6'; // Blue signature ink
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const submitSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const signatureDataUrl = canvas.toDataURL();
    
    signParentReport(student.id, signatureDataUrl);
    alert('Đã ký tên xác nhận học bạ của con thành công!');
  };

  const handleQaSubmit = (e) => {
    e.preventDefault();
    if (!qaInput.trim()) return;
    
    askParentQuestion(student.id, qaInput);
    setQaInput('');
    alert('Câu hỏi đã được gửi đến giáo viên chủ nhiệm!');
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!leaveDate || !leaveReason.trim()) return;
    
    submitLeaveRequest(student.id, leaveDate, leaveReason);
    setLeaveDate('');
    setLeaveReason('');
    alert('Đã gửi đơn xin nghỉ phép đến giáo viên chủ nhiệm!');
  };

  const handleEvaluationSubmit = (e) => {
    e.preventDefault();
    const finalTeacherId = evalTeacherId || (teachers && teachers.length > 0 ? teachers[0].id : '');
    if (!finalTeacherId || !evalComment.trim()) return;
    
    submitTeacherEvaluation(finalTeacherId, evalRating, evalComment, 'parent', student.parentName);
    setEvalComment('');
    alert('Cảm ơn bạn! Đánh giá chất lượng giảng dạy đã được gửi trực tuyến tới Ban Giám Hiệu.');
  };

  const handleTopUpSubmit = (e) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;
    topUpStudentWallet(student.id, topUpAmount);
    alert(`Đã nạp thành công ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(topUpAmount)} vào ví điện tử của cháu ${student.name}!`);
  };

  const handleLimitSubmit = (e) => {
    e.preventDefault();
    if (limitInput <= 0) return;
    updateStudentWalletLimit(student.id, limitInput);
    alert(`Đã cập nhật hạn mức chi tiêu hàng ngày của cháu ${student.name} thành ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(limitInput)}!`);
  };

  const handleParentMealRegSubmit = (e) => {
    e.preventDefault();
    const success = registerCafeteriaMeal(student.id, regDate, regMealType, payViaWalletOption);
    if (success) {
      alert(`Đăng ký suất ăn bán trú ngày ${regDate.split('-').reverse().join('/')} cho cháu thành công!`);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '24px' }}>
        <h1>Cổng Thông Tin Phụ Huynh</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Họ tên học sinh: <strong>{student.name}</strong> • Lớp: {student.class} • Phụ huynh: {student.parentName} • Điểm rèn luyện: <strong style={{ color: 'var(--accent-secondary)' }}>{conductScore} ({conductGrade})</strong>
        </p>
      </div>

      {/* Sub Tabs */}
      <div className="tabs-container custom-scroll" style={{ overflowX: 'auto', display: 'flex', flexWrap: 'nowrap', gap: '4px', paddingBottom: '6px' }}>
        <button onClick={() => handleSubTabChange('grades')} className={`tab-btn ${activeSubTab === 'grades' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Bảng Điểm & Ký Nhận
        </button>
        <button onClick={() => handleSubTabChange('fees')} className={`tab-btn ${activeSubTab === 'fees' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Học Phí & Đóng Tiền ({student.feeStatus.filter(f => !f.paid).length})
        </button>
        <button onClick={() => handleSubTabChange('cafeteria')} className={`tab-btn ${activeSubTab === 'cafeteria' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Bán Trú Con
        </button>
        <button onClick={() => handleSubTabChange('wallet')} className={`tab-btn ${activeSubTab === 'wallet' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Ví Điện Tử Con
        </button>
        <button onClick={() => handleSubTabChange('qa')} className={`tab-btn ${activeSubTab === 'qa' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Hỏi Đáp Chủ Nhiệm ({qas.length})
        </button>
        <button onClick={() => handleSubTabChange('leaves')} className={`tab-btn ${activeSubTab === 'leaves' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Xin Nghỉ Phép ({studentLeaves.length})
        </button>
        <button onClick={() => handleSubTabChange('attendance')} className={`tab-btn ${activeSubTab === 'attendance' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Chuyên Cần Của Con
        </button>
        <button onClick={() => handleSubTabChange('ai_guidance')} className={`tab-btn ${activeSubTab === 'ai_guidance' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Định Hướng AI
        </button>
        <button onClick={() => handleSubTabChange('evaluations')} className={`tab-btn ${activeSubTab === 'evaluations' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Đánh Giá Giáo Viên ({myEvaluations.length})
        </button>
        <button onClick={() => handleSubTabChange('assignments')} className={`tab-btn ${activeSubTab === 'assignments' ? 'active' : ''}`} style={{ whiteSpace: 'nowrap' }}>
          Xem Bài Tập ({assignments ? assignments.filter(a => a.classTarget === student.class).length : 0})
        </button>
      </div>

      {/* Content panes based on sub-tabs */}
      {activeSubTab === 'grades' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Grades Card */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <FileText size={18} color="var(--accent-primary)" />
              <span>Học bạ và Kết quả Học tập liên thông</span>
            </h2>

            <table className="premium-table" style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Môn Học</th>
                  <th style={{ textAlign: 'center' }}>Học kì I</th>
                  <th style={{ textAlign: 'center' }}>Học kì II</th>
                  <th style={{ textAlign: 'center' }}>Cả năm</th>
                  <th>Nhận Xét Khái Quát</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 600 }}>Toán học</td>
                  <td style={{ textAlign: 'center' }}>{(student.gradesSem1?.Math ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 600 }}>{(student.grades.Math ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 700 }}>{((student.gradesSem1?.Math + student.grades.Math * 2) / 3).toFixed(2)}</td>
                  <td>Tiếp thu nhanh, tư duy logic khá.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Ngữ văn</td>
                  <td style={{ textAlign: 'center' }}>{(student.gradesSem1?.Literature ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 600 }}>{(student.grades.Literature ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 700 }}>{((student.gradesSem1?.Literature + student.grades.Literature * 2) / 3).toFixed(2)}</td>
                  <td>Cần chăm chỉ rèn luyện kĩ năng viết nghị luận.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Vật lý</td>
                  <td style={{ textAlign: 'center' }}>{(student.gradesSem1?.Physics ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 600 }}>{(student.grades.Physics ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 700 }}>{((student.gradesSem1?.Physics + student.grades.Physics * 2) / 3).toFixed(2)}</td>
                  <td>Làm bài tập đầy đủ, hiểu bài tốt.</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 600 }}>Tiếng Anh</td>
                  <td style={{ textAlign: 'center' }}>{(student.gradesSem1?.English ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-primary)', fontWeight: 600 }}>{(student.grades.English ?? 0).toFixed(1)}</td>
                  <td style={{ textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 700 }}>{((student.gradesSem1?.English + student.grades.English * 2) / 3).toFixed(2)}</td>
                  <td>Ngữ pháp vững vàng, giao tiếp trôi chảy.</td>
                </tr>
                <tr style={{ background: 'rgba(99, 102, 241, 0.05)', borderTop: '2px solid var(--border-color)' }}>
                  <td style={{ fontWeight: 700 }}>GPA trung bình</td>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{sem1Gpa}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent-primary)' }}>{sem2Gpa}</td>
                  <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--accent-secondary)', fontSize: '1.05rem' }}>{wholeYearGpa}</td>
                  <td style={{ fontWeight: 600 }}>
                    Xếp loại HK1: <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>{getClassification(sem1Gpa)}</span> • HK2: <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>{getClassification(sem2Gpa)}</span> • Cả năm: <span className="badge badge-success" style={{ padding: '2px 6px', fontSize: '0.75rem' }}>{getClassification(wholeYearGpa)}</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signature Card */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Signature size={18} color="var(--accent-primary)" />
              <span>Phụ Huynh Ký Xác Nhận Học Bạ</span>
            </h2>

            {student.parentSignature ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '30px 10px', background: 'rgba(16, 185, 129, 0.05)', border: '1px dashed var(--accent-secondary)', borderRadius: '12px' }}>
                <span className="badge badge-success" style={{ marginBottom: '12px', fontSize: '0.9rem', gap: '6px' }}>
                  <CheckCircle size={14} /> Bảng điểm đã được phụ huynh ký xác nhận
                </span>
                <div style={{ padding: '8px', background: '#fff', borderRadius: '8px' }}>
                  <img src={student.parentSignature} alt="Parent Signature" style={{ height: '50px', display: 'block' }} />
                </div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>Người ký: {student.parentName}</span>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  Kính mong phụ huynh ký xác nhận sau khi đã xem xét kĩ kết quả học tập của học sinh.
                </p>

                <div className="signature-box" style={{ width: '100%', height: '160px', marginBottom: '16px' }}>
                  <canvas
                    ref={canvasRef}
                    width={380}
                    height={160}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={clearCanvas} className="btn btn-secondary" style={{ flex: 1, gap: '6px' }}>
                    <RotateCcw size={14} />
                    <span>Vẽ lại</span>
                  </button>
                  <button onClick={submitSignature} className="btn btn-primary" style={{ flex: 1, gap: '6px' }}>
                    <CheckCircle size={14} />
                    <span>Xác nhận ký</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Conduct Logs Section */}
          <div className="glass-panel" style={{ gridColumn: 'span 2', marginTop: '20px' }}>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Award size={18} color="var(--accent-secondary)" />
              <span>Nhật ký Rèn luyện & Thi đua của học sinh</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {studentConductLogs.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có ghi nhận rèn luyện học tập đặc biệt.
                </div>
              ) : (
                studentConductLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.01)', border: '1px solid var(--border-card)', borderRadius: '8px', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: log.points > 0 ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                        {log.points > 0 ? `+${log.points}` : log.points} điểm
                      </strong>
                      <span>: {log.reason}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}> (Ghi nhận bởi: {log.teacherName})</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'fees' && (
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <CreditCard size={18} color="var(--accent-primary)" />
            <span>Học Phí và Các Khoản Chi Phí Đóng Góp</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {student.feeStatus.map(fee => (
              <div 
                key={fee.id} 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  padding: '20px', 
                  borderRadius: 'var(--radius-md)', 
                  background: 'rgba(255,255,255,0.01)', 
                  border: '1px solid var(--border-card)'
                }}
              >
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{fee.name}</h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Mã khoản thu: {fee.id} • Hạn nộp: {fee.deadline}</span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 700, color: fee.paid ? 'var(--text-primary)' : 'var(--accent-danger)' }}>
                    {formatCurrency(fee.amount)}
                  </span>
                  
                  {fee.paid ? (
                    <span className="badge badge-success" style={{ gap: '4px', padding: '8px 14px' }}>
                      <CheckCircle size={14} /> Đã đóng
                    </span>
                  ) : (
                    <button onClick={() => setShowPayModal(fee)} className="btn btn-danger" style={{ padding: '8px 16px', gap: '6px' }}>
                      <CreditCard size={14} />
                      <span>Nộp tiền ngay</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'qa' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          {/* Ask question form */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <MessageCircle size={18} color="var(--accent-primary)" />
              <span>Gửi Câu Hỏi Cho GVCN</span>
            </h2>

            <form onSubmit={handleQaSubmit}>
              <div className="form-group">
                <label className="form-label">Câu hỏi hoặc Đóng góp ý kiến</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={qaInput}
                  onChange={e => setQaInput(e.target.value)}
                  placeholder="Hỏi về tình hình học tập của con, phản ánh bán trú..." 
                  style={{ resize: 'none' }}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
                <Send size={14} />
                <span>Gửi ý kiến</span>
              </button>
            </form>
          </div>

          {/* Historical Questions list */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Lịch sử trao đổi với giáo viên ({qas.length})</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {qas.length === 0 ? (
                <div style={{ padding: '24px', textCombineUpright: 'center', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Phụ huynh chưa gửi câu hỏi thắc mắc nào.
                </div>
              ) : (
                qas.map(qa => (
                  <div key={qa.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gửi ngày: {qa.date}</span>
                      <span className={`badge ${qa.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>
                        {qa.status === 'pending' ? 'Đang đợi trả lời' : 'Đã phản hồi'}
                      </span>
                    </div>

                    <p style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: '10px' }}>{qa.question}</p>

                    {qa.status === 'resolved' && (
                      <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--accent-secondary)', fontSize: '0.9rem' }}>
                        <strong>Giáo viên phản hồi:</strong> {qa.reply}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'leaves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          {/* Submit Leave Request form */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Calendar size={18} color="var(--accent-primary)" />
              <span>Đăng Ký Nghỉ Phép Cho Con</span>
            </h2>

            <form onSubmit={handleLeaveSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn ngày nghỉ</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={leaveDate}
                  onChange={e => setLeaveDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Lý do xin nghỉ</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={leaveReason}
                  onChange={e => setLeaveReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết (Ví dụ: Cháu bị ốm sốt, gia đình có việc bận đột xuất...)" 
                  style={{ resize: 'none' }}
                  required
                ></textarea>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
                <Send size={14} />
                <span>Gửi đơn xin nghỉ</span>
              </button>
            </form>
          </div>

          {/* Historical Leave Requests list */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Danh sách đơn xin nghỉ phép ({studentLeaves.length})</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {studentLeaves.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa có đơn xin nghỉ phép nào được tạo.
                </div>
              ) : (
                studentLeaves.map(leave => (
                  <div key={leave.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Ngày xin nghỉ: {leave.date}</span>
                      <span className={`badge ${
                        leave.status === 'pending' 
                          ? 'badge-warning' 
                          : leave.status === 'approved' 
                          ? 'badge-success' 
                          : 'badge-danger'
                      }`}>
                        {leave.status === 'pending' && 'Đang chờ duyệt'}
                        {leave.status === 'approved' && 'Đã đồng ý'}
                        {leave.status === 'rejected' && 'Từ chối'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '8px' }}>
                      <strong>Lý do:</strong> {leave.reason}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'evaluations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          {/* Submit Evaluation form */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <BookOpen size={18} color="var(--accent-primary)" />
              <span>Khảo Sát Chất Lượng Giảng Dạy</span>
            </h2>

            <form onSubmit={handleEvaluationSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn Giáo viên giảng dạy</label>
                <select 
                  className="form-control"
                  value={evalTeacherId}
                  onChange={e => setEvalTeacherId(e.target.value)}
                >
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Đánh giá mức độ hài lòng (Số sao)</label>
                <select 
                  className="form-control"
                  value={evalRating}
                  onChange={e => setEvalRating(parseInt(e.target.value))}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ - Rất hài lòng / Xuất sắc</option>
                  <option value={4}>⭐⭐⭐⭐ - Hài lòng / Tốt</option>
                  <option value={3}>⭐⭐⭐ - Bình thường / Đạt yêu cầu</option>
                  <option value={2}>⭐⭐ - Chưa hài lòng / Cần cải tiến</option>
                  <option value={1}>⭐ - Rất không hài lòng</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Nhận xét & Đóng góp ý kiến</label>
                <textarea 
                  className="form-control" 
                  rows="4" 
                  value={evalComment}
                  onChange={e => setEvalComment(e.target.value)}
                  placeholder="Ghi nhận xét của phụ huynh về phương pháp dạy học, thái độ của giáo viên..." 
                  style={{ resize: 'none' }}
                  required
                ></textarea>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
                <Send size={14} />
                <span>Gửi đánh giá</span>
              </button>
            </form>
          </div>

          {/* Historical Evaluations list */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Nhận xét giáo viên đã gửi ({myEvaluations.length})</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myEvaluations.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Phụ huynh chưa gửi đánh giá nào trong học kỳ này.
                </div>
              ) : (
                myEvaluations.map(evalItem => (
                  <div key={evalItem.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <strong>Thầy/Cô: {evalItem.teacherName}</strong>
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>
                        {'⭐'.repeat(evalItem.rating)}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Gửi ngày: {evalItem.date}</span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '8px', fontStyle: 'italic' }}>
                      "{evalItem.comment}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'assignments' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="animate-fade">
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <FileText size={18} color="var(--accent-primary)" />
              <span>Tiến độ bài tập về nhà của học sinh {student.name}</span>
            </h2>

            {(() => {
              const childAssignments = assignments ? assignments.filter(a => a.classTarget === student.class) : [];
              if (childAssignments.length === 0) {
                return (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Hiện không có bài tập nào được giao cho lớp {student.class} của con.
                  </div>
                );
              }
              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
                  {childAssignments.map(assignment => {
                    const sub = submissions ? submissions.find(s => s.assignmentId === assignment.id && s.studentId === student.id) : null;
                    const isSubmitted = !!sub;
                    const isGraded = sub && sub.status === 'graded';
                    
                    return (
                      <div 
                        key={assignment.id} 
                        style={{ 
                          padding: '20px', 
                          borderRadius: '16px', 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          border: isGraded ? '1px solid rgba(16, 185, 129, 0.2)' : isSubmitted ? '1px solid rgba(59, 130, 246, 0.2)' : '1px solid var(--border-card)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '12px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span className="badge badge-info">{assignment.subject} • GV: {assignment.teacherName}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hạn: {assignment.deadline}</span>
                          </div>
                          <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>{assignment.title}</h4>
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.01)', margin: '8px 0', whiteSpace: 'pre-line' }}>
                            {assignment.content}
                          </p>
                        </div>

                        <div style={{ borderTop: '1px solid var(--border-card)', paddingTop: '12px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Trạng thái bài làm:</span>
                            {!isSubmitted ? (
                              <span className="badge badge-warning" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>Chưa nộp</span>
                            ) : sub.status === 'submitted' ? (
                              <span className="badge badge-info" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>Chờ chấm điểm</span>
                            ) : (
                              <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-secondary)' }}>Đã chấm</span>
                            )}
                          </div>

                          {sub && (
                            <div style={{ background: 'rgba(0,0,0,0.01)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-card)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                              <div style={{ fontWeight: 600, marginBottom: '4px' }}>Nội dung làm bài:</div>
                              <div style={{ fontStyle: 'italic', marginBottom: '8px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                "{sub.submissionText}"
                              </div>
                              
                              {isGraded && (
                                <div style={{ borderTop: '1px dashed var(--border-card)', paddingTop: '8px', marginTop: '8px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                                    <span>Điểm số:</span>
                                    <span style={{ color: 'var(--accent-secondary)' }}>{sub.grade} / 10</span>
                                  </div>
                                  {sub.feedback && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                      <strong>Thầy cô nhận xét:</strong> "{sub.feedback}"
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {activeSubTab === 'attendance' && (
        <div className="glass-panel animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Giám sát chuyên cần ra vào của con</h2>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Thời gian học sinh điểm danh tự động thông qua RFID/quét vân tay ở cổng trường.
          </p>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Giờ Check-in</th>
                <th>Trạng thái</th>
                <th>Địa điểm cổng</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01/06/2026</td>
                <td style={{ fontWeight: 600 }}>07:12 AM</td>
                <td><span className="badge badge-success">Có mặt</span></td>
                <td>Cổng chính A</td>
              </tr>
              <tr>
                <td>02/06/2026</td>
                <td style={{ fontWeight: 600 }}>07:18 AM</td>
                <td><span className="badge badge-success">Có mặt</span></td>
                <td>Cổng chính A</td>
              </tr>
              {attendanceLogs && attendanceLogs.filter(l => l.studentId === student.id).map(log => (
                <tr key={log.id}>
                  <td>{log.date.split('-').reverse().join('/')}</td>
                  <td style={{ fontWeight: 600 }}>{log.checkInTime} AM</td>
                  <td>
                    <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-danger' : 'badge-secondary'}`}>
                      {log.status === 'present' ? 'Có mặt' : log.status === 'late' ? 'Đi muộn' : 'Vắng học'}
                    </span>
                  </td>
                  <td>Cổng B (Nhận diện Camera)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeSubTab === 'ai_guidance' && (
        <div className="glass-panel animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Sparkles size={18} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Cố vấn Học vụ AI & Hướng nghiệp cho con</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', alignItems: 'start' }}>
            <div>
              <div style={{ padding: '16px', background: 'rgba(99,102,241,0.03)', borderRadius: '12px', border: '1px solid var(--border-card)', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0' }}>Biểu đồ tiến độ học tập (Điểm trung bình)</h4>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="100%" height="150" viewBox="0 0 400 150" style={{ overflow: 'visible' }}>
                    <line x1="50" y1="20" x2="350" y2="20" stroke="#e2e8f0" strokeDasharray="3,3" />
                    <line x1="50" y1="60" x2="350" y2="60" stroke="#e2e8f0" strokeDasharray="3,3" />
                    <line x1="50" y1="100" x2="350" y2="100" stroke="#e2e8f0" strokeDasharray="3,3" />
                    <line x1="50" y1="120" x2="350" y2="120" stroke="#e2e8f0" />
                    
                    <path d="M 80,80 L 160,70 L 240,65 L 320,55" fill="none" stroke="var(--accent-secondary)" strokeWidth="3" />
                    
                    <circle cx="80" cy="80" r="4" fill="#10b981" />
                    <circle cx="160" cy="70" r="4" fill="#10b981" />
                    <circle cx="240" cy="65" r="4" fill="#10b981" />
                    <circle cx="320" cy="55" r="4" fill="#10b981" />
                    
                    <text x="80" y="135" fontSize="9" fill="#94a3b8" textAnchor="middle">Tuần 32</text>
                    <text x="160" y="135" fontSize="9" fill="#94a3b8" textAnchor="middle">Tuần 33</text>
                    <text x="240" y="135" fontSize="9" fill="#94a3b8" textAnchor="middle">Tuần 34</text>
                    <text x="320" y="135" fontSize="9" fill="#94a3b8" textAnchor="middle">Tuần 35</text>
                    
                    <text x="80" y="95" fontSize="9" fontWeight="bold" fill="#334155" textAnchor="middle">7.8</text>
                    <text x="160" y="85" fontSize="9" fontWeight="bold" fill="#334155" textAnchor="middle">8.0</text>
                    <text x="240" y="80" fontSize="9" fontWeight="bold" fill="#334155" textAnchor="middle">8.2</text>
                    <text x="320" y="45" fontSize="9" fontWeight="bold" fill="var(--accent-secondary)" textAnchor="middle">8.5</text>
                  </svg>
                </div>
              </div>

              <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Điểm dự kiến thi tốt nghiệp THPT của con</h4>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Khối A00 (Toán, Lý, Hóa):</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--accent-secondary)' }}>26.5 điểm</strong>
                  </div>
                  <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Khối D01 (Toán, Văn, Anh):</span>
                    <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--accent-primary)' }}>25.3 điểm</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'rgba(99,102,241,0.02)', border: '1px solid var(--border-card)', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>Định hướng nghề nghiệp phù hợp</h4>
              
              {(() => {
                const userScore = careerTestScores ? careerTestScores.find(c => c.studentId === student.id) : null;
                if (!userScore) {
                  return (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <AlertTriangle size={24} color="#f59e0b" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Con em chưa thực hiện bài trắc nghiệm hướng nghiệp RIASEC tại bảng điều khiển học sinh.</p>
                    </div>
                  );
                }
                
                const scoreEntries = Object.entries(userScore).filter(([k]) => k !== 'studentId');
                scoreEntries.sort((a, b) => b[1] - a[1]);
                const topTrait = scoreEntries[0][0];
                
                let adviseText = 'Con em có xu hướng kỹ thuật cao.';
                let careerMatch = 'Kỹ sư cơ điện tử, Lập trình điều khiển.';
                
                if (topTrait === 'I') {
                  adviseText = 'Cháu có tư duy nghiên cứu, tìm tòi và phân tích chiều sâu rất mạnh. Thích khám phá học thuật độc lập.';
                  careerMatch = 'Nhà nghiên cứu khoa học, Khoa học dữ liệu, Chuyên gia AI.';
                } else if (topTrait === 'S') {
                  adviseText = 'Cháu có kỹ năng tương tác xã hội tuyệt vời, thích chia sẻ, truyền thụ kiến thức và chăm sóc mọi người.';
                  careerMatch = 'Giảng viên sư phạm, Nhà tâm lý, Quản trị nguồn nhân lực.';
                } else if (topTrait === 'A') {
                  adviseText = 'Cháu giàu trí tưởng tượng, thiên hướng nghệ thuật, thẩm mỹ nhạy cảm và giàu ý tưởng độc đáo.';
                  careerMatch = 'Nhà thiết kế truyền thông, Đạo diễn, Nhà biên kịch, Copywriter.';
                } else if (topTrait === 'E') {
                  adviseText = 'Cháu năng động, có tố chất quản trị điều phối đội nhóm, giao tiếp thuyết phục tốt và dám chấp nhận thử thách.';
                  careerMatch = 'Quản lý kinh doanh, Khởi nghiệp công nghệ, Chuyên gia đầu tư.';
                } else if (topTrait === 'C') {
                  adviseText = 'Cháu cẩn thận, ngăn nắp, làm việc chặt chẽ với số liệu, hồ sơ và tuân thủ quy trình chuẩn hóa.';
                  careerMatch = 'Kế toán trưởng, Kiểm toán tài chính, Lập kế hoạch phân tích thuế.';
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                      <strong>Nhóm nổi trội:</strong> Nhóm {topTrait}
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                      {adviseText}
                    </p>
                    <div style={{ borderTop: '1.5px dashed rgba(0,0,0,0.06)', paddingTop: '8px', marginTop: '6px', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      💼 Gợi ý nghề phù hợp: {careerMatch}
                    </div>

                    {/* Wellness Tracking for Child */}
                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(139,92,246,0.02)', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🧠 Nhật ký Stress & Tâm lý của con</span>
                      </h4>

                      {(() => {
                        const childLogs = wellnessLogs ? wellnessLogs.filter(l => l.studentId === student.id) : [];
                        if (childLogs.length === 0) {
                          return (
                            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Chương trình chưa có ghi nhận tâm lý nào gần đây cho cháu.
                            </div>
                          );
                        }
                        
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
                              {childLogs.slice(0, 3).map(log => {
                                const moodEmoji = log.mood === 'happy' ? '😊' : log.mood === 'tired' ? '😴' : log.mood === 'anxious' ? '😰' : '😫';
                                return (
                                  <div key={log.id} style={{ flexShrink: 0, width: '130px', background: '#fff', padding: '8px 10px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.04)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '1.2rem' }}>{moodEmoji}</span>
                                      <span className="badge" style={{ 
                                        fontSize: '0.62rem', 
                                        background: log.stressLevel >= 7 ? 'rgba(239,68,68,0.08)' : log.stressLevel >= 4 ? 'rgba(245,158,11,0.08)' : 'rgba(16,185,129,0.08)',
                                        color: log.stressLevel >= 7 ? '#ef4444' : log.stressLevel >= 4 ? '#b45309' : '#10b981'
                                      }}>
                                        Stress {log.stressLevel}/10
                                      </span>
                                    </div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                      {log.date.split('-').reverse().slice(0, 2).join('/')}
                                    </div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={log.notes}>
                                      {log.notes}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {childLogs.some(l => l.stressLevel >= 7) && (
                              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', padding: '10px', borderRadius: '8px', color: '#b91c1c', fontSize: '0.74rem', marginTop: '6px' }}>
                                ⚠️ Cháu đang có dấu hiệu căng thẳng cao. Khuyên khích trao đổi cùng GVCN hoặc đặt lịch tư vấn tâm lý.
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'cafeteria' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="animate-fade">
          {/* Menu Planner & Registration */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Utensils size={18} color="var(--accent-primary)" />
              <span>Đăng Ký Bán Trú Cho Con</span>
            </h2>
            
            <form onSubmit={handleParentMealRegSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              <div className="form-group">
                <label className="form-label">Chọn ngày đăng ký ăn</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={regDate}
                  onChange={e => setRegDate(e.target.value)}
                  min="2026-06-04"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Loại suất ăn</label>
                <select 
                  className="form-control"
                  value={regMealType}
                  onChange={e => setRegMealType(e.target.value)}
                >
                  <option value="Standard">Suất thường (35.000đ)</option>
                  <option value="Veggie">Suất chay (35.000đ)</option>
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input 
                  type="checkbox" 
                  id="payViaWallet" 
                  checked={payViaWalletOption}
                  onChange={e => setPayViaWalletOption(e.target.checked)}
                />
                <label htmlFor="payViaWallet" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>
                  Thanh toán tự động bằng ví điện tử học sinh
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Đăng ký suất ăn</button>
            </form>

            <h3 style={{ fontSize: '1.05rem', marginBottom: '12px' }}>Lịch sử đăng ký bán trú</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(() => {
                const childRegs = cafeteriaRegistrations ? cafeteriaRegistrations.filter(r => r.studentId === student.id) : [];
                if (childRegs.length === 0) {
                  return (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Chưa có lịch sử đăng ký suất ăn nào cho cháu.
                    </div>
                  );
                }
                return childRegs.map(reg => (
                  <div key={reg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <strong>Ngày: {reg.date.split('-').reverse().join('/')}</strong>
                      <span style={{ marginLeft: '10px' }}>({reg.mealType === 'Standard' ? 'Suất Thường' : 'Suất Chay'})</span>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trạng thái: 
                        <span style={{ 
                          marginLeft: '4px',
                          color: reg.status === 'registered' ? 'var(--accent-secondary)' : 'var(--text-muted)',
                          fontWeight: 600
                        }}>
                          {reg.status === 'registered' ? 'Đã đăng ký' : 'Đã hủy'}
                        </span>
                      </div>
                    </div>
                    {reg.status === 'registered' && (
                      <button 
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Bạn có chắc chắn muốn hủy suất ăn ngày ${reg.date.split('-').reverse().join('/')}?`)) {
                            cancelCafeteriaMeal(student.id, reg.date);
                            alert('Đã hủy suất ăn và hoàn tiền vào ví điện tử thành công!');
                          }
                        }}
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                      >
                        Hủy ăn
                      </button>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Nutrition Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Thực đơn bán trú hôm nay</h2>
              {cafeteriaMenu && cafeteriaMenu.find(m => m.date === '2026-06-03') ? (() => {
                const todayMenu = cafeteriaMenu.find(m => m.date === '2026-06-03');
                return (
                  <div>
                    <h3 style={{ fontSize: '1.05rem', color: 'var(--accent-primary)', marginBottom: '8px' }}>{todayMenu.name}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem' }}>
                      {todayMenu.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '6px', borderBottom: '1px dashed rgba(0,0,0,0.05)' }}>
                          <span>{item.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.cal} kcal</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })() : (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Không có thực đơn cho hôm nay.</p>
              )}
            </div>

            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Phản hồi về bữa ăn của con</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(() => {
                  const childFeedbacks = cafeteriaFeedback ? cafeteriaFeedback.filter(f => f.studentId === student.id) : [];
                  if (childFeedbacks.length === 0) {
                    return (
                      <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                        Cháu chưa gửi phản hồi nào về các bữa ăn gần đây.
                      </div>
                    );
                  }
                  return childFeedbacks.map(f => (
                    <div key={f.id} style={{ padding: '10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)', borderRadius: '8px', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong>Ngày {f.date.split('-').reverse().join('/')}</strong>
                        <div>
                          {'⭐'.repeat(f.rating)}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{f.comment}"</p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'wallet' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }} className="animate-fade">
          {/* Wallet Balance & Action */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <CreditCard size={18} color="var(--accent-primary)" />
              <span>Ví Điện Tử Học Sinh</span>
            </h2>

            {(() => {
              const wallet = studentWallets[student.id] || { balance: 0, dailyLimit: 100000, transactions: [] };
              return (
                <div>
                  <div style={{ padding: '20px', borderRadius: '12px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.1))', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '24px' }}>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Số dư ví điện tử của {student.name}</div>
                    <strong style={{ fontSize: '2rem', color: 'var(--accent-primary)' }}>
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet.balance)}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Hạn mức chi tiêu hàng ngày: <strong>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(wallet.dailyLimit)}</strong>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                    {/* Top up form */}
                    <form onSubmit={handleTopUpSubmit} style={{ border: '1px solid var(--border-card)', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Nạp tiền vào ví</h4>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Số tiền nạp (VND)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={topUpAmount}
                          onChange={e => setTopUpAmount(parseFloat(e.target.value))}
                          step="10000"
                          min="10000"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}>Xác nhận nạp</button>
                    </form>

                    {/* Change limit form */}
                    <form onSubmit={handleLimitSubmit} style={{ border: '1px solid var(--border-card)', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                      <h4 style={{ margin: '0 0 12px 0', fontSize: '0.95rem' }}>Cài đặt hạn mức chi tiêu</h4>
                      <div className="form-group">
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Hạn mức / ngày (VND)</label>
                        <input 
                          type="number" 
                          className="form-control" 
                          value={limitInput}
                          onChange={e => setLimitInput(parseFloat(e.target.value))}
                          step="10000"
                          min="10000"
                          required
                        />
                      </div>
                      <button type="submit" className="btn btn-secondary" style={{ width: '100%', fontSize: '0.85rem', padding: '8px 12px' }}>Cập nhật hạn mức</button>
                    </form>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Transaction History */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>Lịch sử giao dịch ví của con</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }} className="custom-scroll">
              {(() => {
                const wallet = studentWallets[student.id] || { balance: 0, dailyLimit: 100000, transactions: [] };
                if (!wallet.transactions || wallet.transactions.length === 0) {
                  return (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Chưa phát sinh giao dịch nào.
                    </div>
                  );
                }
                return wallet.transactions.map((tx, index) => (
                  <div key={tx.id || index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-card)', borderRadius: '8px', fontSize: '0.82rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{tx.description}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Mã GD: {tx.id} • {tx.date.split('-').reverse().join('/')}</div>
                    </div>
                    <strong style={{ color: tx.type === 'topup' ? 'var(--accent-secondary)' : 'var(--accent-danger)', fontSize: '0.9rem' }}>
                      {tx.type === 'topup' ? '+' : '-'}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(tx.amount)}
                    </strong>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Payment simulated Modal */}
      {showPayModal && (
        <VietQRPayment
          studentId={student.id}
          feeItem={showPayModal}
          onClose={() => setShowPayModal(null)}
          onSuccess={() => setShowPayModal(null)}
        />
      )}
    </div>
  );
}
