import { useState, useContext, useEffect, lazy, Suspense } from 'react';
import { AppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import AppCommandDock from './components/AppCommandDock';
import StoreErrorBanner from './components/StoreErrorBanner';
import UnconfiguredScreen from './components/UnconfiguredScreen';
import SchoolSsoScreen from './components/SchoolSsoScreen';
import { isUnconfigured } from './lib/appMode';
import { hasSchoolToken } from './lib/schoolSso';
import { ShieldCheck, Mail, Phone, Trophy, Search, X, Eye, Menu } from 'lucide-react';

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
const CameraWallTab = lazy(() => import('./components/admin/CameraWallTab'));
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
const CasioFX580 = lazy(() => import('./components/CasioFX580'));
const CasioFloatingWidget = lazy(() => import('./components/CasioFloatingWidget'));
const ClassComparison = lazy(() => import('./components/ClassComparison'));
const SchoolGallery = lazy(() => import('./components/SchoolGallery'));

function App() {
  const { currentRole, userSession } = useContext(AppContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLogin, setShowLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Whether this page load arrived from the school's website, decided once. The
  // token is scrubbed from the address bar as soon as it is spent, so reading
  // the URL on every render would flip this to false mid-exchange and drop the
  // teacher on the landing page while their session was still being opened.
  const [arrivedFromSchool] = useState(() => hasSchoolToken());

  // Reset tab on role switch
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveTab('dashboard');
    }, 0);
    return () => clearTimeout(timer);
  }, [currentRole]);

  // Escape closes the mobile navigation drawer
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen]);

  // A build that was given neither a database nor an explicit demo flag stops
  // here, before it can offer anyone a login screen it cannot honour.
  if (isUnconfigured) {
    return <UnconfiguredScreen />;
  }

  // If no active session, render the LandingPage or Login Portal
  if (!userSession) {
    // A teacher walking over from the school's website never sees the login
    // screen: they signed in there a moment ago, and asking again is the whole
    // thing this was built to avoid.
    if (arrivedFromSchool) {
      return <SchoolSsoScreen />;
    }
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
    if (activeTab === 'casio580') {
      return <CasioFX580 />;
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
    if (activeTab === 'essay_grader' && (currentRole === 'student' || currentRole?.startsWith('teacher') || currentRole === 'admin')) {
      return <EssayGrader />;
    }
    if (activeTab === 'bus_tracker' && (currentRole === 'student' || currentRole === 'parent' || currentRole === 'admin' || currentRole?.startsWith('teacher'))) {
      return <BusTracker />;
    }
    if (activeTab === 'portfolio' && (currentRole === 'student' || currentRole === 'admin' || currentRole?.startsWith('teacher'))) {
      return <PortfolioBuilder />;
    }
    if (activeTab === 'timetable_generator' && (currentRole === 'admin' || currentRole?.startsWith('teacher'))) {
      return <TimetableGenerator />;
    }


    // 1. BAN GIÁM HIỆU
    if (currentRole === 'admin') {
      switch (activeTab) {
        case 'dashboard':
          return <PrincipalDashboard setActiveTab={setActiveTab} />;
        case 'students':
          return <AdminStudentManager />;
        case 'teachers':
          return <AdminTeacherManager />;
        case 'journal':
          return <ClassJournal />;
        case 'duty_schedule':
          return <DutySchedule />;
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
        // Ban Giám Hiệu only, and enforced on the school's server as well —
        // this branch is reachable by role, not by permission.
        case 'camera_wall':
          return <CameraWallTab />;
        case 'asset_manager':
          return <AssetManager />;
        default:
          return <PrincipalDashboard setActiveTab={setActiveTab} />;
      }
    }
    
    // 2. GIÁO VIÊN
    if (currentRole === 'teacher' || currentRole?.startsWith('teacher')) {
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
        case 'seating_chart':
          return <SeatingChart />;
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
        case 'seating_chart':
          return <SeatingChart />;
        default:
          return <ParentHub activeTab={activeTab} setActiveTab={setActiveTab} />;
      }
    }

    return <div>Không tìm thấy nội dung.</div>;
  };

  return (
    <div className="app-container" data-role={currentRole} data-active-tab={activeTab}>
      {/* Mobile drawer toggle — stays reachable while the sidebar is off-canvas */}
      <button
        className="sidebar-toggle no-print"
        onClick={() => setSidebarOpen(open => !open)}
        aria-label={sidebarOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
        aria-expanded={sidebarOpen}
        aria-controls="app-sidebar"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {sidebarOpen && (
        <button
          className="sidebar-scrim no-print"
          onClick={() => setSidebarOpen(false)}
          aria-label="Đóng menu điều hướng"
        />
      )}

      {/* Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <div className="main-content">
        {/* Header / Navbar */}
        <Navbar setActiveTab={setActiveTab} />
        
        {/* Main Content Viewport */}
        <main className="content-pane">
          <StoreErrorBanner />
          {/* Inside the pane, above the content it belongs to. It used to be a
              sibling of this whole layout and positioned fixed, which put it on
              top of the first 60px of every page — nothing reserved the space,
              so the text simply passed underneath it as you scrolled. */}
          <AppCommandDock activeTab={activeTab} setActiveTab={setActiveTab} />
          <Suspense fallback={<AppLoadingState />}>
            {renderTabContent()}
          </Suspense>
        </main>
      </div>

      {/* Floating AI Chat Widget — chỉ hiện với học sinh */}
      <Suspense fallback={null}>
        <FloatingChatWidget />
      </Suspense>

      {/* Floating Casio fx-580 Emulator Widget */}
      <Suspense fallback={null}>
        <CasioFloatingWidget />
      </Suspense>
    </div>
  );
}

