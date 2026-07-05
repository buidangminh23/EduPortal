import { useState, useContext, useEffect, lazy, Suspense } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import { ShieldCheck, Mail, Phone, Trophy } from 'lucide-react';

const PrincipalDashboard = lazy(() => import('./components/PrincipalDashboard'));
const TeacherDashboard = lazy(() => import('./components/TeacherDashboard'));
const ClassJournal = lazy(() => import('./components/ClassJournal'));
const ParentHub = lazy(() => import('./components/ParentHub'));
const StudentDashboard = lazy(() => import('./components/StudentDashboard'));
const AITutor = lazy(() => import('./components/AITutor'));
const VideoLectures = lazy(() => import('./components/VideoLectures'));
const EduMeet = lazy(() => import('./components/EduMeet'));
const SchoolCalendar = lazy(() => import('./components/SchoolCalendar'));
const FloatingChatWidget = lazy(() => import('./components/FloatingChatWidget'));
const BulletinBoard = lazy(() => import('./components/BulletinBoard'));
const DirectChat = lazy(() => import('./components/DirectChat'));
const MeetingBooking = lazy(() => import('./components/MeetingBooking'));
const ExamRepository = lazy(() => import('./components/ExamRepository'));
const AssetManager = lazy(() => import('./components/AssetManager'));
const BadgesPanel = lazy(() => import('./components/BadgesPanel'));
const Leaderboard = lazy(() => import('./components/Leaderboard'));
const GradeTrendChart = lazy(() => import('./components/GradeTrendChart'));
const CanteenManager = lazy(() => import('./components/CanteenManager'));
const WellnessHub = lazy(() => import('./components/WellnessHub'));
const StudyGroupHub = lazy(() => import('./components/StudyGroupHub'));
const LibraryHub = lazy(() => import('./components/LibraryHub'));
const WebLab = lazy(() => import('./components/WebLab'));
const EssayGrader = lazy(() => import('./components/EssayGrader'));
const BusTracker = lazy(() => import('./components/BusTracker'));
const PortfolioBuilder = lazy(() => import('./components/PortfolioBuilder'));
const TimetableGenerator = lazy(() => import('./components/TimetableGenerator'));
const DutySchedule = lazy(() => import('./components/DutySchedule'));
const SeatingChart = lazy(() => import('./components/SeatingChart'));
const ClassVoting = lazy(() => import('./components/ClassVoting'));
const AIRiskAnalysis = lazy(() => import('./components/AIRiskAnalysis'));
const ClassComparison = lazy(() => import('./components/ClassComparison'));
const SchoolGallery = lazy(() => import('./components/SchoolGallery'));

