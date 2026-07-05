import { useContext, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppContext } from '../context/AppContext';
import { SUBJECT_NAMES, BLOCKS } from '../data/mockExamsData';
import { 
  Users, 
  MessageSquare, 
  Award, 
  CheckCircle,
  Clock,
  Send,
  Calendar,
  BookOpen,
  FileText,
  Check,
  X,
  ClipboardList,
  Sparkles,
  Upload,
  Paperclip
} from 'lucide-react';
import TeacherOverview from './dash/TeacherOverview';
import AiLessonPlannerTab from './teacher/AiLessonPlannerTab';


export default function TeacherDashboard({ activeTab: globalActiveTab, setActiveTab: setGlobalActiveTab }) {
  const { 
    students, 
    parentQAs, 
    editStudentGrades, 
    answerParentQuestion,
    leaveRequests,
    approveLeaveRequest,
    lessonPlans,
    submitLessonPlan,
    conductLogs,
    addConductLog,
    assignments,
    submissions,
    createAssignment,
    gradeSubmission,
    attendanceLogs,
    logAttendance,
    learningResources,
    uploadResource,
    mockExamHistory,
    addCustomExam,
    teachers,
    teacherLeaveRequests,
    submitTeacherLeaveRequest,
    userSession,
    teacherSubTab,
    setTeacherSubTab
  } = useContext(AppContext);

  const activeTab = teacherSubTab || 'students';

  const handleSubTabChange = (tab) => {
    setTeacherSubTab(tab);
    if (setGlobalActiveTab) {
      setGlobalActiveTab('dashboard');
    }
  };

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showGradeEntryModal, setShowGradeEntryModal] = useState(false);
  const [gradesInput, setGradesInput] = useState({ Math: 0, Literature: 0, Physics: 0, English: 0 });
  const [selectedSubject, setSelectedSubject] = useState('Math');
  const [detailedGradesInput, setDetailedGradesInput] = useState({ oral: 0, quiz15m: 0, test1Period: 0, semester: 0 });

  const loadDetailedGradesForSubject = (student, subject) => {
    if (!student) return;
    if (student.gradesDetailed && student.gradesDetailed[subject]) {
      setDetailedGradesInput(student.gradesDetailed[subject]);
    } else {
      const score = student.grades[subject] || 0;
      setDetailedGradesInput({ oral: score, quiz15m: score, test1Period: score, semester: score });
    }
  };

  useEffect(() => {
    if (selectedStudent) {
      loadDetailedGradesForSubject(selectedStudent, selectedSubject);
    }
  }, [selectedStudent, selectedSubject]);
  const [replies, setReplies] = useState({}); // state for tracking reply text per QA item

  // Teacher Leave States
  const [teacherLeaveDate, setTeacherLeaveDate] = useState('');
  const [teacherLeaveReason, setTeacherLeaveReason] = useState('');
  const [teacherSubstituteId, setTeacherSubstituteId] = useState('');
  
  // Mock Exam States
  const [mockExamSearch, setMockExamSearch] = useState('');
  const [mockExamBlockFilter, setMockExamBlockFilter] = useState('ALL');

  // Lesson plan state
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanSubject, setNewPlanSubject] = useState('Toán học');

  // Student Conduct state
  const [selectedConductStudent, setSelectedConductStudent] = useState(null);
  const [conductPointsDelta, setConductPointsDelta] = useState(10);
  const [conductReason, setConductReason] = useState('');

  // Homework Assignments local states
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);
  const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false);
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentClassTarget, setNewAssignmentClassTarget] = useState('12A1');
  const [newAssignmentContent, setNewAssignmentContent] = useState('');
  const [newAssignmentDeadline, setNewAssignmentDeadline] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedGradingSubmission, setSelectedGradingSubmission] = useState(null);
  const [gradingScore, setGradingScore] = useState('');
  const [gradingFeedback, setGradingFeedback] = useState('');
  
  // AI Quiz Creator States
  const [assignmentMode, setAssignmentMode] = useState('normal'); // 'normal' | 'ai_quiz'
  const [aiQuizTopic, setAiQuizTopic] = useState('');
  const [aiQuizSubject, setAiQuizSubject] = useState('English');
  const [aiQuizQuestions, setAiQuizQuestions] = useState([]);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Part 6 local states
  const [resTitle, setResTitle] = useState('');
  const [resSubject, setResSubject] = useState('Toán học');
  const [resType, setResType] = useState('pdf');

  // Exam Creator States
  const [showCreateExamModal, setShowCreateExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamBlock, setNewExamBlock] = useState('A00');
  const [newExamDuration, setNewExamDuration] = useState(45);
  const [newExamQuestions, setNewExamQuestions] = useState([]);
  const [generatedComment, setGeneratedComment] = useState('');

  const handleGenerateComment = () => {
    if (!selectedStudent) return;
    const m = selectedStudent.grades.Math || 0;
    const l = selectedStudent.grades.Literature || 0;
    const p = selectedStudent.grades.Physics || 0;
    const e = selectedStudent.grades.English || 0;
    const avg = (m + l + p + e) / 4;
    const logs = conductLogs ? conductLogs.filter(cl => cl.studentId === selectedStudent.id) : [];
    const conductScore = 100 + logs.reduce((sum, curr) => sum + curr.points, 0);
    const conduct = conductScore >= 90 ? 'Tốt' : conductScore >= 70 ? 'Khá' : 'Trung bình';

    let commentText = '';
    if (avg >= 8.5 && conduct === 'Tốt') {
      commentText = `Học sinh ${selectedStudent.name} học lực giỏi toàn diện, tích cực xây dựng bài, đặc biệt xuất sắc ở các môn học tự nhiên. Ý thức thi đua rất tốt, gương mẫu trong học tập và rèn luyện.`;
    } else if (avg >= 8.0 && conduct === 'Tốt') {
      commentText = `Học sinh ${selectedStudent.name} có học lực Giỏi, tiếp thu bài nhanh, chăm ngoan. Chấp hành nghiêm chỉnh nội quy nhà trường và nề nếp thi đua của lớp.`;
    } else if (avg >= 6.5 && conduct !== 'Yếu') {
      commentText = `Học sinh ${selectedStudent.name} có học lực Khá, tiếp thu bài ổn định. Cần rèn luyện thêm tính kiên trì ở các môn tự nhiên. Hạnh kiểm ngoan ngoãn, lễ phép với thầy cô.`;
    } else {
      commentText = `Học sinh ${selectedStudent.name} học lực trung bình, còn hổng kiến thức căn bản ở một số môn. Cần tăng cường học nhóm và chú ý nghe giảng. Cần cố gắng rèn nề nếp thêm.`;
    }
    setGeneratedComment(commentText);
  };

  const createBlankQuestion = (subj = 'Math') => ({
    id: 'Q_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
    subject: subj,
    question: '',
    options: [
      { key: 'A', text: '' },
      { key: 'B', text: '' },
      { key: 'C', text: '' },
      { key: 'D', text: '' }
    ],
    correctKey: 'A',
    explanation: ''
  });

  const handleAddQuestion = () => {
    const subjects = BLOCKS[newExamBlock]?.subjects || ['Math'];
    const defaultSubject = subjects[0] || 'Math';
    setNewExamQuestions(prev => [...prev, createBlankQuestion(defaultSubject)]);
  };

  const handleDeleteQuestion = (index) => {
    setNewExamQuestions(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleQuestionChange = (index, field, value) => {
    setNewExamQuestions(prev => prev.map((q, idx) => idx === index ? { ...q, [field]: value } : q));
  };

  const handleOptionTextChange = (qIndex, oKey, text) => {
    setNewExamQuestions(prev => prev.map((q, idx) => {
      if (idx !== qIndex) return q;
      const updatedOptions = q.options.map(opt => opt.key === oKey ? { ...opt, text } : opt);
      return { ...q, options: updatedOptions };
    }));
  };

  const handleCreateExamSubmit = (e) => {
    e.preventDefault();
    if (!newExamTitle.trim()) {
      alert('Vui lòng nhập tiêu đề đề thi!');
      return;
    }
    if (newExamQuestions.length === 0) {
      alert('Vui lòng thêm ít nhất một câu hỏi!');
      return;
    }
    
    // Check if all questions are filled out
    for (let i = 0; i < newExamQuestions.length; i++) {
      const q = newExamQuestions[i];
      if (!q.question.trim()) {
        alert(`Vui lòng nhập nội dung câu hỏi thứ ${i + 1}!`);
        return;
      }
      for (let j = 0; j < q.options.length; j++) {
        if (!q.options[j].text.trim()) {
          alert(`Vui lòng nhập nội dung phương án ${q.options[j].key} của câu hỏi thứ ${i + 1}!`);
          return;
        }
      }
    }

    const examData = {
      title: newExamTitle,
      block: newExamBlock,
      duration: parseInt(newExamDuration),
      questions: newExamQuestions,
      teacherName: 'Nguyễn Minh Triết'
    };

    addCustomExam(examData);
    alert('Đã ban hành đề thi thử mới thành công!');
    setShowCreateExamModal(false);
    setNewExamTitle('');
    setNewExamBlock('A00');
    setNewExamDuration(45);
    setNewExamQuestions([]);
  };

  // We assume this teacher manages Lớp 12A1
  const classStudents = students.filter(s => s.class === '12A1');
  const classAttempts = mockExamHistory ? mockExamHistory.filter(h => h.class === '12A1') : [];
  const overallClassAverage = classAttempts.length > 0 
    ? (classAttempts.reduce((acc, curr) => acc + curr.score, 0) / classAttempts.length).toFixed(1)
    : '0.0';
  const highestClassScore = classAttempts.length > 0
    ? Math.max(...classAttempts.map(h => h.score)).toFixed(1)
    : '0.0';
  const classLeaves = leaveRequests ? leaveRequests.filter(l => l.class === '12A1') : [];
  const myLessonPlans = lessonPlans ? lessonPlans.filter(p => p.teacherName === 'Nguyễn Minh Triết') : [];
  const teacherConductLogs = conductLogs ? conductLogs.filter(l => l.teacherName === 'Nguyễn Minh Triết') : [];
  
  // Teacher Leaves data
  const myCoverSchedules = teacherLeaveRequests ? teacherLeaveRequests.filter(r => r.substituteTeacherId === 'T01' && r.status === 'approved') : [];
  const myTeacherLeaves = teacherLeaveRequests ? teacherLeaveRequests.filter(r => r.teacherId === 'T01') : [];


  const handleGradeSubmit = (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    
    const { oral, quiz15m, test1Period, semester } = detailedGradesInput;
    const avg = parseFloat(((oral + quiz15m + test1Period * 2 + semester * 3) / 7).toFixed(1));

    // Update with detailed grades and its calculated average
    editStudentGrades(selectedStudent.id, selectedSubject, avg, detailedGradesInput);

    setSelectedStudent(null);
    alert(`Đã cập nhật bảng điểm chi tiết môn ${selectedSubject === 'Math' ? 'Toán' : selectedSubject === 'Literature' ? 'Ngữ văn' : selectedSubject === 'Physics' ? 'Vật lý' : 'Tiếng Anh'} của học sinh ${selectedStudent.name}!`);
  };

  const handleAnswerSubmit = (qaId) => {
    const text = replies[qaId];
    if (!text || !text.trim()) return;
    
    answerParentQuestion(qaId, text);
    setReplies(prev => ({ ...prev, [qaId]: '' }));
    alert('Đã gửi phản hồi thành công đến phụ huynh!');
  };

  const handleLeaveApproval = (requestId, status) => {
    approveLeaveRequest(requestId, status);
    alert(`Đã ${status === 'approved' ? 'chấp thuận' : 'từ chối'} yêu cầu nghỉ phép!`);
  };

  const handleLessonPlanSubmit = (e) => {
    e.preventDefault();
    if (!newPlanTitle.trim()) return;

    submitLessonPlan('Nguyễn Minh Triết', newPlanSubject, newPlanTitle);
    setNewPlanTitle('');
    alert('Đã nộp giáo án lên Ban Giám Hiệu thành công!');
  };

  const handleTeacherLeaveSubmit = (e) => {
    e.preventDefault();
    if (!teacherLeaveDate || !teacherSubstituteId || !teacherLeaveReason.trim()) {
      alert('Vui lòng điền đầy đủ thông tin đơn nghỉ phép!');
      return;
    }
    submitTeacherLeaveRequest('T01', teacherLeaveDate, teacherLeaveReason, teacherSubstituteId);
    setTeacherLeaveDate('');
    setTeacherLeaveReason('');
    setTeacherSubstituteId('');
    alert('Đã gửi đơn xin nghỉ phép và dạy thay lên BGH phê duyệt!');
  };

  const handleConductSubmit = (e) => {
    e.preventDefault();
    if (!selectedConductStudent || !conductReason.trim()) return;

    addConductLog(selectedConductStudent.id, conductPointsDelta, conductReason, 'Nguyễn Minh Triết');
    setSelectedConductStudent(null);
    setConductReason('');
    alert('Đã ghi nhận điểm rèn luyện thi đua cá nhân học sinh thành công!');
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAssignmentSubmit = (e) => {
    e.preventDefault();
    if (!newAssignmentTitle.trim() || !newAssignmentContent.trim() || !newAssignmentDeadline) return;

    createAssignment(
      'T01',
      'Nguyễn Minh Triết',
      assignmentMode === 'ai_quiz' ? (aiQuizSubject === 'English' ? 'Tiếng Anh' : aiQuizSubject === 'Physics' ? 'Vật lý' : 'Toán học') : 'Toán học',
      newAssignmentClassTarget,
      newAssignmentTitle,
      newAssignmentContent,
      newAssignmentDeadline,
      selectedFile ? selectedFile.name : null,
      assignmentMode === 'ai_quiz' ? aiQuizQuestions : null
    );
    
    setNewAssignmentTitle('');
    setNewAssignmentContent('');
    setNewAssignmentDeadline('');
    setSelectedFile(null);
    setAssignmentMode('normal');
    setAiQuizTopic('');
    setAiQuizQuestions([]);
    setShowCreateAssignmentModal(false);
    alert('Đã giao bài tập mới thành công!');
  };

  const handleTriggerAiQuizGen = () => {
    if (!aiQuizTopic.trim()) {
      alert('Vui lòng điền chủ đề bài trắc nghiệm!');
      return;
    }
    setIsGeneratingQuiz(true);
    setTimeout(() => {
      let questions = [];
      if (aiQuizSubject === 'English') {
        questions = [
          { question: `Tìm câu đúng sử dụng Thì Hiện tại hoàn thành với chủ đề "${aiQuizTopic}":`, options: [`A. She has just learned about ${aiQuizTopic}.`, `B. She is learning about ${aiQuizTopic}.`, `C. She learned about ${aiQuizTopic} yesterday.`, `D. She will learn about ${aiQuizTopic}.`], correctKey: 'A' },
          { question: `Chia động từ: "We ___ (study) ${aiQuizTopic} for three weeks."`, options: ['A. studied', 'B. have studied', 'C. are studying', 'D. will study'], correctKey: 'B' },
          { question: `Chọn đáp án đúng nhất điền vào chỗ trống: "They haven't finished the test about ${aiQuizTopic} ___."`, options: ['A. already', 'B. yet', 'C. since', 'D. ago'], correctKey: 'B' },
        ];
      } else if (aiQuizSubject === 'Physics') {
        questions = [
          { question: `Định luật/Công thức cốt lõi liên quan đến chủ đề "${aiQuizTopic}":`, options: ['A. Công thức liên hệ độc lập thời gian', 'B. Định luật bảo toàn cơ năng', 'C. Hệ thức Anh-xtanh', 'D. Tất cả đều đúng'], correctKey: 'D' },
          { question: `Tính chất quan trọng nhất khi nghiên cứu về "${aiQuizTopic}":`, options: ['A. Biên độ luôn suy giảm theo thời gian', 'B. Pha ban đầu luôn bằng không', 'C. Tần số luôn phụ thuộc vào ngoại lực', 'D. Chu kỳ dao động không đổi'], correctKey: 'D' },
          { question: `Đơn vị đo lường tương ứng của đại lượng trong bài tập "${aiQuizTopic}":`, options: ['A. Hz (Héc)', 'B. J (Jun)', 'C. N (Niuton)', 'D. Tùy thuộc vào đại lượng cụ thể'], correctKey: 'D' },
        ];
      } else { // Math
        questions = [
          { question: `Giải phương trình/bài toán ứng dụng chủ đề "${aiQuizTopic}":`, options: ['A. Nghiệm duy nhất x = 0', 'B. Nghiệm x thuộc khoảng (0;1)', 'C. Vô số nghiệm thực', 'D. Cần điều kiện biên để xác định nghiệm'], correctKey: 'D' },
          { question: `Để tìm điểm cực trị hoặc tối ưu hóa trong bài toán "${aiQuizTopic}", ta dùng:`, options: ['A. Đạo hàm bậc nhất f\'(x) = 0', 'B. Tính tích phân cận từ 0 đến vô cực', 'C. Vẽ đồ thị hàm số mũ', 'D. Giải phương trình vi phân bậc hai'], correctKey: 'A' },
          { question: `Phát biểu nào sau đây là ĐÚNG về lý thuyết "${aiQuizTopic}":`, options: ['A. Là ánh xạ liên tục trên tập số thực', 'B. Là tập hợp rỗng', 'C. Luôn có giá trị âm', 'D. Là hàm số tuần hoàn với chu kỳ tuần hoàn pi'], correctKey: 'A' },
        ];
      }
      setAiQuizQuestions(questions);
      setNewAssignmentTitle(`Bài trắc nghiệm AI: Chuyên đề ${aiQuizTopic}`);
      setNewAssignmentContent(`Học sinh hãy hoàn thành bài trắc nghiệm 3 câu hỏi do AI tạo tự động về chuyên đề: ${aiQuizTopic}. Bài nộp sẽ được hệ thống chấm điểm tự động ngay lập tức.`);
      setIsGeneratingQuiz(false);
      alert('Đã tạo đề trắc nghiệm bằng AI thành công! Bạn có thể xem trước nội dung bên dưới.');
    }, 1200);
  };

  const handleGradeSubmissionSubmit = (e) => {
    e.preventDefault();
    if (!selectedGradingSubmission || gradingScore === '') return;

    gradeSubmission(selectedGradingSubmission.id, gradingScore, gradingFeedback);
    setSelectedGradingSubmission(null);
    setGradingScore('');
    setGradingFeedback('');
    alert('Đã chấm điểm và gửi phản hồi bài tập thành công!');
  };

  return (
    <div className="animate-fade">
      {/* Content Panes */}
      {activeTab === 'students' && (
        <TeacherOverview 
          teacherName={userSession?.displayName} 
          onEnterGradesClick={() => setShowGradeEntryModal(true)}
          onAssignHomeworkClick={() => {
            handleSubTabChange('assignments');
            setShowCreateAssignmentModal(true);
          }}
          onViewAssignmentsClick={() => {
            handleSubTabChange('assignments');
          }}
        />
      )}

      {activeTab === 'qa' && (
        /* Parent QAs Panel */
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <MessageSquare size={18} color="var(--accent-primary)" />
            <span>Hỏi đáp Phụ Huynh Học Sinh</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {parentQAs.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Chưa có trao đổi nào từ phụ huynh.
              </div>
            ) : (
              parentQAs.map(qa => (
                <div 
                  key={qa.id} 
                  className="glass-panel" 
                  style={{ 
                    background: 'rgba(255, 255, 255, 0.01)', 
                    borderColor: qa.status === 'pending' ? 'var(--accent-warning-glow)' : 'var(--border-card)',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <strong>{qa.parentName}</strong> (PH em {qa.studentName})
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {qa.status === 'pending' ? (
                        <><Clock size={12} color="var(--accent-warning)" /> Chưa trả lời</>
                      ) : (
                        <><CheckCircle size={12} color="var(--accent-secondary)" /> Đã trả lời</>
                      )}
                      <span> • {qa.date}</span>
                    </span>
                  </div>
                  
                  <p style={{ fontWeight: 500, fontSize: '0.95rem', marginBottom: '12px' }}>{qa.question}</p>

                  {qa.status === 'resolved' ? (
                    <div style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(16, 185, 129, 0.05)', borderLeft: '3px solid var(--accent-secondary)', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      <strong>Thầy Minh Triết phản hồi: </strong>{qa.reply}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Nhập câu trả lời cho phụ huynh..."
                        value={replies[qa.id] || ''}
                        onChange={e => setReplies({...replies, [qa.id]: e.target.value})}
                      />
                      <button 
                        onClick={() => handleAnswerSubmit(qa.id)}
                        className="btn btn-primary"
                        style={{ padding: '10px 20px' }}
                      >
                        <Send size={14} />
                        <span>Gửi</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'leaves' && (
        /* Leave Approval Panel */
        <div className="glass-panel">
          <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
            <Calendar size={18} color="var(--accent-primary)" />
            <span>Phê Duyệt Đơn Nghỉ Phép Lớp 12A1</span>
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Học Sinh</th>
                  <th>Phụ Huynh</th>
                  <th>Ngày Xin Nghỉ</th>
                  <th>Lý Do Xin Nghỉ</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {classLeaves.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      Không có đơn nghỉ phép nào cho lớp 12A1.
                    </td>
                  </tr>
                ) : (
                  classLeaves.map(leave => (
                    <tr key={leave.id}>
                      <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{leave.id}</td>
                      <td style={{ fontWeight: 600 }}>{leave.studentName}</td>
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
                          {leave.status === 'approved' && 'Đã đồng ý'}
                          {leave.status === 'rejected' && 'Từ chối'}
                        </span>
                      </td>
                      <td>
                        {leave.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button 
                              onClick={() => handleLeaveApproval(leave.id, 'approved')} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#e2f8f0', color: '#0f766e', borderColor: '#ccfbf1', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Check size={12} /> Duyệt
                            </button>
                            <button 
                              onClick={() => handleLeaveApproval(leave.id, 'rejected')} 
                              className="btn btn-secondary" 
                              style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#fee2e2', color: '#991b1b', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <X size={12} /> Từ chối
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Không có</span>
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

      {activeTab === 'teacher_leaves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          {/* Submit Teacher Leave Request Form */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Calendar size={18} color="var(--accent-primary)" />
              <span>Đơn Xin Nghỉ Phép & Đổi Dạy Thay</span>
            </h2>

            <form onSubmit={handleTeacherLeaveSubmit}>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>Ngày xin nghỉ phép</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={teacherLeaveDate}
                  onChange={e => setTeacherLeaveDate(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)' }}
                  required
                />
              </div>
              <div className="form-group" style={{ marginTop: '14px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Giáo viên dạy thay</label>
                <select 
                  className="form-control"
                  value={teacherSubstituteId}
                  onChange={e => setTeacherSubstituteId(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)' }}
                  required
                >
                  <option value="">-- Chọn giáo viên dạy thay --</option>
                  {teachers && teachers.filter(t => t.id !== 'T01').map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.subject})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ marginTop: '14px', marginBottom: '20px' }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Lý do nghỉ phép</label>
                <textarea 
                  className="form-control" 
                  value={teacherLeaveReason}
                  onChange={e => setTeacherLeaveReason(e.target.value)}
                  placeholder="Nhập lý do nghỉ phép, công tác..." 
                  style={{ minHeight: '100px', resize: 'vertical', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'rgba(255,255,255,0.7)' }}
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '6px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Send size={14} />
                <span>Gửi đơn lên BGH</span>
              </button>
            </form>
          </div>

          {/* Teacher leaves history & assignment schedule */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* My Leave Requests history */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <ClipboardList size={16} color="var(--accent-primary)" />
                <span>Lịch Sử Nghỉ Phép Của Tôi ({myTeacherLeaves.length})</span>
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Ngày Nghỉ</th>
                      <th>Giáo Viên Dạy Thay</th>
                      <th>Lý Do</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myTeacherLeaves.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                          Bạn chưa gửi đơn xin nghỉ phép nào.
                        </td>
                      </tr>
                    ) : (
                      myTeacherLeaves.map(req => (
                        <tr key={req.id}>
                          <td style={{ fontWeight: 600 }}>{req.date}</td>
                          <td>{req.substituteTeacherName}</td>
                          <td style={{ maxWidth: '200px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={req.reason}>
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
                              {req.status === 'approved' && 'Đã duyệt'}
                              {req.status === 'rejected' && 'Từ chối'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Approved Cover Schedule where teacher is substitute */}
            <div className="glass-panel">
              <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.15rem' }}>
                <Clock size={16} color="var(--accent-secondary)" />
                <span>Lịch Dạy Thay Đồng Nghiệp ({myCoverSchedules.length})</span>
              </h2>

              <div style={{ overflowX: 'auto' }}>
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Ngày Dạy Thay</th>
                      <th>Giáo Viên Nhờ Dạy</th>
                      <th>Môn Học</th>
                      <th>Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myCoverSchedules.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                          Không có lịch phân công dạy thay nào.
                        </td>
                      </tr>
                    ) : (
                      myCoverSchedules.map(req => {
                        const originalTeacher = teachers.find(t => t.id === req.teacherId);
                        return (
                          <tr key={req.id}>
                            <td style={{ fontWeight: 600 }}>{req.date}</td>
                            <td style={{ fontWeight: 600 }}>{req.teacherName}</td>
                            <td>{originalTeacher ? originalTeacher.subject : 'N/A'}</td>
                            <td>
                              <span className="badge badge-success">Đã xác nhận</span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lesson_plans' && (
        /* Lesson Plans Panel */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }}>
          {/* Submit lesson plan */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <BookOpen size={18} color="var(--accent-primary)" />
              <span>Nộp Giáo Án Cho BGH</span>
            </h2>

            <form onSubmit={handleLessonPlanSubmit}>
              <div className="form-group">
                <label className="form-label">Tên bài học / Tiêu đề giáo án</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newPlanTitle}
                  onChange={e => setNewPlanTitle(e.target.value)}
                  placeholder="Ví dụ: Giáo án ôn tập Tổ hợp & Xác suất..." 
                  required
                />
              </div>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Môn học</label>
                <select 
                  className="form-control"
                  value={newPlanSubject}
                  onChange={e => setNewPlanSubject(e.target.value)}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', gap: '6px' }}>
                <Send size={14} />
                <span>Nộp giáo án</span>
              </button>
            </form>
          </div>

          {/* Lesson Plans history */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Lịch sử giáo án của bạn ({myLessonPlans.length})</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {myLessonPlans.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Chưa nộp giáo án nào.
                </div>
              ) : (
                myLessonPlans.map(plan => (
                  <div key={plan.id} style={{ padding: '16px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ngày nộp: {plan.date} • Môn: {plan.subject}</span>
                      <span className={`badge ${
                        plan.status === 'pending' 
                          ? 'badge-warning' 
                          : plan.status === 'approved' 
                          ? 'badge-success' 
                          : 'badge-danger'
                      }`}>
                        {plan.status === 'pending' && 'Đang chờ duyệt'}
                        {plan.status === 'approved' && 'Đã phê duyệt'}
                        {plan.status === 'rejected' && 'Từ chối'}
                      </span>
                    </div>

                    <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: '8px 0' }}>
                      {plan.title}
                    </h4>

                    {plan.feedback && (
                      <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.05)', borderLeft: '3px solid var(--accent-primary)', fontSize: '0.85rem', marginTop: '10px' }}>
                        <strong>Nhận xét từ BGH:</strong> {plan.feedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai_planner' && (
        <AiLessonPlannerTab />
      )}

      {activeTab === 'conduct' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          {/* Students Conduct List */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Users size={18} color="var(--accent-primary)" />
              <span>Sổ điểm rèn luyện & thi đua lớp 12A1</span>
            </h2>

            <div style={{ overflowX: 'auto' }}>
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Mã HS</th>
                    <th>Họ và Tên</th>
                    <th>Điểm Rèn Luyện</th>
                    <th>Xếp Loại</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(std => {
                    const logs = conductLogs ? conductLogs.filter(l => l.studentId === std.id) : [];
                    const score = 100 + logs.reduce((sum, curr) => sum + curr.points, 0);
                    const grade = score >= 90 ? 'Tốt' : score >= 70 ? 'Khá' : score >= 50 ? 'Trung bình' : 'Yếu';
                    
                    return (
                      <tr key={std.id}>
                        <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{std.id}</td>
                        <td style={{ fontWeight: 600 }}>{std.name}</td>
                        <td style={{ fontWeight: 700, color: score >= 90 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{score}</td>
                        <td>
                          <span className={`badge ${
                            score >= 90 ? 'badge-success' : score >= 70 ? 'badge-info' : 'badge-warning'
                          }`}>
                            {grade}
                          </span>
                        </td>
                        <td>
                          <button 
                            onClick={() => { setSelectedConductStudent(std); setConductPointsDelta(10); setConductReason(''); }} 
                            className="btn btn-secondary" 
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          >
                            Ghi nhận điểm
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Conduct history by this teacher */}
          <div className="glass-panel">
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <Calendar size={18} color="var(--accent-primary)" />
              <span>Nhật ký khen thưởng / kỷ luật đã ghi ({teacherConductLogs.length})</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {teacherConductLogs.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Thầy chưa ghi nhận điểm rèn luyện nào cho học sinh.
                </div>
              ) : (
                teacherConductLogs.map(log => (
                  <div key={log.id} style={{ padding: '12px', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <strong>{log.studentName}</strong>
                      <span style={{ fontWeight: 700, color: log.points > 0 ? 'var(--accent-secondary)' : 'var(--accent-danger)' }}>
                        {log.points > 0 ? `+${log.points}` : log.points} điểm
                      </span>
                    </div>
                    <p style={{ fontSize: '0.85rem', margin: '4px 0', color: 'var(--text-secondary)' }}>Lý do: {log.reason}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ngày ghi: {log.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '20px' }} className="animate-fade">
          {/* Left panel: List of Assignments and Create Button */}
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, fontSize: '1.25rem' }}>
                <BookOpen size={18} color="var(--accent-primary)" />
                <span>Bài tập đã giao</span>
              </h2>
              <button 
                onClick={() => setShowCreateAssignmentModal(true)} 
                className="btn btn-primary"
                style={{ padding: '8px 14px', fontSize: '0.85rem' }}
              >
                Giao bài tập mới
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {assignments && assignments.filter(a => a.teacherId === 'T01').length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Thầy chưa giao bài tập nào. Hãy nhấn "Giao bài tập mới" để bắt đầu!
                </div>
              ) : (
                assignments && assignments.filter(a => a.teacherId === 'T01').map(assignment => {
                  const assignmentSubs = submissions ? submissions.filter(s => s.assignmentId === assignment.id) : [];
                  const completedSubs = assignmentSubs.filter(s => s.status === 'graded' || s.status === 'submitted').length;
                  const totalStudentsInClass = students.filter(s => s.class === assignment.classTarget).length;
                  
                  return (
                    <div 
                      key={assignment.id} 
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      style={{ 
                        padding: '16px', 
                        borderRadius: 'var(--radius-md)', 
                        background: selectedAssignmentId === assignment.id ? 'rgba(79, 70, 229, 0.05)' : 'rgba(255, 255, 255, 0.02)', 
                        border: selectedAssignmentId === assignment.id ? '1px solid var(--accent-primary)' : '1px solid var(--border-card)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <span className="badge badge-info">{assignment.classTarget} - {assignment.subject}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hạn: {assignment.deadline}</span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '6px 0', color: 'var(--text-primary)' }}>
                        {assignment.title}
                      </h3>
                      <p style={{ 
                        fontSize: '0.85rem', 
                        color: 'var(--text-secondary)', 
                        margin: '6px 0 12px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {assignment.content}
                      </p>
                      {assignment.fileName && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--accent-primary)', margin: '-6px 0 10px 0', fontWeight: 600 }}>
                          <Paperclip size={12} />
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>{assignment.fileName}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span>Đã nộp: {completedSubs}/{totalStudentsInClass} học sinh</span>
                        <span>Ngày giao: {assignment.dateCreated}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right panel: Assignment details & Student Submissions list */}
          <div className="glass-panel">
            {!selectedAssignmentId ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
                <FileText size={48} style={{ opacity: 0.3, marginBottom: '16px' }} />
                <span>Hãy chọn một bài tập ở danh sách bên trái để xem tiến độ nộp bài và chấm điểm học sinh.</span>
              </div>
            ) : (
              (() => {
                const assignment = assignments.find(a => a.id === selectedAssignmentId);
                const targetClassStudents = students.filter(s => s.class === assignment.classTarget);
                
                return (
                  <div>
                    <div style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '16px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>{assignment.classTarget} • {assignment.subject}</span>
                          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '4px 0' }}>{assignment.title}</h2>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ngày giao: {assignment.dateCreated} • Hạn nộp: {assignment.deadline}</p>
                        </div>
                      </div>
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '12px', 
                        borderRadius: '8px', 
                        background: 'rgba(255, 255, 255, 0.01)', 
                        border: '1px solid var(--border-card)',
                        fontSize: '0.9rem', 
                        color: 'var(--text-secondary)',
                        whiteSpace: 'pre-line'
                      }}>
                        {assignment.content}
                      </div>
                      {assignment.fileName && (
                        <div style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '8px', 
                          marginTop: '12px', 
                          padding: '8px 12px', 
                          background: 'rgba(99, 102, 241, 0.08)', 
                          border: '1px solid rgba(99, 102, 241, 0.2)', 
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          color: 'var(--accent-primary)',
                          fontWeight: 600
                        }}>
                          <Paperclip size={14} />
                          <span>Tệp đính kèm: <strong style={{ textDecoration: 'underline', cursor: 'pointer' }}>{assignment.fileName}</strong></span>
                        </div>
                      )}
                    </div>

                    <h4 style={{ marginBottom: '12px', fontSize: '1rem', fontWeight: 700 }}>Danh sách bài nộp của lớp</h4>
                    
                    <div style={{ overflowX: 'auto' }}>
                      <table className="premium-table">
                        <thead>
                          <tr>
                            <th>Mã HS</th>
                            <th>Họ và tên</th>
                            <th>Ngày nộp</th>
                            <th>Trạng thái</th>
                            <th>Điểm số</th>
                            <th>Thao tác</th>
                          </tr>
                        </thead>
                        <tbody>
                          {targetClassStudents.map(std => {
                            const sub = submissions ? submissions.find(s => s.assignmentId === selectedAssignmentId && s.studentId === std.id) : null;
                            
                            return (
                              <tr key={std.id}>
                                <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{std.id}</td>
                                <td style={{ fontWeight: 600 }}>{std.name}</td>
                                <td style={{ fontSize: '0.85rem' }}>{sub ? sub.submittedAt : '—'}</td>
                                <td>
                                  {!sub ? (
                                    <span className="badge badge-warning" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-danger)' }}>Chưa nộp</span>
                                  ) : sub.status === 'submitted' ? (
                                    <span className="badge badge-info" style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>Chờ chấm điểm</span>
                                  ) : (
                                    <span className="badge badge-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-secondary)' }}>Đã chấm điểm</span>
                                  )}
                                </td>
                                <td style={{ fontWeight: 700, fontSize: '1rem' }}>
                                  {sub && sub.grade !== null ? `${sub.grade}/10` : '—'}
                                </td>
                                <td>
                                  {sub ? (
                                    <button 
                                      onClick={() => {
                                        setSelectedGradingSubmission(sub);
                                        setGradingScore(sub.grade !== null ? sub.grade : '');
                                        setGradingFeedback(sub.feedback || '');
                                      }}
                                      className="btn btn-secondary" 
                                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                    >
                                      {sub.status === 'submitted' ? 'Chấm điểm' : 'Xem & Sửa'}
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Không có bài làm</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="glass-panel animate-fade">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
                <Clock size={18} color="var(--accent-primary)" />
                <span>Điểm danh học sinh chuyên cần - Lớp 12A1</span>
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Giám sát và ghi nhận trạng thái ra vào lớp học hằng ngày
              </p>
            </div>
            
            {/* The automated checkpoint simulator button */}
            <button
              onClick={() => {
                // Simulate automated check-in
                logAttendance('HS001', 'present', '07:15');
                logAttendance('HS002', 'present', '07:05');
                logAttendance('HS003', 'late', '07:35');
                alert('Mô phỏng check-in thành công! Học sinh đã quét thẻ RFID tại cổng trường lúc 07:15 (Hoàng Nam: Đúng giờ, Mai Chi: Đúng giờ, Minh Triết: Đi muộn).');
              }}
              className="btn btn-primary"
              style={{ display: 'flex', gap: '6px', alignItems: 'center' }}
            >
              <Users size={16} />
              <span>Giả lập Quét thẻ & Camera cổng trường</span>
            </button>
          </div>

          <table className="premium-table">
            <thead>
              <tr>
                <th>Mã HS</th>
                <th>Ảnh</th>
                <th>Họ và Tên</th>
                <th>Giờ check-in</th>
                <th>Trạng thái hôm nay (03/06)</th>
                <th>Ghi nhận thủ công</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map(std => {
                const log = attendanceLogs ? attendanceLogs.find(l => l.studentId === std.id && l.date === '2026-06-03') : null;
                return (
                  <tr key={std.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{std.id}</td>
                    <td>
                      <img 
                        src={std.avatarUrl} 
                        alt={std.name} 
                        style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{std.name}</td>
                    <td style={{ fontWeight: 700 }}>{log ? `${log.checkInTime} AM` : '--:--'}</td>
                    <td>
                      {log ? (
                        <span className={`badge ${log.status === 'present' ? 'badge-success' : log.status === 'late' ? 'badge-danger' : 'badge-secondary'}`}>
                          {log.status === 'present' ? 'Có mặt' : log.status === 'late' ? 'Đi muộn' : 'Vắng học'}
                        </span>
                      ) : (
                        <span className="badge badge-secondary" style={{ opacity: 0.6 }}>Chưa check-in</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { logAttendance(std.id, 'present', '07:20'); alert(`Đã điểm danh CÓ MẶT cho ${std.name}`); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }}>Có mặt</button>
                        <button onClick={() => { logAttendance(std.id, 'late', '07:45'); alert(`Đã ghi nhận ĐI MUỘN cho ${std.name}`); }} className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--accent-danger)' }}>Muộn</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="glass-panel animate-fade" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px', alignItems: 'start' }}>
          
          {/* Uploader log history list */}
          <div>
            <h2 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem' }}>
              <BookOpen size={18} color="var(--accent-primary)" />
              <span>Học liệu bài giảng đã tải lên</span>
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {learningResources && learningResources.filter(r => r.teacherName.includes('Triết')).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>Chưa tải lên tài liệu học tập nào.</div>
              ) : (
                learningResources && learningResources.filter(r => r.teacherName.includes('Triết')).map(res => (
                  <div key={res.id} style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid var(--border-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span className="badge badge-info" style={{ fontSize: '0.65rem', marginBottom: '4px' }}>{res.subject}</span>
                      <h5 style={{ margin: 0, fontWeight: 700 }}>{res.title}</h5>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã tài liệu: {res.id} • Nộp ngày: {res.dateUploaded.split('-').reverse().join('/')}</span>
                    </div>
                    <span className="badge badge-success" style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>{res.fileType}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upload Resource Form */}
          <div style={{ padding: '18px', background: 'rgba(99, 102, 241, 0.02)', border: '1px solid var(--border-card)', borderRadius: '12px' }}>
            <h4 style={{ margin: '0 0 14px 0', fontSize: '0.95rem' }}>Tải lên tài liệu học liệu số mới</h4>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              if (!resTitle.trim()) return;
              uploadResource(resSubject, resTitle, resType, 'Nguyễn Minh Triết');
              setResTitle('');
              alert('Đã đăng tải học liệu số thành công! Học sinh có thể tải về học tập.');
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="form-group">
                <label className="form-label">Tên tài liệu / Chuyên đề</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={resTitle}
                  onChange={e => setResTitle(e.target.value)}
                  placeholder="Ví dụ: Ôn tập Lý thuyết Tích Phân & Ứng Dụng..."
                  required
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Môn học phụ trách</label>
                <select 
                  className="form-control"
                  value={resSubject}
                  onChange={e => setResSubject(e.target.value)}
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  <option value="Toán học">Toán học</option>
                  <option value="Vật lý">Vật lý</option>
                  <option value="Ngữ văn">Ngữ văn</option>
                  <option value="Tiếng Anh">Tiếng Anh</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Định dạng file</label>
                <select 
                  className="form-control"
                  value={resType}
                  onChange={e => setResType(e.target.value)}
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  <option value="pdf">Tệp tài liệu dạng PDF</option>
                  <option value="pptx">Bài giảng trình chiếu PPTX</option>
                  <option value="docx">Đề kiểm tra dạng Word DOCX</option>
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Đăng tải học liệu số
              </button>
            </form>
          </div>

        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreateAssignmentModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content animate-fade" style={{ maxWidth: '600px', background: '#1e1e24', color: '#f8fafc', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 'bold' }}>Giao Bài Tập Về Nhà Mới</h2>
              <button 
                type="button"
                onClick={() => setShowCreateAssignmentModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignmentSubmit}>
              {/* Mode Toggle Tabs */}
              <div style={{ display: 'flex', background: '#27272a', padding: '4px', borderRadius: '10px', marginBottom: '20px' }}>
                <button
                  type="button"
                  onClick={() => setAssignmentMode('normal')}
                  style={{
                    flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                    background: assignmentMode === 'normal' ? 'var(--accent-primary, #6366f1)' : 'transparent',
                    color: '#ffffff', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  📝 Tự luận / Bài tập thường
                </button>
                <button
                  type="button"
                  onClick={() => setAssignmentMode('ai_quiz')}
                  style={{
                    flex: 1, padding: '8px', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600,
                    background: assignmentMode === 'ai_quiz' ? 'var(--accent-primary, #6366f1)' : 'transparent',
                    color: '#ffffff', cursor: 'pointer', transition: 'all 0.15s ease'
                  }}
                >
                  🤖 Tạo trắc nghiệm tự động bằng AI
                </button>
              </div>

              {assignmentMode === 'ai_quiz' && (
                <div style={{ background: 'rgba(99, 102, 241, 0.06)', border: '1px solid rgba(99, 102, 241, 0.18)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🤖 Cấu hình AI Quiz Generator
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '12px', marginBottom: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>Môn học trắc nghiệm</label>
                      <select
                        className="form-control"
                        value={aiQuizSubject}
                        onChange={e => setAiQuizSubject(e.target.value)}
                        style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                      >
                        <option value="English">Tiếng Anh</option>
                        <option value="Physics">Vật lý</option>
                        <option value="Math">Toán học</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.78rem' }}>Chủ đề thi / Chuyên đề học *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ví dụ: Passive Voice, Dao động cơ..."
                        value={aiQuizTopic}
                        onChange={e => setAiQuizTopic(e.target.value)}
                        style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTriggerAiQuizGen}
                    className="btn btn-primary"
                    disabled={isGeneratingQuiz}
                    style={{ width: '100%', padding: '10px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  >
                    {isGeneratingQuiz ? '🤖 Đang thiết lập bộ câu hỏi...' : '⚡ Sinh bộ đề trắc nghiệm bằng AI'}
                  </button>

                  {/* Preview Generated Questions */}
                  {aiQuizQuestions.length > 0 && (
                    <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '0.78rem', color: '#a1a1aa', fontWeight: 600, marginBottom: '8px' }}>XEM TRƯỚC CÂU HỎI AI ĐÃ SINH:</div>
                      {aiQuizQuestions.map((q, idx) => (
                        <div key={idx} style={{ fontSize: '0.8rem', color: '#e2e8f0', marginBottom: '8px', borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none', paddingBottom: '6px' }}>
                          <strong>Câu {idx + 1}:</strong> {q.question}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '4px', fontSize: '0.72rem', color: '#94a3b8' }}>
                            {q.options.map((opt, oIdx) => <div key={oIdx}>{opt}</div>)}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>✓ Đáp án đúng: {q.correctKey}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Tiêu đề bài tập</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newAssignmentTitle} 
                  onChange={e => setNewAssignmentTitle(e.target.value)} 
                  placeholder="Ví dụ: Ôn tập hàm số chuyên đề cực trị..."
                  required 
                  style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Lớp học mục tiêu</label>
                  <select 
                    className="form-control"
                    value={newAssignmentClassTarget}
                    onChange={e => setNewAssignmentClassTarget(e.target.value)}
                    style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  >
                    <option value="12A1">Lớp 12A1 (Sĩ số: {students.filter(s => s.class === '12A1').length})</option>
                    <option value="12A2">Lớp 12A2 (Sĩ số: {students.filter(s => s.class === '12A2').length})</option>
                    <option value="11A1">Lớp 11A1 (Sĩ số: {students.filter(s => s.class === '11A1').length})</option>
                    <option value="10A1">Lớp 10A1 (Sĩ số: {students.filter(s => s.class === '10A1').length})</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Hạn nộp bài</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    value={newAssignmentDeadline}
                    onChange={e => setNewAssignmentDeadline(e.target.value)}
                    required 
                    style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: '#cbd5e1' }}>Nội dung đề bài & Yêu cầu chi tiết</label>
                <textarea 
                  className="form-control" 
                  rows="5"
                  value={newAssignmentContent}
                  onChange={e => setNewAssignmentContent(e.target.value)}
                  placeholder="Nhập nội dung bài tập, các yêu cầu trình bày cụ thể..."
                  style={{ resize: 'vertical', background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  required
                />
              </div>

              {/* File Attachment Form Group */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Đính kèm tệp tài liệu (Đề bài, tài liệu...)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label 
                    htmlFor="file-upload" 
                    className="btn"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      margin: 0, 
                      cursor: 'pointer',
                      background: '#3f3f46', 
                      border: '1px solid #52525b', 
                      color: '#ffffff',
                      padding: '10px 16px',
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    <Upload size={16} />
                    <span>Chọn tệp tin...</span>
                  </label>
                  <input 
                    id="file-upload"
                    type="file" 
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: selectedFile ? '#f1f5f9' : '#94a3b8', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '280px' }}>
                    {selectedFile ? selectedFile.name : 'Chưa có tệp nào được chọn'}
                  </span>
                  {selectedFile && (
                    <button 
                      type="button" 
                      onClick={() => setSelectedFile(null)} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px', display: 'flex', alignItems: 'center' }}
                      title="Xóa tệp đính kèm"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => { setShowCreateAssignmentModal(false); setSelectedFile(null); }} className="btn btn-secondary" style={{ flex: 1, background: '#3f3f46', border: '1px solid #52525b', color: '#ffffff' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 700 }}>Giao bài tập</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Grade Submission Modal */}
      {selectedGradingSubmission && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ maxWidth: '650px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Chấm điểm bài làm: {selectedGradingSubmission.studentName}</h2>
              <button onClick={() => setSelectedGradingSubmission(null)} className="btn-close" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: 0 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <span className="form-label">Nội dung bài nộp của học sinh (nộp ngày: {selectedGradingSubmission.submittedAt}):</span>
              <div style={{ 
                padding: '16px', 
                borderRadius: '8px', 
                background: 'rgba(0, 0, 0, 0.02)', 
                border: '1px solid var(--border-card)', 
                fontSize: '0.95rem',
                color: 'var(--text-primary)',
                maxHeight: '240px',
                overflowY: 'auto',
                whiteSpace: 'pre-line',
                marginTop: '6px'
              }}>
                {selectedGradingSubmission.submissionText}
              </div>
            </div>

            <form onSubmit={handleGradeSubmissionSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Điểm số (thang 10)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="10" 
                    className="form-control" 
                    value={gradingScore}
                    onChange={e => setGradingScore(e.target.value)}
                    placeholder="Nhập điểm..."
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Nhận xét, phản hồi giáo viên</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={gradingFeedback}
                    onChange={e => setGradingFeedback(e.target.value)}
                    placeholder="Bài làm tốt, trình bày khoa học..."
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setSelectedGradingSubmission(null)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Gửi kết quả chấm điểm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conduct Modal */}
      {selectedConductStudent && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade">
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem' }}>Cập nhật điểm rèn luyện học sinh: {selectedConductStudent.name}</h2>
            
            <form onSubmit={handleConductSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn hành động điểm số</label>
                <select 
                  className="form-control"
                  value={conductPointsDelta}
                  onChange={e => setConductPointsDelta(parseInt(e.target.value))}
                >
                  <option value={10}>Cộng 10 điểm thưởng (Phát biểu xuất sắc, có hành động gương mẫu)</option>
                  <option value={5}>Cộng 5 điểm thưởng (Làm bài tốt, dọn dẹp lớp học)</option>
                  <option value={-5}>Trừ 5 điểm phạt (Nói chuyện riêng, đi học muộn)</option>
                  <option value={-10}>Trừ 10 điểm phạt (Không làm bài tập, vi phạm nội quy nặng)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Chi tiết lý do ghi nhận</label>
                <input 
                  type="text" 
                  className="form-control"
                  value={conductReason}
                  onChange={e => setConductReason(e.target.value)}
                  placeholder="Ghi cụ thể sự việc (Ví dụ: Phát biểu xuất sắc bài tập nâng cao môn Toán)..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setSelectedConductStudent(null)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Xác nhận ghi nhận</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Create Custom Exam Modal */}
      {showCreateExamModal && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content animate-fade" style={{ width: '90%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '30px' }}>
            <h2 style={{ marginBottom: '6px', fontSize: '1.4rem', fontWeight: 800, color: '#1e293b' }}>
              Soạn đề thi thử liên môn mới
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px' }}>
              Tạo đề thi kết hợp tất cả các môn của khối thi. Đề thi sẽ xuất hiện ngay lập tức trên dashboard của học sinh.
            </p>
            
            <form onSubmit={handleCreateExamSubmit}>
              {/* General Info Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Tên đề thi thử</label>
                  <input 
                    type="text" 
                    className="form-control"
                    value={newExamTitle}
                    onChange={e => setNewExamTitle(e.target.value)}
                    placeholder="Ví dụ: Đề khảo sát chất lượng học kỳ II"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Chọn Khối thi</label>
                  <select 
                    className="form-control"
                    value={newExamBlock}
                    onChange={e => {
                      setNewExamBlock(e.target.value);
                      // Clear questions since subjects change
                      setNewExamQuestions([]);
                    }}
                  >
                    {Object.entries(BLOCKS).map(([key, value]) => (
                      <option key={key} value={key}>{value.name} ({value.subjects.map(s => SUBJECT_NAMES[s] || s).join(', ')})</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Thời gian (phút)</label>
                  <input 
                    type="number" 
                    className="form-control"
                    value={newExamDuration}
                    onChange={e => setNewExamDuration(parseInt(e.target.value) || 15)}
                    min="5"
                    max="180"
                    required
                  />
                </div>
              </div>

              {/* Questions Area */}
              <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '20px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b' }}>
                    Danh sách câu hỏi ({newExamQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="btn btn-secondary"
                    style={{ background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    + Thêm câu hỏi
                  </button>
                </div>

                {newExamQuestions.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', border: '2px dashed #cbd5e1', borderRadius: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Chưa có câu hỏi nào được thêm. Hãy nhấn "+ Thêm câu hỏi" để bắt đầu soạn đề.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '450px', overflowY: 'auto', paddingRight: '6px' }}>
                    {newExamQuestions.map((q, idx) => (
                      <div key={q.id} style={{ padding: '20px', border: '1px solid #e2e8f0', borderRadius: '12px', background: '#f8fafc', position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-primary)', background: 'var(--accent-primary-glow)', padding: '3px 10px', borderRadius: '6px' }}>
                            Câu hỏi {idx + 1}
                          </span>
                          
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>Môn học:</label>
                            <select
                              className="form-control"
                              style={{ width: '130px', padding: '4px 8px', fontSize: '0.8rem' }}
                              value={q.subject}
                              onChange={e => handleQuestionChange(idx, 'subject', e.target.value)}
                            >
                              {BLOCKS[newExamBlock].subjects.map(s => (
                                <option key={s} value={s}>{SUBJECT_NAMES[s] || s}</option>
                              ))}
                            </select>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(idx)}
                              style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.82rem', marginLeft: '10px' }}
                            >
                              Xóa câu
                            </button>
                          </div>
                        </div>

                        {/* Question Text */}
                        <div className="form-group" style={{ marginBottom: '12px' }}>
                          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Đề bài (Hỗ trợ HTML):</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={q.question}
                            onChange={e => handleQuestionChange(idx, 'question', e.target.value)}
                            placeholder="Ví dụ: Tìm x biết x<sup>2</sup> - 4 = 0."
                            required
                          />
                        </div>

                        {/* Options Inputs */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                          {q.options.map(opt => (
                            <div key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#64748b' }}>{opt.key}:</span>
                              <input
                                type="text"
                                className="form-control"
                                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                                value={opt.text}
                                onChange={e => handleOptionTextChange(idx, opt.key, e.target.value)}
                                placeholder={`Phương án ${opt.key}`}
                                required
                              />
                            </div>
                          ))}
                        </div>

                        {/* Correct Key and Explanation */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
                          <div className="form-group">
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Đáp án đúng:</label>
                            <select
                              className="form-control"
                              value={q.correctKey}
                              onChange={e => handleQuestionChange(idx, 'correctKey', e.target.value)}
                            >
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Lời giải giải thích:</label>
                            <input
                              type="text"
                              className="form-control"
                              value={q.explanation}
                              onChange={e => handleQuestionChange(idx, 'explanation', e.target.value)}
                              placeholder="Giải thích chi tiết các bước giải..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateExamModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}>Lưu và ban hành đề thi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MOCK EXAMS TAB */}
      {activeTab === 'mock_exams' && (
        <div className="animate-fade">
          {/* Section Header with Creator Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#1e293b' }}>Báo cáo & Thiết lập Đề Thi Thử</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
                Theo dõi kết quả học tập và tạo đề thi thử liên môn tùy chỉnh cho học sinh.
              </p>
            </div>
            <button
              onClick={() => {
                setShowCreateExamModal(true);
                setNewExamQuestions([createBlankQuestion(BLOCKS[newExamBlock].subjects[0])]);
              }}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', fontWeight: 700 }}
            >
              <Sparkles size={16} /> Soạn đề thi mới
            </button>
          </div>
          {/* Summary Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="glass-panel stat-card" style={{ background: 'white' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>TỔNG SỐ LƯỢT THI THỬ LỚP</span>
                <div style={{ fontSize: '2rem', marginTop: '6px', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                  {classAttempts.length} lượt
                </div>
              </div>
              <div className="stat-icon"><ClipboardList size={24} /></div>
            </div>

            <div className="glass-panel stat-card" style={{ background: 'white' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ĐIỂM TRUNG BÌNH THI THỬ</span>
                <div style={{ fontSize: '2rem', marginTop: '6px', color: '#10b981', fontWeight: 'bold' }}>
                  {overallClassAverage}/10
                </div>
              </div>
              <div className="stat-icon"><Award size={24} /></div>
            </div>

            <div className="glass-panel stat-card" style={{ background: 'white' }}>
              <div>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>ĐIỂM CAO NHẤT LỚP</span>
                <div style={{ fontSize: '2rem', marginTop: '6px', color: '#f59e0b', fontWeight: 'bold' }}>
                  {highestClassScore}/10
                </div>
              </div>
              <div className="stat-icon"><Award size={24} /></div>
            </div>
          </div>

          {/* SVG Bar Chart for Block Averages */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '30px', background: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '20px' }}>
              Điểm thi thử trung bình theo Khối thi (Lớp 12A1)
            </h3>
            
            {(() => {
              const blocks = ['A00', 'A01', 'B00', 'C00', 'D01'];
              const data = blocks.map(b => {
                const bAttempts = classAttempts.filter(h => h.block === b);
                const avg = bAttempts.length > 0 
                  ? (bAttempts.reduce((acc, curr) => acc + curr.score, 0) / bAttempts.length)
                  : 0;
                return { block: b, avg: parseFloat(avg.toFixed(1)) };
              });

              const chartWidth = 500;
              const chartHeight = 200;
              const barWidth = 50;
              const gap = 40;
              const maxVal = 10;

              return (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <svg width="100%" height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`} style={{ maxWidth: '600px' }}>
                    {/* Y-axis Grid Lines */}
                    {[0, 2, 4, 6, 8, 10].map(val => {
                      const y = chartHeight - (val / maxVal) * chartHeight;
                      return (
                        <g key={val}>
                          <line x1="40" y1={y} x2={chartWidth - 20} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" />
                          <text x="15" y={y + 4} fontSize="10" fill="#64748b" textAnchor="middle">{val}</text>
                        </g>
                      );
                    })}

                    {/* Bars */}
                    {data.map((item, idx) => {
                      const barHeight = (item.avg / maxVal) * chartHeight;
                      const x = 60 + idx * (barWidth + gap);
                      const y = chartHeight - barHeight;
                      
                      return (
                        <g key={item.block}>
                          <defs>
                            <linearGradient id={`grad-teacher-${item.block}`} x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.8" />
                            </linearGradient>
                          </defs>
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx="6"
                            fill={`url(#grad-teacher-${item.block})`}
                            style={{ transition: 'all 0.3s' }}
                          />
                          <text
                            x={x + barWidth / 2}
                            y={y - 8}
                            fontSize="11"
                            fontWeight="bold"
                            fill="#4f46e5"
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
                            Khối {item.block}
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

          {/* Table list of students results */}
          <div className="glass-panel" style={{ padding: '24px', background: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                Danh sách Kết quả Thi Thử Lớp 12A1
              </h3>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Tìm học sinh..."
                  className="form-control"
                  value={mockExamSearch}
                  onChange={e => setMockExamSearch(e.target.value)}
                  style={{ width: '200px', fontSize: '0.85rem', padding: '8px 12px' }}
                />
                
                <select
                  className="form-control"
                  value={mockExamBlockFilter}
                  onChange={e => setMockExamBlockFilter(e.target.value)}
                  style={{ width: '130px', fontSize: '0.85rem', padding: '8px 12px' }}
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
                    const filtered = classAttempts.filter(h => {
                      const matchSearch = h.studentName.toLowerCase().includes(mockExamSearch.toLowerCase());
                      const matchBlock = mockExamBlockFilter === 'ALL' || h.block === mockExamBlockFilter;
                      return matchSearch && matchBlock;
                    });

                    if (filtered.length === 0) {
                      return (
                        <tr>
                          <td colSpan="7" style={{ padding: '24px 8px', color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center' }}>
                            Không tìm thấy kết quả nào phù hợp.
                          </td>
                        </tr>
                      );
                    }

                    return filtered.map(attempt => (
                      <tr key={attempt.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.03)', fontSize: '0.88rem', color: '#1e293b' }}>
                        <td style={{ padding: '12px 8px', fontWeight: 600 }}>{attempt.studentName}</td>
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

      {/* Grade Entry List Modal */}
      {showGradeEntryModal && createPortal(
        <div className="modal-overlay" style={{ zIndex: 999 }}>
          <div className="modal-content animate-fade" style={{ maxWidth: '750px', background: '#1e1e24', color: '#f8fafc', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#f8fafc', fontWeight: 'bold' }}>
                Danh Sách Nhập Điểm Lớp {classStudents[0]?.class || '12A1'}
              </h2>
              <button 
                type="button"
                onClick={() => setShowGradeEntryModal(false)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}>
                    <th style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Học sinh</th>
                    <th style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Toán</th>
                    <th style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Văn</th>
                    <th style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Lý</th>
                    <th style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600 }}>Anh</th>
                    <th style={{ padding: '12px 10px', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudents.map(std => (
                    <tr key={std.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600, color: '#f1f5f9' }}>
                          <img src={std.avatarUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                          <span>{std.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#e2e8f0' }}>{std.grades.Math ?? '—'}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#e2e8f0' }}>{std.grades.Literature ?? '—'}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#e2e8f0' }}>{std.grades.Physics ?? '—'}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#e2e8f0' }}>{std.grades.English ?? '—'}</td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <button 
                          type="button"
                          onClick={() => {
                            setSelectedStudent(std);
                            setGeneratedComment('');
                            setSelectedSubject('Math');
                            loadDetailedGradesForSubject(std, 'Math');
                            setGradesInput({
                              Math: std.grades.Math || 0,
                              Literature: std.grades.Literature || 0,
                              Physics: std.grades.Physics || 0,
                              English: std.grades.English || 0
                            });
                          }}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: '#3f3f46', border: '1px solid #52525b', color: '#ffffff' }}
                        >
                          Nhập điểm
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '15px' }}>
              <button 
                type="button" 
                onClick={() => setShowGradeEntryModal(false)} 
                className="btn btn-secondary"
                style={{ padding: '8px 20px', background: '#ffffff', color: '#18181b', fontWeight: 700 }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Grading Modal */}
      {selectedStudent && createPortal(
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-content animate-fade" style={{ background: '#1e1e24', color: '#f8fafc', borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <h2 style={{ marginBottom: '16px', fontSize: '1.25rem', color: '#f8fafc', fontWeight: 'bold' }}>Cập nhật điểm số: {selectedStudent.name}</h2>
            <form onSubmit={handleGradeSubmit}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label" style={{ color: '#cbd5e1', fontWeight: 600 }}>Môn học nhập điểm</label>
                <select
                  className="form-control"
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff', height: '42px' }}
                >
                  <option value="Math">Toán học</option>
                  <option value="Literature">Ngữ văn</option>
                  <option value="Physics">Vật lý</option>
                  <option value="English">Tiếng Anh</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Điểm Miệng (hs 1)</label>
                  <input 
                    type="number" step="0.1" min="0" max="10" className="form-control" 
                    value={detailedGradesInput.oral}
                    onChange={e => setDetailedGradesInput({...detailedGradesInput, oral: parseFloat(e.target.value) || 0})}
                    required 
                    style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Điểm 15 Phút (hs 1)</label>
                  <input 
                    type="number" step="0.1" min="0" max="10" className="form-control" 
                    value={detailedGradesInput.quiz15m}
                    onChange={e => setDetailedGradesInput({...detailedGradesInput, quiz15m: parseFloat(e.target.value) || 0})}
                    required 
                    style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Điểm 1 Tiết (hs 2)</label>
                  <input 
                    type="number" step="0.1" min="0" max="10" className="form-control" 
                    value={detailedGradesInput.test1Period}
                    onChange={e => setDetailedGradesInput({...detailedGradesInput, test1Period: parseFloat(e.target.value) || 0})}
                    required 
                    style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1', fontSize: '0.82rem' }}>Điểm Học Kỳ (hs 3)</label>
                  <input 
                    type="number" step="0.1" min="0" max="10" className="form-control" 
                    value={detailedGradesInput.semester}
                    onChange={e => setDetailedGradesInput({...detailedGradesInput, semester: parseFloat(e.target.value) || 0})}
                    required 
                    style={{ background: '#27272a', borderColor: '#52525b', color: '#ffffff' }}
                  />
                </div>
              </div>

              <div style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', padding: '12px 16px', borderRadius: '12px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 500 }}>Điểm trung bình tạm tính:</span>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#10b981' }}>
                  {((detailedGradesInput.oral + detailedGradesInput.quiz15m + detailedGradesInput.test1Period * 2 + detailedGradesInput.semester * 3) / 7).toFixed(1)}
                </span>
              </div>

              {/* AI Auto Comment Section */}
              <div style={{ marginTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="form-label" style={{ color: '#cbd5e1', margin: 0 }}>AI Gợi ý nhận xét học bạ</label>
                  <button 
                    type="button" 
                    onClick={handleGenerateComment} 
                    className="btn btn-secondary btn-sm"
                    style={{ padding: '4px 10px', fontSize: '0.75rem', background: 'var(--accent)', border: 'none', color: '#fff' }}
                  >
                    Sinh nhận xét AI
                  </button>
                </div>
                <textarea 
                  className="form-control" 
                  value={generatedComment}
                  onChange={e => setGeneratedComment(e.target.value)}
                  placeholder="Bấm nút 'Sinh nhận xét AI' để hệ thống tự động soạn thảo nhận xét..." 
                  style={{ minHeight: '80px', background: '#27272a', borderColor: '#52525b', color: '#ffffff', fontSize: '0.85rem', lineHeight: 1.4 }}
                />
                {generatedComment && (
                  <button 
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedComment);
                      alert('Đã sao chép nhận xét vào bộ nhớ đệm!');
                    }}
                    style={{ marginTop: '6px', background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  >
                    📋 Sao chép nhận xét
                  </button>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setSelectedStudent(null)} className="btn btn-secondary" style={{ flex: 1, background: '#3f3f46', border: '1px solid #52525b', color: '#ffffff' }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, fontWeight: 700 }}>Cập nhật</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

