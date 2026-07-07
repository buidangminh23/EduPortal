import { useState, useContext } from 'react';
import { AppContext } from '../../context/AppContext';
import { Brain, Sparkles, Trophy, ArrowRight, ChevronRight, RotateCcw, Compass, GraduationCap } from 'lucide-react';

const QUESTIONS = [
  { id: 1, type: 'R', text: 'Tôi thích thiết kế bản vẽ kỹ thuật, sửa chữa các thiết bị điện tử hoặc đồ đạc trong gia đình.' },
  { id: 2, type: 'I', text: 'Tôi thích tự mình tìm tòi, nghiên cứu các hiện tượng khoa học hoặc giải những bài toán logic phức tạp.' },
  { id: 3, type: 'A', text: 'Tôi có hứng thú với việc viết văn, vẽ tranh, chụp ảnh hoặc tham gia các câu lạc bộ nghệ thuật.' },
  { id: 4, type: 'S', text: 'Tôi thích hỗ trợ, chăm sóc người khác, làm việc nhóm hoặc tham gia hoạt động thiện nguyện xã hội.' },
  { id: 5, type: 'E', text: 'Tôi muốn thuyết phục người khác, lên kế hoạch kinh doanh hoặc đóng vai trò trưởng nhóm để dẫn dắt mọi người.' },
  { id: 6, type: 'C', text: 'Tôi thích làm việc với các con số, ghi chép sổ sách kế toán hoặc lưu trữ hồ sơ tài liệu ngăn nắp.' },
  { id: 7, type: 'R', text: 'Tôi thích lắp ráp mô hình, vận hành máy móc thiết bị hoặc làm các công việc thực hành chân tay.' },
  { id: 8, type: 'I', text: 'Tôi thích phân tích số liệu thống kê, làm thí nghiệm hóa học hoặc tìm hiểu cơ chế hoạt động của đồ công nghệ.' },
  { id: 9, type: 'A', text: 'Tôi thích thiết kế thời trang, sáng tạo nội dung truyền thông hoặc làm những đồ thủ công handmade độc lạ.' },
  { id: 10, type: 'S', text: 'Tôi thích hướng dẫn bài tập cho các bạn học cùng, lắng nghe chia sẻ hoặc tư vấn tâm lý cho người khác.' },
  { id: 11, type: 'E', text: 'Tôi thích tham gia đàm phán thương thảo, tổ chức các sự kiện lớn hoặc đặt mục tiêu hoàn thành doanh số.' },
  { id: 12, type: 'C', text: 'Tôi thích làm việc có quy trình cụ thể rõ ràng, lập bảng biểu Excel theo dõi ngân sách hoặc lập thời gian biểu.' },
];

const CATEGORY_NAMES = {
  R: { fullname: 'Realistic (Thực tế)', desc: 'Thích làm việc với máy móc, dụng cụ, cây cối, con vật hoặc các hoạt động ngoài trời.' },
  I: { fullname: 'Investigative (Nghiên cứu)', desc: 'Thích quan sát, tìm tòi, học hỏi, phân tích dữ liệu và giải quyết các bài toán khoa học.' },
  A: { fullname: 'Artistic (Nghệ thuật)', desc: 'Thích sự sáng tạo, tự do thể hiện bản thân, nghệ thuật vẽ, viết, âm nhạc và thiết kế.' },
  S: { fullname: 'Social (Xã hội)', desc: 'Thích giảng dạy, giúp đỡ, chăm sóc, chia sẻ và làm việc với con người.' },
  E: { fullname: 'Enterprising (Quản lý)', desc: 'Thích giao tiếp, lãnh đạo, thuyết phục người khác, khởi nghiệp và quản trị dự án.' },
  C: { fullname: 'Conventional (Quy củ)', desc: 'Thích làm việc với dữ liệu cụ thể, tuân thủ quy trình hành chính, kế toán và tổ chức số liệu.' },
};