function AppLoadingState() {
  return (
    <div className="app-loading-state">
      <div className="loading-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <strong>Đang mở không gian làm việc</strong>
        <p>Chuẩn bị dữ liệu và giao diện phù hợp với vai trò hiện tại.</p>
      </div>
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



const removeVietnameseTones = (str) => {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
};

// Sub-component: Student profile table for Admin/BGH view with Smart Search
function AdminStudentManager() {
  const { students, addStudent } = useContext(AppContext);
  const [showAdd, setShowAdd] = useState(false);
  const [newStd, setNewStd] = useState({ name: '', class: '12A1', parentName: '', parentPhone: '' });
  
  // Smart Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('All'); // All, 12, 11, 10
  const [selectedClass, setSelectedClass] = useState('All'); // All, 12A1, 12A2, 11A1, 10A1
  const [gpaFilter, setGpaFilter] = useState('All'); // All, xuatsac, gioi, kha, at_risk
  const [feeFilter, setFeeFilter] = useState('All'); // All, paid, unpaid
  const [selectedStudentDetail, setSelectedStudentDetail] = useState(null);

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

    // Calculate GPA
    const grades = Object.values(s.grades || {});
    const avg = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length) : 0;
    
    let matchGpa = true;
    if (gpaFilter === 'xuatsac') matchGpa = avg >= 9.0;
    else if (gpaFilter === 'gioi') matchGpa = avg >= 8.0 && avg < 9.0;
    else if (gpaFilter === 'kha') matchGpa = avg >= 6.5 && avg < 8.0;
    else if (gpaFilter === 'at_risk') matchGpa = avg < 6.5;

    // Fee Status match
    const unpaidCount = s.feeStatus ? s.feeStatus.filter(f => !f.paid).length : 0;
    let matchFee = true;
    if (feeFilter === 'paid') matchFee = unpaidCount === 0;
    else if (feeFilter === 'unpaid') matchFee = unpaidCount > 0;

    // Smart Text Search
    let matchSearch = true;
    if (searchQuery.trim()) {
      const q = removeVietnameseTones(searchQuery.trim());
      const nameMatch = removeVietnameseTones(s.name).includes(q);
      const idMatch = removeVietnameseTones(s.id).includes(q);
      const parentMatch = removeVietnameseTones(s.parentName || '').includes(q);
      const phoneMatch = (s.parentPhone || '').includes(q);
      const classMatch = removeVietnameseTones(s.class || '').includes(q);

      matchSearch = nameMatch || idMatch || parentMatch || phoneMatch || classMatch;
    }

    return matchGrade && matchClass && matchGpa && matchFee && matchSearch;
  });

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedGrade('All');
    setSelectedClass('All');
    setGpaFilter('All');
    setFeeFilter('All');
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>Hồ Sơ Học Sinh Toàn Trường</span>
            <span className="badge badge-info" style={{ borderRadius: '12px', fontSize: '0.8rem', padding: '4px 10px' }}>
              {filteredStudents.length} / {students.length} học sinh
            </span>
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Danh sách học sinh chính quy trực thuộc hệ thống đào tạo với bộ tìm kiếm thông minh.</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn btn-primary">
          + Thêm Học Sinh Mới
        </button>
      </div>

      {/* Smart Search & Advanced Filters Container */}
      <div style={{ 
        background: 'rgba(79, 70, 229, 0.03)', 
        border: '1px solid rgba(79, 70, 229, 0.1)',
        borderRadius: '16px', 
        padding: '18px', 
        marginBottom: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}>
        {/* Instant Search Bar */}
        <div style={{ position: 'relative', width: '100%' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#6366f1' }} />
          <input
            type="text"
            className="form-control"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="🔍 Tìm kiếm thông minh: Nhập tên học sinh (Nguyễn Hoàng Nam), Mã HS (HS001), Phụ huynh, SĐT..."
            style={{
              paddingLeft: '46px',
              paddingRight: searchQuery ? '40px' : '16px',
              height: '46px',
              borderRadius: '12px',
              border: '1.5px solid rgba(99, 102, 241, 0.3)',
              background: '#fff',
              fontSize: '0.92rem',
              fontWeight: 500,
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.06)'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(0,0,0,0.08)',
                border: 'none',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Multi-criteria Filter Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Grade Filters */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>💥 Chọn Khối</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['All', '12', '11', '10'].map(grade => (
                <button
                  key={grade}
                  onClick={() => handleGradeChange(grade)}
                  className={`btn ${selectedGrade === grade ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '16px' }}
                >
                  {grade === 'All' ? 'Tất cả' : `Khối ${grade}`}
                </button>
              ))}
            </div>
          </div>

          {/* Class Filters */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>🏫 Chọn Lớp</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setSelectedClass('All')}
                className={`btn ${selectedClass === 'All' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '16px' }}
              >
                Tất cả Lớp
              </button>
              {getClassOptions().map(cls => (
                <button
                  key={cls}
                  onClick={() => setSelectedClass(cls)}
                  className={`btn ${selectedClass === cls ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '4px 12px', fontSize: '0.78rem', borderRadius: '16px' }}
                >
                  Lớp {cls}
                </button>
              ))}
            </div>
          </div>

          {/* GPA Filter */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>⭐ Lọc Học Lực / Điểm TB</div>
            <select
              value={gpaFilter}
              onChange={e => setGpaFilter(e.target.value)}
              className="form-control"
              style={{
                height: '42px',
                padding: '0 12px',
                lineHeight: '42px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1e293b',
                borderRadius: '12px',
                background: '#fff',
                border: '1.5px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              <option value="All">Tất cả điểm số</option>
              <option value="xuatsac">🌟 Xuất sắc (&gt;= 9.0)</option>
              <option value="gioi">🎓 Giỏi (8.0 - 8.9)</option>
              <option value="kha">📈 Khá (6.5 - 7.9)</option>
              <option value="at_risk">⚠️ Cần hỗ trợ (&lt; 6.5)</option>
            </select>
          </div>

          {/* Fee Filter */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>💳 Trạng Thái Học Phí</div>
            <select
              value={feeFilter}
              onChange={e => setFeeFilter(e.target.value)}
              className="form-control"
              style={{
                height: '42px',
                padding: '0 12px',
                lineHeight: '42px',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#1e293b',
                borderRadius: '12px',
                background: '#fff',
                border: '1.5px solid rgba(99, 102, 241, 0.25)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
              }}
            >
              <option value="All">Tất cả trạng thái</option>
              <option value="paid">✅ Đã hoàn thành học phí</option>
              <option value="unpaid">⚠️ Còn nợ học phí</option>
            </select>
          </div>
        </div>

        {/* Reset Filter Action */}
        {(searchQuery || selectedGrade !== 'All' || selectedClass !== 'All' || gpaFilter !== 'All' || feeFilter !== 'All') && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={resetFilters} className="btn" style={{ fontSize: '0.78rem', color: '#ef4444', background: 'rgba(239,68,68,0.08)', fontWeight: 600 }}>
              ✕ Xóa tất cả bộ lọc
            </button>
          </div>
        )}
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
              <th style={{ textAlign: 'center' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '6px' }}>🔍 Không tìm thấy kết quả phù hợp</div>
                  <div style={{ fontSize: '0.85rem' }}>Thử tìm từ khóa khác hoặc bấm <strong>"Xóa tất cả bộ lọc"</strong>.</div>
                </td>
              </tr>
            ) : (
              filteredStudents.map(s => {
                const grades = Object.values(s.grades);
                const avg = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(2);
                const unpaidCount = s.feeStatus.filter(f => !f.paid).length;
                return (
                  <tr key={s.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedStudentDetail(s)}>
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
                    <td style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedStudentDetail(s)}
                        className="btn"
                        style={{ padding: '6px 10px', background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Eye size={14} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal: Xem Hồ Sơ Chi Tiết Học Sinh */}
      {selectedStudentDetail && (
        <div className="modal-overlay" onClick={() => setSelectedStudentDetail(null)}>
          <div className="modal-content animate-fade" style={{ background: 'white', maxWidth: '640px', width: '90%', borderRadius: '20px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={selectedStudentDetail.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'}
                  alt={selectedStudentDetail.name}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#1e293b' }}>{selectedStudentDetail.name}</h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', display: 'flex', gap: '8px', marginTop: '2px' }}>
                    <span>Mã HS: <strong>{selectedStudentDetail.id}</strong></span>
                    <span>•</span>
                    <span>Lớp: <strong>{selectedStudentDetail.class}</strong></span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedStudentDetail(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                <X size={16} />
              </button>
            </div>

            {/* Content Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Grades Table */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Trophy size={16} style={{ color: '#eab308' }} /> Bảng Điểm Các Môn Học
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                  {Object.entries(selectedStudentDetail.grades || {}).map(([subject, score]) => (
                    <div key={subject} style={{ background: '#fff', borderRadius: '8px', padding: '8px 12px', border: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{subject}</div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: score >= 8 ? '#10b981' : score >= 6.5 ? '#3b82f6' : '#ef4444' }}>{score}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Parent Info */}
              <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Phụ huynh bảo hộ</div>
                  <div style={{ fontWeight: 700, color: '#1e293b' }}>{selectedStudentDetail.parentName}</div>
                  <div style={{ fontSize: '0.85rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <Phone size={12} /> {selectedStudentDetail.parentPhone}
                  </div>
                </div>
                <a href={`tel:${selectedStudentDetail.parentPhone}`} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.8rem', textDecoration: 'none' }}>
                  📞 Liên hệ ngay
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button onClick={() => setSelectedStudentDetail(null)} className="btn btn-secondary" style={{ padding: '8px 20px' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

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
