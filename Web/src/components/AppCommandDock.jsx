import { useContext, useMemo } from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Megaphone,
  MessageCircle,
  BookOpen,
  Users,
  Layers,
  Sparkles,
  ClipboardList,
  Video,
  Calculator,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

const DOCK_LABELS_EN = {
  dashboard: 'Overview',
  calendar: 'Calendar',
  bulletin: 'School News',
  students: 'Students',
  timetable_generator: 'Timetable',
  ai_risk: 'AI Risk',
  exam_repository: 'Exams',
  essay_grader: 'Grading',
  meet: 'EduMeet',
  seating_chart: 'Seating Chart',
  journal: 'Class Journal',
  duty_schedule: 'Duty Schedule',
  tutor: 'AI Tutor',
  study_group: 'Study Group',
  casio580: 'Casio 580',
  chat: 'Teacher Chat',
  meeting_booking: 'Appointments',
};

const COMMON_ACTIONS = [
  { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { id: 'calendar', label: 'Lịch', icon: CalendarDays },
  { id: 'bulletin', label: 'Tin trường', icon: Megaphone },
];

const ROLE_ACTIONS = {
  admin: [
    { id: 'students', label: 'Học sinh', icon: Users },
    { id: 'timetable_generator', label: 'Xếp TKB', icon: CalendarDays },
    { id: 'ai_risk', label: 'AI Risk', icon: Sparkles },
  ],
  teacher_subject: [
    { id: 'exam_repository', label: 'Kho đề', icon: BookOpen },
    { id: 'essay_grader', label: 'Chấm bài', icon: ClipboardList },
    { id: 'meet', label: 'EduMeet', icon: Video },
  ],
  teacher_homeroom: [
    { id: 'seating_chart', label: 'Sơ đồ', icon: Layers },
    { id: 'journal', label: 'Sổ đầu bài', icon: BookOpen },
    { id: 'duty_schedule', label: 'Lịch trực', icon: CalendarDays },
  ],
  teacher: [
    { id: 'seating_chart', label: 'Sơ đồ', icon: Layers },
    { id: 'exam_repository', label: 'Kho đề', icon: BookOpen },
    { id: 'meet', label: 'EduMeet', icon: Video },
  ],
  student: [
    { id: 'casio580', label: 'Casio 580', icon: Calculator },
    { id: 'tutor', label: 'AI Tutor', icon: Sparkles },
    { id: 'exam_repository', label: 'Kho đề', icon: ClipboardList },
  ],
  parent: [
    { id: 'chat', label: 'Nhắn GV', icon: MessageCircle },
    { id: 'meeting_booking', label: 'Lịch hẹn', icon: CalendarDays },
    { id: 'seating_chart', label: 'Chỗ ngồi', icon: Layers },
  ],
};

export default function AppCommandDock({ activeTab, setActiveTab }) {
  const { currentRole, notifications, t } = useContext(AppContext);

  const actions = useMemo(() => {
    const merged = [...COMMON_ACTIONS, ...(ROLE_ACTIONS[currentRole] ?? [])];
    const unique = new Map();
    merged.forEach(action => unique.set(action.id, action));
    return [...unique.values()].slice(0, 6);
  }, [currentRole]);

  return (
    <div className="app-command-dock no-print" aria-label="Điều hướng nhanh">
      {actions.map(action => {
        const Icon = action.icon;
        const active = activeTab === action.id;
        const displayLabel = t(action.label, DOCK_LABELS_EN[action.id] || action.label);

        return (
          <button
            key={action.id}
            type="button"
            className={`dock-action ${active ? 'active' : ''}`}
            onClick={() => setActiveTab(action.id)}
            title={displayLabel}
            aria-label={displayLabel}
          >
            <Icon size={18} />
            <span>{displayLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