const CAREER_SUGGESTIONS = {
  R: {
    jobs: 'Kỹ sư cơ khí, Lập trình viên nhúng, Kỹ thuật viên viễn thông, Kiến trúc sư cảnh quan, Nhà nông học chất lượng cao.',
    majors: 'Kỹ thuật Cơ khí, Điện tử Viễn thông, Công nghệ Kỹ thuật Ô tô, Nông nghiệp Công nghệ cao.',
    unis: 'ĐH Bách Khoa Hà Nội/TPHCM, Trường ĐH Giao thông Vận tải, ĐH Sư phạm Kỹ thuật.'
  },
  I: {
    jobs: 'Nhà nghiên cứu AI (Data Scientist), Chuyên viên An ninh mạng, Bác sĩ y khoa, Nhà hóa sinh học, Nhà khí tượng.',
    majors: 'Khoa học máy tính, Trí tuệ nhân tạo, Y đa khoa, Công nghệ Sinh học, Vật lý học.',
    unis: 'Trường ĐH Công nghệ (UET-VNU), ĐH Bách Khoa, ĐH Y Hà Nội / ĐH Y Dược TPHCM, ĐH Khoa học Tự nhiên.'
  },
  A: {
    jobs: 'Nhà thiết kế đồ họa, Chuyên viên sáng tạo nội dung, Kiến trúc sư công trình, Đạo diễn hình ảnh, Nhà báo.',
    majors: 'Thiết kế đồ họa, Truyền thông đa phương tiện, Kiến trúc, Báo chí và Truyền thông.',
    unis: 'ĐH Kiến trúc, ĐH Mỹ thuật Công nghiệp, Học viện Báo chí và Tuyên truyền, ĐH RMIT, ĐH FPT.'
  },
  S: {
    jobs: 'Giảng viên, Chuyên viên Tâm lý học đường, Quản trị nhân sự, Bác sĩ phục hồi chức năng, Quản lý dự án phi chính phủ (NGO).',
    majors: 'Sư phạm chất lượng cao, Tâm lý học, Quản trị Nhân lực, Công tác Xã hội.',
    unis: 'ĐH Sư phạm Hà Nội / TPHCM, ĐH Khoa học Xã hội và Nhân văn (VNU), ĐH Lao động Xã hội.'
  },
  E: {
    jobs: 'Giám đốc dự án, Chuyên viên phát triển thị trường, Doanh nhân khởi nghiệp, Luật sư thương mại, Chuyên gia đầu tư.',
    majors: 'Quản trị kinh doanh, Tài chính Quốc tế, Luật Kinh tế, Logistics và Chuỗi cung ứng.',
    unis: 'ĐH Ngoại thương (FTU), ĐH Kinh tế Quốc dân (NEU), ĐH Kinh tế TPHCM (UEH), Học viện Ngoại giao.'
  },
  C: {
    jobs: 'Chuyên viên kiểm toán, Kế toán trưởng, Phân tích dữ liệu tài chính, Quản trị cơ sở dữ liệu, Chuyên viên hành chính pháp lý.',
    majors: 'Kiểm toán, Kế toán, Hệ thống thông tin quản lý, Khoa học dữ liệu tài chính.',
    unis: 'Học viện Tài chính, Học viện Ngân hàng, ĐH Kinh tế Quốc dân, ĐH Thương mại.'
  }
};

