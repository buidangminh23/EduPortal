import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { decodeHtmlEntities } from '../../lib/tutor/formatText';
import { 
  Sparkles, 
  Send, 
  Printer, 
  Brain,
  Sliders,
} from 'lucide-react';
import { QUESTIONS } from '../../data/mockExamsData';

export default function AiLessonPlannerTab() {
  const { submitLessonPlan, addCustomExam, userSession } = useContext(AppContext);

  // Form states
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('12');
  const [docType, setDocType] = useState('lesson_plan'); // lesson_plan | quiz
  const [questionCount, setQuestionCount] = useState(10);
  const [pedagogyStyle, setPedagogyStyle] = useState('creative'); // creative | critical | teamwork
  
  // Quiz difficulty distribution states
  const [diffEasy, setDiffEasy] = useState(40);
  const [diffMedium, setDiffMedium] = useState(30);
  const [diffHard, setDiffHard] = useState(20);

  // Generation status states
  const [isGenerating, setIsGenerating] = useState(false);
  const [genStep, setGenStep] = useState('');
  const [generatedDoc, setGeneratedDoc] = useState(null);

  const teacherName = userSession?.displayName || 'Thầy Nguyễn Minh Triết';

  const handleGenerate = () => {
    if (!topic.trim()) {
      alert('Vui lòng nhập tên bài học hoặc chủ đề cần soạn!');
      return;
    }

    setIsGenerating(true);
    setGeneratedDoc(null);

    // Simulate multi-stage AI generation
    const steps = [
      'Đang phân tích khung chương trình của Bộ GD&ĐT...',
      'Đang xây dựng mục tiêu dạy học phát triển năng lực...',
      'Đang thiết kế tiến trình bài giảng 4 hoạt động sư phạm...',
      'Đang định cấu hình câu hỏi trắc nghiệm & soạn đáp án chi tiết...',
      'Hoàn tất biên soạn giáo án!'
    ];

    let currentStepIdx = 0;
    setGenStep(steps[0]);

    const interval = setInterval(() => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setGenStep(steps[currentStepIdx]);
      } else {
        clearInterval(interval);
        setIsGenerating(false);
        triggerDocCreation();
      }
    }, 900);
  };

  const triggerDocCreation = () => {
    if (docType === 'lesson_plan') {
      // Create a full Lesson Plan mock structure
      setGeneratedDoc({
        type: 'lesson_plan',
        title: `Giáo án: ${topic}`,
        subject,
        grade,
        objectives: {
          knowledge: `Học sinh nắm vững các khái niệm cơ bản về ${topic}, hiểu rõ bản chất cốt lõi và mối liên hệ thực tiễn của bài học.`,
          skills: `Phát triển kỹ năng tính toán, suy luận logic, vận dụng công thức giải nhanh các bài toán ứng dụng liên quan đến ${topic}.`,
          attitude: 'Tích cực tham gia đóng góp xây dựng bài giảng, rèn luyện đức tính cẩn thận, kiên trì và tự giác ôn luyện bài tập về nhà.'
        },
        equipment: 'Máy chiếu, SGK, slide bài giảng điện tử, dụng cụ vẽ hình học hoặc phiếu học tập phát cho các nhóm học sinh.',
        activities: [
          {
            time: '5 phút',
            name: 'Hoạt động 1: Khởi động & Tạo tâm thế',
            goal: 'Tái hiện kiến thức cũ có liên quan trực tiếp, kích thích sự tò mò và hứng thú tìm hiểu nội dung mới của học sinh.',
            teacher: `Đặt câu hỏi tình huống thực tế hoặc giao nhiệm vụ nhanh về chủ đề ${topic}.`,
            student: 'Thảo luận nhanh theo cặp và cử đại diện phát biểu ý kiến/dự đoán.',
            eval: 'Đánh giá mức độ nhớ bài và tính chủ động giao tiếp của học sinh.'
          },
          {
            time: '20 phút',
            name: 'Hoạt động 2: Hình thành kiến thức mới',
            goal: 'Giúp học sinh tự tìm tòi, tiếp cận và khắc sâu công thức/định nghĩa khoa học cốt lõi.',
            teacher: `Trình chiếu sơ đồ bài học, dẫn dắt học sinh khám phá định nghĩa về ${topic}. Hướng dẫn chi tiết ví dụ minh họa điển hình.`,
            student: 'Ghi chép công thức trọng tâm vào vở, thực hiện thảo luận nhóm để giải đáp câu hỏi gợi mở của giáo viên.',
            eval: 'Sản phẩm phiếu học tập số 1 của các nhóm, mức độ tiếp thu khái niệm.'
          },
          {
            time: '10 phút',
            name: 'Hoạt động 3: Luyện tập & Thực hành',
            goal: 'Hệ thống hóa kiến thức vừa học qua bài tập áp dụng mức độ nhận biết và thông hiểu.',
            teacher: 'Giao phiếu bài tập cá nhân, mời 2 học sinh lên bảng giải 2 dạng bài mẫu cơ bản.',
            student: 'Làm việc độc lập vào vở bài tập, quan sát bài giải của bạn trên bảng và đưa ra nhận xét chéo.',
            eval: 'Bài làm trên bảng và mức độ hoàn thành bài tập cá nhân dưới lớp.'
          },
          {
            time: '10 phút',
            name: 'Hoạt động 4: Vận dụng & Mở rộng',
            goal: 'Vận dụng kiến thức vào thực tế cuộc sống hoặc giải bài toán tổng hợp khó nâng cao.',
            teacher: 'Đưa ra một bài toán mở mang tính ứng dụng thực tế của môn học hoặc một câu đố tư duy logic.',
            student: 'Hoạt động nhóm lớn, tổng hợp ý kiến lên giấy A0 hoặc bảng nhóm để báo cáo.',
            eval: 'Báo cáo sản phẩm nhóm lớn, tinh thần phối hợp đồng đội.'
          }
        ]
      });
    } else {
      // Create a Quiz structure
      const questions = [];
      const blocksMap = {
        'Toán học': 'A00',
        'Vật lý': 'A01',
        'Tiếng Anh': 'D01',
        'Ngữ văn': 'C00'
      };
      
      const block = blocksMap[subject] || 'A00';
      const countVal = parseInt(questionCount) || 10;

      const subjectMap = {
        'Toán học': 'Math',
        'Vật lý': 'Physics',
        'Ngữ văn': 'Literature',
        'Tiếng Anh': 'English'
      };
      const dbKey = subjectMap[subject] || 'Math';
      const realQuestionsPool = QUESTIONS[dbKey] || [];

      for (let i = 1; i <= countVal; i++) {
        let diff = 'Nhận biết';
        if (i > countVal * 0.7) diff = 'Vận dụng cao';
        else if (i > countVal * 0.4) diff = 'Vận dụng';
        else if (i > countVal * 0.2) diff = 'Thông hiểu';

        const poolIndex = (i - 1) % realQuestionsPool.length;
        const realQ = realQuestionsPool[poolIndex];
        const isSpecificTopic = topic && topic.trim() !== '';
        
        let finalQuestionText;
        let finalOptions;
        let finalCorrectKey;
        let finalExplanation;

        if (isSpecificTopic && (i > realQuestionsPool.length || topic.toLowerCase().includes('chí phèo') || topic.toLowerCase().includes('tích phân'))) {
          const topicQ = getTopicQuestion(subject, topic, i - 1);
          finalQuestionText = `[Mức độ ${diff}] ${topicQ.question}`;
          finalOptions = topicQ.options;
          finalCorrectKey = topicQ.correctKey;
          finalExplanation = topicQ.explanation;
        } else if (realQ) {
          finalQuestionText = `[Mức độ ${diff}] ${realQ.question}`;
          finalOptions = realQ.options.map(opt => ({ key: opt.key, text: opt.text }));
          finalCorrectKey = realQ.correctKey;
          finalExplanation = realQ.explanation;
        } else {
          finalQuestionText = `[Mức độ ${diff}] Câu hỏi số ${i}: Phân tích chuyên đề "${topic}" (Lớp ${grade} - Môn ${subject}).`;
          finalOptions = [
            { key: 'A', text: `Phương án nhiễu A cho chủ đề ${topic}` },
            { key: 'B', text: `Phương án chính xác B (Đáp án đúng)` },
            { key: 'C', text: `Phương án nhiễu C cho chủ đề ${topic}` },
            { key: 'D', text: `Phương án nhiễu D cho chủ đề ${topic}` }
          ];
          finalCorrectKey = 'B';
          finalExplanation = `Lời giải câu hỏi số ${i}: Áp dụng các quy tắc cơ bản để giải quyết bài tập thuộc chủ đề "${topic}".`;
        }

        questions.push({
          id: `AI_Q_${i}_${Date.now()}`,
          subject,
          question: finalQuestionText,
          options: finalOptions,
          correctKey: finalCorrectKey,
          explanation: finalExplanation
        });
      }

      setGeneratedDoc({
        type: 'quiz',
        title: `Đề kiểm tra thử AI: ${topic}`,
        subject,
        grade,
        block,
        questions
      });
    }
  };

  const handlePublishLessonPlan = () => {
    if (!generatedDoc) return;
    submitLessonPlan(teacherName, generatedDoc.subject, generatedDoc.title);
    alert(`Đã lưu và nộp giáo án "${generatedDoc.title}" lên BGH phê duyệt thành công!`);
  };

  const handlePublishQuiz = () => {
    if (!generatedDoc) return;
    
    // Publish as mock exam to school repository
    const examData = {
      title: generatedDoc.title,
      block: generatedDoc.block,
      duration: generatedDoc.questions.length * 4, // 4 mins per question
      questions: generatedDoc.questions,
      teacherName
    };
    
    addCustomExam(examData);
    alert(`Đã ban hành đề thi thử "${generatedDoc.title}" thành công! Học sinh lớp chủ nhiệm hiện tại có thể vào thi trực tuyến.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleTopicChange = (val) => {
    setTopic(val);
    const detected = detectSubject(val);
    if (detected) {
      setSubject(detected);
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Planner Settings Form */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            <Brain size={20} color="var(--accent-primary)" />
            <span>Cấu Hình Trợ Lý Soạn Bài AI</span>
          </h2>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Tên bài học / Chủ đề</label>
            <input 
              type="text" 
              className="form-control"
              placeholder="Ví dụ: Định lý Py-ta-go, Sóng âm, Chí Phèo..."
              value={topic}
              onChange={e => handleTopicChange(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Môn học</label>
              <select value={subject} onChange={e => setSubject(e.target.value)} className="form-control" style={{ background: 'white' }}>
                <option value="Toán học">Toán học</option>
                <option value="Vật lý">Vật lý</option>
                <option value="Ngữ văn">Ngữ văn</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Khối lớp</label>
              <select value={grade} onChange={e => setGrade(e.target.value)} className="form-control" style={{ background: 'white' }}>
                <option value="10">Lớp 10</option>
                <option value="11">Lớp 11</option>
                <option value="12">Lớp 12</option>
              </select>
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Loại hình cần soạn</label>
            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="docType" 
                  checked={docType === 'lesson_plan'} 
                  onChange={() => setDocType('lesson_plan')} 
                />
                Giáo án chi tiết (45 phút)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input 
                  type="radio" 
                  name="docType" 
                  checked={docType === 'quiz'} 
                  onChange={() => setDocType('quiz')} 
                />
                Đề kiểm tra trắc nghiệm
              </label>
            </div>
          </div>

          {/* Conditional forms based on type selection */}
          {docType === 'lesson_plan' ? (
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 600 }}>Định hướng phương pháp</label>
              <select value={pedagogyStyle} onChange={e => setPedagogyStyle(e.target.value)} className="form-control" style={{ background: 'white' }}>
                <option value="creative">Sáng tạo & Liên hệ thực tế</option>
                <option value="critical">Phát triển tư duy phản biện & Giải quyết vấn đề</option>
                <option value="teamwork">Tập trung thảo luận & Làm việc nhóm học sinh</option>
              </select>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: 600 }}>Số lượng câu hỏi trắc nghiệm</label>
                <input 
                  type="number" 
                  className="form-control"
                  min="5" 
                  value={questionCount} 
                  onChange={e => {
                    const val = e.target.value;
                    setQuestionCount(val === '' ? '' : parseInt(val));
                  }}
                  onBlur={() => {
                    if (!questionCount || parseInt(questionCount) < 5) {
                      setQuestionCount(10);
                    }
                  }}
                />
              </div>

              {/* Quiz difficulty sliders */}
              <div style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
                <span className="form-label" style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>
                  <Sliders size={12} style={{ marginRight: '4px' }} />
                  Tỷ lệ độ khó đề thi (%)
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Nhận biết:</span> 
                    <input 
                      type="number" 
                      style={{ width: '45px', textAlign: 'right', border: 'none', background: 'transparent', fontWeight: 700 }} 
                      value={diffEasy} 
                      onChange={e => setDiffEasy(parseInt(e.target.value) || 0)} 
                    />%
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Thông hiểu:</span> 
                    <input 
                      type="number" 
                      style={{ width: '45px', textAlign: 'right', border: 'none', background: 'transparent', fontWeight: 700 }} 
                      value={diffMedium} 
                      onChange={e => setDiffMedium(parseInt(e.target.value) || 0)} 
                    />%
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                    <span>Vận dụng:</span> 
                    <input 
                      type="number" 
                      style={{ width: '45px', textAlign: 'right', border: 'none', background: 'transparent', fontWeight: 700 }} 
                      value={diffHard} 
                      onChange={e => setDiffHard(parseInt(e.target.value) || 0)} 
                    />%
                  </div>
                </div>
              </div>
            </div>
          )}

          <button 
            type="button" 
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn btn-primary"
            style={{ width: '100%', gap: '8px', marginTop: '6px' }}
          >
            <Sparkles size={16} />
            <span>{isGenerating ? 'Đang khởi tạo bài viết...' : 'Bắt đầu soạn thảo AI'}</span>
          </button>
        </div>

        {/* Generated Output Panel */}
        <div className="glass-panel" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
          
          {/* Generation Loader */}
          {isGenerating && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                border: '3px solid rgba(99, 102, 241, 0.1)', borderTopColor: 'var(--accent-primary)',
                animation: 'spin 1s linear infinite', marginBottom: '16px'
              }} />
              <h4 style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', textAlign: 'center' }}>
                AI đang làm việc...
              </h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                {genStep}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isGenerating && !generatedDoc && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--text-muted)', textAlign: 'center' }}>
              <Brain size={48} strokeWidth={1} style={{ marginBottom: '16px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '8px' }}>Chưa có tài liệu giáo án</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto', lineHeight: 1.5 }}>
                Vui lòng điền tiêu đề bài học và cấu hình các chỉ số bên trái, sau đó nhấn <strong>Bắt đầu soạn thảo AI</strong> để hệ thống tiến hành biên tập tài liệu dạy học.
              </p>
            </div>
          )}

          {/* Document Content Display */}
          {!isGenerating && generatedDoc && (
            <div id="print-area" className="custom-scroll" style={{ flex: 1, overflowY: 'auto', maxHeight: '550px' }}>
              
              {/* Header actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-card)', paddingBottom: '12px', marginBottom: '16px' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-primary)', textTransform: 'uppercase' }}>
                    {generatedDoc.type === 'lesson_plan' ? 'Giáo án điện tử 45m' : 'Đề kiểm tra trắc nghiệm'}
                  </span>
                  <h3 style={{ fontSize: '1.2rem', margin: '2px 0 0 0' }}>{generatedDoc.title}</h3>
                </div>
                <div style={{ display: 'flex', gap: '8px' }} className="no-print">
                  <button 
                    onClick={handlePrint} 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    <Printer size={14} /> In bản PDF
                  </button>
                  <button 
                    onClick={generatedDoc.type === 'lesson_plan' ? handlePublishLessonPlan : handlePublishQuiz}
                    className="btn btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                  >
                    <Send size={14} /> {generatedDoc.type === 'lesson_plan' ? 'Nộp lên BGH' : 'Ban hành thi'}
                  </button>
                </div>
              </div>

              {/* Render Lesson Plan Details */}
              {generatedDoc.type === 'lesson_plan' && (
                <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  
                  {/* Objective blocks */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '1rem', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '8px', margin: '0 0 8px 0' }}>I. Mục Tiêu Bài Học</h4>
                    <div style={{ paddingLeft: '12px' }}>
                      <p style={{ margin: '0 0 6px 0' }}><strong>1. Kiến thức:</strong> {generatedDoc.objectives.knowledge}</p>
                      <p style={{ margin: '0 0 6px 0' }}><strong>2. Kỹ năng:</strong> {generatedDoc.objectives.skills}</p>
                      <p style={{ margin: '0 0 6px 0' }}><strong>3. Thái độ/Hành vi:</strong> {generatedDoc.objectives.attitude}</p>
                    </div>
                  </div>

                  {/* Equipment */}
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ fontSize: '1rem', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '8px', margin: '0 0 8px 0' }}>II. Thiết Bị Dạy Học & Học Liệu</h4>
                    <p style={{ paddingLeft: '12px', margin: 0 }}>{generatedDoc.equipment}</p>
                  </div>

                  {/* Activities Table */}
                  <div>
                    <h4 style={{ fontSize: '1rem', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '8px', margin: '0 0 12px 0' }}>III. Tiến Trình Dạy Học Chi Tiết</h4>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {generatedDoc.activities.map((act, index) => (
                        <div key={index} style={{ padding: '12px', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px solid var(--border-card)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-card)', paddingBottom: '6px', marginBottom: '8px' }}>
                            <strong style={{ color: 'var(--accent-primary)' }}>{act.name}</strong>
                            <span style={{ fontSize: '0.78rem', fontWeight: 800, padding: '2px 6px', background: 'rgba(99,102,241,0.08)', borderRadius: '4px' }}>{act.time}</span>
                          </div>
                          <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem' }}><strong>Mục tiêu:</strong> {act.goal}</p>
                          <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem' }}><strong>Hoạt động GV:</strong> {act.teacher}</p>
                          <p style={{ margin: '0 0 6px 0', fontSize: '0.82rem' }}><strong>Hoạt động HS:</strong> {act.student}</p>
                          <p style={{ margin: 0, fontSize: '0.82rem' }}><strong>Đánh giá kết quả:</strong> {act.eval}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Render Quiz Details */}
              {generatedDoc.type === 'quiz' && (
                <div style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>
                  <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857' }}>
                      <strong>💡 Gợi ý của AI:</strong> Đề thi trắc nghiệm này được biên soạn bám sát cấu trúc ôn tập thi THPT Quốc gia khối <strong>{generatedDoc.block}</strong> môn <strong>{generatedDoc.subject}</strong>. Bạn có thể nhấn <strong>"Ban hành thi"</strong> để cho học sinh làm trực tuyến ngay lập tức.
                    </p>
                  </div>

                  <h4 style={{ fontSize: '1rem', borderLeft: '3px solid var(--accent-primary)', paddingLeft: '8px', margin: '0 0 16px 0' }}>Nội Dung Đề Kiểm Tra ({generatedDoc.questions.length} câu)</h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {generatedDoc.questions.map((q, idx) => (
                      <div key={q.id} style={{ borderBottom: '1px solid var(--border-card)', paddingBottom: '16px' }}>
                        <p style={{ fontWeight: 700, marginBottom: '10px' }} dangerouslySetInnerHTML={{ __html: `Câu ${idx + 1}: ${decodeHtmlEntities(q.question)}` }} />
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', paddingLeft: '12px', marginBottom: '10px' }}>
                          {q.options.map(opt => {
                            const isCorrect = opt.key === q.correctKey;
                            return (
                              <div 
                                key={opt.key}
                                style={{ 
                                  padding: '8px 12px', 
                                  borderRadius: '6px', 
                                  background: isCorrect ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.01)',
                                  border: '1px solid',
                                  borderColor: isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'transparent',
                                  fontSize: '0.82rem'
                                }}
                              >
                                <strong>{opt.key}.</strong> <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(opt.text) }} /> {isCorrect && '✓'}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation block */}
                        <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.02)', borderLeft: '3px solid #cbd5e1', fontSize: '0.78rem', marginTop: '10px', color: 'var(--text-secondary)' }}>
                          <strong>Giải thích đáp án:</strong> <span dangerouslySetInnerHTML={{ __html: decodeHtmlEntities(q.explanation) }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}

const detectSubject = (text) => {
  const t = text.toLowerCase();
  const litKeywords = ['chí phèo', 'vợ nhặt', 'tây tiến', 'sóng', 'người lái đò', 'vợ chồng a phủ', 'văn học', 'bài thơ', 'tác phẩm', 'quang dũng', 'kim lân', 'nguyễn tuân', 'xuân quỳnh', 'nam cao', 'ngữ văn', 'văn'];
  const mathKeywords = ['py-ta-go', 'pythagoras', 'tích phân', 'đạo hàm', 'số mũ', 'hình học', 'giới hạn', 'toán học', 'đại số', 'khảo sát hàm số', 'nguyên hàm', 'toán', 'logarit'];
  const physicsKeywords = ['sóng âm', 'dao động', 'điện xoay chiều', 'vật lý', 'lực', 'quang hình', 'ánh sáng', 'từ trường', 'lý'];
  const englishKeywords = ['tiếng anh', 'english', 'tenses', 'grammar', 'ngữ pháp', 'từ vựng', 'vocabulary', 'pronunciation'];

  if (litKeywords.some(kw => t.includes(kw))) return 'Ngữ văn';
  if (mathKeywords.some(kw => t.includes(kw))) return 'Toán học';
  if (physicsKeywords.some(kw => t.includes(kw))) return 'Vật lý';
  if (englishKeywords.some(kw => t.includes(kw))) return 'Tiếng Anh';
  return null;
};

const getTopicQuestion = (sub, topic, index) => {
  const t = topic.toLowerCase();
  
  if (sub === 'Ngữ văn') {
    if (t.includes('chí phèo')) {
      const cpQuestions = [
        {
          question: 'Chi tiết "bát cháo hành" của Thị Nở trong truyện ngắn "Chí Phèo" mang ý nghĩa nghệ thuật sâu sắc nào?',
          options: [
            { key: 'A', text: 'Là món ăn ngon nhất Chí Phèo từng được thưởng thức.' },
            { key: 'B', text: 'Biểu tượng của tình thương, hơi ấm nhân tình đánh thức phần người lương thiện bị vùi lấp của Chí Phèo.' },
            { key: 'C', text: 'Sự chăm sóc mang tính vụ lợi của Thị Nở dành cho Chí Phèo.' },
            { key: 'D', text: 'Thể hiện cuộc sống nghèo đói, túng quẫn của người dân làng Vũ Đại.' }
          ],
          correctKey: 'B',
          explanation: 'Bát cháo hành của Thị Nở là biểu tượng của tình thương cảm mộc mạc, không vụ lợi. Đó là lần đầu tiên Chí Phèo được một bàn tay đàn bà chăm sóc. Hơi ấm của bát cháo hành và sự quan tâm của Thị Nở đã đánh thức bản tính lương thiện, khao khát làm người hòa nhập xã hội trong Chí Phèo. Chọn B.'
        },
        {
          question: 'Tiếng chửi của nhân vật Chí Phèo ở phần mở đầu tác phẩm thể hiện trạng thái tâm lý nào?',
          options: [
            { key: 'A', text: 'Sự say rượu quá mức khiến đầu óc không còn tỉnh táo.' },
            { key: 'B', text: 'Sự phản kháng tuyệt vọng trước số phận bị cướp đi nhân hình, nhân tính và khao khát giao tiếp với đồng loại.' },
            { key: 'C', text: 'Thái độ nghênh ngang, thách thức của một kẻ côn đồ khét tiếng.' },
            { key: 'D', text: 'Nỗi oán hận đối với chính gia đình của bản thân mình.' }
          ],
          correctKey: 'B',
          explanation: 'Chí Phèo chửi trời, chửi đời, chửi làng Vũ Đại, và cuối cùng chửi ai không chửi nhau với hắn. Tiếng chửi là công cụ giao tiếp duy nhất còn lại của Chí Phèo với cuộc đời. Phản ứng im lặng của dân làng Vũ Đại đẩy Chí Phèo vào sự cô độc tuyệt đối. Chọn B.'
        },
        {
          question: 'Ai là người chịu trách nhiệm trực tiếp đẩy Chí Phèo vào con đường lưu manh hóa sau khi ra tù?',
          options: [
            { key: 'A', text: 'Thị Nở.' },
            { key: 'B', text: 'Bá Kiến.' },
            { key: 'C', text: 'Lý Cường.' },
            { key: 'D', text: 'Bà cô Thị Nở.' }
          ],
          correctKey: 'B',
          explanation: 'Bá Kiến - đại diện cho giai cấp địa chủ phong kiến bóc lột - đã đẩy Chí Phèo vào tù vì lòng ghen tuông vô cớ. Sau khi Chí Phèo ra tù, Bá Kiến tiếp tục lợi dụng sự phẫn uất của Chí Phèo biến hắn thành tay sai đắc lực, đẩy hắn sâu hơn vào vũng bùn tội lỗi. Chọn B.'
        },
        {
          question: 'Bi kịch lớn nhất của nhân vật Chí Phèo ở cuối truyện ngắn là gì?',
          options: [
            { key: 'A', text: 'Bị Thị Nở từ chối chung sống.' },
            { key: 'B', text: 'Khát khao trở về làm người lương thiện bị cự tuyệt, dẫn đến cái chết bi thảm.' },
            { key: 'C', text: 'Bị Bá Kiến đâm chết tại nhà.' },
            { key: 'D', text: 'Không có tiền tiêu xài và bị cả làng đuổi đi.' }
          ],
          correctKey: 'B',
          explanation: 'Bi kịch của Chí Phèo không chỉ dừng lại ở bi kịch bị từ chối tình yêu. Đó là bi kịch tinh thần đau đớn khi nhận ra mình không thể làm người lương thiện được nữa vì xã hội đã cướp đi quyền đó. Cái chết của Chí Phèo là lời tố cáo sâu sắc xã hội đương thời. Chọn B.'
        }
      ];
      return cpQuestions[index % cpQuestions.length];
    }
    
    return {
      question: `Trong chương trình Ngữ văn lớp 12, khi phân tích chủ đề "${topic}", khía cạnh nghệ thuật nào cần được tập trung làm nổi bật nhất?`,
      options: [
        { key: 'A', text: 'Xây dựng cốt truyện giật gân, ly kỳ.' },
        { key: 'B', text: 'Giá trị nhân đạo sâu sắc và nghệ thuật khắc họa nội tâm nhân vật độc đáo.' },
        { key: 'C', text: 'Sử dụng nhiều thuật ngữ khoa học hàn lâm phức tạp.' },
        { key: 'D', text: 'Tập trung miêu tả cảnh quan thiên nhiên trù phú.' }
      ],
      correctKey: 'B',
      explanation: `Đối với đề tài "${topic}", giá trị nhân đạo cùng nghệ thuật miêu tả tâm lý nhân vật luôn đóng vai trò chủ đạo, giúp truyền tải thông điệp nhân văn của tác giả một cách sâu sắc nhất. Chọn B.`
    };
  }

  if (sub === 'Toán học') {
    if (topic.toLowerCase().includes('tích phân') || topic.toLowerCase().includes('nguyên hàm')) {
      const mathQ = [
        {
          question: 'Tính tích phân I = ∫ (2x + 1) dx từ x=0 đến x=1.',
          options: [
            { key: 'A', text: 'I = 1' },
            { key: 'B', text: 'I = 2' },
            { key: 'C', text: 'I = 3' },
            { key: 'D', text: 'I = 0' }
          ],
          correctKey: 'B',
          explanation: 'Họ nguyên hàm của 2x + 1 là F(x) = x^2 + x. Áp dụng công thức Newton-Leibniz: I = F(1) - F(0) = (1^2 + 1) - (0^2 + 0) = 2. Chọn B.'
        },
        {
          question: 'Tính diện tích S của hình phẳng giới hạn bởi đồ thị hàm số y = x^2, trục hoành Ox và hai đường thẳng x=0, x=3.',
          options: [
            { key: 'A', text: 'S = 3' },
            { key: 'B', text: 'S = 9' },
            { key: 'C', text: 'S = 27' },
            { key: 'D', text: 'S = 18' }
          ],
          correctKey: 'B',
          explanation: 'Diện tích S = ∫ x^2 dx từ x=0 đến x=3. Nguyên hàm là F(x) = x^3 / 3. Ta có S = (3^3 / 3) - 0 = 27/3 = 9. Chọn B.'
        }
      ];
      return mathQ[index % mathQ.length];
    }
    return {
      question: `Tìm công thức toán học chính xác khi xử lý bài toán liên quan đến chuyên đề "${topic}" (Lớp 12).`,
      options: [
        { key: 'A', text: 'Áp dụng công thức nhân đôi lượng giác.' },
        { key: 'B', text: 'Áp dụng định lý đạo hàm và tích phân cơ bản để xác định cực trị/diện tích.' },
        { key: 'C', text: 'Sử dụng bảng phân phối Gauss thống kê.' },
        { key: 'D', text: 'Áp dụng định lý Cosin trong tam giác thường.' }
      ],
      correctKey: 'B',
      explanation: `Đối với chuyên đề "${topic}" môn Toán học lớp 12, việc vận dụng định lý đạo hàm để khảo sát hàm số hoặc tích phân tính diện tích là phương pháp cốt lõi để tìm ra lời giải chính xác. Chọn B.`
    };
  }

  if (sub === 'Vật lý') {
    return {
      question: `Trong thí nghiệm hoặc bài tập Vật lý về chủ đề "${topic}", đại lượng nào sau đây quyết định tính chất vật lý đặc trưng của hệ?`,
      options: [
        { key: 'A', text: 'Nhiệt độ môi trường bên ngoài.' },
        { key: 'B', text: 'Chu kỳ dao động, tần số riêng hoặc bước sóng của sóng truyền.' },
        { key: 'C', text: 'Khối lượng của vật cản xung quanh.' },
        { key: 'D', text: 'Độ ẩm không khí tại phòng thí nghiệm.' }
      ],
      correctKey: 'B',
      explanation: `Khi khảo sát chuyên đề "${topic}", các thông số đặc trưng như tần số, chu kỳ hay bước sóng luôn là đại lượng cốt lõi định hình hành vi dao động hoặc truyền sóng của hệ vật lý. Chọn B.`
    };
  }

  return {
    question: `Choose the correct statement or grammatical form regarding the topic "${topic}":`,
    options: [
      { key: 'A', text: 'It is an obsolete structure that is rarely used in practice.' },
      { key: 'B', text: 'It represents a standard academic concept widely tested in national exams.' },
      { key: 'C', text: 'It has no logical explanation and must be memorized by heart.' },
      { key: 'D', text: 'It is only applicable in informal conversations.' }
    ],
    correctKey: 'B',
    explanation: `The concept of "${topic}" is a fundamental part of the curriculum, frequently appearing in intermediate and advanced evaluations. Choice B is correct.`
  };
};
