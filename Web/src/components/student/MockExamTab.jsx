import { useState, useEffect, useCallback, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { BLOCKS, SYSTEM_BLOCK_EXAMS, SUBJECT_NAMES } from '../../data/mockExamsData';
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

  const currentSubjectQuestions = activeExam?.questions?.filter(q => q.subject === selectedSubjectTab) || [];
  const currentQuestion = currentSubjectQuestions[currentQuestionIndex] || currentSubjectQuestions[0];

  return (
    <div className="animate-fade">
      {/* ─── 1. SELECTION & OVERVIEW VIEW ────────────────────────────────────── */}
      {examMode === null && (
        <div>
          {/* Header Card */}
          <div className="glass-panel" style={{ padding: '28px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.55))' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ClipboardList size={28} color="var(--accent-primary)" /> Thi Thử Đại Học THPT Quốc Gia (Format Bộ GD&ĐT 2025+)
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Chọn thi riêng lẻ từng <strong>Môn học</strong> (50 phút) hoặc thi toàn bộ <strong>Tổ hợp Khối thi</strong> (Toán - Lý - Hóa, Văn - Sử - Địa...).
                </p>
              </div>

              {/* Selector Bar 1: Block Selector */}
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} color="var(--accent-primary)" /> 1. Chọn Tổ hợp Khối thi Đại Học:
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
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
              </div>
            </div>
          </div>

          {/* Integrated System Exam Cards & Single Subject Selection */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BookOpen size={20} color="var(--accent-primary)" /> Danh sách Môn thi & Đề thi THPT Quốc Gia ({BLOCKS[selectedBlockKey].name})
            </h3>

            {(() => {
              const systemExam = SYSTEM_BLOCK_EXAMS.find(ex => ex.block === selectedBlockKey);
              if (!systemExam) return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có đề thi hệ thống cho khối này.</p>;

              const subjects = Array.from(new Set(systemExam.questions.map(q => q.subject)));

              return (
                <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.04), rgba(255, 255, 255, 0.9))', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(99,102,241,0.1)', padding: '4px 12px', borderRadius: '99px' }}>
                        Đề thi THPT Quốc gia Chính thức
                      </span>
                      <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginTop: '8px' }}>
                        {systemExam.title}
                      </h4>
                    </div>
                  </div>

                  {/* Explicit Subject Selection Options */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                      👉 Vui lòng chọn phương thức làm bài thi bên dưới:
                    </div>

                    {/* Option 1: Full Block Multi-Subject Exam */}
                    <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: '2px solid #6366f1', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <div style={{ fontWeight: 800, color: '#4338ca', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          🚀 Thi toàn bộ Tổ hợp {BLOCKS[selectedBlockKey].name} ({subjects.map(s => SUBJECT_NAMES[s]).join(' - ')})
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>
                          Thời gian: <strong>{systemExam.duration} phút</strong> | Thang điểm xét tuyển: <strong>30.0 điểm</strong> (3 Môn liên tiếp)
                        </div>
                      </div>
                      <button
                        onClick={() => handleStartExam(systemExam, null)}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: 'linear-gradient(135deg, #6366f1, #3b82f6)'
                        }}
                      >
                        <span>Bắt đầu làm bài</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

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
          </div>

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

                    {/* Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {currentQuestion.options.map(option => {
                        const isSelected = examAnswers[currentQuestion.id] === option.key;
                        return (
                          <button
                            key={option.key}
                            onClick={() => handleSelectOption(currentQuestion.id, option.key)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '16px',
                              borderRadius: '12px',
                              border: isSelected ? '2px solid var(--accent-primary)' : '1px solid #cbd5e1',
                              background: isSelected ? 'var(--accent-primary-glow)' : 'white',
                              color: '#1e293b',
                              textAlign: 'left',
                              cursor: 'pointer',
                              fontWeight: isSelected ? 600 : 500,
                              fontSize: '0.92rem',
                              transition: 'all 0.15s',
                              gap: '12px'
                            }}
                          >
                            <span style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              border: isSelected ? 'none' : '1px solid #94a3b8',
                              background: isSelected ? 'var(--accent-primary)' : 'transparent',
                              color: isSelected ? 'white' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}>
                              {option.key}
                            </span>
                            <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(option.text) }} />
                          </button>
                        );
                      })}
                    </div>
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
                  Thời gian hoàn thành: <strong>{reviewingPastAttempt?.timeSpent}</strong> •
                  Ngày thi: <strong>{reviewingPastAttempt?.date?.split('-').reverse().join('/')}</strong>
                </p>
              </div>

              {/* Big score box */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Điểm Số</span>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: reviewingPastAttempt?.score >= 8 ? '#10b981' : reviewingPastAttempt?.score >= 5 ? '#f59e0b' : '#ef4444' }}>
                    {reviewingPastAttempt?.score?.toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 400 }}>/10.0</span>
                  </div>
                </div>

                <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>Tổng câu đúng: <strong style={{ color: '#10b981' }}>{reviewingPastAttempt?.correctAnswers}/{reviewingPastAttempt?.totalQuestions}</strong></div>
                  <div style={{ marginTop: '4px' }}>Đánh giá: <strong>{reviewingPastAttempt?.score >= 8 ? 'Xuất sắc! 🎉' : reviewingPastAttempt?.score >= 6.5 ? 'Khá tốt! 👍' : 'Cần cố gắng thêm! 💪'}</strong></div>
                </div>

                {reviewingPastAttempt?.subjectBreakdown && (
                  <div style={{ borderLeft: '1px solid rgba(0,0,0,0.08)', paddingLeft: '20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MÔN HỌC CHI TIẾT:</strong>
                    {Object.entries(reviewingPastAttempt.subjectBreakdown).map(([subKey, data]) => (
                      <div key={subKey} style={{ fontSize: '0.82rem', marginBottom: '2px' }}>
                        {SUBJECT_NAMES[subKey] || subKey}: <strong>{data.correct}/{data.total}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleExitExam}
                  className="btn btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '12px', border: '1px solid #cbd5e1' }}
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
                const studentAns = getSelectedAnswerKey(q, reviewingPastAttempt);
                const isCorrect = studentAns === q.correctKey;

                return (
                  <div key={q.id} className="glass-panel" style={{ borderLeft: isCorrect ? '4px solid #10b981' : '4px solid #ef4444', padding: '24px' }}>

                    {/* Question title */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' }}>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Câu {idx + 1}:
                      </span>

                      {isCorrect ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 600, fontSize: '0.8rem', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          <Check size={12} /> Trả lời đúng
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontWeight: 600, fontSize: '0.8rem', background: 'rgba(239, 68, 68, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                          <X size={12} /> Trả lời sai (hoặc chưa làm)
                        </span>
                      )}
                    </div>

                    <p
                      style={{ fontSize: '0.98rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px', lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(q.question) }}
                    />

                    {/* Options show */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px', marginBottom: '16px' }}>
                      {q.options.map(option => {
                        const isCorrectOption = option.key === q.correctKey;
                        const isStudentOption = option.key === studentAns;

                        let optBg = 'white';
                        let optBorder = '1px solid #e2e8f0';
                        let optColor = '#1e293b';

                        if (isCorrectOption) {
                          optBg = 'rgba(16, 185, 129, 0.08)';
                          optBorder = '1px solid #10b981';
                          optColor = '#065f46';
                        } else if (isStudentOption && !isCorrect) {
                          optBg = 'rgba(239, 68, 68, 0.08)';
                          optBorder = '1px solid #ef4444';
                          optColor = '#991b1b';
                        }

                        return (
                          <div
                            key={option.key}
                            style={{
                              padding: '12px 16px',
                              borderRadius: '8px',
                              background: optBg,
                              border: optBorder,
                              color: optColor,
                              fontSize: '0.88rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                          >
                            <strong style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isCorrectOption ? '#10b981' : isStudentOption ? '#ef4444' : '#f1f5f9',
                              color: isCorrectOption || isStudentOption ? 'white' : '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.72rem'
                            }}>
                              {option.key}
                            </strong>
                            <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(option.text) }} />
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation Box */}
                    <div style={{
                      padding: '14px 18px',
                      background: 'rgba(99, 102, 241, 0.04)',
                      borderRadius: '8px',
                      border: '1px dashed rgba(99, 102, 241, 0.2)',
                      fontSize: '0.85rem',
                      color: '#4f46e5',
                      lineHeight: 1.5
                    }}>
                      <strong style={{ display: 'block', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.75rem', color: '#6366f1' }}>LỜI GIẢI CHI TIẾT:</strong>
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