export default function AiAdvisorTab() {
  const { selectedStudentId, students, careerTestScores, saveCareerTest } = useContext(AppContext);
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];

  const [testStarted, setTestStarted] = useState(false);
  const [completedStudentId, setCompletedStudentId] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(0));

  // Check if student already has scores
  const savedScore = careerTestScores?.find(score => score.studentId === student?.id);
  const testCompleted = completedStudentId === student?.id || (Boolean(savedScore) && !testStarted);

  const handleStart = () => {
    setAnswers(Array(QUESTIONS.length).fill(0));
    setCurrentIdx(0);
    setTestStarted(true);
    setCompletedStudentId(null);
  };

  const handleSelectScore = (score) => {
    const nextAnswers = [...answers];
    nextAnswers[currentIdx] = score;
    setAnswers(nextAnswers);

    if (currentIdx < QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentIdx(prev => prev + 1);
      }, 250);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Validate all answered
    if (answers.some(a => a === 0)) {
      alert('Vui lòng trả lời đầy đủ các câu hỏi trước khi nộp bài!');
      return;
    }

    // Calculate R I A S E C scores
    const results = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    QUESTIONS.forEach((q, idx) => {
      results[q.type] += answers[idx];
    });

    if (student) {
      saveCareerTest(student.id, results);
      setCompletedStudentId(student.id);
      setTestStarted(false);
    }
  };

  // Radar chart computation (cx = 150, cy = 130, maxRadius = 80)
  const getRadarData = () => {
    const scores = savedScore || { R: 6, I: 8, A: 4, S: 7, E: 5, C: 3 };
    const categories = ['R', 'I', 'A', 'S', 'E', 'C'];
    const cx = 150;
    const cy = 130;
    const maxRadius = 80;

    // Helper: get coordinate for category index and value (out of 10 max, since 2 questions of max 5 = 10)
    const getCoord = (idx, value) => {
      const angle = (idx * 60 - 90) * (Math.PI / 180);
      const r = (value / 10) * maxRadius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle)
      };
    };

    // Build axis coordinates (full max score = 10)
    const axes = categories.map((cat, idx) => {
      const outer = getCoord(idx, 10);
      const labelCoord = getCoord(idx, 12); // place text a bit outward
      return { cat, label: CATEGORY_NAMES[cat].fullname.split(' ')[0], outer, labelCoord };
    });

    // Build background grid hexagons (at levels 2.5, 5, 7.5, 10)
    const gridLevels = [2.5, 5, 7.5, 10];
    const gridPolygons = gridLevels.map(level => {
      return categories.map((_, idx) => {
        const pt = getCoord(idx, level);
        return `${pt.x},${pt.y}`;
      }).join(' ');
    });

    // Build actual data polygon points
    const dataPoints = categories.map((cat, idx) => {
      const val = scores[cat] || 0;
      const pt = getCoord(idx, val);
      return `${pt.x},${pt.y}`;
    }).join(' ');

    const pointsList = categories.map((cat, idx) => {
      const val = scores[cat] || 0;
      return getCoord(idx, val);
    });

    return { cx, cy, axes, gridPolygons, dataPoints, points: pointsList, scores };
  };

  const getHollandCode = () => {
    const scores = savedScore || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const sorted = Object.entries(scores)
      .filter(([key]) => ['R', 'I', 'A', 'S', 'E', 'C'].includes(key))
      .sort((a, b) => b[1] - a[1]);
    
    const code = sorted.slice(0, 3).map(([key]) => key).join('');
    const topCat = sorted[0]?.[0] || 'I';
    return { code, topCat, sorted };
  };

  const radar = getRadarData();
  const holland = getHollandCode();

  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Brain size={28} color="var(--accent-primary, #6366f1)" />
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--text-primary)' }}>Trợ Lý Định Hướng & Hướng Nghiệp AI</h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Khảo sát trắc nghiệm Holland Code (RIASEC) xác định cá tính nghề nghiệp vượt trội.</p>
          </div>
        </div>
        {testCompleted && (
          <button onClick={handleStart} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '8px 16px' }}>
            <RotateCcw size={14} /> Làm lại trắc nghiệm
          </button>
        )}
      </div>

      {/* STATE 1: WELCOME SCREEN */}
      {!testStarted && !testCompleted && (
        <div style={{ textAlign: 'center', padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ background: 'rgba(99,102,241,0.08)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Compass size={40} color="var(--accent-primary, #6366f1)" className="animate-spin-slow" />
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '12px' }}>Khám phá Cá tính Hướng nghiệp của Bạn</h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.9rem', marginBottom: '24px' }}>
            Hệ thống trắc nghiệm Holland (RIASEC) gồm 12 câu hỏi ngắn giúp phân tích xu hướng nghề nghiệp tự nhiên của bạn. Trợ lý AI sẽ tính toán và đưa ra sơ đồ tính cách cùng các gợi ý Đại học, chuyên ngành phù hợp nhất tại Việt Nam.
          </p>
          <button onClick={handleStart} className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span>Bắt đầu khảo sát RIASEC</span>
            <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* STATE 2: ACTIVE QUIZ */}
      {testStarted && !testCompleted && (
        <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px 0' }}>
          {/* Progress indicators */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            <span>Câu hỏi {currentIdx + 1} / {QUESTIONS.length}</span>
            <span>Tiến độ: {Math.round(((currentIdx + 1) / QUESTIONS.length) * 100)}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', marginBottom: '32px', overflow: 'hidden' }}>
            <div style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--accent-primary) 0%, #3b82f6 100%)', transition: 'width 0.25s ease' }}></div>
          </div>

          {/* Question Card */}
          <div className="glass-panel" style={{ padding: '32px', marginBottom: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', minHeight: '140px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
            <span style={{ position: 'absolute', top: '16px', left: '20px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Nhóm trắc nghiệm: {CATEGORY_NAMES[QUESTIONS[currentIdx].type].fullname.split(' ')[0]}
            </span>
            <p style={{ fontSize: '1.15rem', fontWeight: 600, lineHeight: 1.6, margin: 0, marginTop: '8px', color: 'var(--text-primary)' }}>
              {QUESTIONS[currentIdx].text}
            </p>
          </div>

          {/* Answer Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Chọn mức độ yêu thích:</span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
              {[
                { val: 1, label: 'Rất ghét' },
                { val: 2, label: 'Không thích' },
                { val: 3, label: 'Bình thường' },
                { val: 4, label: 'Yêu thích' },
                { val: 5, label: 'Rất thích' }
              ].map((opt) => {
                const isSelected = answers[currentIdx] === opt.val;
                return (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => handleSelectScore(opt.val)}
                    className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      padding: '14px 4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.15s ease',
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)'
                    }}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{opt.val}</span>
                    <span style={{ fontSize: '0.68rem', color: isSelected ? '#fff' : 'var(--text-secondary)', textAlign: 'center' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '36px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
            <button 
              type="button"
              onClick={handlePrev}
              disabled={currentIdx === 0}
              className="btn btn-secondary"
              style={{ opacity: currentIdx === 0 ? 0.4 : 1, padding: '8px 20px', fontSize: '0.85rem' }}
            >
              Quay lại
            </button>

            {currentIdx === QUESTIONS.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={answers.some(a => a === 0)}
                className="btn btn-primary animate-pulse"
                style={{ padding: '10px 24px', fontSize: '0.88rem', fontWeight: 700 }}
              >
                Nộp bài & Phân tích kết quả
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIdx(prev => prev + 1)}
                disabled={answers[currentIdx] === 0}
                className="btn btn-secondary"
                style={{ padding: '8px 20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', opacity: answers[currentIdx] === 0 ? 0.4 : 1 }}
              >
                <span>Câu tiếp</span>
                <ChevronRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STATE 3: RESULTS & RADAR CHART */}
      {testCompleted && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '32px', marginTop: '12px', alignItems: 'start' }}>
          
          {/* Left Column: Holland Code & Visual Spider Chart */}
          <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ textAlign: 'center' }}>
              <span className="badge badge-info" style={{ background: 'var(--accent-soft)', color: 'var(--accent-ink)', fontSize: '0.8rem', padding: '4px 10px', borderRadius: '12px' }}>
                MÃ HOLLAND CỦA BẠN
              </span>
              <h3 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '2px', margin: '8px 0 0 0' }}>
                {holland.code}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                ({holland.sorted.slice(0,3).map(([k]) => CATEGORY_NAMES[k].fullname.split(' ')[0]).join(' - ')})
              </p>
            </div>

            {/* SVG Spider Chart */}
            <div style={{ position: 'relative', width: '300px', height: '260px' }}>
              <svg width="300" height="260" style={{ overflow: 'visible' }}>
                {/* Background hexagons */}
                {radar.gridPolygons.map((poly, idx) => (
                  <polygon
                    key={idx}
                    points={poly}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                ))}

                {/* Axes lines */}
                {radar.axes.map((ax, idx) => (
                  <line
                    key={idx}
                    x1={radar.cx}
                    y1={radar.cy}
                    x2={ax.outer.x}
                    y2={ax.outer.y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    strokeDasharray="2,2"
                  />
                ))}

                {/* Categories labels */}
                {radar.axes.map((ax, idx) => {
                  let textAnchor = 'middle';
                  if (ax.labelCoord.x > radar.cx + 20) textAnchor = 'start';
                  if (ax.labelCoord.x < radar.cx - 20) textAnchor = 'end';
                  const score = radar.scores[ax.cat] || 0;
                  
                  return (
                    <text
                      key={idx}
                      x={ax.labelCoord.x}
                      y={ax.labelCoord.y + 4}
                      fontSize="10"
                      fontWeight="700"
                      fill={idx === 0 || idx === 1 || idx === 3 ? 'var(--text-primary)' : '#94a3b8'}
                      textAnchor={textAnchor}
                    >
                      {ax.label} ({score})
                    </text>
                  );
                })}

                {/* Shaded Data Area Polygon */}
                <polygon
                  points={radar.dataPoints}
                  fill="rgba(99, 102, 241, 0.28)"
                  stroke="var(--accent-primary, #6366f1)"
                  strokeWidth="2.5"
                  strokeLinejoin="round"
                />

                {/* Data Points Circles */}
                {radar.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="var(--accent-primary, #6366f1)"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                ))}
              </svg>
            </div>

            {/* Explanatory notes */}
            <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '16px' }}>
              <h5 style={{ fontSize: '0.88rem', margin: '0 0 10px 0', fontWeight: 600 }}>Cá tính hướng nghiệp vượt trội:</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {holland.sorted.slice(0, 3).map(([cat, score]) => (
                  <div key={cat} style={{ fontSize: '0.8rem', lineHeight: 1.4 }}>
                    <strong style={{ color: 'var(--accent-primary)' }}>{CATEGORY_NAMES[cat].fullname}:</strong> {score}/10đ. {CATEGORY_NAMES[cat].desc}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: AI Career Recommendation & University Matchmaker Link */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* AI Advisor Panel */}
            <div className="glass-panel" style={{ padding: '24px', background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.08)' }}>
              <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 700 }}>
                <Sparkles size={18} color="var(--accent-primary)" />
                <span>Định hướng Nghề nghiệp & Học thuật từ AI</span>
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* 1. Jobs */}
                <div>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    Nghề nghiệp phù hợp nhất:
                  </h5>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>
                    {CAREER_SUGGESTIONS[holland.topCat]?.jobs}
                  </p>
                </div>

                {/* 2. Majors */}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    Chuyên ngành học gợi ý:
                  </h5>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.5, margin: 0, fontWeight: 600, color: 'var(--accent-secondary, #10b981)' }}>
                    {CAREER_SUGGESTIONS[holland.topCat]?.majors}
                  </p>
                </div>

                {/* 3. Universities */}
                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.06)', paddingTop: '12px' }}>
                  <h5 style={{ margin: '0 0 4px 0', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.5px' }}>
                    Trường Đại học đào tạo hàng đầu:
                  </h5>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '6px' }}>
                    <GraduationCap size={16} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ fontSize: '0.88rem', lineHeight: 1.5, margin: 0, color: 'var(--text-primary)' }}>
                      {CAREER_SUGGESTIONS[holland.topCat]?.unis}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Advice details */}
            <div className="glass-panel" style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.02)' }}>
              <h5 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trophy size={16} color="#f59e0b" /> Lời khuyên định hướng lộ trình học tập:
              </h5>
              <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)', margin: 0 }}>
                Dựa trên kết quả nhóm **{holland.code}** kết hợp với kết quả điểm thi thử hiện tại của bạn, lộ trình ôn tập nên ưu tiên việc duy trì điểm số các môn cốt lõi của tổ hợp đăng ký xét tuyển. 
                Bạn hãy tận dụng bộ công cụ **Định vị trường Đại học (University Matchmaker)** trong Dashboard Học sinh để ước lượng tỷ lệ đỗ vào các nguyện vọng tương ứng theo lịch sử điểm chuẩn năm ngoái nhé!
              </p>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