function App() {
  const { currentRole, userSession } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);

  // Reset tab on role switch
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveTab('dashboard');
    }, 0);
    return () => clearTimeout(timer);
  }, [currentRole]);

  // If no active session, render the LandingPage or Login Portal
  if (!userSession) {
    if (showLogin) {
      return <Login onBack={() => setShowLogin(false)} />;
    }
    return <LandingPage onLogin={() => setShowLogin(true)} />;
  }

  // Main page content router
  const renderTabContent = () => {
    if (activeTab === 'calendar') {
      return <SchoolCalendar />;
    }

    // Student only tabs
    if (currentRole === 'student') {
      if (activeTab === 'canteen') return <CanteenManager />;
      if (activeTab === 'wellness') return <WellnessHub />;
      if (activeTab === 'study_group') return <StudyGroupHub />;
      if (activeTab === 'library_hub') return <LibraryHub />;
      if (activeTab === 'weblab') return <WebLab />;
    }

    // Role-dependent premium pages
    if (activeTab === 'essay_grader' && (currentRole === 'student' || currentRole === 'teacher' || currentRole === 'admin')) {
      return <EssayGrader />;
    }
    if (activeTab === 'bus_tracker' && (currentRole === 'student' || currentRole === 'parent' || currentRole === 'admin' || currentRole === 'teacher')) {
      return <BusTracker />;
    }
    if (activeTab === 'portfolio' && (currentRole === 'student' || currentRole === 'admin' || currentRole === 'teacher')) {
      return <PortfolioBuilder />;
    }
    if (activeTab === 'timetable_generator' && (currentRole === 'admin' || currentRole === 'teacher')) {
      return <TimetableGenerator />;
    }


    // 1. BAN GIÁM HIỆU
    if (currentRole === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <PrincipalDashboard />;
        case 'students':
          return <AdminStudentManager />;
        case 'teachers':
          return <AdminTeacherManager />;
        case 'journal':
          return <ClassJournal />;
        case 'duty_schedule':
          return <DutySchedule />;
        case 'seating_chart':
          return <SeatingChart />;
        case 'class_voting':
          return <ClassVoting />;
        case 'ai_risk':
          return <AIRiskAnalysis />;
        case 'class_comparison':
          return <ClassComparison />;
        case 'school_gallery':
          return <SchoolGallery />;
        case 'bulletin':
          return <BulletinBoard />;
        case 'exam_repository':
          return <ExamRepository />;
        case 'asset_manager':
          return <AssetManager />;
        default:
          return <PrincipalDashboard />;
      }
    }
    
    // 2. GIÁO VIÊN
    if (currentRole === 'teacher') {
      switch (activeTab) {
        case 'dashboard':
          return <TeacherDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
        case 'journal':
          return <ClassJournal />;
        case 'duty_schedule':
          return <DutySchedule />;
        case 'seating_chart':
          return <SeatingChart />;
        case 'class_voting':
          return <ClassVoting />;
        case 'ai_risk':
          return <AIRiskAnalysis />;
        case 'school_gallery':
          return <SchoolGallery />;
        case 'qas':
          return <TeacherDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
        case 'meet':
          return <EduMeet />;
        case 'chat':
          return <DirectChat />;
        case 'meeting_booking':
          return <MeetingBooking />;
        case 'bulletin':
          return <BulletinBoard />;
        case 'exam_repository':
          return <ExamRepository />;
        case 'asset_manager':
          return <AssetManager />;
        default:
          return <TeacherDashboard activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
    }

    // 3. HỌC SINH
    if (currentRole === 'student') {
      switch (activeTab) {
        case 'dashboard':
          return <StudentDashboard setActiveTab={setActiveTab} />;
        case 'school_gallery':
          return <SchoolGallery />;
        case 'lectures':
          return <VideoLectures />;
        case 'tutor':
          return <AITutor />;
        case 'meet':
          return <EduMeet />;
        case 'bulletin':
          return <BulletinBoard />;
        case 'exam_repository':
          return <ExamRepository />;
        case 'gamification':
          return <GamificationPage />;
        default:
          return <StudentDashboard setActiveTab={setActiveTab} />;
      }
    }

    // 4. PHỤ HUYNH
    if (currentRole === 'parent') {
      switch (activeTab) {
        case 'chat':
          return <DirectChat />;
        case 'school_gallery':
          return <SchoolGallery />;
        case 'meeting_booking':
          return <MeetingBooking />;
        case 'bulletin':
          return <BulletinBoard />;
        default:
          return <ParentHub activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
    }

    return <div>Không tìm thấy nội dung.</div>;
  };

  return (
    <div className="app-container" data-role={currentRole}>
      {/* Navigation Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <div className="main-content">
        {/* Header / Navbar */}
        <Navbar setActiveTab={setActiveTab} />
        
        {/* Main Content Viewport */}
        <main className="content-pane">
          <Suspense fallback={<div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Đang tải nội dung…</div>}>
            {renderTabContent()}
          </Suspense>
        </main>
      </div>

      {/* Floating AI Chat Widget — chỉ hiện với học sinh */}
      <Suspense fallback={null}>
        <FloatingChatWidget />
      </Suspense>
    </div>
  );
}

// Gamification composite page: Badges + Leaderboard + Grade Trend
function GamificationPage() {
  const { students, selectedStudentId } = useContext(AppContext);
  const student = students?.find(s => s.id === selectedStudentId) || students?.[0];
  return (
    <div className="glass-panel animate-fade" style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <Trophy size={24} color="#f59e0b" />
        <div>
          <h2 style={{ margin: 0 }}>Thành Tích & Xếp Hạng</h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Huy hiệu, bảng xếp hạng thi thử và xu hướng điểm số của bạn</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        {student && <GradeTrendChart student={student} />}
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 24 }}>
          <BadgesPanel studentId={selectedStudentId} />
        </div>
        <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 24 }}>
          <Leaderboard />
        </div>
      </div>
    </div>
  );
}

