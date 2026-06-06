import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  Sparkles,
} from 'lucide-react';
import MockExamTab from './student/MockExamTab';
import AttendanceTab from './student/AttendanceTab';
import ConductTab from './student/ConductTab';
import DeadlinesTab from './student/DeadlinesTab';
import EvaluationsTab from './student/EvaluationsTab';
import CafeteriaTab from './student/CafeteriaTab';
import CompetencyHeatmapTab from './student/CompetencyHeatmapTab';
import WalletIdTab from './student/WalletIdTab';
import AssignmentsTab from './student/AssignmentsTab';
import LibraryTab from './student/LibraryTab';
import ClubsTab from './student/ClubsTab';
import AiAdvisorTab from './student/AiAdvisorTab';
import OverviewTab from './student/OverviewTab';
import CounselingTab from './student/CounselingTab';



export default function StudentDashboard({ setActiveTab }) {
  const { 
    currentRole,
    studentSubTab,
    setStudentSubTab,
    selectedStudentId, 
    students, 
    conductLogs,
  } = useContext(AppContext);

  // Use shared subTab from context (controlled by Sidebar)
  const subTab = studentSubTab;
  const setSubTab = setStudentSubTab;

  const isStudent = currentRole === 'student';
  // Active student lookup (must be safe in hook initializers)
  const student = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  if (!student) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Không tìm thấy thông tin học sinh</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }
  // Conduct points
  const studentConductLogs = conductLogs ? conductLogs.filter(l => l.studentId === student.id) : [];
  const conductScore = 100 + studentConductLogs.reduce((acc, curr) => acc + curr.points, 0);
  const conductGrade = conductScore >= 90 ? 'Tốt' : conductScore >= 70 ? 'Khá' : conductScore >= 50 ? 'Trung bình' : 'Yếu';
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
      {subTab === 'deadlines' && <DeadlinesTab student={student} />}

      {/* MOCK UNIVERSITY EXAMS TAB */}
      {subTab === 'mock_exams' && <MockExamTab student={student} />}

      {/* OVERVIEW TAB */}
      {subTab === 'overview' && <OverviewTab student={student} setActiveTab={setActiveTab} />}

      {/* AI STUDY ADVISOR TAB (PART 6) */}
      {subTab === 'ai_advisor' && <AiAdvisorTab />}

      {/* ATTENDANCE TAB (PART 6) */}
      {subTab === 'attendance' && <AttendanceTab student={student} />}

      {/* CONDUCT TAB */}
      {subTab === 'conduct' && <ConductTab student={student} />}

      {/* ASSIGNMENTS TAB */}
      {subTab === 'assignments' && <AssignmentsTab student={student} />}

      {/* DIGITAL LIBRARY & FLASHCARDS (PART 6) */}
      {subTab === 'library' && <LibraryTab student={student} />}

      {/* CLUBS HUB TAB (PART 6) */}
      {subTab === 'clubs' && <ClubsTab student={student} />}

      {/* COUNSELING & CAREER GUIDANCE TAB — chỉ dành cho học sinh */}
      {subTab === 'counseling' && isStudent && <CounselingTab student={student} />}

      {/* SURVEY & EVALUATIONS TAB */}
      {subTab === 'evaluations' && <EvaluationsTab student={student} />}

      {/* SMART CAFETERIA & MENU PLANNER TAB */}
      {subTab === 'cafeteria' && <CafeteriaTab student={student} />}

      {/* AI LEARNING HEATMAP & STUDY PATH TAB */}
      {subTab === 'competency_heatmap' && <CompetencyHeatmapTab setSubTab={setSubTab} />}

      {/* DIGITAL STUDENT ID & CARD WALLET TAB */}
      {subTab === 'wallet_id' && <WalletIdTab student={student} />}
    </div>
  );
}
