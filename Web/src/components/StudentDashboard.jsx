import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
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
import StudyPlanTab from './student/StudyPlanTab';
import ClassChatRoom from './ClassChatRoom';
import MiniTournament from './MiniTournament';
import OverviewTab from './student/OverviewTab';
import CounselingTab from './student/CounselingTab';
import UniversityMatchmakerTab from './student/UniversityMatchmakerTab';
import CasioFX580 from './CasioFX580';

export default function StudentDashboard({ setActiveTab }) {
  const { currentRole, studentSubTab, setStudentSubTab, selectedStudentId, students } = useContext(AppContext);

  const subTab = studentSubTab;
  const setSubTab = setStudentSubTab;
  const isStudent = currentRole === 'student';
  const student = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  if (!student) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Không tìm thấy thông tin học sinh</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade">
      {subTab === 'deadlines' && <DeadlinesTab student={student} />}
      {subTab === 'mock_exams' && <MockExamTab student={student} />}
      {subTab === 'overview' && <OverviewTab student={student} setActiveTab={setActiveTab} />}
      {subTab === 'study_plan' && <StudyPlanTab />}
      {subTab === 'class_chat' && <ClassChatRoom />}
      {subTab === 'tournament' && <MiniTournament />}
      {subTab === 'ai_advisor' && <AiAdvisorTab />}
      {subTab === 'attendance' && <AttendanceTab student={student} />}
      {subTab === 'conduct' && <ConductTab student={student} />}
      {subTab === 'assignments' && <AssignmentsTab student={student} />}
      {subTab === 'library' && <LibraryTab student={student} />}
      {subTab === 'clubs' && <ClubsTab student={student} />}
      {subTab === 'counseling' && isStudent && <CounselingTab student={student} />}
      {subTab === 'university_matchmaker' && <UniversityMatchmakerTab student={student} />}
      {subTab === 'evaluations' && <EvaluationsTab student={student} />}
      {subTab === 'cafeteria' && <CafeteriaTab student={student} />}
      {subTab === 'competency_heatmap' && <CompetencyHeatmapTab setSubTab={setSubTab} />}
      {subTab === 'wallet_id' && <WalletIdTab student={student} />}
      {subTab === 'casio580' && <CasioFX580 />}
    </div>
  );
}
