import { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { BLOCKS, SYSTEM_BLOCK_EXAMS, SUBJECT_NAMES, QUESTIONS } from '../../data/mockExamsData';
import { decodeHtmlEntities } from '../../lib/tutor/formatText';
import {
  Award,
  ArrowRight,
  Sparkles,
  FileText,
  Clock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Timer,
  Check,
  X,
  ClipboardList,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart2
} from 'lucide-react';

const SUBJECT_ICONS = {
  Math: '📐',
  Physics: '⚛️',
  Chemistry: '🧪',
  Biology: '🧬',
  English: '🇬🇧',
  History: '📜',
  Geography: '🗺️',
  Literature: '📖'
};

export default function MockExamTab({ student }) {
  const { customExams, mockExamHistory, saveMockExamResult } = useContext(AppContext);

  const [selectedBlockKey, setSelectedBlockKey] = useState('A00');
  const [activeExam, setActiveExam] = useState(null);
  const [examMode, setExamMode] = useState(null); // null | 'taking' | 'reviewing'
  const [selectedSubjectTab, setSelectedSubjectTab] = useState('');
  const [examAnswers, setExamAnswers] = useState({});
  const [examSecondsLeft, setExamSecondsLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reviewingPastAttempt, setReviewingPastAttempt] = useState(null);
  const [selectionTab, setSelectionTab] = useState('subject'); // 'subject' | 'block'

  // Helper to get list of unique subjects in current active exam
  const getExamSubjects = useCallback((exam) => {
    if (!exam || !exam.questions) return [];
    const set = new Set();
    exam.questions.forEach(q => {
      if (q.subject) set.add(q.subject);
    });
    return Array.from(set);
  }, []);

  // Calculate official MoET National High School exam score
  const calculateExamScore = useCallback((exam, answers) => {
    if (!exam || !exam.questions) return { score: 0, totalQuestions: 0, subjectBreakdown: {} };

    const subjectBreakdown = {};
    const subjects = Array.from(new Set(exam.questions.map(q => q.subject)));

    subjects.forEach(subj => {
      const subjQuestions = exam.questions.filter(q => q.subject === subj);
      let rawPoints = 0;
      let totalRawMax = 0;

      subjQuestions.forEach(q => {
        const qType = q.type || 'single';
        const userAns = answers[q.id];

        if (qType === 'single') {
          totalRawMax += 1;
          if (userAns === q.correctKey) {
            rawPoints += 1;
          }
        } else if (qType === 'tf') {
          totalRawMax += 1;
          if (userAns && typeof userAns === 'object') {
            let numCorrect = 0;
            q.statements?.forEach(st => {
              if (userAns[st.id] === st.correct) {
                numCorrect++;
              }
            });
            // MoET official True/False scoring scale: 1 -> 0.1, 2 -> 0.25, 3 -> 0.5, 4 -> 1.0
            if (numCorrect === 1) rawPoints += 0.1;
            else if (numCorrect === 2) rawPoints += 0.25;
            else if (numCorrect === 3) rawPoints += 0.5;
            else if (numCorrect === 4) rawPoints += 1.0;
          }
        } else if (qType === 'short') {
          totalRawMax += 1;
          if (userAns && String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase()) {
            rawPoints += 1;
          }
        }
      });

      const scaledSubjectScore = totalRawMax > 0 ? (rawPoints / totalRawMax) * 10.0 : 0;
      subjectBreakdown[subj] = {
        rawPoints,
        totalRawMax,
        subjectScore: Math.round(scaledSubjectScore * 100) / 100,
        total: subjQuestions.length
      };
    });

    const totalBlockScore = Object.values(subjectBreakdown).reduce((sum, item) => sum + item.subjectScore, 0);
    const roundedBlockScore = Math.round(totalBlockScore * 100) / 100;

    return {
      score: roundedBlockScore, // Total out of 30.0 points
      totalQuestions: exam.questions.length,
      subjectBreakdown
    };
  }, []);

  const submitExam = useCallback(() => {
    if (!activeExam) return;

    const durationUsed = activeExam.duration * 60 - examSecondsLeft;
    const minutesUsed = Math.floor(durationUsed / 60);
    const secondsUsed = durationUsed % 60;
    const timeSpentStr = `${String(minutesUsed).padStart(2, '0')}:${String(secondsUsed).padStart(2, '0')}`;

    const { score, totalQuestions, subjectBreakdown } = calculateExamScore(activeExam, examAnswers);

    const newResult = {
      studentId: student?.id,
      studentName: student?.name,
      class: student?.class,
      block: activeExam.block || selectedBlockKey,
      examId: activeExam.id,
      title: activeExam.title,
      score: score,
      totalQuestions: totalQuestions,
      timeSpent: timeSpentStr,
      selectedAnswers: examAnswers,
      subjectBreakdown: subjectBreakdown,
      date: new Date().toISOString().split('T')[0]
    };

    saveMockExamResult(newResult);
    setExamMode('reviewing');
    setReviewingPastAttempt(newResult);
  }, [activeExam, examAnswers, examSecondsLeft, student, selectedBlockKey, saveMockExamResult, calculateExamScore]);

  const handleAutoSubmit = useCallback(() => {
    alert('⏰ Hết giờ làm bài! Hệ thống đang nộp bài thi của bạn.');
    submitExam();
  }, [submitExam]);

  const handleFinishExam = useCallback(() => {
    if (!activeExam) return;
    if (window.confirm('Bạn có chắc chắn muốn nộp bài thi THPT Quốc gia này?')) {
      submitExam();
    }
  }, [activeExam, submitExam]);

  useEffect(() => {
    let timerInterval = null;
    if (examMode === 'taking' && examSecondsLeft > 0) {
      timerInterval = setInterval(() => {
        setExamSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            setTimeout(() => { handleAutoSubmit(); }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [examMode, examSecondsLeft, handleAutoSubmit]);

  const handleStartExam = (exam, subjectFilter = null) => {
    let examToRun = exam;
    if (subjectFilter) {
      const filteredQs = exam.questions.filter(q => q.subject === subjectFilter);
      examToRun = {
        ...exam,
        id: `${exam.id}_${subjectFilter}`,
        title: `Đề thi thử Tốt nghiệp THPT Môn ${SUBJECT_NAMES[subjectFilter] || subjectFilter}`,
        duration: 50, // Official 50 mins per single subject exam
        questions: filteredQs
      };
    }

    setActiveExam(examToRun);
    const subjects = getExamSubjects(examToRun);
    setSelectedSubjectTab(subjects[0] || 'Math');
    setExamMode('taking');
    setExamAnswers({});
    setExamSecondsLeft(examToRun.duration * 60);
    setCurrentQuestionIndex(0);
    setReviewingPastAttempt(null);
  };

  const handleSelectOptionSingle = (questionId, optionKey) => {
    setExamAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
    }));
  };

  const handleSelectOptionTF = (questionId, statementId, val) => {
    setExamAnswers(prev => {
      const existing = prev[questionId] || {};
      return {
        ...prev,
        [questionId]: {
          ...existing,
          [statementId]: val
        }
      };
    });
  };

  const handleSelectOptionShort = (questionId, textVal) => {
    setExamAnswers(prev => ({
      ...prev,
      [questionId]: textVal
    }));
  };

  const handleViewPastAttempt = (attempt) => {
    let exam = SYSTEM_BLOCK_EXAMS.find(ex => ex.id === attempt.examId);
    if (!exam && customExams) {
      exam = customExams.find(ex => ex.id === attempt.examId);
    }
    if (!exam) {
      exam = SYSTEM_BLOCK_EXAMS.find(ex => ex.title === attempt.title || ex.block === attempt.block);
    }
    if (!exam && customExams) {
      exam = customExams.find(ex => ex.title === attempt.title || ex.block === attempt.block);
    }

    if (exam) {
      setActiveExam(exam);
      const subjects = getExamSubjects(exam);
      setSelectedSubjectTab(subjects[0] || 'Math');
      setExamAnswers(attempt.selectedAnswers || {});
      setExamMode('reviewing');
      setReviewingPastAttempt(attempt);
    } else {
      alert('Không tìm thấy đề thi tương ứng để xem lại.');
    }
  };

  const handleExitExam = () => {
    setActiveExam(null);
    setExamMode(null);
    setExamAnswers({});
    setReviewingPastAttempt(null);
  };

  const isQuestionAnswered = (q) => {
    const ans = examAnswers[q.id];
    if (!ans) return false;
    if (q.type === 'tf') {
      return typeof ans === 'object' && Object.keys(ans).length > 0;
    }
    if (q.type === 'short') {
      return String(ans).trim().length > 0;
    }
    return true;
  };

  const ALL_SUBJECTS = ['Math', 'Physics', 'Chemistry', 'Biology', 'English', 'Literature', 'History', 'Geography'];

  const handleStartSubjectExam = (subjectKey) => {
    const subjQuestions = QUESTIONS[subjectKey] || [];
    const mockExamObj = {
      id: `SYS_SUBJ_${subjectKey}`,
      block: 'SINGLE',
      title: `Đề thi thử Tốt nghiệp THPT Môn ${SUBJECT_NAMES[subjectKey] || subjectKey}`,
      duration: 50,
      questions: subjQuestions
    };
    setActiveExam(mockExamObj);
    setSelectedSubjectTab(subjectKey);
    setExamMode('taking');
    setExamAnswers({});
    setExamSecondsLeft(50 * 60);
    setCurrentQuestionIndex(0);
    setReviewingPastAttempt(null);
  };

  const currentSubjectQuestions = activeExam?.questions?.filter(q => q.subject === selectedSubjectTab) || [];
  const currentQuestion = currentSubjectQuestions[currentQuestionIndex] || currentSubjectQuestions[0];

  return (
    <div className="animate-fade">
      {/* ─── 1. SELECTION & OVERVIEW VIEW ────────────────────────────────────── */}
      {examMode === null && (
        <div>
          {/* Header Card */}
          <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.6))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ClipboardList size={28} color="var(--accent-primary)" /> Thi Thử Đại Học THPT Quốc Gia (Format Bộ GD&ĐT 2025+)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Lựa chọn thi riêng lẻ từng <strong>Môn học</strong> (50 phút) hoặc luyện tập <strong>Tổ hợp Khối thi liên môn</strong> (Toán - Lý - Hóa, Văn - Sử - Địa...).
                </p>
              </div>

              {/* Mode Switcher Tabs */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setSelectionTab('subject')}
                  className={`btn ${selectionTab === 'subject' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '12px 24px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: selectionTab === 'subject' ? 'none' : '1px solid #cbd5e1',
                    background: selectionTab === 'subject' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'white',
                    color: selectionTab === 'subject' ? 'white' : '#475569'
                  }}
                >
                  <BookOpen size={18} /> 📐 THI THEO MÔN HỌC ĐỘC LẬP (8 MÔN)
                </button>

                <button
                  onClick={() => setSelectionTab('block')}
                  className={`btn ${selectionTab === 'block' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{
                    padding: '12px 24px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    border: selectionTab === 'block' ? 'none' : '1px solid #cbd5e1',
                    background: selectionTab === 'block' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'white',
                    color: selectionTab === 'block' ? 'white' : '#475569'
                  }}
                >
                  <Award size={18} /> 🏆 THI THEO TỔ HỢP KHỐI (A00, A01, B00...)
                </button>
              </div>
            </div>
          </div>

          {/* ─── TAB 1: SINGLE SUBJECT EXAMS GRID ───────────────────────────── */}
          {selectionTab === 'subject' && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={20} color="var(--accent-primary)" /> Danh sách 8 Môn thi THPT Quốc Gia độc lập
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {ALL_SUBJECTS.map(subjKey => {
                  const qCount = (QUESTIONS[subjKey] || []).length;
                  return (
                    <div
                      key={subjKey}
                      className="glass-panel"
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        gap: '16px',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '2rem' }}>{SUBJECT_ICONS[subjKey]}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 10px', borderRadius: '99px', background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5' }}>
                            Thang điểm 10.0đ
                          </span>
                        </div>

                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                          Môn {SUBJECT_NAMES[subjKey]}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                          Thời gian: <strong>50 phút</strong> | Cấu trúc: <strong>{qCount} câu hỏi</strong> (Trắc nghiệm 4 lựa chọn, Đúng/Sai, Điền số)
                        </p>
                      </div>

                      <button
                        onClick={() => handleStartSubjectExam(subjKey)}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          justify: 'center',
                          padding: '12px',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          background: 'linear-gradient(135deg, #6366f1, #4f46e5)'
                        }}
                      >
                        Bắt đầu thi Môn {SUBJECT_NAMES[subjKey]} <ArrowRight size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── TAB 2: BLOCK COMBINATION EXAMS ────────────────────────────── */}
          {selectionTab === 'block' && (
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                {Object.keys(BLOCKS).map(blockKey => (
                  <button
                    key={blockKey}
                    onClick={() => setSelectedBlockKey(blockKey)}
                    className={`btn ${selectedBlockKey === blockKey ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '10px 18px',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                      borderRadius: '12px',
                      border: selectedBlockKey === blockKey ? 'none' : '1px solid #cbd5e1',
                      background: selectedBlockKey === blockKey ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'white',
                      color: selectedBlockKey === blockKey ? 'white' : '#4f46e5'
                    }}
                  >
                    {BLOCKS[blockKey].name}
                  </button>
                ))}
              </div>

              {(() => {
                const systemExam = SYSTEM_BLOCK_EXAMS.find(ex => ex.block === selectedBlockKey);
                if (!systemExam) return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có đề thi hệ thống cho khối này.</p>;

                const subjects = Array.from(new Set(systemExam.questions.map(q => q.subject)));

                return (
                  <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'white', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.1)', padding: '4px 12px', borderRadius: '99px' }}>
                        Đề thi THPT Quốc gia Tổ hợp {BLOCKS[selectedBlockKey].name}
                      </span>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginTop: '8px' }}>
                        {systemExam.title}
                      </h4>
                      <p style={{ color: '#64748b', fontSize: '0.88rem', marginTop: '4px' }}>
                        Thời gian: <strong>{systemExam.duration} phút</strong> | Thang điểm: <strong>30.0 điểm</strong> | Các môn: <strong>{subjects.map(s => SUBJECT_NAMES[s]).join(', ')}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => handleStartExam(systemExam, null)}
                      className="btn btn-primary"
                      style={{ padding: '12px 24px', fontWeight: 700, fontSize: '0.95rem', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
                    >
                      🚀 Bắt đầu làm bài thi Tổ hợp Khối {BLOCKS[selectedBlockKey].name} ({systemExam.questions.length} câu) <ArrowRight size={16} />
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

            {/* Teacher created exams */}
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginTop: '32px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={18} color="var(--accent-primary)" /> Đề thi thử từ Thầy Cô thiết lập
            </h3>

            {(() => {
              const teacherExams = customExams ? customExams.filter(ex => ex.block === selectedBlockKey) : [];
              if (teacherExams.length === 0) {
                return (
                  <div className="glass-panel" style={{ padding: '24px', textAlign: 'center', border: '1px dashed #cbd5e1', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                    Chưa có đề thi thử riêng nào từ thầy cô bộ môn giao cho khối thi này.
                  </div>
                );
              }

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                  {teacherExams.map(exam => {
                    const counts = {};
                    exam.questions.forEach(q => {
                      counts[q.subject] = (counts[q.subject] || 0) + 1;
                    });
                    const structureDesc = Object.entries(counts)
                      .map(([sub, count]) => `${count} ${SUBJECT_NAMES[sub] || sub}`)
                      .join(', ');

                    return (
                      <div key={exam.id} className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px', border: '1px solid rgba(16, 185, 129, 0.25)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.03), rgba(255, 255, 255, 0.85))' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#10b981',
                              background: 'rgba(16, 185, 129, 0.1)',
                              padding: '4px 10px',
                              borderRadius: '99px'
                            }}>
                              Thầy Cô giao ({exam.teacherName || 'Giáo viên'})
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {exam.duration} phút
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.4, margin: '6px 0' }}>
                            {exam.title}
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            <strong>Cấu trúc đề:</strong> {structureDesc}
                          </p>
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                            Ngày tạo: {exam.createdDate?.split('-').reverse().join('/') || 'Mới đây'}
                          </span>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                          <button
                            onClick={() => handleStartExam(exam)}
                            className="btn btn-primary"
                            style={{
                              width: '100%',
                              borderRadius: '10px',
                              padding: '10px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              background: 'var(--accent-secondary)',
                              border: 'none'
                            }}
                          >
                            <span>Bắt đầu làm bài</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

          {/* Attempt History */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <RefreshCw size={18} color="var(--accent-info)" /> Lịch sử thi thử của bạn
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(0,0,0,0.05)', textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px 8px' }}>Tên Đề thi</th>
                    <th style={{ padding: '12px 8px' }}>Khối thi</th>
                    <th style={{ padding: '12px 8px' }}>Ngày thi</th>
                    <th style={{ padding: '12px 8px' }}>Thời gian làm</th>
                    <th style={{ padding: '12px 8px' }}>Số câu đúng</th>
                    <th style={{ padding: '12px 8px' }}>Điểm số</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {mockExamHistory.filter(h => h.studentId === student.id).length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '24px 8px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                        Bạn chưa tham gia đợt thi thử nào. Hãy chọn môn thi phía trên để bắt đầu!
                      </td>
                    </tr>
                  ) : (
                    mockExamHistory.filter(h => h.studentId === student.id).map(attempt => (
                      <tr key={attempt.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '0.88rem', color: '#1e293b' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{attempt.title || `Đề thi thử Khối ${attempt.block}`}</td>
                        <td style={{ padding: '12px 8px' }}><span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{attempt.block}</span></td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>{attempt.date.split('-').reverse().join('/')}</td>
                        <td style={{ padding: '12px 8px', color: 'var(--text-muted)' }}><Clock size={12} style={{ marginRight: '4px', display: 'inline' }} /> {attempt.timeSpent}</td>
                        <td style={{ padding: '12px 8px' }}>{attempt.correctAnswers} / {attempt.totalQuestions}</td>
                        <td style={{ padding: '12px 8px' }}>
                          <strong style={{
                            color: attempt.score >= 8 ? '#10b981' : attempt.score >= 5 ? '#f59e0b' : '#ef4444',
                            fontSize: '1rem'
                          }}>
                            {attempt.score.toFixed(1)}
                          </strong>
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleViewPastAttempt(attempt)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px' }}
                          >
                            Xem lời giải
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Exam room (taking exam) */}
      {examMode === 'taking' && activeExam && (
        <div className="glass-panel animate-fade" style={{ padding: '30px', border: '2px solid rgba(99, 102, 241, 0.25)', minHeight: '500px' }}>

          {/* Header row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,0,0,0.08)', paddingBottom: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, background: 'var(--accent-primary-glow)', padding: '4px 10px', borderRadius: '99px' }}>
                PHÒNG THI THỬ TRỰC TUYẾN
              </span>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>{activeExam.title}</h3>
            </div>

            {/* Timer and action */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: examSecondsLeft < 60 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                padding: '8px 18px',
                borderRadius: '12px',
                border: examSecondsLeft < 60 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                color: examSecondsLeft < 60 ? '#ef4444' : '#10b981',
                fontWeight: 700,
                fontSize: '1.1rem'
              }}>
                <Timer size={20} className={examSecondsLeft < 60 ? 'animate-pulse' : ''} />
                <span>
                  {Math.floor(examSecondsLeft / 60)}:
                  {String(examSecondsLeft % 60).padStart(2, '0')}
                </span>
              </div>

              <button
                onClick={handleFinishExam}
                className="btn btn-primary"
                style={{ background: 'var(--accent-secondary)', padding: '10px 24px', fontWeight: 700, borderRadius: '12px', border: 'none' }}
              >
                Nộp bài
              </button>
            </div>
          </div>

          {/* Main content grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '24px' }}>

            {/* Left side: Question detail */}
            <div>
              {(() => {
                const currentQuestion = activeExam.questions[currentQuestionIndex];
                if (!currentQuestion) return null;

                return (
                  <div className="animate-fade" key={currentQuestion.id}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, background: 'var(--accent-primary)', color: 'white', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {currentQuestionIndex + 1}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Câu {currentQuestionIndex + 1} trên tổng số {activeExam.questions.length} câu</span>
                      <span style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: '#4f46e5',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '8px',
                        marginLeft: 'auto'
                      }}>
                        Môn học: {SUBJECT_NAMES[currentQuestion.subject] || currentQuestion.subject}
                      </span>
                    </div>

                    <p
                      style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1e293b', marginBottom: '24px', lineHeight: 1.6 }}
                      dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(currentQuestion.question) }}
                    />

                    {/* Question Type 1: 4 Options (Single Choice A, B, C, D) */}
                    {(!currentQuestion.type || currentQuestion.type === 'single') && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {currentQuestion.options?.map(option => {
                          const isSelected = examAnswers[currentQuestion.id] === option.key;
                          return (
                            <button
                              key={option.key}
                              type="button"
                              onClick={() => handleSelectOptionSingle(currentQuestion.id, option.key)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '16px',
                                borderRadius: '12px',
                                border: isSelected ? '2px solid var(--accent-primary, #6366f1)' : '1px solid #cbd5e1',
                                background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'white',
                                color: '#1e293b',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontWeight: isSelected ? 700 : 500,
                                fontSize: '0.92rem',
                                transition: 'all 0.15s',
                                gap: '12px'
                              }}
                            >
                              <span style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                background: isSelected ? 'var(--accent-primary, #6366f1)' : '#f1f5f9',
                                color: isSelected ? 'white' : '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.85rem',
                                fontWeight: 800
                              }}>
                                {option.key}
                              </span>
                              <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(option.text) }} />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Question Type 2: True / False (Phần II) */}
                    {currentQuestion.type === 'tf' && (
                      <div style={{ marginBottom: '24px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ padding: '10px', textAlign: 'left' }}>Mệnh đề</th>
                              <th style={{ padding: '10px', width: '90px', textAlign: 'center' }}>Đúng</th>
                              <th style={{ padding: '10px', width: '90px', textAlign: 'center' }}>Sai</th>
                            </tr>
                          </thead>
                          <tbody>
                            {currentQuestion.statements?.map(st => {
                              const userAnsObj = examAnswers[currentQuestion.id] || {};
                              const userVal = userAnsObj[st.id];

                              return (
                                <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '12px 10px' }}>
                                    <strong>{st.id})</strong> <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(st.text) }} />
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectOptionTF(currentQuestion.id, st.id, true)}
                                      className={`btn ${userVal === true ? 'btn-primary' : 'btn-secondary'}`}
                                      style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
                                    >
                                      Đúng
                                    </button>
                                  </td>
                                  <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleSelectOptionTF(currentQuestion.id, st.id, false)}
                                      className={`btn ${userVal === false ? 'btn-primary' : 'btn-secondary'}`}
                                      style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '6px' }}
                                    >
                                      Sai
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Question Type 3: Short Answer (Phần III) */}
                    {currentQuestion.type === 'short' && (
                      <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                          Nhập đáp số / kết quả của bạn:
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Gõ kết quả số học vào đây (ví dụ: 2, 15, 3.14)..."
                          value={examAnswers[currentQuestion.id] || ''}
                          onChange={e => handleSelectOptionShort(currentQuestion.id, e.target.value)}
                          style={{ height: '48px', fontSize: '1rem', fontWeight: 600 }}
                        />
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Prev/Next buttons */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '30px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="btn btn-secondary"
                  style={{ gap: '6px', opacity: currentQuestionIndex === 0 ? 0.5 : 1, cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                  <span>Câu trước</span>
                </button>

                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(activeExam.questions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === activeExam.questions.length - 1}
                  className="btn btn-secondary"
                  style={{ gap: '6px', opacity: currentQuestionIndex === activeExam.questions.length - 1 ? 0.5 : 1, cursor: currentQuestionIndex === activeExam.questions.length - 1 ? 'not-allowed' : 'pointer' }}
                >
                  <span>Câu tiếp theo</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Right side: Navigation status panel */}
            <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', paddingLeft: '24px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>TIẾN ĐỘ BÀI LÀM</h4>
              {(() => {
                const subjectsInExam = [];
                activeExam.questions.forEach(q => {
                  if (!subjectsInExam.includes(q.subject)) {
                    subjectsInExam.push(q.subject);
                  }
                });

                return subjectsInExam.map(subj => {
                  const subjQuestions = activeExam.questions.map((q, idx) => ({ q, idx })).filter(item => item.q.subject === subj);
                  return (
                    <div key={subj} style={{ marginBottom: '16px' }}>
                      <h5 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {SUBJECT_NAMES[subj] || subj}
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {subjQuestions.map(({ q, idx }) => {
                          const isAnswered = !!examAnswers[q.id];
                          const isCurrent = idx === currentQuestionIndex;
                          return (
                            <button
                              key={q.id}
                              onClick={() => setCurrentQuestionIndex(idx)}
                              style={{
                                width: '100%',
                                aspectRatio: '1',
                                borderRadius: '8px',
                                border: isCurrent ? '2px solid var(--accent-primary)' : isAnswered ? 'none' : '1px solid #cbd5e1',
                                background: isAnswered ? 'var(--accent-primary)' : 'transparent',
                                color: isAnswered ? 'white' : '#64748b',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.15s'
                              }}
                            >
                              {idx + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Exam results / review */}
      {examMode === 'reviewing' && activeExam && (
        <div className="animate-fade">

          {/* Scorecard panel */}
          <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.55))', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '99px' }}>
                  KẾT QUẢ THI THỬ
                </span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#1e293b', marginTop: '6px' }}>{activeExam.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                  Khối thi: <strong style={{ color: 'var(--accent-primary)' }}>{reviewingPastAttempt?.block}</strong> •
                  Thời gian làm: <strong>{reviewingPastAttempt?.timeSpent || '30:00'}</strong> •
                  Ngày thi: <strong>{reviewingPastAttempt?.date || 'Hôm nay'}</strong>
                </p>
              </div>

              {/* Big score box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Điểm Số</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: reviewingPastAttempt?.score >= 24 || reviewingPastAttempt?.score >= 8 ? '#10b981' : reviewingPastAttempt?.score >= 18 || reviewingPastAttempt?.score >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {reviewingPastAttempt?.score?.toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/{reviewingPastAttempt?.block === 'SINGLE' ? '10.0' : '30.0'}</span>
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>Tổng số câu: <strong style={{ color: '#10b981' }}>{reviewingPastAttempt?.totalQuestions || activeExam.questions.length} câu</strong></div>
                  <div style={{ marginTop: '4px' }}>Đánh giá: <strong>{(reviewingPastAttempt?.score >= 24 || reviewingPastAttempt?.score >= 8) ? 'Xuất sắc! 🎉' : (reviewingPastAttempt?.score >= 18 || reviewingPastAttempt?.score >= 6.5) ? 'Khá tốt! 👍' : 'Cần cố gắng thêm! 💪'}</strong></div>
                </div>

                {reviewingPastAttempt?.subjectBreakdown && (
                  <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>KẾT QUẢ MÔN HỌC:</strong>
                    {Object.entries(reviewingPastAttempt.subjectBreakdown).map(([subKey, data]) => (
                      <div key={subKey} style={{ fontSize: '0.82rem', marginBottom: '2px' }}>
                        {SUBJECT_NAMES[subKey] || subKey}: <strong>{data.subjectScore?.toFixed(1)}/10.0 đ</strong>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleExitExam}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                >
                  Quay lại đề thi
                </button>
              </div>
            </div>
          </div>

          {/* Explanations section */}
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileText size={18} color="var(--accent-primary)" /> Chi tiết đáp án và Lời giải giải thích
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {activeExam.questions.map((q, idx) => {
                const userAns = reviewingPastAttempt?.selectedAnswers?.[q.id];
                const qType = q.type || 'single';
                let isCorrect = false;

                if (qType === 'single') {
                  isCorrect = userAns === q.correctKey;
                } else if (qType === 'short') {
                  isCorrect = userAns && String(userAns).trim().toLowerCase() === String(q.correctAnswer).trim().toLowerCase();
                } else if (qType === 'tf') {
                  let correctSts = 0;
                  q.statements?.forEach(st => {
                    if (userAns && userAns[st.id] === st.correct) correctSts++;
                  });
                  isCorrect = correctSts === 4;
                }

                return (
                  <div key={q.id} className="glass-panel" style={{ borderLeft: isCorrect ? '4px solid #10b981' : '4px solid #ef4444', padding: '24px' }}>
                    {/* Question header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Câu {idx + 1} ({SUBJECT_NAMES[q.subject] || q.subject}):
                      </span>

                      {isCorrect ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 700, fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                          <Check size={14} /> Đúng 100%
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                          <X size={14} /> Chưa chính xác / Chưa làm
                        </span>
                      )}
                    </div>

                    <p
                      style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px', lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(q.question) }}
                    />

                    {/* Question Type 1: Single Choice */}
                    {qType === 'single' && q.options && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                        {q.options.map(option => {
                          const isCorrectOption = option.key === q.correctKey;
                          const isStudentOption = option.key === userAns;

                          let optBg = 'white';
                          let optBorder = '1px solid #e2e8f0';
                          let optColor = '#1e293b';

                          if (isCorrectOption) {
                            optBg = '#ecfdf5';
                            optBorder = '2px solid #10b981';
                            optColor = '#065f46';
                          } else if (isStudentOption && !isCorrectOption) {
                            optBg = '#fef2f2';
                            optBorder = '2px solid #ef4444';
                            optColor = '#991b1b';
                          }

                          return (
                            <div
                              key={option.key}
                              style={{
                                padding: '12px 16px',
                                borderRadius: '10px',
                                background: optBg,
                                border: optBorder,
                                color: optColor,
                                fontSize: '0.88rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                              }}
                            >
                              <strong style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: isCorrectOption ? '#10b981' : isStudentOption ? '#ef4444' : '#f1f5f9',
                                color: isCorrectOption || isStudentOption ? 'white' : '#64748b',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.78rem'
                              }}>
                                {option.key}
                              </strong>
                              <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(option.text) }} />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Question Type 2: True / False */}
                    {qType === 'tf' && q.statements && (
                      <div style={{ marginBottom: '16px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                          <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                              <th style={{ padding: '8px', textAlign: 'left' }}>Mệnh đề</th>
                              <th style={{ padding: '8px', width: '110px', textAlign: 'center' }}>Lựa chọn của bạn</th>
                              <th style={{ padding: '8px', width: '110px', textAlign: 'center' }}>Đáp án đúng</th>
                            </tr>
                          </thead>
                          <tbody>
                            {q.statements.map(st => {
                              const stUserVal = userAns?.[st.id];
                              const isStCorrect = stUserVal === st.correct;

                              return (
                                <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '10px 8px' }}>
                                    <strong>{st.id})</strong> <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(st.text) }} />
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center', color: isStCorrect ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                    {stUserVal === true ? 'Đúng' : stUserVal === false ? 'Sai' : 'Chưa làm'}
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'center', fontWeight: 700, color: '#10b981' }}>
                                    {st.correct ? 'Đúng' : 'Sai'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Question Type 3: Short Answer */}
                    {qType === 'short' && (
                      <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 16px', borderRadius: '8px', fontSize: '0.9rem' }}>
                        <div>Bạn đã nhập: <strong style={{ color: isCorrect ? '#10b981' : '#ef4444' }}>{userAns || '(Chưa nhập)'}</strong></div>
                        <div style={{ marginTop: '4px' }}>Đáp án đúng chuẩn: <strong style={{ color: '#10b981' }}>{q.correctAnswer}</strong></div>
                      </div>
                    )}

                    {/* Explanation Box */}
                    <div style={{
                      padding: '14px 18px',
                      background: 'rgba(99, 102, 241, 0.05)',
                      borderRadius: '10px',
                      border: '1px dashed rgba(99, 102, 241, 0.25)',
                      fontSize: '0.88rem',
                      color: '#334155',
                      lineHeight: 1.6
                    }}>
                      <strong style={{ display: 'block', marginBottom: '6px', fontSize: '0.8rem', color: '#4f46e5' }}>💡 LỜI GIẢI CHI TIẾT:</strong>
                      <div dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(q.explanation) }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