// Sub-component: Student profile table for Admin/BGH view
function AdminStudentManager() {
  const { students, addStudent } = useContext(AppContext);
  const [showAdd, setShowAdd] = useState(false);
  const [newStd, setNewStd] = useState({ name: '', class: '12A1', parentName: '', parentPhone: '' });
  
  // Filter states
  const [selectedGrade, setSelectedGrade] = useState('All'); // All, 12, 11, 10
  const [selectedClass, setSelectedClass] = useState('All'); // All, 12A1, 12A2, 11A1, 10A1

  // Handle grade change and auto-adjust class filter
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass('All'); // Reset class selection when grade changes
  };

  // Get classes list based on selected grade
  const getClassOptions = () => {
    if (selectedGrade === '12') return ['12A1', '12A2'];
    if (selectedGrade === '11') return ['11A1'];
    if (selectedGrade === '10') return ['10A1'];
    return ['12A1', '12A2', '11A1', '10A1']; // for 'All'
  };

  const filteredStudents = students.filter(s => {
    const matchGrade = selectedGrade === 'All' || s.grade === selectedGrade;
    const matchClass = selectedClass === 'All' || s.class === selectedClass;
    return matchGrade && matchClass;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newStd.name.trim()) return;
    addStudent(newStd);
    setShowAdd(false);
    setNewStd({ name: '', class: '12A1', parentName: '', parentPhone: '' });
    alert('Đã tiếp nhận hồ sơ học sinh mới!');
  };

  return (
    <div className="glass-panel animate-fade">
      {/* Roster Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3>Hồ Sơ Học Sinh Toàn Trường ({students.length})</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Danh sách học sinh chính quy trực thuộc hệ thống đào tạo.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">Thêm Học Sinh Mới</button>
      </div>

      {/* Grade and Class Filters */}
      <div style={{ 
        background: 'rgba(79, 70, 229, 0.03)', 
        border: '1px solid rgba(79, 70, 229, 0.08)',
        borderRadius: '14px', 
        padding: '16px', 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Grade Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>Chọn Khối:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', '12', '11', '10'].map(grade => (
              <button
                key={grade}
                onClick={() => handleGradeChange(grade)}
                className={`btn ${selectedGrade === grade ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                {grade === 'All' ? 'Tất cả Khối' : `Khối ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {/* Class Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>Chọn Lớp:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedClass('All')}
              className={`btn ${selectedClass === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
            >
              Tất cả Lớp
            </button>
            {getClassOptions().map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`btn ${selectedClass === cls ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                Lớp {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Mã HS</th>
              <th>Ảnh</th>
              <th>Họ và Tên</th>
              <th>Khối</th>
              <th>Lớp</th>
              <th>Phụ Huynh</th>
              <th>Số điện thoại</th>
              <th>Điểm TB học kì</th>
              <th>Trạng thái học phí</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  Không tìm thấy học sinh nào thuộc bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              filteredStudents.map(s => {
                const grades = Object.values(s.grades);
                const avg = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
                const unpaidCount = s.feeStatus.filter(f => !f.paid).length;
                return (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{s.id}</td>
                    <td>
                      <img 
                        src={s.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'} 
                        alt={s.name} 
                        style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          objectFit: 'cover', 
                          border: '2px solid rgba(79, 70, 229, 0.1)'
                        }} 
                      />
                    </td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td><span className="badge badge-info">Khối {s.grade}</span></td>
                    <td><span className="badge badge-success">Lớp {s.class}</span></td>
                    <td>{s.parentName}</td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Phone size={12} /> {s.parentPhone}</span></td>
                    <td style={{ fontWeight: 700, color: avg >= 8 ? 'var(--accent-secondary)' : 'var(--text-primary)' }}>{avg}</td>
                    <td>
                      {unpaidCount === 0 ? (
                        <span className="badge badge-success">Đã hoàn thành</span>
                      ) : (
                        <span className="badge badge-danger">Còn nợ {unpaidCount} khoản</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade" style={{ background: 'white' }}>
            <h3 style={{ marginBottom: '16px' }}>Tiếp Nhận Học Sinh Mới</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Họ và Tên Học Sinh</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newStd.name}
                  onChange={e => setNewStd({...newStd, name: e.target.value})}
                  placeholder="Lê Văn B" 
                  required 
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Xếp lớp</label>
                <select 
                  className="form-control"
                  value={newStd.class}
                  onChange={e => setNewStd({...newStd, class: e.target.value})}
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                >
                  <option value="12A1">Lớp 12A1 (Khối 12)</option>
                  <option value="12A2">Lớp 12A2 (Khối 12)</option>
                  <option value="11A1">Lớp 11A1 (Khối 11)</option>
                  <option value="10A1">Lớp 10A1 (Khối 10)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Họ Tên Phụ Huynh</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newStd.parentName}
                  onChange={e => setNewStd({...newStd, parentName: e.target.value})}
                  placeholder="Lê Văn A" 
                  required 
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Số điện thoại liên hệ</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={newStd.parentPhone}
                  onChange={e => setNewStd({...newStd, parentPhone: e.target.value})}
                  placeholder="09xxxxxxxx" 
                  required 
                  style={{ background: 'white', borderColor: '#cbd5e1', color: '#1e293b' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowAdd(false)} className="btn btn-secondary" style={{ flex: 1 }}>Hủy</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Lưu hồ sơ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-component: Teacher manager wrapper for Admin/BGH view (reuses list from dashboard)
function AdminTeacherManager() {
  const { teachers } = useContext(AppContext);

  // Filter states
  const [selectedGrade, setSelectedGrade] = useState('All'); // All, 12, 11, 10
  const [selectedClass, setSelectedClass] = useState('All'); // All, 12A1, 12A2, 11A1, 10A1

  // Handle grade change and auto-adjust class filter
  const handleGradeChange = (grade) => {
    setSelectedGrade(grade);
    setSelectedClass('All'); // Reset class selection when grade changes
  };

  // Get classes list based on selected grade
  const getClassOptions = () => {
    if (selectedGrade === '12') return ['12A1', '12A2'];
    if (selectedGrade === '11') return ['11A1'];
    if (selectedGrade === '10') return ['10A1'];
    return ['12A1', '12A2', '11A1', '10A1']; // for 'All'
  };

  const filteredTeachers = teachers.filter(t => {
    if (!t.classJoined) {
      return selectedGrade === 'All' && selectedClass === 'All';
    }
    const teacherGrade = t.classJoined.substring(0, 2);
    const matchGrade = selectedGrade === 'All' || teacherGrade === selectedGrade;
    const matchClass = selectedClass === 'All' || t.classJoined === selectedClass;
    return matchGrade && matchClass;
  });

  return (
    <div className="glass-panel animate-fade">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3>Danh sách Hội đồng Sư phạm ({teachers.length})</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Xem chi tiết thông tin nhân sự giáo viên các bộ môn.</p>
        </div>
      </div>

      {/* Grade and Class Filters */}
      <div style={{ 
        background: 'rgba(79, 70, 229, 0.03)', 
        border: '1px solid rgba(79, 70, 229, 0.08)',
        borderRadius: '14px', 
        padding: '16px', 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        {/* Grade Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>Chọn Khối:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['All', '12', '11', '10'].map(grade => (
              <button
                key={grade}
                onClick={() => handleGradeChange(grade)}
                className={`btn ${selectedGrade === grade ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                {grade === 'All' ? 'Tất cả Khối' : `Khối ${grade}`}
              </button>
            ))}
          </div>
        </div>

        {/* Class Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', width: '90px' }}>Chủ nhiệm Lớp:</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedClass('All')}
              className={`btn ${selectedClass === 'All' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
            >
              Tất cả Lớp
            </button>
            {getClassOptions().map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`btn ${selectedClass === cls ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
              >
                Lớp {cls}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="premium-table">
          <thead>
            <tr>
              <th>Mã GV</th>
              <th>Ảnh</th>
              <th>Họ và Tên</th>
              <th>Môn phụ trách</th>
              <th>Hòm thư liên hệ</th>
              <th>Số điện thoại</th>
              <th>Lớp chủ nhiệm</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  Không tìm thấy giáo viên nào chủ nhiệm bộ lọc này.
                </td>
              </tr>
            ) : (
              filteredTeachers.map(t => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{t.id}</td>
                  <td>
                    <img 
                      src={t.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80'} 
                      alt={t.name} 
                      style={{ 
                        width: '38px', 
                        height: '38px', 
                        borderRadius: '50%', 
                        objectFit: 'cover', 
                        border: '2px solid rgba(79, 70, 229, 0.1)'
                      }} 
                    />
                  </td>
                  <td style={{ fontWeight: 600 }}>{t.name}</td>
                  <td><span className="badge badge-info">{t.subject}</span></td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Mail size={12} /> {t.email}</span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }}><Phone size={12} /> {t.phone}</span>
                  </td>
                  <td><span className="badge badge-success">{t.classJoined || 'Tự do'}</span></td>
                  <td>
                    <span className="badge badge-success" style={{ gap: '2px' }}>
                      <ShieldCheck size={12} /> Đang công tác
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;
