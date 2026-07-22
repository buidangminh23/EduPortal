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
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

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
    { id: 'tutor', label: 'AI Tutor', icon: Sparkles },
    { id: 'exam_repository', label: 'Kho đề', icon: ClipboardList },
    { id: 'study_group', label: 'Học nhóm', icon: Users },
  ],
  parent: [
    { id: 'chat', label: 'Nhắn GV', icon: MessageCircle },
    { id: 'meeting_booking', label: 'Lịch hẹn', icon: CalendarDays },
    { id: 'seating_chart', label: 'Chỗ ngồi', icon: Layers },
  ],
};

export default function AppCommandDock({ activeTab, setActiveTab }) {
  const { currentRole, notifications } = useContext(AppContext);

  const actions = useMemo(() => {
    const merged = [...COMMON_ACTIONS, ...(ROLE_ACTIONS[currentRole] ?? [])];
    const unique = new Map();
    merged.forEach(action => unique.set(action.id, action));
    return [...unique.values()].slice(0, 6);
  }, [currentRole]);

  const unread = notifications
    ? notifications.filter(n => !n.read && (n.targetRole === 'all' || n.targetRole === currentRole)).length
    : 0;

  return (
    <div className="app-command-dock no-print" aria-label="Điều hướng nhanh">
      {actions.map(action => {
        const Icon = action.icon;
        const active = activeTab === action.id;
        return (
          <button
            key={action.id}
            type="button"
            className={`dock-action ${active ? 'active' : ''}`}
            onClick={() => setActiveTab(action.id)}
            title={action.label}
            aria-label={action.label}
          >
            <Icon size={18} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
