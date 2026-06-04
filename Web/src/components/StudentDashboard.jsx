import { useContext, useState, useEffect, useCallback } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  BLOCKS, 
  SYSTEM_BLOCK_EXAMS, 
  SUBJECT_NAMES 
} from '../data/mockExamsData';
import { 
  Award, 
  BookOpen, 
  HelpCircle, 
  Calendar, 
  ArrowRight,
  Sparkles,
  Send,
  Star,
  Users,
  CheckCircle,
  FileText,
  UserCheck,
  Brain,
  Trash2,
  Plus,
  Compass,
  Clock,
  ChevronRight,
  ChevronLeft,
  Heart,
  Utensils,
  Wallet,
  LayoutGrid,
  RefreshCw,
  Timer,
  Check,
  X,
  ClipboardList
} from 'lucide-react';
import SmartFlashcard from './SmartFlashcard';


const getTimestamp = () => Date.now();

export default function StudentDashboard({ setActiveTab }) {
  const { 
    currentRole,
    studentSubTab,
    setStudentSubTab,
    selectedStudentId, 
    mockExamHistory,
    saveMockExamResult,
    customExams,
    students, 
    tutorChat,
    teachers,
    conductLogs,
    teacherEvaluations,
    submitTeacherEvaluation,
    assignments,
    deadlines,
    addDeadline,
    toggleDeadlineDone,
    deleteDeadline,
    submissions,
    submitAssignment,
    attendanceLogs,
    clubs,
    clubApplications,
    submitClubApplication,
    learningResources,
    careerTestScores,
    saveCareerTest,
    cafeteriaMenu,
    cafeteriaRegistrations,
    cafeteriaFeedback,
    studentWallets,
    submitMealFeedback,
    spendStudentWallet
  } = useContext(AppContext);

  // Use shared subTab from context (controlled by Sidebar)
  const subTab = studentSubTab;
  const setSubTab = setStudentSubTab;

  const isStudent = currentRole === 'student';

  const [submissionTexts, setSubmissionTexts] = useState({}); // assignmentId -> text

  // Deadline states
  const [newDlTitle, setNewDlTitle] = useState('');
  const [newDlDate, setNewDlDate] = useState('');
  const [newDlPriority, setNewDlPriority] = useState('medium');

  // Mock Exam States
  const [selectedBlockKey, setSelectedBlockKey] = useState('A00');
  const [activeExam, setActiveExam] = useState(null);
  const [examMode, setExamMode] = useState(null); // 'taking', 'reviewing', or null
  const [examAnswers, setExamAnswers] = useState({});
  const [examSecondsLeft, setExamSecondsLeft] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [reviewingPastAttempt, setReviewingPastAttempt] = useState(null);

  // Form states
  const [evalTeacherId, setEvalTeacherId] = useState(teachers && teachers.length > 0 ? teachers[0].id : '');
  const [evalRating, setEvalRating] = useState(5);
  const [evalComment, setEvalComment] = useState('');

  // Part 6 States: CLB application
  const [selectedClubId, setSelectedClubId] = useState(clubs && clubs.length > 0 ? clubs[0].id : '');
  const [clubAppIntro, setClubAppIntro] = useState('');


  // Part 6 States: Quizzes trắc nghiệm
  const [activeQuizStep, setActiveQuizStep] = useState(0); // 0: start, 1: questions, 2: score
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(0);

  // Part 6 States: RIASEC Test Questionnaire
  const [riasecAnswers, setRiasecAnswers] = useState({ R: 3, I: 3, A: 3, S: 3, E: 3, C: 3 });

  // Part 6 States: Counseling chat box
  const [counselorInput, setCounselorInput] = useState('');
  const [counselorIsTyping, setCounselorIsTyping] = useState(false);
  const [counselorMood, setCounselorMood] = useState(null); // null | 'happy' | 'okay' | 'stressed' | 'sad'
  const [counselorMsgCount, setCounselorMsgCount] = useState(0);

  // Part 8 States: Smart Cafeteria Feedback
  const [mealRateInput, setMealRateInput] = useState(5);
  const [mealCommentInput, setMealCommentInput] = useState('');

  // Part 8 States: Heatmap/Competency
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Part 8 States: ID Card & Wallet
  const [idCardFlipped, setIdCardFlipped] = useState(false);
  const [canteenItem, setCanteenItem] = useState('Nước ngọt');
  const [canteenPrice, setCanteenPrice] = useState(15000);

  // Active student lookup (must be safe in hook initializers)
  const student = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  // These hooks use student id and must be declared after student lookup but before early return
  const [hasCompletedRiasec, setHasCompletedRiasec] = useState(() => {
    return careerTestScores ? careerTestScores.some(s => s.studentId === student?.id) : false;
  });

  const [counselorHistory, setCounselorHistory] = useState(() => [
    { sender: 'counselor', text: '👋 Chào em! Thầy là chuyên gia tư vấn tâm lý học đường của nhà trường.\n\nKỳ thi tốt nghiệp THPT sắp đến, thầy hiểu rằng đây là giai đoạn các em chịu rất nhiều áp lực. Thầy ở đây để lắng nghe và đồng hành cùng em.\n\n💬 Em có thể hỏi thầy về:\n• Căng thẳng thi cử & quản lý cảm xúc\n• Định hướng ngành nghề & kết quả RIASEC\n• Kỹ năng học tập & lập kế hoạch ôn thi\n• Các mối quan hệ & vấn đề cá nhân\n\nHôm nay em đang cảm thấy thế nào?', timestamp: getTimestamp() }
  ]);

  const calculateExamScore = useCallback((exam, answers) => {
    let correctCount = 0;
    exam.questions.forEach(q => {
      if (answers[q.id] === q.correctKey) {
        correctCount++;
      }
    });
    const score = (correctCount / exam.questions.length) * 10;
    return { score, correctCount };
  }, []);

  const submitExam = useCallback(() => {
    // Find activeExam inside helper
    setActiveExam(currentActiveExam => {
      if (!currentActiveExam) return null;
      
      setExamAnswers(currentAnswers => {
        setExamSecondsLeft(currentSecs => {
          const durationUsed = currentActiveExam.duration * 60 - currentSecs;
          const minutesUsed = Math.floor(durationUsed / 60);
          const secondsUsed = durationUsed % 60;
          const timeSpentStr = `${String(minutesUsed).padStart(2, '0')}:${String(secondsUsed).padStart(2, '0')}`;
          
          const { score, correctCount } = calculateExamScore(currentActiveExam, currentAnswers);
          
          // Calculate subject-specific breakdown
          const subjectBreakdown = {};
          currentActiveExam.questions.forEach(q => {
            if (!subjectBreakdown[q.subject]) {
              subjectBreakdown[q.subject] = { correct: 0, total: 0 };
            }
            subjectBreakdown[q.subject].total++;
            if (currentAnswers[q.id] === q.correctKey) {
              subjectBreakdown[q.subject].correct++;
            }
          });

          const newResult = {
            studentId: student?.id,
            studentName: student?.name,
            class: student?.class,
            block: currentActiveExam.block || selectedBlockKey,
            examId: currentActiveExam.id,
            title: currentActiveExam.title,
            score: score,
            totalQuestions: currentActiveExam.questions.length,
            correctAnswers: correctCount,
            timeSpent: timeSpentStr,
            selectedAnswers: currentAnswers,
            subjectBreakdown: subjectBreakdown
          };

          saveMockExamResult(newResult);
          setExamMode('reviewing');
          setReviewingPastAttempt({
            ...newResult,
            date: new Date().toISOString().split('T')[0]
          });
          
          return currentSecs;
        });
        return currentAnswers;
      });

      return currentActiveExam;
    });
  }, [student, selectedBlockKey, saveMockExamResult, calculateExamScore]);

  const handleAutoSubmit = useCallback(() => {
    alert('Hết giờ làm bài! Hệ thống tự động nộp bài.');
    submitExam();
  }, [submitExam]);

  const handleFinishExam = useCallback(() => {
    if (!activeExam) return;
    if (window.confirm('Bạn có chắc chắn muốn nộp bài thi?')) {
      submitExam();
    }
  }, [activeExam, submitExam]);

  // Timer effect for Mock Exam
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

  if (!student) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Không tìm thấy thông tin học sinh</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }

  const handleStartExam = (exam) => {
    setActiveExam(exam);
    setExamMode('taking');
    setExamAnswers({});
    setExamSecondsLeft(exam.duration * 60);
    setCurrentQuestionIndex(0);
    setReviewingPastAttempt(null);
  };

  const handleSelectOption = (questionId, optionKey) => {
    setExamAnswers(prev => ({
      ...prev,
      [questionId]: optionKey
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

  const getSelectedAnswerKey = (q, attempt) => {
    if (attempt && attempt.selectedAnswers && attempt.selectedAnswers[q.id]) {
      return attempt.selectedAnswers[q.id];
    }
    if (!attempt) return null;
    // Mock for initial seed data
    const qIndex = activeExam?.questions?.findIndex(question => question.id === q.id) ?? 0;
    if (qIndex < attempt.correctAnswers) {
      return q.correctKey;
    }
    const wrongKeys = q.options.map(o => o.key).filter(k => k !== q.correctKey);
    return wrongKeys[0] || 'A';
  };

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



  // AI Tutor questions count
  const tutorMsgCount = tutorChat.filter(m => m.sender === 'user').length;

  // Conduct points
  const studentConductLogs = conductLogs ? conductLogs.filter(l => l.studentId === student.id) : [];
  const conductScore = 100 + studentConductLogs.reduce((acc, curr) => acc + curr.points, 0);
  const conductGrade = conductScore >= 90 ? 'Tốt' : conductScore >= 70 ? 'Khá' : conductScore >= 50 ? 'Trung bình' : 'Yếu';
  
  // Rater Evaluations
  const myEvaluations = teacherEvaluations ? teacherEvaluations.filter(e => e.raterRole === 'student' && e.raterName === student.name) : [];

  // Form, CLB, Flashcards, Quiz, counseling, and canteen states moved to the top level

  const handleEvaluationSubmit = (e) => {
    e.preventDefault();
    const finalTeacherId = evalTeacherId || (teachers && teachers.length > 0 ? teachers[0].id : '');
    if (!finalTeacherId || !evalComment.trim()) return;

    submitTeacherEvaluation(finalTeacherId, evalRating, evalComment, 'student', student.name);
    setEvalComment('');
    alert('Cảm ơn ý kiến của bạn! Đánh giá chất lượng giảng dạy đã được gửi trực tuyến tới Ban Giám Hiệu.');
  };

  const handleSubSubmit = (assignmentId) => {
    const text = submissionTexts[assignmentId];
    if (!text || !text.trim()) {
      alert('Vui lòng nhập nội dung câu trả lời/bài làm trước khi nộp!');
      return;
    }
    submitAssignment(assignmentId, student.id, text);
    setSubmissionTexts(prev => ({ ...prev, [assignmentId]: '' }));
    alert('Đã nộp bài làm thành công! Hệ thống sẽ cập nhật trạng thái chấm điểm của giáo viên bộ môn.');
  };

  const handleClubApply = (e) => {
    e.preventDefault();
    if (!clubAppIntro.trim()) return;
    submitClubApplication(student.id, selectedClubId, clubAppIntro);
    setClubAppIntro('');
    alert('Đã nộp đơn ứng tuyển CLB thành công! Ban giám hiệu sẽ rà soát đơn duyệt sớm nhất.');
  };


  // Static Quiz questions mapping
  const quizQuestions = [
    { id: 1, q: 'Tích phân xác định ∫[0, 1] x dx có giá trị bằng:', a: '1/2', b: '1', c: '2', d: '0', ans: 'a' },
    { id: 2, q: 'Hiện tượng cộng hưởng xảy ra trong mạch RLC nối tiếp khi:', a: 'ZL > ZC', b: 'ZL < ZC', c: 'ZL = ZC', d: 'R = ZL', ans: 'c' },
    { id: 3, q: 'Tác giả của tác phẩm truyện ngắn danh tiếng "Vợ nhặt" là ai?', a: 'Tô Hoài', b: 'Kim Lân', c: 'Nam Cao', d: 'Nguyễn Tuân', ans: 'b' },
    { id: 4, q: 'Trong tiếng Anh, từ nào mang ý nghĩa là "người hướng dẫn/cố vấn"?', a: 'Mentor', b: 'Classmate', c: 'Principal', d: 'Schoolyard', ans: 'a' },
    { id: 5, q: 'Biểu thức tính tổng trở Z của mạch RLC nối tiếp là:', a: 'Z = R + ZL + ZC', b: 'Z = R + ZL - ZC', c: 'Z = sqrt(R² + (ZL - ZC)²)', d: 'Z = R² + (ZL - ZC)²', ans: 'c' }
  ];

  const handleQuizSubmit = () => {
    let score = 0;
    quizQuestions.forEach(q => {
      if (selectedAnswers[q.id] === q.ans) {
        score++;
      }
    });
    setQuizScore(score);
    setActiveQuizStep(2);
  };

  const handleResetQuiz = () => {
    setSelectedAnswers({});
    setQuizScore(0);
    setActiveQuizStep(1);
  };

  // RIASEC scoring calculations & SVG Radar polygon generator
  const handleRiasecSave = () => {
    saveCareerTest(student.id, riasecAnswers);
    setHasCompletedRiasec(true);
    alert('Đã lưu kết quả khảo sát RIASEC thành công!');
  };

  // Get student's RIASEC scores from local state or context database
  const getRiasecScores = () => {
    const contextScore = careerTestScores ? careerTestScores.find(s => s.studentId === student.id) : null;
    return contextScore || riasecAnswers;
  };

  const getRiasecText = (scores) => {
    // Find top personality types
    const entries = Object.entries(scores).filter(([k]) => k !== 'studentId');
    entries.sort((a, b) => b[1] - a[1]);
    const topTrait = entries[0][0];

    switch (topTrait) {
      case 'R': return { name: 'R - Kỹ thuật (Realistic)', desc: 'Thích làm việc với máy móc, công cụ, bản vẽ kỹ thuật. Phù hợp các khối ngành Kỹ sư, Lập trình điều khiển, Robotics.', jobs: 'Kỹ sư cơ điện tử, Kỹ sư phần mềm, Kiến trúc sư, Chuyên gia tự động hóa.' };
      case 'I': return { name: 'I - Nghiên cứu (Investigative)', desc: 'Thích quan sát, tìm tòi, suy luận logic để giải quyết vấn đề toán/lý/hóa học. Thích làm việc độc lập nghiên cứu.', jobs: 'Nhà khoa học dữ liệu, Nhà nghiên cứu toán học, Lập trình viên AI, Bác sĩ học thuật.' };
      case 'A': return { name: 'A - Nghệ thuật (Artistic)', desc: 'Thích tự do sáng tạo nghệ thuật, giàu trí tưởng tượng, cảm xúc nhạy bén và kỹ năng biểu đạt cao.', jobs: 'Nhà thiết kế đồ họa, Biên kịch phim, Đạo diễn nghệ thuật, Nhà báo tự do.' };
      case 'S': return { name: 'S - Xã hội (Social)', desc: 'Thích hỗ trợ, đào tạo, giao lưu và chăm sóc những người xung quanh. Có tinh thần đồng đội cao.', jobs: 'Giảng viên sư phạm, Nhà tâm lý học, Quản trị nhân sự, Chuyên viên công tác xã hội.' };
      case 'E': return { name: 'E - Quản lý (Enterprising)', desc: 'Thích dẫn dắt đội ngũ, quản lý kế hoạch dự án, có khả năng đàm phán thuyết phục tốt và ham học hỏi.', jobs: 'Quản lý dự án start-up, Giám đốc tài chính, Chuyên viên marketing, Luật sư đàm phán.' };
      case 'C': return { name: 'C - Nghiệp vụ (Conventional)', desc: 'Thích tính toán số liệu, lập bảng kiểm soát, ngăn nắp và thực thi chính xác các quy trình kế toán.', jobs: 'Kế toán trưởng, Kiểm toán viên nhà nước, Chuyên viên thống kê thuế, Quản trị cơ sở dữ liệu.' };
      default: return { name: 'Hài hòa', desc: 'Sở hữu nhiều phẩm chất tính cách nghề nghiệp cân bằng.', jobs: 'Nhiều lĩnh vực đa dạng.' };
    }
  };

  const currentScores = getRiasecScores();
  const riasecInfo = getRiasecText(currentScores);

  // Generate radar points for SVG (Radar Graph)
  const getRadarPointsPath = (scores) => {
    const center = 150;
    const maxVal = 5;
    const radarRadius = 100;
    const axes = [
      { k: 'R', angle: 0 },
      { k: 'I', angle: Math.PI / 3 },
      { k: 'A', angle: (2 * Math.PI) / 3 },
      { k: 'S', angle: Math.PI },
      { k: 'E', angle: (4 * Math.PI) / 3 },
      { k: 'C', angle: (5 * Math.PI) / 3 }
    ];

    const points = axes.map(axis => {
      const score = scores[axis.k] || 3;
      const length = (score / maxVal) * radarRadius;
      const x = center + length * Math.sin(axis.angle);
      const y = center - length * Math.cos(axis.angle);
      return `${x},${y}`;
    });

    return points.join(' ');
  };

  // AI Counselor – rich multi-turn contextual response engine
  const generateCounselorReply = (txt, msgCount, mood, studentInfo, riasecProfile) => {
    const norm = txt.toLowerCase();
    const studentName = studentInfo.name.split(' ').pop(); // use last name (Vietnamese)
    const gpaVal = parseFloat((Object.values(studentInfo.grades).reduce((a, b) => a + b, 0) / Object.values(studentInfo.grades).length).toFixed(1));

    // === EMERGENCY / SELF-HARM DETECTION ===
    if (norm.includes('tự tử') || norm.includes('không muốn sống') || norm.includes('kết thúc tất cả') || norm.includes('chán sống')) {
      return `💙 Em ơi, thầy rất lo cho em khi nghe điều này. Em không đơn độc – thầy ở đây và nhà trường luôn bảo vệ em.\n\nXin hãy gọi ngay **Đường dây hỗ trợ sức khỏe tâm thần 1800 599 920** (miễn phí, 24/7) hoặc tìm gặp thầy cô ngay hôm nay.\n\nEm có thể kể cho thầy nghe thêm chuyện gì đang xảy ra không? Thầy lắng nghe em.`;
    }

    // === STRESS / ANXIETY (detailed) ===
    if (norm.includes('áp lực') || norm.includes('lo lắng') || norm.includes('lo sợ') || norm.includes('hoảng loạn') || norm.includes('panic')) {
      return `💙 Cảm ơn em đã chia sẻ. Áp lực trước kỳ thi là phản ứng hoàn toàn bình thường của não bộ – nó thực ra là bằng chứng em đang coi trọng việc học.\n\n🧘 **3 kỹ thuật giảm lo âu tức thời:**\n• **Thở 4-7-8:** Hít vào 4 giây → Nín thở 7 giây → Thở ra 8 giây. Lặp 3 lần.\n• **Kỹ thuật 5-4-3-2-1:** Nhìn 5 thứ, nghe 4 âm thanh, chạm 3 bề mặt, ngửi 2 mùi, nếm 1 vị – giúp em về hiện tại.\n• **"Hộp lo lắng":** Viết nỗi lo ra giấy, gấp lại, đặt sang một bên – não bộ sẽ "tạm đóng" vấn đề đó.\n\nEm đang lo nhất về điều gì? Thi cử, gia đình, hay một vấn đề khác?`;
    }

    // === TIRED / BURNOUT ===
    if (norm.includes('mệt') || norm.includes('kiệt sức') || norm.includes('burnout') || norm.includes('không ngủ được') || norm.includes('mất ngủ')) {
      return `😴 Thầy hiểu rồi – kiệt sức học tập là tín hiệu cơ thể em cần được nạp lại năng lượng, không phải dấu hiệu của sự yếu đuối.\n\n⚡ **Giao thức phục hồi năng lượng:**\n• Ngủ đủ **7–8 tiếng**, đặc biệt quan trọng: ngủ trước **23h** vì não củng cố trí nhớ trong giấc ngủ sâu.\n• Sau mỗi **50 phút học**, nghỉ **10 phút** theo kỹ thuật Pomodoro.\n• Bổ sung protein (trứng, sữa, thịt nạc) và uống đủ nước – não cần nước để hoạt động tốt.\n• Tránh học sau **22h** – học khuya làm giảm khả năng ghi nhớ 40%.\n\n${gpaVal >= 8.5 ? `GPA của em là ${gpaVal} – rất xuất sắc! Em xứng đáng được nghỉ ngơi sau bao nỗ lực.` : `GPA của em là ${gpaVal} – hãy ôn theo thứ tự ưu tiên môn yếu trước.`}\n\nEm có muốn thầy giúp lập thời gian biểu ôn thi cân bằng không?`;
    }

    // === DEPRESSION / SADNESS ===
    if (norm.includes('buồn') || norm.includes('khóc') || norm.includes('cô đơn') || norm.includes('không ai hiểu') || norm.includes('chán nản')) {
      return `🤗 Em ơi, cảm xúc của em hoàn toàn hợp lệ. Được phép buồn – điều đó cho thấy em đang cảm nhận cuộc sống sâu sắc.\n\nNhà tâm lý học Viktor Frankl từng nói: *"Giữa kích thích và phản ứng, có một khoảng không gian. Trong không gian đó là quyền tự do và sức mạnh của ta."*\n\n💜 **Những điều nhỏ giúp nâng tinh thần:**\n• Ghi lại **3 điều em biết ơn** mỗi tối – khoa học chứng minh giúp tái cấu trúc não bộ sau 21 ngày.\n• Nói chuyện với người bạn tin tưởng – đừng mang gánh nặng một mình.\n• Vận động 20 phút/ngày – cơ thể tiết Endorphin tự nhiên như "thuốc chống trầm cảm".\n\nEm muốn chia sẻ thêm chuyện gì đang xảy ra không? Thầy không vội đâu.`;
    }

    // === RIASEC / CAREER GUIDANCE ===
    if (norm.includes('riasec') || norm.includes('chọn ngành') || norm.includes('hướng nghiệp') || norm.includes('nghề nghiệp') || norm.includes('đại học') || norm.includes('ngành nào') || norm.includes('tương lai')) {
      const scores = riasecProfile;
      const entries = Object.entries(scores).filter(([k]) => ['R','I','A','S','E','C'].includes(k));
      entries.sort((a, b) => b[1] - a[1]);
      const [top1, top2] = entries;
      const code = (top1 ? top1[0] : 'I') + (top2 ? top2[0] : 'A');
      const codeMap = {
        'RI': 'Kỹ sư AI/Robotics, Kỹ sư phần mềm nhúng',
        'IA': 'Nhà khoa học dữ liệu, Thiết kế UX/UI nghiên cứu',
        'IS': 'Bác sĩ nội khoa, Nhà tâm lý học lâm sàng',
        'AS': 'Nhà giáo dục sáng tạo, Nhà thiết kế trải nghiệm',
        'SE': 'Quản lý nhân sự, Chuyên gia phát triển cộng đồng',
        'EC': 'Giám đốc tài chính, Luật sư doanh nghiệp',
        'IR': 'Kỹ sư nghiên cứu & phát triển, Chuyên gia an ninh mạng',
        'EA': 'Đạo diễn sáng tạo, Marketing chiến lược',
      };
      const suggestion = codeMap[code] || 'Nhiều ngành nghề đa dạng phù hợp với em';
      return `🧭 **Phân tích hướng nghiệp cá nhân hóa cho ${studentName}:**\n\nDựa trên bài test RIASEC, mã nghề nghiệp nổi bật của em là **${top1 ? top1[0] : '?'}-${top2 ? top2[0] : '?'}** (điểm: ${top1 ? top1[1] : '?'}/5 và ${top2 ? top2[1] : '?'}/5).\n\n🎯 **Nghề nghiệp phù hợp gợi ý:** ${suggestion}\n\n📚 **Khối thi tham khảo:**\n• Nhóm R+I: Khối A00 (Toán-Lý-Hóa), A01 (Toán-Lý-Anh)\n• Nhóm A+S: Khối C00 (Văn-Sử-Địa), D01 (Văn-Toán-Anh)\n• Nhóm E+C: Khối D01, A01 + Năng khiếu kinh tế\n\n💡 Với GPA **${gpaVal}**, em ${gpaVal >= 9 ? 'có thể xét tuyển thẳng vào các trường TOP đầu!' : gpaVal >= 8 ? 'đang trong vùng an toàn cho các trường tốp đầu' : 'nên tập trung ôn luyện để cải thiện điểm số'}.\n\nEm muốn biết chi tiết về ngành nào trong số này?`;
    }

    // === ACADEMIC / STUDY STRATEGIES ===
    if (norm.includes('học') || norm.includes('ôn thi') || norm.includes('điểm') || norm.includes('thi') || norm.includes('bài') || norm.includes('môn')) {
      const weakSubjects = Object.entries(studentInfo.grades).filter(([, v]) => v < 8).map(([k]) => k);
      const weakStr = weakSubjects.length > 0 ? weakSubjects.join(', ') : 'tất cả các môn đều khá tốt';
      return `📚 **Kế hoạch ôn tập thông minh cho ${studentName}:**\n\nDựa trên học bạ của em, điểm cần ưu tiên cải thiện: **${weakStr}**.\n\n⏰ **Thời gian biểu ôn thi hiệu quả (tham khảo):**\n• 06:00–07:00: Ôn nhanh bài cũ (không học bài mới buổi sáng)\n• 08:00–11:30: Học bài mới (não hoạt động tốt nhất buổi sáng)\n• 14:00–17:00: Làm đề luyện tập & giải bài tập\n• 19:00–21:30: Ôn tập và hệ thống kiến thức\n• 22:00: Dừng học, giải trí nhẹ → ngủ trước 23h\n\n🧠 **Kỹ thuật học siêu tốc:**\n• **Spaced Repetition**: Ôn lại sau 1 ngày, 3 ngày, 1 tuần, 1 tháng\n• **Active Recall**: Đóng vở lại, tự hỏi rồi mới mở kiểm tra\n• **Feynman Technique**: Giải thích khái niệm như dạy cho người khác\n\nEm đang gặp khó khăn nhất ở môn nào?`;
    }

    // === RELATIONSHIPS / SOCIAL ===
    if (norm.includes('bạn bè') || norm.includes('bắt nạt') || norm.includes('cô đơn') || norm.includes('mâu thuẫn') || norm.includes('gia đình') || norm.includes('bố') || norm.includes('mẹ') || norm.includes('ba') || norm.includes('má')) {
      return `👥 Các mối quan hệ ảnh hưởng rất lớn đến tâm lý và học tập của em.\n\n💬 **Một vài điều thầy muốn chia sẻ:**\n• Xung đột là **bình thường** – điều quan trọng là cách xử lý, không phải tránh né.\n• Hãy dùng **"Thông điệp Tôi"**: thay vì "Bạn làm tôi tức" → "Tôi cảm thấy buồn khi điều đó xảy ra".\n• Nếu bị bắt nạt hoặc áp lực từ bạn bè/gia đình, em **có quyền** tìm giáo viên tư vấn để được hỗ trợ.\n• Đừng cố gắng làm hài lòng tất cả mọi người – đó là con đường dẫn đến kiệt sức.\n\nEm muốn kể cụ thể hơn về tình huống đang gặp không? Mọi thông tin em chia sẻ đều được bảo mật.`;
    }

    // === MOTIVATION / INSPIRATION ===
    if (norm.includes('không muốn học') || norm.includes('chán') || norm.includes('lười') || norm.includes('vô nghĩa') || norm.includes('bỏ cuộc') || norm.includes('nản')) {
      return `🔥 Thầy hiểu – cảm giác mất động lực là rất phổ biến, đặc biệt sau những giai đoạn học căng thẳng kéo dài.\n\n✨ **Khoa học về động lực:**\nNão bộ cần 3 yếu tố để duy trì động lực: **Tự chủ** (em tự chọn cách học) + **Thành thạo** (thấy mình tiến bộ) + **Mục đích** (biết tại sao mình học).\n\n🎯 **Thực hành ngay:**\n1. Viết ra **một lý do lớn nhất** em muốn học tốt – dán nơi em hay nhìn\n2. Đặt mục tiêu nhỏ 25 phút (1 Pomodoro) – chỉ 25 phút thôi, không áp lực\n3. Thưởng bản thân sau mỗi mục tiêu nhỏ hoàn thành\n\n💬 *"Thành công không đến từ việc luôn cảm thấy có hứng – mà từ việc hành động ngay cả khi không có hứng."*\n\nEm có thể kể cho thầy nghe ước mơ lớn nhất của em không?`;
    }

    // === SLEEP / HEALTH ===
    if (norm.includes('ngủ') || norm.includes('sức khỏe') || norm.includes('ăn') || norm.includes('dinh dưỡng') || norm.includes('thể dục')) {
      return `🌙 Sức khỏe là nền tảng của việc học hiệu quả. Thầy rất vui em để ý đến điều này!\n\n🏃 **Công thức sức khỏe học sinh:**\n• **Ngủ:** 7–9 tiếng/đêm, ngủ và dậy đúng giờ mỗi ngày (kể cả cuối tuần)\n• **Dinh dưỡng:** Ăn sáng đủ (đặc biệt protein + carb phức) – bỏ bữa sáng giảm 20% khả năng tập trung\n• **Vận động:** 20–30 phút/ngày (đi bộ, bơi, đạp xe) – tăng BDNF, "phân bón" cho tế bào thần kinh\n• **Nước:** Uống 1.5–2 lít nước/ngày. Thiếu nước 2% = giảm 10% khả năng nhận thức\n• **Hạn chế:** Cà phê sau 14h, màn hình trước ngủ 1 tiếng, ăn đêm sau 21h\n\nEm muốn hỏi cụ thể hơn về khía cạnh nào không?`;
    }

    // === CONTEXTUAL FOLLOW-UP (conversation flow) ===
    if (msgCount >= 3 && (norm.includes('oke') || norm.includes('ok') || norm.includes('cảm ơn') || norm.includes('hiểu rồi') || norm.includes('thanks'))) {
      return `😊 Thầy rất vui được đồng hành cùng em, ${studentName}!\n\nNhớ rằng: hành trình 1000 dặm bắt đầu từ một bước chân. Em đã dũng cảm chia sẻ – đó là bước đầu tiên rồi.\n\n📋 **Tóm tắt các điểm thầy muốn em nhớ:**\n• Nghỉ ngơi đủ giấc là ĐẦU TƯ, không phải lãng phí thời gian\n• Hỏi thầy cô khi cần – không ai giỏi một mình\n• Mỗi ngày tiến bộ 1% – sau 1 năm sẽ giỏi hơn 37 lần\n\nEm luôn có thể quay lại đây bất cứ khi nào cần nhé! 💙`;
    }

    // === GREETINGS ===
    if (norm.includes('xin chào') || norm.includes('hello') || norm.includes('chào thầy') || norm.includes('hi') || txt.length < 15) {
      return `👋 Chào ${studentName}! Thầy rất vui được gặp em.\n\nHôm nay em muốn nói chuyện về điều gì? Thầy có thể hỗ trợ em về:\n• 😰 Căng thẳng thi cử & cảm xúc\n• 🎯 Hướng nghiệp & chọn ngành\n• 📚 Kế hoạch học tập\n• 💬 Mối quan hệ & kỹ năng sống\n\nCứ thoải mái chia sẻ với thầy nhé!`;
    }

    // === DEFAULT – empathetic fallback ===
    const fallbacks = [
      `💙 Cảm ơn em đã chia sẻ. Thầy đang lắng nghe rất chăm chú.\n\nĐể thầy có thể hỗ trợ em tốt hơn, em có thể kể thêm cụ thể hơn không? Ví dụ:\n• Chuyện này xảy ra từ bao giờ?\n• Em đã thử làm gì chưa?\n• Điều em mong muốn nhất lúc này là gì?`,
      `🤝 Thầy hiểu em. Mỗi người có hành trình riêng – không có gì là "quá nhỏ" để chia sẻ.\n\nEm có muốn nói thêm về hoàn cảnh cụ thể không? Thầy sẽ cố gắng đưa ra gợi ý phù hợp nhất cho ${studentName}.`,
      `✨ Em đã nói rất đúng. Thầy muốn hỏi thêm để hiểu rõ hơn: điều này ảnh hưởng đến việc học hoặc cuộc sống hàng ngày của em như thế nào? Cứ nói thật lòng nhé, thầy không phán xét đâu.`
    ];
    return fallbacks[msgCount % fallbacks.length];
  };

  const handleCounselorSend = (e) => {
    e.preventDefault();
    const inputVal = counselorInput.trim();
    if (!inputVal || counselorIsTyping) return;

    const userMsg = { sender: 'user', text: inputVal, timestamp: getTimestamp() };
    setCounselorHistory(prev => [...prev, userMsg]);
    setCounselorInput('');
    setCounselorIsTyping(true);
    const newCount = counselorMsgCount + 1;
    setCounselorMsgCount(newCount);

    const delay = 800 + Math.min(inputVal.length * 18, 2000); // realistic typing delay
    setTimeout(() => {
      const reply = generateCounselorReply(inputVal, newCount, counselorMood, student, currentScores);
      setCounselorHistory(prev => [...prev, { sender: 'counselor', text: reply, timestamp: getTimestamp() }]);
      setCounselorIsTyping(false);
    }, delay);
  };

  const handleCounselorQuickReply = (text) => {
    setCounselorInput(text);
  };

  const handleMealFeedbackSubmit = (e) => {
    e.preventDefault();
    if (!mealCommentInput.trim()) {
      alert('Vui lòng nhập nhận xét về bữa ăn!');
      return;
    }
    submitMealFeedback(student.id, mealRateInput, mealCommentInput);
    setMealCommentInput('');
    alert('Cảm ơn bạn đã gửi phản hồi bữa ăn bán trú ngày hôm nay!');
  };

  const handleCanteenPurchase = (e) => {
    e.preventDefault();
    spendStudentWallet(student.id, canteenPrice, `Mua ${canteenItem} tại Canteen`);
  };

  const handleAddDeadline = (e) => {
    e.preventDefault();
    if (!newDlTitle || !newDlDate) return;
    addDeadline({ title: newDlTitle, date: newDlDate, priority: newDlPriority });
    setNewDlTitle('');
    setNewDlDate('');
  };

  const myAssignments = assignments ? assignments.filter(a => a.classTarget === student.class) : [];
  const myAttendance = attendanceLogs ? attendanceLogs.filter(l => l.studentId === student.id) : [];
  const myClubsApps = clubApplications ? clubApplications.filter(a => a.studentId === student.id) : [];

  const myDeadlines = deadlines ? deadlines.filter(d => d.classTarget === student.class || d.classTarget === 'personal') : [];
  // Sort deadlines: undone first, then by date ascending
  myDeadlines.sort((a, b) => {
    if (a.done === b.done) {
      return new Date(a.date) - new Date(b.date);
    }
    return a.done ? 1 : -1;
  });

  return (
    <div className="animate-fade">
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Chào mừng trở lại, {student.name}! 🚀</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Lớp {student.class} • Điểm rèn luyện: <strong style={{ color: 'var(--accent-secondary)' }}>{conductScore} ({conductGrade})</strong>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', padding: '8px 16px', background: 'var(--accent-primary-glow)', border: '1px solid rgba(139, 92, 246, 0.15)', borderRadius: '99px' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)' }}>Chế độ học tập tích cực</span>
        </div>
      </div>

      {/* DEADLINES & CALENDAR TAB */}
      {subTab === 'deadlines' && (
        <div className="animate-fade">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '30px' }}>
            
            {/* Upcoming Deadlines List */}
            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={20} color="var(--accent-primary)" /> Lịch thi & Deadline
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {myDeadlines.map(dl => {
                  const dlDate = new Date(dl.date);
                  const isOverdue = dlDate < new Date(new Date().setHours(0,0,0,0)) && !dl.done;
                  
                  return (
                    <div 
                      key={dl.id} 
                      className={`glass-panel-hover ${dl.done ? 'done' : ''}`}
                      style={{ 
                        padding: '16px', 
                        borderRadius: 'var(--radius-md)', 
                        borderLeft: `4px solid ${dl.done ? 'var(--text-muted)' : (isOverdue ? 'var(--accent-danger)' : dl.color || 'var(--accent-primary)')}`,
                        background: 'rgba(255, 255, 255, 0.02)',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        opacity: dl.done ? 0.6 : 1
                      }}
                    >
                      <button 
                        onClick={() => toggleDeadlineDone(dl.id)}
                        style={{
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          color: dl.done ? 'var(--accent-success)' : 'var(--text-muted)',
                          marginTop: '2px'
                        }}
                      >
                        <CheckCircle size={20} />
                      </button>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600, textDecoration: dl.done ? 'line-through' : 'none', color: isOverdue ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
                            {dl.title}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: isOverdue ? 'var(--accent-danger)' : 'var(--text-secondary)', fontWeight: 500 }}>
                            {dlDate.toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textDecoration: dl.done ? 'line-through' : 'none' }}>
                          {dl.desc || dl.subject}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span style={{ 
                            fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', fontWeight: 600,
                            background: dl.type === 'exam' ? 'rgba(239, 68, 68, 0.15)' : (dl.type === 'event' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)'),
                            color: dl.type === 'exam' ? '#ef4444' : (dl.type === 'event' ? '#10b981' : '#6366f1')
                          }}>
                            {dl.type === 'exam' ? 'KỲ THI' : (dl.type === 'event' ? 'SỰ KIỆN' : 'BÀI TẬP')}
                          </span>
                          {dl.priority === 'urgent' && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontWeight: 600 }}>GẤP</span>}
                          {dl.type === 'personal' && (
                            <button onClick={() => deleteDeadline(dl.id)} style={{ background: 'transparent', border: 'none', color: 'var(--accent-danger)', cursor: 'pointer', marginLeft: 'auto' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
                {myDeadlines.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    <CheckCircle size={40} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                    <p>Tuyệt vời! Bạn không có deadline nào sắp tới.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Add Personal Deadline */}
            <div>
              <div className="glass-panel" style={{ position: 'sticky', top: '90px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <Plus size={20} color="var(--accent-primary)" /> Thêm mục tiêu cá nhân
                </h3>
                <form onSubmit={handleAddDeadline}>
                  <div className="form-group">
                    <label className="form-label">Tên công việc / Mục tiêu</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={newDlTitle}
                      onChange={e => setNewDlTitle(e.target.value)}
                      placeholder="VD: Ôn tập 50 từ vựng Tiếng Anh..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Ngày hoàn thành (Deadline)</label>
                    <input 
                      type="date" 
                      className="form-control" 
                      value={newDlDate}
                      onChange={e => setNewDlDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mức độ ưu tiên</label>
                    <select 
                      className="form-control" 
                      value={newDlPriority}
                      onChange={e => setNewDlPriority(e.target.value)}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Gấp, quan trọng</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    <CheckCircle size={18} /> Thêm vào danh sách
                  </button>
                </form>

                <div style={{ marginTop: '24px', padding: '16px', background: 'var(--accent-primary-glow)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(99,102,241,0.1)' }}>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> Lời khuyên học tập
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Việc chia nhỏ các mục tiêu lớn thành những deadline ngắn hạn sẽ giúp não bộ giảm cảm giác quá tải và tiết ra nhiều Dopamine hơn mỗi khi bạn tick hoàn thành một việc!
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MOCK UNIVERSITY EXAMS TAB */}
      {subTab === 'mock_exams' && (
        <div className="animate-fade">
          
          {/* Main selection view */}
          {examMode === null && (
            <div>
              {/* Header card with glassmorphism */}
              <div className="glass-panel" style={{ padding: '30px', marginBottom: '24px', background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.45))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ClipboardList size={28} color="var(--accent-primary)" /> Thi Thử Đại Học THPT Quốc Gia
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
                      Rèn luyện kiến thức thực tế với đề thi thử chuẩn cấu trúc đề của Bộ Giáo dục và Đào tạo.
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
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

              {/* Grid of Integrated Block Exams */}
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={18} color="var(--accent-secondary)" /> Đề thi thử hệ thống của {BLOCKS[selectedBlockKey].name}
                </h3>
                
                {(() => {
                  const systemExam = SYSTEM_BLOCK_EXAMS.find(ex => ex.block === selectedBlockKey);
                  if (!systemExam) return <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Chưa có đề thi hệ thống cho khối này.</p>;
                  
                  const counts = {};
                  systemExam.questions.forEach(q => {
                    counts[q.subject] = (counts[q.subject] || 0) + 1;
                  });
                  const structureDesc = Object.entries(counts)
                    .map(([sub, count]) => `${count} ${SUBJECT_NAMES[sub] || sub}`)
                    .join(', ');

                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '180px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(255, 255, 255, 0.8))' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <span style={{ 
                              fontSize: '0.75rem', 
                              fontWeight: 600, 
                              color: 'var(--accent-primary)', 
                              background: 'var(--accent-primary-glow)', 
                              padding: '4px 10px', 
                              borderRadius: '99px' 
                            }}>
                              Đề thi Hệ thống
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {systemExam.duration} phút
                            </span>
                          </div>
                          <h4 style={{ fontSize: '1rem', fontWeight: 850, color: '#1e293b', lineHeight: 1.4, margin: '6px 0' }}>
                            {systemExam.title}
                          </h4>
                          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            <strong>Cấu trúc liên môn:</strong> {structureDesc}
                          </p>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            Trải nghiệm thi thử liên môn tuần tự theo đúng quy chế thi thật của Bộ GD&ĐT.
                          </p>
                        </div>
                        
                        <div style={{ marginTop: '20px' }}>
                          <button
                            onClick={() => handleStartExam(systemExam)}
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
                                  background: 'linear-gradient(135deg, #10b981, #059669)',
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
                    style={{ background: '#10b981', padding: '10px 24px', fontWeight: 700, borderRadius: '12px', border: 'none' }}
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
                          dangerouslySetInnerHTML={{ __html: currentQuestion.question }}
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
                                <span dangerouslySetInnerHTML={{ __html: option.text }} />
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
                    // Group questions by subject
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
                          dangerouslySetInnerHTML={{ __html: q.question }}
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
                                <span dangerouslySetInnerHTML={{ __html: option.text }} />
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
                          <div dangerouslySetInnerHTML={{ __html: q.explanation }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW TAB */}
      {subTab === 'overview' && (
        <div className="animate-fade">
          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="glass-panel stat-card">
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>GPA TỔNG KẾT CẢ NĂM</span>
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
              <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Chi tiết kết quả học tập</h2>
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
                    {subjectsKeys.map(sub => {
                      const score1 = student.gradesSem1?.[sub] ?? 0;
                      const score2 = student.grades?.[sub] ?? 0;
                      const scoreAll = parseFloat(((score1 + score2 * 2) / 3).toFixed(2));
                      
                      const getSubjectName = (key) => {
                        if (key === 'Math') return 'Toán học';
                        if (key === 'Literature') return 'Ngữ văn';
                        if (key === 'Physics') return 'Vật lý';
                        if (key === 'English') return 'Tiếng Anh';
                        return key;
                      };

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
      )}

      {/* AI STUDY ADVISOR TAB (PART 6) */}
      {subTab === 'ai_advisor' && (
        <div className="glass-panel animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
            <Brain size={22} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Học vụ AI & Định hướng Lộ trình</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
            
            {/* SVG Learning Progress chart */}
            <div>
              <div style={{ padding: '16px', background: 'rgba(79, 70, 229, 0.02)', border: '1px solid rgba(79, 70, 229, 0.08)', borderRadius: '12px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.95rem' }}>Biểu đồ tiến độ học tập kì II</h4>
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                  <svg width="100%" height="200" viewBox="0 0 400 200" style={{ overflow: 'visible' }}>
                    {/* Gridlines */}
                    <line x1="50" y1="30" x2="350" y2="30" stroke="#f1f5f9" strokeDasharray="3,3" />
                    <line x1="50" y1="70" x2="350" y2="70" stroke="#f1f5f9" strokeDasharray="3,3" />
                    <line x1="50" y1="110" x2="350" y2="110" stroke="#f1f5f9" strokeDasharray="3,3" />
                    <line x1="50" y1="150" x2="350" y2="150" stroke="#f1f5f9" strokeDasharray="3,3" />
                    
                    {/* Axes */}
                    <line x1="50" y1="30" x2="50" y2="170" stroke="#cbd5e1" />
                    <line x1="50" y1="170" x2="350" y2="170" stroke="#cbd5e1" />
                    
                    {/* Y Labels (grades) */}
                    <text x="35" y="35" fontSize="10" fill="#94a3b8" textAnchor="end">10.0</text>
                    <text x="35" y="75" fontSize="10" fill="#94a3b8" textAnchor="end">8.0</text>
                    <text x="35" y="115" fontSize="10" fill="#94a3b8" textAnchor="end">6.0</text>
                    <text x="35" y="155" fontSize="10" fill="#94a3b8" textAnchor="end">4.0</text>
                    
                    {/* Data Line Path */}
                    {/* T32: 7.8 (y=74), T33: 8.0 (y=70), T34: 8.2 (y=66), T35: 8.5 (y=60) */}
                    <path
                      d="M 80,78 L 160,70 L 240,66 L 320,60"
                      fill="none"
                      stroke="url(#gradient-line)"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Nodes */}
                    <circle cx="80" cy="78" r="5" fill="#818cf8" stroke="white" strokeWidth="1.5" />
                    <circle cx="160" cy="70" r="5" fill="#6366f1" stroke="white" strokeWidth="1.5" />
                    <circle cx="240" cy="66" r="5" fill="#4f46e5" stroke="white" strokeWidth="1.5" />
                    <circle cx="320" cy="60" r="5" fill="#3b82f6" stroke="white" strokeWidth="1.5" />

                    {/* Nodes text grades */}
                    <text x="80" y="93" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">7.8</text>
                    <text x="160" y="85" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">8.0</text>
                    <text x="240" y="81" fontSize="10" fontWeight="600" fill="#475569" textAnchor="middle">8.2</text>
                    <text x="320" y="48" fontSize="10" fontWeight="700" fill="var(--accent-secondary)" textAnchor="middle">8.5</text>

                    {/* X Labels (weeks) */}
                    <text x="80" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 32</text>
                    <text x="160" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 33</text>
                    <text x="240" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 34</text>
                    <text x="320" y="185" fontSize="10" fill="#94a3b8" textAnchor="middle">Tuần 35</text>

                    <defs>
                      <linearGradient id="gradient-line" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="100%" stopColor="#3b82f6" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Graduation mock AI prediction */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Tổ hợp xét tuyển A00</h5>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>26.5</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 30 điểm (Dự đoán)</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Toán: 8.8 • Lý: 9.2 • Hóa: 8.5</p>
                </div>

                <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
                  <h5 style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)' }}>Tổ hợp xét tuyển D01</h5>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-primary)' }}>25.3</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ 30 điểm (Dự đoán)</span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>Toán: 8.8 • Văn: 8.0 • Anh: 8.5</p>
                </div>
              </div>
            </div>

            {/* AI Recommendation panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '16px', background: 'rgba(99, 102, 241, 0.04)', border: '1px solid rgba(99, 102, 241, 0.1)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                  <Sparkles size={16} color="var(--accent-primary)" />
                  <span>Định hướng của cố vấn học tập AI</span>
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <strong>Môn Toán học:</strong> Em đang tiến bộ rất vững vàng ở chuyên đề Hàm số và Tích phân. Tuy nhiên cần chú ý rà soát phần hình học không gian (đặc biệt các dạng toán tọa độ hóa Oxyz).
                  </div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5, borderTop: '1px dashed rgba(0,0,0,0.08)', paddingTop: '10px' }}>
                    <strong>Môn Vật lý:</strong> Kết quả dự đoán đạt 9.2đ, đây là thế mạnh của em. Nên tập trung làm các đề thi thử tổng hợp để rèn tốc độ làm câu trắc nghiệm khó.
                  </div>
                  <div style={{ fontSize: '0.85rem', lineHeight: 1.5, borderTop: '1px dashed rgba(0,0,0,0.08)', paddingTop: '10px' }}>
                    <strong>Môn Ngữ văn:</strong> Điểm số 7.8-8.0 ổn định, bài viết nghị luận có kết cấu tốt nhưng cần rèn luyện thêm liên hệ thực tế xã hội để tạo dấu ấn sâu sắc hơn.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ATTENDANCE TAB (PART 6) */}
      {subTab === 'attendance' && (
        <div className="glass-panel animate-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--accent-secondary)" />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Nhật ký điểm danh chuyên cần</h2>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lớp học: <strong>{student.class}</strong></span>
          </div>

          {/* Quick numbers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '16px', background: '#ecfdf5', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#047857' }}>{myAttendance.filter(l => l.status === 'present').length + 3}</div>
              <div style={{ fontSize: '0.8rem', color: '#047857', fontWeight: 600 }}>Ngày đi học đúng giờ</div>
            </div>
            <div style={{ padding: '16px', background: '#fffbeb', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b45309' }}>{myAttendance.filter(l => l.status === 'late').length}</div>
              <div style={{ fontSize: '0.8rem', color: '#b45309', fontWeight: 600 }}>Ngày đi học muộn</div>
            </div>
            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#64748b' }}>{myAttendance.filter(l => l.status === 'absent').length}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ngày xin phép nghỉ</div>
            </div>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Ngày tháng</th>
                <th>Giờ Check-in</th>
                <th>Cổng trường</th>
                <th>Trạng thái chuyên cần</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>01/06/2026</td>
                <td style={{ fontWeight: 600 }}>07:12 AM</td>
                <td>Cổng A (Quét thẻ)</td>
                <td><span className="badge badge-success">Có mặt</span></td>
                <td style={{ color: 'var(--text-muted)' }}>Đúng giờ chào cờ</td>
              </tr>
              <tr>
                <td>02/06/2026</td>
                <td style={{ fontWeight: 600 }}>07:18 AM</td>
                <td>Cổng A (Quét thẻ)</td>
                <td><span className="badge badge-success">Có mặt</span></td>
                <td style={{ color: 'var(--text-muted)' }}>Đúng giờ học</td>
              </tr>
              {myAttendance.map((log) => (
                <tr key={log.id}>
                  <td>{log.date.split('-').reverse().join('/')}</td>
                  <td style={{ fontWeight: 600 }}>{log.checkInTime} AM</td>
                  <td>Cổng B (Nhận diện camera)</td>
                  <td>
                    <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-danger' : 'badge-secondary'}`}>
                      {log.status === 'present' ? 'Có mặt' : log.status === 'late' ? 'Đi muộn' : 'Nghỉ học'}
                    </span>
                  </td>
                  <td>{log.status === 'late' ? 'Đi muộn sau 07:30' : 'Đã ghi nhận điểm danh'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* CONDUCT TAB */}
      {subTab === 'conduct' && (
        <div className="glass-panel animate-fade">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <Award size={18} color="var(--accent-secondary)" />
            <span>Điểm Rèn Luyện & Thi Đua Lớp {student.class}</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '30px', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-card)', borderRadius: '16px' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ĐIỂM HIỆN TẠI</span>
              <h2 style={{ fontSize: '3rem', margin: '8px 0', color: 'var(--accent-secondary)' }}>{conductScore}</h2>
              <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '6px 14px' }}>Xếp loại: {conductGrade}</span>
            </div>
            
            <div style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              <strong>Quy chế điểm rèn luyện:</strong>
              <ul>
                <li>Điểm khởi điểm mặc định đầu học kì là 100 điểm.</li>
                <li>Học sinh được cộng điểm thưởng (+5, +10) khi có thành tích thi đua, hăng hái phát biểu xây dựng bài học hoặc tích cực tham gia phong trào CLB.</li>
                <li>Học sinh bị trừ điểm (-5, -10) khi vi phạm nội quy, đi muộn hoặc làm việc riêng trong giờ học.</li>
                <li>Xếp loại rèn luyện: Xuất sắc & Tốt (từ 90 điểm trở lên), Khá (từ 70-89 điểm), Trung bình (50-69 điểm).</li>
              </ul>
            </div>
          </div>

          <h4 style={{ marginBottom: '14px', fontWeight: 700 }}>Nhật ký thi đua học đường</h4>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Ngày ghi nhận</th>
                <th>Nội dung rèn luyện</th>
                <th>Điểm cộng/trừ</th>
                <th>Giáo viên ghi nhận</th>
              </tr>
            </thead>
            <tbody>
              {studentConductLogs.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>Không có lịch sử cộng/trừ điểm rèn luyện nào.</td>
                </tr>
              ) : (
                studentConductLogs.map(log => (
                  <tr key={log.id}>
                    <td>{log.date}</td>
                    <td style={{ fontWeight: 600 }}>{log.reason}</td>
                    <td>
                      <span className={`badge ${log.points > 0 ? 'badge-success' : 'badge-danger'}`} style={{ fontWeight: 700 }}>
                        {log.points > 0 ? `+${log.points}` : log.points} điểm
                      </span>
                    </td>
                    <td>{log.teacherName}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ASSIGNMENTS TAB */}
      {subTab === 'assignments' && (
        <div className="animate-fade">
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '6px' }}>Danh sách Bài Tập Về Nhà được giao</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Hãy hoàn thành đúng hạn các bài tập tự luận/trắc nghiệm từ giáo viên bộ môn.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {myAssignments.length === 0 ? (
              <div className="glass-panel" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Chưa có bài tập nào được giao cho lớp {student.class}.
              </div>
            ) : (
              myAssignments.map(assignment => {
                const sub = submissions.find(s => s.assignmentId === assignment.id && s.studentId === student.id);
                const isSubmitted = !!sub;
                const isGraded = isSubmitted && sub.status === 'graded';
                const score = isGraded ? sub.grade : null;
                const feedback = isGraded ? sub.feedback : '';
                const subText = submissionTexts[assignment.id] || '';

                return (
                  <div
                    key={assignment.id}
                    style={{
                      padding: '20px', 
                      borderRadius: '16px', 
                      background: 'white', 
                      border: isGraded ? '1.5px solid rgba(16, 185, 129, 0.25)' : isSubmitted ? '1.5px solid rgba(59, 130, 246, 0.25)' : '1px solid var(--border-card)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.01)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                    className="animate-fade"
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span className="badge badge-info">{assignment.subject} • {assignment.teacherName}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hạn: {assignment.deadline}</span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '8px 0', color: 'var(--text-primary)' }}>
                        {assignment.title}
                      </h4>

                      <p style={{ 
                        fontSize: '0.88rem', 
                        color: 'var(--text-secondary)', 
                        background: 'rgba(0,0,0,0.01)', 
                        padding: '10px', 
                        borderRadius: '8px', 
                        border: '1px solid rgba(0,0,0,0.02)',
                        margin: '8px 0 16px 0', 
                        whiteSpace: 'pre-line' 
                      }}>
                        {assignment.content}
                      </p>

                      {/* Submission status & Details */}
                      {isGraded ? (
                        <div style={{ marginTop: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', marginBottom: '8px' }}>
                            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{score}</span>
                            <div style={{ fontSize: '0.8rem' }}>
                              <div style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>Đã chấm điểm (thang 10)</div>
                              <div style={{ color: 'var(--text-muted)' }}>Bài nộp hoàn thành thành công</div>
                            </div>
                          </div>
                          {feedback && (
                            <p style={{ fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(0, 0, 0, 0.01)', borderLeft: '3px solid var(--accent-secondary)', borderRadius: '0 8px 8px 0', fontStyle: 'italic', margin: '4px 0', color: 'var(--text-secondary)' }}>
                              <strong>Lời phê:</strong> "{feedback}"
                            </p>
                          )}
                        </div>
                      ) : isSubmitted ? (
                        <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, color: 'var(--accent-primary)', marginBottom: '4px' }}>
                            <span>Đã nộp bài làm</span>
                            <span>{sub.submittedAt}</span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Đang chờ thầy/cô xem xét chấm điểm...</span>
                        </div>
                      ) : (
                        <div style={{ marginTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-danger)', fontWeight: 600, marginBottom: '6px' }}>
                            <span>🔴 Chưa nộp bài làm</span>
                          </div>
                          <textarea
                            className="form-control"
                            rows="3"
                            placeholder="Nhập nội dung bài giải hoặc văn bản nộp bài..."
                            value={subText}
                            onChange={e => setSubmissionTexts(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                            style={{ fontSize: '0.85rem', resize: 'none', background: 'white', borderColor: 'var(--border-card)', color: '#1e293b' }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSubSubmit(assignment.id)}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '8px 0', fontSize: '0.85rem', marginTop: '8px' }}
                          >
                            Nộp bài tập trực tuyến
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* DIGITAL LIBRARY & FLASHCARDS (PART 6) */}
      {subTab === 'library' && (
        <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Digital resources & Quiz section */}
          <div>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <BookOpen size={18} color="var(--accent-primary)" />
              <span>Học liệu số & Ôn tập ôn thi</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {learningResources && learningResources.map((res) => (
                <div id={res.id} key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-card)' }}>
                  <div>
                    <span className="badge badge-info" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>{res.subject}</span>
                    <h5 style={{ margin: 0, fontWeight: 700 }}>{res.title}</h5>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Đăng bởi: {res.teacherName} • Ngày {res.dateUploaded.split('-').reverse().join('/')}</span>
                  </div>
                  <button onClick={() => alert('Bắt đầu tải tài liệu về máy...')} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '8px' }}>
                    Tải về
                  </button>
                </div>
              ))}
            </div>

            {/* Quick Practice Quiz Card */}
            <div style={{ padding: '18px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.08)', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={18} color="var(--accent-primary)" />
                <span>Trắc nghiệm nhanh ôn luyện 5 câu</span>
              </h4>

              {activeQuizStep === 0 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Hãy kiểm tra nhanh kiến thức Toán học, Vật lý và Ngữ văn để rèn luyện tư duy làm bài trắc nghiệm.
                  </p>
                  <button onClick={() => setActiveQuizStep(1)} className="btn btn-primary">
                    Bắt đầu làm bài
                  </button>
                </div>
              )}

              {activeQuizStep === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {quizQuestions.map((q) => (
                    <div key={q.id} style={{ borderBottom: '1px dashed #e2e8f0', paddingBottom: '12px' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', fontWeight: 600 }}>Câu {q.id}: {q.q}</p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {[
                          { key: 'a', label: q.a },
                          { key: 'b', label: q.b },
                          { key: 'c', label: q.c },
                          { key: 'd', label: q.d }
                        ].map((opt) => (
                          <button
                            key={opt.key}
                            onClick={() => setSelectedAnswers(prev => ({ ...prev, [q.id]: opt.key }))}
                            className="btn"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              textAlign: 'left',
                              borderRadius: '8px',
                              border: selectedAnswers[q.id] === opt.key ? '1.5px solid var(--accent-primary)' : '1px solid #cbd5e1',
                              background: selectedAnswers[q.id] === opt.key ? 'rgba(99, 102, 241, 0.05)' : 'white',
                              color: '#334155'
                            }}
                          >
                            <strong>{opt.key.toUpperCase()}.</strong> {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button onClick={handleQuizSubmit} className="btn btn-primary" style={{ marginTop: '10px' }}>
                    Nộp bài trắc nghiệm
                  </button>
                </div>
              )}

              {activeQuizStep === 2 && (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <span className="badge badge-success" style={{ fontSize: '1.5rem', padding: '10px 24px', borderRadius: '30px', marginBottom: '14px' }}>
                    Kết quả: {quizScore}/5 câu đúng
                  </span>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                    {quizScore === 5 ? '🎉 Xuất sắc! Em đã trả lời đúng tất cả câu hỏi.' : quizScore >= 3 ? 'Khá tốt! Hãy cố gắng ôn luyện thêm để đạt điểm tuyệt đối.' : 'Em cần ôn tập thêm học liệu ở trên nhé.'}
                  </p>
                  <button onClick={handleResetQuiz} className="btn btn-secondary" style={{ marginTop: '12px' }}>
                    Làm lại bài trắc nghiệm
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Flashcard 3D section */}
          <div className="glass-panel" style={{ padding: '24px', borderRadius: '16px' }}>
            <SmartFlashcard studentId={student.id} />
          </div>


        </div>
      )}

      {/* CLUBS HUB TAB (PART 6) */}
      {subTab === 'clubs' && (
        <div className="glass-panel animate-fade">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Users size={20} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Câu Lạc Bộ Học Sinh</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            
            {/* List of Clubs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {clubs && clubs.map((club) => (
                <div key={club.id} style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px', background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)' }}>{club.name}</h4>
                    <span className={`badge ${club.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                      {club.status === 'active' ? 'Đang hoạt động' : 'Đang chờ duyệt'}
                    </span>
                  </div>
                  <p style={{ margin: '0 0 12px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {club.desc}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Thành viên: <strong>{club.membersCount} học sinh</strong></span>
                    <span>Ngân sách năm học: <strong>{club.budgetApproved > 0 ? `${club.budgetApproved.toLocaleString()} VNĐ` : 'Chờ duyệt'}</strong></span>
                  </div>
                </div>
              ))}
            </div>

            {/* Application Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ padding: '18px', background: 'rgba(99, 102, 241, 0.02)', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem' }}>Đăng ký tham gia Câu Lạc Bộ</h4>
                
                <form onSubmit={handleClubApply} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Chọn CLB muốn ứng tuyển</label>
                    <select 
                      className="form-control"
                      value={selectedClubId}
                      onChange={e => setSelectedClubId(e.target.value)}
                      style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                    >
                      {clubs && clubs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Giới thiệu bản thân & Lý do ứng tuyển</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      value={clubAppIntro}
                      onChange={e => setClubAppIntro(e.target.value)}
                      placeholder="Hãy giới thiệu ngắn về sở thích và nguyện vọng đóng góp CLB của em..."
                      required
                      style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', fontSize: '0.85rem' }}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                    Nộp đơn đăng ký CLB
                  </button>
                </form>
              </div>

              {/* History of applications */}
              <div style={{ padding: '16px', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>Lịch sử đăng ký CLB</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {myClubsApps.length === 0 ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', textAlignment: 'center' }}>Chưa nộp đơn CLB nào.</p>
                  ) : (
                    myClubsApps.map(app => (
                      <div key={app.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', fontSize: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ display: 'block' }}>{app.clubName}</strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lý do: {app.introduction.slice(0, 20)}...</span>
                        </div>
                        <span className={`badge ${app.status === 'approved' ? 'badge-success' : app.status === 'rejected' ? 'badge-danger' : 'badge-info'}`}>
                          {app.status === 'approved' ? 'Đã nhận' : app.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* COUNSELING & CAREER GUIDANCE TAB — chỉ dành cho học sinh */}
      {subTab === 'counseling' && isStudent && (
        <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* RIASEC Career psychometric questionnaire */}
          <div>
            <h2 style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Compass size={18} color="var(--accent-primary)" />
              <span>Khảo sát tính cách Hướng nghiệp RIASEC</span>
            </h2>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Hãy chấm điểm từ 1 (Không thích) đến 5 (Rất thích) cho các nhóm câu hỏi bên dưới để khám phá thế mạnh tính cách nghề nghiệp.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              {[
                { k: 'R', label: 'R (Realistic): Thích kỹ thuật, lắp ráp, chế tạo robot, sửa chữa linh kiện.' },
                { k: 'I', label: 'I (Investigative): Thích giải toán khó, nghiên cứu khoa học, khám phá công nghệ mới.' },
                { k: 'A', label: 'A (Artistic): Thích thiết kế đồ họa, sáng tạo nội dung, hội họa hoặc biểu diễn nghệ thuật.' },
                { k: 'S', label: 'S (Social): Thích hỗ trợ mọi người, chia sẻ kỹ năng học tập, làm việc nhóm tích cực.' },
                { k: 'E', label: 'E (Enterprising): Thích quản lý đội ngũ, lên kế hoạch kinh doanh, dẫn dắt câu lạc bộ.' },
                { k: 'C', label: 'C (Conventional): Thích tổng hợp thống kê số liệu, làm việc ngăn nắp với sổ sách kế toán.' }
              ].map(q => (
                <div key={q.k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 500, flex: 1, paddingRight: '12px' }}>{q.label}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {[1, 2, 3, 4, 5].map(v => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRiasecAnswers(prev => ({ ...prev, [q.k]: v }))}
                        className="btn"
                        style={{
                          width: '28px',
                          height: '28px',
                          padding: 0,
                          fontSize: '0.8rem',
                          borderRadius: '50%',
                          border: riasecAnswers[q.k] === v ? '1.5px solid var(--accent-primary)' : '1px solid #cbd5e1',
                          background: riasecAnswers[q.k] === v ? 'var(--accent-primary)' : 'white',
                          color: riasecAnswers[q.k] === v ? 'white' : '#475569'
                        }}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleRiasecSave} className="btn btn-primary" style={{ width: '100%', marginBottom: '24px' }}>
              Lưu kết quả khảo sát RIASEC
            </button>

            {hasCompletedRiasec && (
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: '20px', padding: '16px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.08)', borderRadius: '12px', alignItems: 'center' }}>
                {/* SVG Radar network polygon chart */}
                <div>
                  <svg width="140" height="140" viewBox="0 0 300 300" style={{ overflow: 'visible' }}>
                    {/* Background hexagons */}
                    <polygon points="150,50 236,100 236,200 150,250 64,200 64,100" fill="none" stroke="#e2e8f0" strokeWidth="2" />
                    <polygon points="150,100 193,125 193,175 150,200 107,175 107,125" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                    
                    {/* Axes lines */}
                    <line x1="150" y1="150" x2="150" y2="50" stroke="#cbd5e1" />
                    <line x1="150" y1="150" x2="236" y2="100" stroke="#cbd5e1" />
                    <line x1="150" y1="150" x2="236" y2="200" stroke="#cbd5e1" />
                    <line x1="150" y1="150" x2="150" y2="250" stroke="#cbd5e1" />
                    <line x1="150" y1="150" x2="64" y2="200" stroke="#cbd5e1" />
                    <line x1="150" y1="150" x2="64" y2="100" stroke="#cbd5e1" />

                    {/* Labels */}
                    <text x="150" y="35" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="middle">R</text>
                    <text x="250" y="95" fontSize="16" fontWeight="bold" fill="#64748b">I</text>
                    <text x="250" y="215" fontSize="16" fontWeight="bold" fill="#64748b">A</text>
                    <text x="150" y="275" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="middle">S</text>
                    <text x="45" y="215" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="end">E</text>
                    <text x="45" y="95" fontSize="16" fontWeight="bold" fill="#64748b" textAnchor="end">C</text>

                    {/* Value Polygon */}
                    <polygon
                      points={getRadarPointsPath(currentScores)}
                      fill="rgba(99, 102, 241, 0.4)"
                      stroke="var(--accent-primary)"
                      strokeWidth="3.5"
                    />
                  </svg>
                </div>

                {/* Score mapping profile description */}
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {riasecInfo.name}
                  </h4>
                  <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {riasecInfo.desc}
                  </p>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    🛠️ Phù hợp: {riasecInfo.jobs}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* AI School counselor – premium chatbot */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)', flexShrink: 0
              }}>
                <Heart size={20} color="white" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Tư Vấn Tâm Lý Học Đường</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: '0.78rem', color: '#15803d', fontWeight: 600 }}>Đang trực tuyến • Phản hồi ngay lập tức</span>
                </div>
              </div>
            </div>

            {/* Mood Check-in */}
            <div style={{ padding: '14px', background: 'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(139,92,246,0.04) 100%)', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.1)' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                🌡️ Hôm nay em đang cảm thấy thế nào?
              </p>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[
                  { id: 'great', emoji: '😄', label: 'Tuyệt vời' },
                  { id: 'okay', emoji: '🙂', label: 'Bình thường' },
                  { id: 'stressed', emoji: '😰', label: 'Căng thẳng' },
                  { id: 'sad', emoji: '😢', label: 'Buồn' },
                  { id: 'tired', emoji: '😴', label: 'Mệt mỏi' }
                ].map(mood => (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => {
                      setCounselorMood(mood.id);
                      handleCounselorQuickReply(`Em đang cảm thấy ${mood.label.toLowerCase()} hôm nay`);
                    }}
                    style={{
                      padding: '6px 12px', borderRadius: '99px', border: '1.5px solid',
                      borderColor: counselorMood === mood.id ? 'var(--accent-primary)' : 'rgba(99,102,241,0.2)',
                      background: counselorMood === mood.id ? 'rgba(99,102,241,0.1)' : 'white',
                      color: counselorMood === mood.id ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      fontSize: '0.78rem', fontWeight: counselorMood === mood.id ? 700 : 500,
                      cursor: 'pointer', transition: 'all 0.2s',
                      display: 'flex', alignItems: 'center', gap: '4px'
                    }}
                  >
                    {mood.emoji} {mood.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat window */}
            <div style={{
              height: '400px', border: '1px solid var(--border-card)', borderRadius: '16px',
              background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.04)'
            }}>

              {/* Chat messages */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }} className="custom-scroll">
                {counselorHistory.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start', gap: '4px' }}>
                    {m.sender !== 'user' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                        }}>
                          <Heart size={12} color="white" />
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Tư Vấn AI</span>
                      </div>
                    )}
                    <div style={{
                      maxWidth: '82%', padding: '12px 16px', borderRadius: m.sender === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                      fontSize: '0.86rem', lineHeight: 1.6, whiteSpace: 'pre-line',
                      background: m.sender === 'user'
                        ? 'linear-gradient(135deg, var(--accent-primary) 0%, #8b5cf6 100%)'
                        : 'white',
                      color: m.sender === 'user' ? 'white' : '#1e293b',
                      border: m.sender === 'user' ? 'none' : '1px solid rgba(99,102,241,0.1)',
                      boxShadow: m.sender === 'user' ? '0 4px 12px rgba(99,102,241,0.25)' : '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      {m.text}
                    </div>
                    {m.timestamp && (
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {new Date(m.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}

                {/* Typing indicator */}
                {counselorIsTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Heart size={12} color="white" />
                    </div>
                    <div style={{
                      padding: '10px 16px', borderRadius: '4px 18px 18px 18px',
                      background: 'white', border: '1px solid rgba(99,102,241,0.1)',
                      display: 'flex', gap: '4px', alignItems: 'center'
                    }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1',
                          animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
                          animationName: 'typing-bounce'
                        }} />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Quick reply suggestions */}
              {counselorMsgCount === 0 && (
                <div style={{ padding: '10px 16px', borderTop: '1px solid #f1f5f9', background: 'white', display: 'flex', gap: '8px', overflowX: 'auto' }} className="custom-scroll">
                  {[
                    'Tôi đang bị áp lực thi cử 😰',
                    'Giúp tôi chọn ngành phù hợp',
                    'Tôi cảm thấy mệt mỏi và mất động lực',
                    'Kế hoạch ôn thi hiệu quả'
                  ].map(q => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleCounselorQuickReply(q)}
                      style={{
                        flexShrink: 0, padding: '6px 12px', borderRadius: '99px',
                        border: '1.5px solid rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.05)',
                        color: 'var(--accent-primary)', fontSize: '0.76rem', fontWeight: 600,
                        cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s'
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Chat input */}
              <form onSubmit={handleCounselorSend} style={{ display: 'flex', borderTop: '1px solid var(--border-card)', background: 'white', padding: '12px' }}>
                <input
                  type="text"
                  value={counselorInput}
                  onChange={e => setCounselorInput(e.target.value)}
                  placeholder={counselorIsTyping ? 'Thầy đang trả lời...' : 'Chia sẻ tâm sự với thầy...'}
                  disabled={counselorIsTyping}
                  className="form-control"
                  style={{ flex: 1, fontSize: '0.85rem', background: '#f1f5f9', border: 'none', borderRadius: '12px', color: '#1e293b', padding: '10px 16px' }}
                />
                <button
                  type="submit"
                  disabled={counselorIsTyping || !counselorInput.trim()}
                  className="btn btn-primary"
                  style={{ padding: '10px 14px', minWidth: 0, borderRadius: '12px', marginLeft: '8px', opacity: (counselorIsTyping || !counselorInput.trim()) ? 0.5 : 1 }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>

            {/* Disclaimer */}
            <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.5 }}>
              🔒 Mọi thông tin em chia sẻ được bảo mật tuyệt đối. AI Tư Vấn không thay thế chuyên gia tâm lý lâm sàng.
              Trong trường hợp khẩn cấp, gọi <strong>1800 599 920</strong>.
            </p>
          </div>

        </div>
      )}

      {/* SURVEY & EVALUATIONS TAB */}
      {subTab === 'evaluations' && (
        <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Survey Submission form */}
          <div>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Star size={18} color="var(--accent-primary)" />
              <span>Khảo sát Chất lượng Giảng dạy kì II</span>
            </h2>
            
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Ý kiến phản hồi từ học sinh sẽ giúp các thầy cô nâng cao chất lượng bài học bộ môn. Đơn khảo sát sẽ được bảo mật và gửi trực tiếp tới Ban Giám Hiệu.
            </p>

            <form onSubmit={handleEvaluationSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn Giáo viên bộ môn</label>
                <select 
                  className="form-control"
                  value={evalTeacherId}
                  onChange={e => setEvalTeacherId(e.target.value)}
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  {teachers && teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Đánh giá sao chất lượng bài giảng (1 - 5 sao)</label>
                <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setEvalRating(star)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      <Star 
                        size={28} 
                        fill={evalRating >= star ? '#eab308' : 'none'} 
                        color={evalRating >= star ? '#eab308' : '#cbd5e1'} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nhận xét chi tiết (Ưu điểm, Góp ý phương pháp dạy...)</label>
                <textarea 
                  className="form-control"
                  rows="4"
                  placeholder="Em muốn đóng góp ý kiến về việc giảng giải lý thuyết, giao bài tập về nhà hoặc không khí học tập trên lớp..."
                  value={evalComment}
                  onChange={e => setEvalComment(e.target.value)}
                  required
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', fontSize: '0.85rem' }}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                Gửi đơn khảo sát chất lượng giảng dạy
              </button>
            </form>
          </div>

          {/* Evaluations submitted history */}
          <div>
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Lịch sử đánh giá ({myEvaluations.length})</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {myEvaluations.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px' }}>
                  Em chưa gửi phiếu đánh giá nào trong kì học này.
                </p>
              ) : (
                myEvaluations.map(item => (
                  <div key={item.id} style={{ padding: '14px', border: '1px solid var(--border-card)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '0.9rem' }}>{item.teacherName}</strong>
                      <div style={{ display: 'flex', gap: '2px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star 
                            key={s} 
                            size={12} 
                            fill={item.rating >= s ? '#eab308' : 'none'} 
                            color={item.rating >= s ? '#eab308' : '#cbd5e1'} 
                          />
                        ))}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.4 }}>
                      "{item.comment}"
                    </p>
                    <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>{item.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* SMART CAFETERIA & MENU PLANNER TAB */}
      {subTab === 'cafeteria' && (
        <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Utensils size={18} color="var(--accent-primary)" />
              <span>Thực đơn Bán Trú & Dinh Dưỡng</span>
            </h2>
            
            {cafeteriaMenu && cafeteriaMenu.find(m => m.date === '2026-06-03') ? (() => {
              const todayMenu = cafeteriaMenu.find(m => m.date === '2026-06-03');
              const todayReg = cafeteriaRegistrations && cafeteriaRegistrations.find(r => r.studentId === student.id && r.date === '2026-06-03');
              const isRegistered = todayReg && todayReg.status === 'registered';

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ padding: '16px', borderRadius: '12px', background: isRegistered ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)', border: isRegistered ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Trạng thái đăng ký ăn hôm nay:</div>
                      <strong style={{ fontSize: '1rem', color: isRegistered ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                        {isRegistered ? `Đã đăng ký (${todayReg.mealType === 'Standard' ? 'Suất Thường' : 'Suất Chay'})` : 'Chưa đăng ký suất ăn bán trú'}
                      </strong>
                    </div>
                    {isRegistered && <span className="badge badge-success">Đã thanh toán qua ví</span>}
                  </div>

                  <div style={{ padding: '18px', border: '1px solid var(--border-card)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)' }}>
                    <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', color: 'var(--accent-primary)' }}>{todayMenu.name}</h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                      {todayMenu.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px dashed rgba(0,0,0,0.05)', fontSize: '0.9rem' }}>
                          <span style={{ fontWeight: 500 }}>{item.name}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{item.cal} kcal (Đạm: {item.p} • Xơ: {item.c} • Béo: {item.f})</span>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', fontWeight: 700 }}>Tổng quan năng lượng & Dinh dưỡng bữa trưa</h4>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <div style={{ position: 'relative', width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="100" height="100" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                          <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--accent-primary)" strokeWidth="3" strokeDasharray="38 100" strokeLinecap="round" />
                          <text x="18" y="17.5" fontSize="4.5" fontWeight="bold" textAnchor="middle" fill="var(--text-primary)">{todayMenu.totalCal}</text>
                          <text x="18" y="22.5" fontSize="3" textAnchor="middle" fill="var(--text-muted)">kcal</text>
                        </svg>
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                            <span>Chất đạm (Protein)</span>
                            <strong>{todayMenu.protein}</strong>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: '70%', height: '100%', background: '#3b82f6' }}></div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                            <span>Tinh bột (Carbohydrates)</span>
                            <strong>{todayMenu.carbs}</strong>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: '60%', height: '100%', background: '#f59e0b' }}></div>
                          </div>
                        </div>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '3px' }}>
                            <span>Chất béo (Lipid)</span>
                            <strong>{todayMenu.fat}</strong>
                          </div>
                          <div style={{ width: '100%', height: '5px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                            <div style={{ width: '40%', height: '100%', background: '#ec4899' }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <p style={{ color: 'var(--text-muted)' }}>Không có thông tin thực đơn bán trú hôm nay.</p>
            )}
          </div>

          {/* Feedback Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-card)', background: 'white' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', fontWeight: 700 }}>Đánh giá bữa ăn bán trú hôm nay</h3>
              <form onSubmit={handleMealFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label className="form-label">Chọn mức độ hài lòng (1 - 5 sao)</label>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <button key={star} type="button" onClick={() => setMealRateInput(star)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        <Star size={24} fill={mealRateInput >= star ? '#eab308' : 'none'} color={mealRateInput >= star ? '#eab308' : '#cbd5e1'} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Ý kiến đóng góp / phản hồi</label>
                  <textarea className="form-control" rows="3" placeholder="Đồ ăn hôm nay thế nào? Em có thích món này không? Hãy gửi phản hồi cho nhà bếp nhé..." value={mealCommentInput} onChange={e => setMealCommentInput(e.target.value)} style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b', fontSize: '0.85rem' }} />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Gửi phản hồi bữa ăn</button>
              </form>
            </div>

            {/* Past Meal Feedbacks */}
            <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid var(--border-card)', background: 'white' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '12px', fontWeight: 700 }}>Nhận xét bữa ăn gần đây</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }} className="custom-scroll">
                {cafeteriaFeedback && cafeteriaFeedback.filter(f => f.studentId === student.id).length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Chưa có đánh giá bữa ăn nào.</p>
                ) : (
                  cafeteriaFeedback && cafeteriaFeedback.filter(f => f.studentId === student.id).map(item => (
                    <div key={item.id} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-card)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Ngày {item.date.split('-').reverse().join('/')}</span>
                        <div style={{ display: 'flex', gap: '1px' }}>
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} size={10} fill={item.rating >= s ? '#eab308' : 'none'} color={item.rating >= s ? '#eab308' : '#cbd5e1'} />
                          ))}
                        </div>
                      </div>
                      <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)' }}>"{item.comment}"</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI LEARNING HEATMAP & STUDY PATH TAB */}
      {subTab === 'competency_heatmap' && (
        <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          <div>
            <h2 style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <LayoutGrid size={18} color="var(--accent-primary)" />
              <span>Bản đồ nhiệt Năng lực Học tập AI</span>
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Bản đồ trực quan hóa năng lực của bạn trong từng chủ đề học tập. Hãy nhấn vào khối màu để xem chi tiết chẩn đoán lộ trình học và gợi ý tài liệu ôn thi.
            </p>

            {/* Interactive SVG Heatmap/Treemap */}
            <div style={{ background: 'rgba(255, 255, 255, 0.5)', border: '1px solid var(--border-card)', borderRadius: '16px', padding: '12px', display: 'flex', justifyContent: 'center' }}>
              <svg width="100%" height="320" viewBox="0 0 600 310" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#34d399" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                  <linearGradient id="yellowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                  <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f87171" />
                    <stop offset="100%" stopColor="#dc2626" />
                  </linearGradient>
                </defs>

                {[
                  { x: 0, y: 0, w: 180, h: 90, topic: 'Hàm số & Đồ thị', sub: 'Toán', score: 85, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Thành thạo khảo sát hàm số, tương giao đồ thị và tiệm cận.' },
                  { x: 190, y: 0, w: 180, h: 90, topic: 'Số phức', sub: 'Toán', score: 92, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Hiểu rất sâu phần biểu diễn hình học số phức và tìm min-max cực trị.' },
                  { x: 380, y: 0, w: 220, h: 90, topic: 'Dao động cơ học', sub: 'Vật lý', score: 90, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Làm tốt các bài tập con lắc lò xo ghép, con lắc đơn chịu tác động lực lạ.' },
                  
                  { x: 0, y: 100, w: 220, h: 100, topic: 'Nghị luận xã hội', sub: 'Ngữ văn', score: 85, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Có vốn từ phong phú, cấu trúc bài viết nghị luận xã hội chặt chẽ.' },
                  { x: 230, y: 100, w: 170, h: 100, topic: 'Hình học Oxyz', sub: 'Toán', score: 72, color: '#f59e0b', grad: 'url(#yellowGrad)', desc: 'Nắm chắc kiến thức tọa độ phẳng nhưng lúng túng khi giải cực trị khoảng cách Oxyz.', resourceId: 'R01' },
                  { x: 410, y: 100, w: 190, h: 100, topic: 'Hạt nhân nguyên tử', sub: 'Vật lý', score: 80, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Nắm vững công thức tính năng lượng liên kết và định luật phóng xạ.' },
                  
                  { x: 0, y: 210, w: 230, h: 90, topic: 'Tích phân & Đạo hàm', sub: 'Toán', score: 45, color: '#ef4444', grad: 'url(#redGrad)', desc: 'Gặp khó khăn ở các bài toán tích phân lượng giác và phương pháp tích phân từng phần nâng cao.', resourceId: 'R01' },
                  { x: 240, y: 210, w: 180, h: 90, topic: 'Văn học hiện thực', sub: 'Ngữ văn', score: 50, color: '#f59e0b', grad: 'url(#yellowGrad)', desc: 'Bài phân tích giá trị hiện thực và nhân đạo tác phẩm Vợ Nhặt còn sơ sài, thiếu dẫn chứng.', resourceId: 'R02' },
                  { x: 430, y: 210, w: 170, h: 90, topic: 'Thơ ca kháng chiến', sub: 'Ngữ văn', score: 78, color: '#10b981', grad: 'url(#greenGrad)', desc: 'Cảm nhận thơ ca tốt, cần liên hệ mở rộng thêm bối cảnh lịch sử tác phẩm.' }
                ].map((item, idx) => {
                  const isSelected = selectedTopic && selectedTopic.topic === item.topic;
                  return (
                    <g key={idx} style={{ cursor: 'pointer' }} onClick={() => setSelectedTopic(item)}>
                      <rect 
                        x={item.x} 
                        y={item.y} 
                        width={item.w} 
                        height={item.h} 
                        rx="8" 
                        fill={item.grad} 
                        stroke={isSelected ? '#1e293b' : 'white'} 
                        strokeWidth={isSelected ? 3.5 : 1}
                        style={{ transition: 'all 0.2s', opacity: selectedTopic ? (isSelected ? 1 : 0.7) : 0.95 }}
                      />
                      <text x={item.x + 12} y={item.y + 26} fill="white" fontSize="10.5" fontWeight="bold">{item.sub}</text>
                      <text x={item.x + 12} y={item.y + 44} fill="white" fontSize="11" fontWeight="700" style={{ letterSpacing: '-0.3px' }}>{item.topic}</text>
                      <rect x={item.x + 12} y={item.y + item.h - 26} width="40" height="15" rx="4" fill="rgba(255,255,255,0.25)" />
                      <text x={item.x + 32} y={item.y + item.h - 15} fill="white" fontSize="9.5" fontWeight="bold" textAnchor="middle">{item.score}%</text>
                    </g>
                  );
                })}
              </svg>
            </div>
            
            {/* Color guide */}
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '14px', fontSize: '0.8rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '3px' }}></div><span>{'Tốt (>=80%)'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '3px' }}></div><span>Khá / Trung bình (50-79%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '3px' }}></div><span>{'Yếu / Hổng kiến thức (<50%)'}</span></div>
            </div>
          </div>

          {/* Diagnosis & Action panel */}
          <div>
            <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-card)', background: 'white', minHeight: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {selectedTopic ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%', justifyContent: 'space-between', flex: 1 }}>
                  <div>
                    <span className="badge" style={{ background: selectedTopic.score >= 80 ? 'rgba(16, 185, 129, 0.1)' : selectedTopic.score >= 50 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedTopic.color, fontWeight: 700 }}>
                      Môn {selectedTopic.sub} • {selectedTopic.score >= 80 ? 'Thành thạo' : selectedTopic.score >= 50 ? 'Cần củng cố' : 'Lỗ hổng lớn'}
                    </span>
                    
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '10px 0 6px 0', color: 'var(--text-primary)' }}>{selectedTopic.topic}</h3>
                    
                    <div style={{ borderLeft: `3px solid ${selectedTopic.color}`, paddingLeft: '12px', margin: '14px 0', fontSize: '0.88rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
                      <strong>Chẩn đoán của AI:</strong>
                      <p style={{ margin: '4px 0 0 0', fontStyle: 'italic' }}>"{selectedTopic.desc}"</p>
                    </div>

                    <div style={{ padding: '12px', background: 'rgba(79, 70, 229, 0.03)', border: '1px solid rgba(79, 70, 229, 0.08)', borderRadius: '10px', fontSize: '0.85rem' }}>
                      <h4 style={{ margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                        <Sparkles size={14} />
                        <span>Lộ trình ôn tập gợi ý:</span>
                      </h4>
                      <ol style={{ margin: 0, paddingLeft: '16px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        <li>Đọc và làm theo tài liệu đính kèm.</li>
                        <li>Luyện tập 3-5 thẻ Flashcards liên quan.</li>
                        <li>Làm quiz trắc nghiệm nhanh 5 câu để kiểm tra lại.</li>
                      </ol>
                    </div>
                  </div>

                  {selectedTopic.resourceId ? (() => {
                    const linkedRes = learningResources && learningResources.find(r => r.id === selectedTopic.resourceId);
                    return (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <BookOpen size={14} />
                          <span>Học liệu liên kết: {linkedRes ? linkedRes.title : 'Tài liệu ôn tập Toán/Văn'}</span>
                        </div>
                        <button
                          onClick={() => {
                            setSubTab('library');
                            setTimeout(() => {
                              const el = document.getElementById(selectedTopic.resourceId);
                              if (el) {
                                el.scrollIntoView({ behavior: 'smooth' });
                                el.style.boxShadow = '0 0 15px var(--accent-primary)';
                                setTimeout(() => { el.style.boxShadow = ''; }, 2000);
                              }
                            }, 100);
                          }}
                          className="btn btn-primary"
                          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                          <BookOpen size={16} />
                          <span>Mở tài liệu ôn tập ngay</span>
                        </button>
                      </div>
                    );
                  })() : (
                    <div style={{ marginTop: '20px' }}>
                      <button
                        onClick={() => setSubTab('library')}
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                      >
                        Mở thư mục Học liệu & Flashcards
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', textAlign: 'center', padding: '40px 10px' }}>
                  <Brain size={44} strokeWidth={1.2} style={{ marginBottom: '14px', color: 'var(--accent-primary)' }} />
                  <p style={{ margin: 0, fontSize: '0.88rem' }}>Vui lòng chọn một khối kiến thức trên Bản đồ năng lực học tập để xem chẩn đoán AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL STUDENT ID & CARD WALLET TAB */}
      {subTab === 'wallet_id' && (() => {
        const wallet = studentWallets[student.id] || { balance: 0, dailyLimit: 100000, transactions: [] };
        const todaySpend = wallet.transactions ? wallet.transactions.filter(t => t.date === '2026-06-03' && t.type === 'spend').reduce((sum, t) => sum + t.amount, 0) : 0;
        const remainLimit = Math.max(0, wallet.dailyLimit - todaySpend);
        
        return (
          <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '30px', alignItems: 'start' }}>
            {/* 3D Student ID Card Mockup */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
              <div style={{ alignSelf: 'flex-start' }}>
                <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Thẻ Học Sinh Số (3D Virtual ID)</h2>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Bấm trực tiếp vào thẻ hoặc nút bên dưới để lật mặt thẻ</p>
              </div>

              {/* 3D Perspective Card Container */}
              <div 
                className="student-card-3d-wrap" 
                onClick={() => setIdCardFlipped(!idCardFlipped)}
                style={{
                  width: '320px',
                  height: '200px',
                  perspective: '1000px',
                  cursor: 'pointer',
                  margin: '10px 0'
                }}
              >
                <div 
                  className={`student-card-3d-inner ${idCardFlipped ? 'flipped' : ''}`}
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: idCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                  }}
                >
                  {/* FRONT SIDE OF ID CARD */}
                  <div 
                    className="card-front"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.85), rgba(139, 92, 246, 0.85))',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255, 255, 255, 0.25)',
                      padding: '16px',
                      color: 'white',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textAlign: 'left',
                      boxShadow: '0 10px 25px rgba(99, 102, 241, 0.15)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>EduPortal School</span>
                      <span style={{ fontSize: '0.68rem', background: 'rgba(255,255,255,0.2)', padding: '3px 8px', borderRadius: '99px' }}>THPT Quốc Gia</span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', margin: '14px 0' }}>
                      <img 
                        src={student.avatarUrl} 
                        alt="Avatar" 
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid white' }} 
                      />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <strong style={{ fontSize: '1.05rem', lineHeight: '1.2' }}>{student.name}</strong>
                        <span style={{ fontSize: '0.72rem', opacity: 0.85, marginTop: '2px' }}>Mã HS: {student.id}</span>
                        <span style={{ fontSize: '0.72rem', opacity: 0.85 }}>Lớp học: {student.class}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                      <div>
                        <div style={{ fontSize: '0.6rem', opacity: 0.7 }}>NIÊN KHÓA</div>
                        <strong style={{ fontSize: '0.75rem' }}>2023 - 2026</strong>
                      </div>
                      <span style={{ fontSize: '0.65rem', background: '#10b981', color: 'white', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>THẺ HOẠT ĐỘNG</span>
                    </div>
                  </div>

                  {/* BACK SIDE OF ID CARD */}
                  <div 
                    className="card-back"
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: '100%',
                      backfaceVisibility: 'hidden',
                      borderRadius: '16px',
                      background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.9), rgba(17, 24, 39, 0.95))',
                      backdropFilter: 'blur(10px)',
                      border: '1.5px solid rgba(255, 255, 255, 0.15)',
                      padding: '16px',
                      color: 'white',
                      transform: 'rotateY(180deg)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', textAlign: 'left', flex: 1, paddingRight: '12px' }}>
                      <strong style={{ fontSize: '0.72rem', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Ví điện tử tích hợp</strong>
                      <p style={{ fontSize: '0.6rem', opacity: 0.7, margin: '6px 0', lineHeight: '1.3' }}>
                        Dùng quét mã QR tại căng tin, thư viện, hoặc cổng soát vé bán trú của trường học.
                      </p>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '0.55rem', opacity: 0.6 }}>Hiệu lực đến</div>
                        <strong style={{ fontSize: '0.7rem' }}>30/06/2026</strong>
                      </div>
                    </div>
                    
                    <div style={{ background: 'white', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="85" height="85" viewBox="0 0 29 29" style={{ display: 'block' }}>
                        <path d="M0 0h9v9H0zm1 1v7h7V1zm8 8h1v1h-1zm1 1v1h1v1h-1v-2zm-1 2H7v1H6v-1H5v2H4v-1H3v1H1v-1H0v2h2v1h1v-1h2v1h1v-1h1v1h1v-2H8v-1zm1-9h9v9H9zm1 1v7h7V1zm-1 8H0v9h9zm1 1v7h7V10zm8 0h1v1h-1zm2 1h1v1h-1zm-2 2h2v1h-2zm2 1h1v1h-1zm-2 2h1v1h-1zm1 1v1H9v-1h1v-1h7v1zm1 1h1v1h-1zM20 0h9v9h-9zm1 1v7h7V1zm-1 8h1v1h-1zm2 1h2v1h-2zm-2 2h1v1h-1zm2 1h1v1h-1zm-2 2h2v1h-2z" fill="#000" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-secondary" 
                onClick={(e) => {
                  e.stopPropagation();
                  setIdCardFlipped(!idCardFlipped);
                }}
                style={{ fontSize: '0.8rem', padding: '6px 14px' }}
              >
                Lật mặt thẻ
              </button>
            </div>

            {/* Wallet Panel & Canteen Simulation */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Wallet Info Card */}
              <div 
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.7), rgba(255,255,255,0.5))',
                  border: '1px solid var(--border-card)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Wallet size={18} color="var(--accent-primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Ví điện tử cá nhân</span>
                  </div>
                  <span className="badge badge-info" style={{ fontWeight: 700 }}>Học sinh</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>SỐ DƯ HIỆN TẠI</div>
                    <strong style={{ fontSize: '1.75rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
                      {wallet.balance.toLocaleString()}đ
                    </strong>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>HẠN MỨC NGÀY CÒN LẠI</div>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                      {remainLimit.toLocaleString()}đ
                    </strong>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Giới hạn ngày: {wallet.dailyLimit.toLocaleString()}đ</div>
                  </div>
                </div>

                {/* Progress bar of limit */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                    <span>Tiêu dùng hôm nay: {todaySpend.toLocaleString()}đ</span>
                    <span>Hạn mức: {wallet.dailyLimit.toLocaleString()}đ</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        width: `${Math.min(100, (todaySpend / wallet.dailyLimit) * 100)}%`, 
                        height: '100%', 
                        background: (todaySpend / wallet.dailyLimit) >= 0.85 ? 'var(--accent-danger)' : 'var(--accent-primary)',
                        borderRadius: '99px'
                      }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Simulation buy canteen */}
              <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-card)', background: 'white' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--accent-secondary)" />
                  <span>Giả lập mua hàng Canteen trường</span>
                </h3>
                
                <form onSubmit={handleCanteenPurchase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Chọn mặt hàng thanh toán</label>
                    <select 
                      className="form-control" 
                      onChange={e => {
                        const val = e.target.value;
                        setCanteenItem(val);
                        if (val === 'Snack & Nước ngọt') setCanteenPrice(15000);
                        if (val === 'Bánh mì sườn') setCanteenPrice(25000);
                        if (val === 'Hộp bút màu & Thước kẻ') setCanteenPrice(40000);
                        if (val === 'Sữa tươi Milo') setCanteenPrice(10000);
                      }}
                      style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                    >
                      <option value="Snack & Nước ngọt">Snack & Nước ngọt - 15.000đ</option>
                      <option value="Bánh mì sườn">Bánh mì sườn - 25.000đ</option>
                      <option value="Hộp bút màu & Thước kẻ">Hộp bút màu & Thước kẻ - 40.000đ</option>
                      <option value="Sữa tươi Milo">Sữa tươi Milo - 10.000đ</option>
                    </select>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', background: 'linear-gradient(to right, var(--accent-secondary), #10b981)' }}>
                    Quét QR ví chi trả {canteenPrice.toLocaleString()}đ
                  </button>
                </form>
              </div>

              {/* Transaction Logs */}
              <div style={{ padding: '20px', borderRadius: '16px', border: '1px solid var(--border-card)', background: 'white' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <RefreshCw size={14} />
                  <span>Lịch sử chi tiêu ví học sinh</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '180px', overflowY: 'auto' }} className="custom-scroll">
                  {wallet.transactions && wallet.transactions.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Chưa có giao dịch ví nào được thực hiện.</p>
                  ) : (
                    wallet.transactions && wallet.transactions.map((tx, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--border-card)', fontSize: '0.82rem' }}>
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{tx.description}</strong>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{tx.date.split('-').reverse().join('/')}</span>
                        </div>
                        <span style={{ fontWeight: 700, color: tx.type === 'spend' ? 'var(--accent-danger)' : '#10b981' }}>
                          {tx.type === 'spend' ? '-' : '+'}{tx.amount.toLocaleString()}đ
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
