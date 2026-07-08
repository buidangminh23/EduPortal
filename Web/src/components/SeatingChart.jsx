import { useState, useContext, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  LayoutGrid,
  Shuffle,
  Printer,
  User,
  BookOpen,
  ArrowLeftRight,
  Info,
  Star,
  Save,
  Search,
  Undo2,
  Redo2,
  Lock,
  Unlock,
  RotateCcw,
  SortAsc,
  CheckCircle,
  XCircle,
  MousePointer2,
  Trophy,
} from 'lucide-react';
import { AppContext } from '../context/AppContext';

/* ─────────────────────────────────────────────
   Constants
───────────────────────────────────────────── */
const COLS = 5;
const ROWS = 9;
const TOTAL_SEATS = COLS * ROWS; // 45

const CLASS_LIST = ['12A1', '12A2', '11A1', '10A1'];

/* ─────────────────────────────────────────────
   Mock students per class
   (fallback when AppContext.students is empty)
───────────────────────────────────────────── */
const MOCK_STUDENTS_BY_CLASS = {
  '12A1': [
    { id: 'HS001', name: 'Nguyễn Văn An' },
    { id: 'HS002', name: 'Trần Minh Châu' },
    { id: 'HS003', name: 'Lê Thị Dung' },
    { id: 'HS004', name: 'Phạm Hoàng Đức' },
    { id: 'HS005', name: 'Vũ Ngọc Hà' },
    { id: 'HS006', name: 'Đặng Quang Hùng' },
    { id: 'HS007', name: 'Hoàng Thị Lan' },
    { id: 'HS008', name: 'Bùi Văn Long' },
    { id: 'HS009', name: 'Trịnh Thu Mai' },
    { id: 'HS010', name: 'Ngô Tuấn Nam' },
    { id: 'HS011', name: 'Đinh Thị Nhung' },
    { id: 'HS012', name: 'Lý Văn Phúc' },
    { id: 'HS013', name: 'Cao Thị Quỳnh' },
    { id: 'HS014', name: 'Trương Minh Sơn' },
    { id: 'HS015', name: 'Đỗ Thị Thanh' },
    { id: 'HS016', name: 'Phan Quốc Toàn' },
    { id: 'HS017', name: 'Hồ Thị Uyên' },
    { id: 'HS018', name: 'Lưu Minh Việt' },
    { id: 'HS019', name: 'Dương Thị Xuân' },
    { id: 'HS020', name: 'Tô Văn Yên' },
    { id: 'HS021', name: 'Võ Thị Ánh' },
    { id: 'HS022', name: 'Chu Hoàng Bảo' },
    { id: 'HS023', name: 'Khổng Thị Cẩm' },
    { id: 'HS024', name: 'Mạc Đình Dũng' },
    { id: 'HS025', name: 'Nông Thị Êm' },
    { id: 'HS026', name: 'Ông Minh Phát' },
    { id: 'HS027', name: 'Sầm Thị Giang' },
    { id: 'HS028', name: 'Thạch Văn Hải' },
    { id: 'HS029', name: 'Quách Minh Khải' },
    { id: 'HS030', name: 'Liêu Thị Linh' },
    { id: 'HS031', name: 'Mã Văn Lộc' },
    { id: 'HS032', name: 'Nhan Thị My' },
    { id: 'HS033', name: 'Ổn Minh Nghĩa' },
    { id: 'HS034', name: 'Phu Thị Oanh' },
    { id: 'HS035', name: 'Quốc Minh Phong' },
  ],
  '12A2': [
    { id: 'HS101', name: 'Âu Thị Bích' },
    { id: 'HS102', name: 'Bành Minh Cường' },
    { id: 'HS103', name: 'Cái Thị Diệu' },
    { id: 'HS104', name: 'Đàm Văn Em' },
    { id: 'HS105', name: 'Ếch Thị Phượng' },
    { id: 'HS106', name: 'Giả Minh Giang' },
    { id: 'HS107', name: 'Hứa Thị Hường' },
    { id: 'HS108', name: 'Ích Văn Kha' },
    { id: 'HS109', name: 'Kha Thị Liên' },
    { id: 'HS110', name: 'Long Minh Mạnh' },
    { id: 'HS111', name: 'Mộ Thị Ngân' },
    { id: 'HS112', name: 'Nam Văn Ổn' },
    { id: 'HS113', name: 'Ô Thị Phú' },
    { id: 'HS114', name: 'Phố Minh Quyền' },
    { id: 'HS115', name: 'Quất Thị Rộng' },
    { id: 'HS116', name: 'Rậu Văn Sáng' },
    { id: 'HS117', name: 'Sầm Thị Tâm' },
    { id: 'HS118', name: 'Tân Minh Uy' },
    { id: 'HS119', name: 'Uy Thị Vân' },
    { id: 'HS120', name: 'Vân Văn Xuyên' },
    { id: 'HS121', name: 'Xuân Thị Yến' },
    { id: 'HS122', name: 'Yến Minh Zung' },
    { id: 'HS123', name: 'Ân Thị Bảo' },
    { id: 'HS124', name: 'Bảo Văn Châu' },
    { id: 'HS125', name: 'Châu Thị Đào' },
    { id: 'HS126', name: 'Đào Minh Phúc' },
    { id: 'HS127', name: 'Phúc Thị Hoa' },
    { id: 'HS128', name: 'Hoa Văn Khang' },
    { id: 'HS129', name: 'Khang Thị Lan' },
    { id: 'HS130', name: 'Lan Minh Minh' },
  ],
  '11A1': [
    { id: 'HS201', name: 'Anh Thị Bạch' },
    { id: 'HS202', name: 'Bạch Văn Cẩn' },
    { id: 'HS203', name: 'Cẩn Thị Dịu' },
    { id: 'HS204', name: 'Dịu Minh Enh' },
    { id: 'HS205', name: 'Enh Thị Phép' },
    { id: 'HS206', name: 'Phép Văn Gắng' },
    { id: 'HS207', name: 'Gắng Thị Hạnh' },
    { id: 'HS208', name: 'Hạnh Minh Ích' },
    { id: 'HS209', name: 'Ích Thị Kính' },
    { id: 'HS210', name: 'Kính Văn Lành' },
    { id: 'HS211', name: 'Lành Thị Mến' },
    { id: 'HS212', name: 'Mến Minh Năng' },
    { id: 'HS213', name: 'Năng Thị Ổn' },
    { id: 'HS214', name: 'Ổn Văn Phước' },
    { id: 'HS215', name: 'Phước Thị Quán' },
    { id: 'HS216', name: 'Quán Minh Rộng' },
    { id: 'HS217', name: 'Rộng Thị Sáng' },
    { id: 'HS218', name: 'Sáng Văn Tảo' },
    { id: 'HS219', name: 'Tảo Thị Uyên' },
    { id: 'HS220', name: 'Uyên Minh Vượng' },
    { id: 'HS221', name: 'Vượng Thị Xây' },
    { id: 'HS222', name: 'Xây Văn Yên' },
    { id: 'HS223', name: 'Yên Thị Ân' },
    { id: 'HS224', name: 'Ân Minh Bền' },
    { id: 'HS225', name: 'Bền Thị Cần' },
  ],
  '10A1': [
    { id: 'HS301', name: 'An Thị Bình' },
    { id: 'HS302', name: 'Bình Văn Cao' },
    { id: 'HS303', name: 'Cao Thị Dang' },
    { id: 'HS304', name: 'Dang Minh Ê' },
    { id: 'HS305', name: 'Ê Thị Phong' },
    { id: 'HS306', name: 'Phong Văn Giỏi' },
    { id: 'HS307', name: 'Giỏi Thị Hay' },
    { id: 'HS308', name: 'Hay Minh In' },
    { id: 'HS309', name: 'In Thị Kết' },
    { id: 'HS310', name: 'Kết Văn Lợi' },
    { id: 'HS311', name: 'Lợi Thị Mộng' },
    { id: 'HS312', name: 'Mộng Minh Nhân' },
    { id: 'HS313', name: 'Nhân Thị Ổn' },
    { id: 'HS314', name: 'Ổn Văn Phát' },
    { id: 'HS315', name: 'Phát Thị Quân' },
    { id: 'HS316', name: 'Quân Minh Rõ' },
    { id: 'HS317', name: 'Rõ Thị Sạch' },
    { id: 'HS318', name: 'Sạch Văn Tốt' },
    { id: 'HS319', name: 'Tốt Thị Uy' },
    { id: 'HS320', name: 'Uy Minh Vui' },
    { id: 'HS321', name: 'Vui Thị Xuân' },
    { id: 'HS322', name: 'Xuân Văn Ý' },
  ],
};

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function buildSeats(students) {
  const seats = Array.from({ length: TOTAL_SEATS }, (_, i) => ({
    index: i,
    student: students[i] ?? null,
    locked: false,
  }));
  return seats;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getSeatIndexFromPoint(x, y) {
  const seatEl = document.elementFromPoint(x, y)?.closest?.('[data-seat-index]');
  if (!seatEl) return null;
  const seatIndex = Number(seatEl.dataset.seatIndex);
  return Number.isInteger(seatIndex) ? seatIndex : null;
}

function cloneSeats(seats) {
  return seats.map((seat, index) => ({
    ...seat,
    index,
    locked: !!seat.locked,
    student: seat.student ? { ...seat.student } : null,
  }));
}

function areSeatsEqual(a, b) {
  if (a.length !== b.length) return false;
  return a.every((seat, index) => {
    const next = b[index];
    return (
      seat.student?.id === next.student?.id
      && !!seat.locked === !!next.locked
    );
  });
}

function getStudentAverage(student) {
  const scores = student?.grades
    ? Object.values(student.grades).filter(score => Number.isFinite(score))
    : [];
  if (!scores.length) return null;
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function toSeatStudent(student) {
  if (!student) return null;
  return { id: student.id, name: student.name };
}

/* ─────────────────────────────────────────────
   Seat Card
───────────────────────────────────────────── */
function SeatCard({
  seat,
  isSelected,
  onClick,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  isDraggedOver,
  isDragging,
  isHighlighted,
  isSearchMatch,
  isLocked,
  readOnly,
  privateView,
}) {
  const { student } = seat;
  const isEmpty = !student;
  const canDrag = !isEmpty && !readOnly && !isLocked;
  const isMasked = privateView && !isHighlighted && !!student;
  const displayName = isMasked ? 'Bạn cùng lớp' : student?.name;
  const displayId = isMasked ? `Ghế ${seat.index + 1}` : student?.id;

  let borderColor = 'rgba(255,255,255,0.1)';
  let bg = 'rgba(255,255,255,0.04)';
  let glowStyle = {};

  if (isHighlighted) {
    borderColor = '#f59e0b';
    bg = 'rgba(245,158,11,0.18)';
    glowStyle = { boxShadow: '0 0 0 3px rgba(245,158,11,0.45), 0 0 16px rgba(245,158,11,0.2)', transform: 'scale(1.04)' };
  } else if (isSelected) {
    borderColor = 'var(--accent-primary, #6366f1)';
    bg = 'rgba(99,102,241,0.15)';
    glowStyle = { boxShadow: '0 0 0 3px rgba(99,102,241,0.3)' };
  } else if (isSearchMatch) {
    borderColor = '#0ea5e9';
    bg = 'rgba(14,165,233,0.12)';
    glowStyle = { boxShadow: '0 0 0 3px rgba(14,165,233,0.18)' };
  } else if (isDraggedOver) {
    borderColor = 'var(--accent-secondary, #10b981)';
    bg = 'rgba(16,185,129,0.15)';
    glowStyle = { boxShadow: '0 0 0 4px rgba(16,185,129,0.35)', transform: 'scale(1.02)' };
  } else if (isLocked) {
    borderColor = 'rgba(100,116,139,0.35)';
    bg = 'rgba(100,116,139,0.08)';
  } else if (isEmpty) {
    borderColor = 'rgba(255,255,255,0.08)';
    bg = 'transparent';
  }

  return (
    <div
      data-seat-index={seat.index}
      draggable={canDrag}
      onDragStart={readOnly ? undefined : (e) => onDragStart(e, seat.index)}
      onDragEnd={readOnly ? undefined : onDragEnd}
      onDragOver={readOnly ? undefined : (e) => onDragOver(e, seat.index)}
      onDrop={readOnly ? undefined : (e) => onDrop(e, seat.index)}
      onPointerDown={canDrag ? (e) => onPointerDown(e, seat.index) : undefined}
      onPointerMove={!readOnly ? onPointerMove : undefined}
      onPointerUp={!readOnly ? onPointerUp : undefined}
      onPointerCancel={!readOnly ? onPointerCancel : undefined}
      onClick={readOnly ? undefined : () => onClick(seat.index)}
      aria-label={student ? `Ghế ${seat.index + 1}: ${displayName}` : `Ghế ${seat.index + 1}: Trống`}
      style={{
        width: '100%',
        aspectRatio: '3/2',
        borderRadius: 12,
        border: `2px ${isEmpty ? 'dashed' : 'solid'} ${borderColor}`,
        background: bg,
        cursor: readOnly ? 'default' : (isLocked ? 'not-allowed' : (isDragging ? 'grabbing' : (isEmpty ? 'pointer' : 'grab'))),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 4px',
        transition: 'all 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: readOnly ? 'auto' : 'none',
        opacity: isDragging ? 0.55 : 1,
        willChange: isDragging || isDraggedOver ? 'transform' : 'auto',
        ...glowStyle,
      }}
    >
      {/* Seat number label */}
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: 6,
          fontSize: 9,
          color: 'rgba(255,255,255,0.25)',
          fontWeight: 600,
        }}
      >
        {seat.index + 1}
      </span>

      {isLocked && (
        <span
          title="Ghế đang khóa"
          style={{
            position: 'absolute',
            top: 4,
            right: 6,
            width: 18,
            height: 18,
            borderRadius: 6,
            background: 'rgba(100,116,139,0.14)',
            color: '#64748b',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Lock size={10} />
        </span>
      )}

      {isEmpty ? (
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)' }}>Trống</span>
      ) : (
        <>
          {/* Avatar circle */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: isHighlighted
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : isSelected
                  ? 'var(--accent-primary, #6366f1)'
                  : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
              flexShrink: 0,
            }}
          >
            {isHighlighted ? <Star size={14} color="#fff" /> : <User size={14} color={isSelected || isHighlighted ? '#fff' : 'rgba(255,255,255,0.5)'} />}
          </div>
          {/* Name */}
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: isSelected ? 'var(--accent-primary, #6366f1)' : 'var(--text-primary)',
              textAlign: 'center',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {displayName}
          </span>
          {/* ID */}
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
            {displayId}
          </span>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────── */
export default function SeatingChart({ readOnly = false, fixedClass, highlightStudentId }) {
  const { students: contextStudents, seatingCharts, setSeatingCharts, currentRole, selectedStudentId } = useContext(AppContext);

  // Determine effective readOnly and highlight from context
  const canEditSeatingChart = currentRole === 'admin' || currentRole === 'teacher';
  const isReadOnly = readOnly || !canEditSeatingChart;
  const activeStudent = contextStudents?.find(s => s.id === selectedStudentId);
  const effectiveFixedClass = fixedClass || (isReadOnly && activeStudent ? activeStudent.class : null);
  const effectiveHighlightId = highlightStudentId || (isReadOnly ? selectedStudentId : null);

  const [selectedClass, setSelectedClass] = useState(effectiveFixedClass || CLASS_LIST[0]);
  const [selectedSeat, setSelectedSeat] = useState(null); // index | null
  const [draggedSeat, setDraggedSeat] = useState(null); // index | null
  const [dragOverSeat, setDragOverSeat] = useState(null); // index | null
  const [pointerDrag, setPointerDrag] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [history, setHistory] = useState([]);
  const [future, setFuture] = useState([]);
  const [dirtyClasses, setDirtyClasses] = useState({});
  const [savedAtByClass, setSavedAtByClass] = useState({});
  const [lastAction, setLastAction] = useState('');
  const suppressNextClickRef = useRef(false);
  const draggedSeatRef = useRef(null);
  const pointerDragRef = useRef(null);

  useEffect(() => {
    if (!isReadOnly || !effectiveFixedClass || selectedClass === effectiveFixedClass) return undefined;
    const timer = setTimeout(() => {
      setSelectedClass(effectiveFixedClass);
      setSelectedSeat(null);
      setSearchTerm('');
      setHistory([]);
      setFuture([]);
      setLastAction('');
    }, 0);
    return () => clearTimeout(timer);
  }, [effectiveFixedClass, isReadOnly, selectedClass]);

  // Ensure all classes in CLASS_LIST are initialized in seatingCharts
  const activeCharts = useMemo(() => {
    const charts = { ...seatingCharts };
    let changed = false;
    CLASS_LIST.forEach(cls => {
      if (!charts[cls] || charts[cls].length < TOTAL_SEATS) {
        const src = (contextStudents && contextStudents.length > 0)
          ? contextStudents.filter(s => s.class === cls || s.className === cls)
          : (MOCK_STUDENTS_BY_CLASS[cls] ?? []);
        charts[cls] = buildSeats(src);
        changed = true;
      }
    });
    if (changed && canEditSeatingChart) {
      setTimeout(() => setSeatingCharts(charts), 0);
    }
    return charts;
  }, [canEditSeatingChart, seatingCharts, contextStudents, setSeatingCharts]);

  const seatsByClass = activeCharts;
  const setSeatsByClass = setSeatingCharts;
  const [swapCount, setSwapCount] = useState(0);

  const seats = useMemo(() => seatsByClass[selectedClass] ?? [], [seatsByClass, selectedClass]);
  const classRoster = useMemo(() => {
    if (contextStudents && contextStudents.length > 0) {
      return contextStudents.filter(s => s.class === selectedClass || s.className === selectedClass);
    }
    return MOCK_STUDENTS_BY_CLASS[selectedClass] ?? [];
  }, [contextStudents, selectedClass]);

  const studentProfilesById = useMemo(() => {
    const profiles = new Map();
    classRoster.forEach(student => profiles.set(student.id, student));
    return profiles;
  }, [classRoster]);

  const normalizedSearch = normalizeText(searchTerm.trim());
  const searchMatches = useMemo(() => {
    if (!normalizedSearch) return new Set();
    return new Set(
      seats
        .filter(seat => {
          const student = seat.student;
          if (!student) return false;
          return normalizeText(`${student.name} ${student.id}`).includes(normalizedSearch);
        })
        .map(seat => seat.index)
    );
  }, [normalizedSearch, seats]);

  const searchResults = useMemo(() => (
    normalizedSearch
      ? seats.filter(seat => searchMatches.has(seat.index)).slice(0, 8)
      : []
  ), [normalizedSearch, searchMatches, seats]);

  const selectedSeatData = selectedSeat !== null ? seats[selectedSeat] : null;
  const selectedStudentProfile = selectedSeatData?.student
    ? studentProfilesById.get(selectedSeatData.student.id)
    : null;
  const selectedStudentAverage = getStudentAverage(selectedStudentProfile);
  const lockedSeats = useMemo(() => seats.filter(seat => seat.locked).length, [seats]);
  const classAverage = useMemo(() => {
    const scores = seats
      .map(seat => studentProfilesById.get(seat.student?.id))
      .map(getStudentAverage)
      .filter(score => score !== null);
    if (!scores.length) return null;
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  }, [seats, studentProfilesById]);
  const isDirty = !!dirtyClasses[selectedClass];
  const savedAt = savedAtByClass[selectedClass];

  const commitSeats = useCallback((nextSeats, actionLabel) => {
    const normalizedNextSeats = cloneSeats(nextSeats);
    if (areSeatsEqual(seats, normalizedNextSeats)) return false;

    setHistory(prev => [...prev.slice(-14), { seats: cloneSeats(seats), label: actionLabel }]);
    setFuture([]);
    setSeatsByClass(map => ({ ...map, [selectedClass]: normalizedNextSeats }));
    setDirtyClasses(prev => ({ ...prev, [selectedClass]: true }));
    setLastAction(actionLabel);
    setSwapCount(c => c + 1);
    return true;
  }, [seats, selectedClass, setSeatsByClass]);

  const swapSeats = useCallback((prev, index) => {
    const sourceSeat = seats[prev];
    const targetSeat = seats[index];
    if (!sourceSeat || !targetSeat || sourceSeat.locked || targetSeat.locked) return false;

    const newSeats = cloneSeats(seats);
    const tmp = newSeats[prev].student;
    newSeats[prev] = { ...newSeats[prev], student: newSeats[index].student };
    newSeats[index] = { ...newSeats[index], student: tmp };
    return commitSeats(newSeats, 'Đổi chỗ học sinh');
  }, [commitSeats, seats]);

  /* Handle seat click: first click selects, second click swaps */
  const handleSeatClick = useCallback((index) => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    setSelectedSeat(prev => {
      if (prev === null) return index;
      if (prev === index) return null; // deselect same
      if (seats[prev]?.locked || seats[index]?.locked) return index;
      swapSeats(prev, index);
      return null;
    });
  }, [seats, swapSeats]);

  const handleDragStart = useCallback((e, index) => {
    if (seats[index]?.locked) {
      e.preventDefault();
      return;
    }
    setDraggedSeat(index);
    draggedSeatRef.current = index;
    setSelectedSeat(null);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  }, [seats]);

  const handleDragEnd = useCallback(() => {
    setDraggedSeat(null);
    setDragOverSeat(null);
    setPointerDrag(null);
    draggedSeatRef.current = null;
    pointerDragRef.current = null;
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    if (seats[index]?.locked) {
      e.dataTransfer.dropEffect = 'none';
      setDragOverSeat(null);
      return;
    }
    e.dataTransfer.dropEffect = 'move';
    setDragOverSeat(index);
  }, [seats]);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const transferredIndex = Number(e.dataTransfer.getData('text/plain'));
    const sourceIndex = draggedSeatRef.current ?? draggedSeat ?? (Number.isInteger(transferredIndex) ? transferredIndex : null);
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      swapSeats(sourceIndex, targetIndex);
    }
    setDraggedSeat(null);
    setDragOverSeat(null);
    setPointerDrag(null);
    draggedSeatRef.current = null;
    pointerDragRef.current = null;
  }, [draggedSeat, swapSeats]);

  const handlePointerDragStart = useCallback((e, index) => {
    if (e.button !== undefined && e.button !== 0) return;
    if (seats[index]?.locked) return;

    e.currentTarget.setPointerCapture?.(e.pointerId);
    setSelectedSeat(null);
    const nextDrag = {
      sourceIndex: index,
      targetIndex: index,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      hasMoved: false,
    };
    pointerDragRef.current = nextDrag;
    setPointerDrag(nextDrag);
  }, [seats]);

  const handlePointerDragMove = useCallback((e) => {
    setPointerDrag(prev => {
      const activeDrag = pointerDragRef.current ?? prev;
      if (!activeDrag || activeDrag.pointerId !== e.pointerId) return prev;

      const distance = Math.hypot(e.clientX - activeDrag.startX, e.clientY - activeDrag.startY);
      const hasMoved = activeDrag.hasMoved || distance > 6;
      if (hasMoved && e.cancelable) e.preventDefault();

      const nextDrag = {
        ...activeDrag,
        targetIndex: (() => {
          const targetIndex = getSeatIndexFromPoint(e.clientX, e.clientY);
          return targetIndex !== null && !seats[targetIndex]?.locked ? targetIndex : null;
        })(),
        hasMoved,
      };
      pointerDragRef.current = nextDrag;
      return nextDrag;
    });
  }, [seats]);

  const finishPointerDrag = useCallback((e) => {
    const activeDrag = pointerDragRef.current;
    if (!activeDrag || activeDrag.pointerId !== e.pointerId) return;

    e.currentTarget.releasePointerCapture?.(e.pointerId);

    if (activeDrag.hasMoved) {
      suppressNextClickRef.current = true;
      if (activeDrag.targetIndex !== null && activeDrag.targetIndex !== activeDrag.sourceIndex) {
        swapSeats(activeDrag.sourceIndex, activeDrag.targetIndex);
      }
      setTimeout(() => {
        suppressNextClickRef.current = false;
      }, 0);
    }

    pointerDragRef.current = null;
    setPointerDrag(null);
  }, [swapSeats]);

  const arrangeUnlockedSeats = useCallback((orderedStudents, actionLabel) => {
    const lockedStudentIds = new Set(
      seats
        .filter(seat => seat.locked && seat.student)
        .map(seat => seat.student.id)
    );
    const movableStudents = orderedStudents.filter(student => !lockedStudentIds.has(student.id));
    let cursor = 0;
    const nextSeats = seats.map(seat => (
      seat.locked
        ? { ...seat }
        : { ...seat, student: movableStudents[cursor++] ?? null }
    ));

    commitSeats(nextSeats, actionLabel);
    setSelectedSeat(null);
  }, [commitSeats, seats]);

  const handleShuffle = useCallback(() => {
    const students = seats.map(s => s.student).filter(Boolean);
    arrangeUnlockedSeats(shuffle(students), 'Xếp ngẫu nhiên');
  }, [arrangeUnlockedSeats, seats]);

  const handleArrangeByName = useCallback(() => {
    const students = seats
      .map(s => s.student)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    arrangeUnlockedSeats(students, 'Xếp theo tên A-Z');
  }, [arrangeUnlockedSeats, seats]);

  const handleArrangeById = useCallback(() => {
    const students = seats
      .map(s => s.student)
      .filter(Boolean)
      .sort((a, b) => a.id.localeCompare(b.id, 'vi'));
    arrangeUnlockedSeats(students, 'Xếp theo mã học sinh');
  }, [arrangeUnlockedSeats, seats]);

  const handleArrangeByScore = useCallback(() => {
    const students = seats
      .map(s => s.student)
      .filter(Boolean)
      .sort((a, b) => {
        const scoreA = getStudentAverage(studentProfilesById.get(a.id)) ?? -1;
        const scoreB = getStudentAverage(studentProfilesById.get(b.id)) ?? -1;
        return scoreB - scoreA || a.name.localeCompare(b.name, 'vi');
      });
    arrangeUnlockedSeats(students, 'Xếp theo điểm trung bình');
  }, [arrangeUnlockedSeats, seats, studentProfilesById]);

  const handleSyncRoster = useCallback(() => {
    arrangeUnlockedSeats(classRoster.map(toSeatStudent).filter(Boolean), 'Đồng bộ danh sách lớp');
  }, [arrangeUnlockedSeats, classRoster]);

  const toggleSeatLock = useCallback((index) => {
    const seat = seats[index];
    if (!seat) return;

    const nextSeats = seats.map((item, seatIndex) => (
      seatIndex === index ? { ...item, locked: !item.locked } : item
    ));
    commitSeats(nextSeats, seat.locked ? 'Mở khóa ghế' : 'Khóa ghế');
  }, [commitSeats, seats]);

  const handleUndo = useCallback(() => {
    if (!history.length) return;
    const previous = history[history.length - 1];

    setHistory(prev => prev.slice(0, -1));
    setFuture(prev => [{ seats: cloneSeats(seats), label: lastAction || 'Trạng thái hiện tại' }, ...prev]);
    setSeatsByClass(map => ({ ...map, [selectedClass]: cloneSeats(previous.seats) }));
    setDirtyClasses(prev => ({ ...prev, [selectedClass]: true }));
    setLastAction(`Hoàn tác: ${previous.label}`);
    setSelectedSeat(null);
  }, [history, lastAction, seats, selectedClass, setSeatsByClass]);

  const handleRedo = useCallback(() => {
    if (!future.length) return;
    const next = future[0];

    setFuture(prev => prev.slice(1));
    setHistory(prev => [...prev.slice(-14), { seats: cloneSeats(seats), label: next.label }]);
    setSeatsByClass(map => ({ ...map, [selectedClass]: cloneSeats(next.seats) }));
    setDirtyClasses(prev => ({ ...prev, [selectedClass]: true }));
    setLastAction(`Làm lại: ${next.label}`);
    setSelectedSeat(null);
  }, [future, seats, selectedClass, setSeatsByClass]);

  const handleSave = useCallback(() => {
    setDirtyClasses(prev => ({ ...prev, [selectedClass]: false }));
    setSavedAtByClass(prev => ({
      ...prev,
      [selectedClass]: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    }));
    setLastAction('Đã lưu sơ đồ');
  }, [selectedClass]);

  const handleSearchKeyDown = useCallback((e) => {
    if (e.key !== 'Enter' || searchResults.length === 0) return;
    setSelectedSeat(searchResults[0].index);
  }, [searchResults]);

  /* Class change */
  const handleClassChange = useCallback((cls) => {
    setSelectedClass(cls);
    setSelectedSeat(null);
    setDraggedSeat(null);
    setDragOverSeat(null);
    setPointerDrag(null);
    draggedSeatRef.current = null;
    pointerDragRef.current = null;
    setSearchTerm('');
    setHistory([]);
    setFuture([]);
    setLastAction('');
  }, []);

  /* Stats */
  const totalStudents = useMemo(() => seats.filter(s => s.student).length, [seats]);
  const emptySeats = TOTAL_SEATS - totalStudents;
  const visibleClassList = useMemo(() => (
    isReadOnly && effectiveFixedClass ? [effectiveFixedClass] : CLASS_LIST
  ), [effectiveFixedClass, isReadOnly]);

  const printStyles = `
    @media print {
      body * { visibility: hidden !important; }
      #seating-print-area, #seating-print-area * { visibility: visible !important; }
      #seating-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; }
      .no-print { display: none !important; }
    }
    @media (max-width: 980px) {
      .seating-workspace { grid-template-columns: 1fr !important; }
      .seating-side-panel { order: -1; }
    }
  `;

  if (currentRole === 'parent' && !activeStudent) {
    return (
      <div className="glass-panel animate-fade" style={{ padding: 28, borderRadius: 20, textAlign: 'center' }}>
        <h2 style={{ margin: '0 0 8px', color: 'var(--text-primary)' }}>Chưa liên kết học sinh</h2>
        <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
          Tài khoản phụ huynh này chưa được gắn với hồ sơ học sinh nên không thể xem sơ đồ chỗ ngồi.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <div className="glass-panel animate-fade" style={{ padding: 28, borderRadius: 20 }}>
        {/* ── Header ── */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'linear-gradient(135deg, #10b981, #059669)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(16,185,129,0.4)',
              }}
            >
              <LayoutGrid size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
                Sơ Đồ Chỗ Ngồi
              </h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)' }}>
                {totalStudents} học sinh · {emptySeats} ghế trống
                {lockedSeats > 0 && ` · ${lockedSeats} ghế khóa`}
                {swapCount > 0 && ` · ${swapCount} lượt chỉnh`}
                {!isReadOnly && (isDirty ? ' · Chưa lưu' : savedAt ? ` · Đã lưu ${savedAt}` : '')}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Class selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {visibleClassList.map(cls => (
                <button
                  key={cls}
                  onClick={() => handleClassChange(cls)}
                  className={selectedClass === cls ? 'btn btn-primary' : 'btn btn-secondary'}
                  style={{ fontSize: 13, padding: '7px 14px' }}
                >
                  <BookOpen size={13} />
                  {cls}
                </button>
              ))}
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => window.print()}
              title="Xuất sơ đồ"
            >
              <Printer size={15} />
              Xuất sơ đồ
            </button>
          </div>
        </div>

        {!isReadOnly && (
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 14px',
              marginBottom: 16,
              border: '1px solid rgba(148,163,184,0.22)',
              borderRadius: 14,
              background: 'rgba(255,255,255,0.58)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                position: 'relative',
                flex: '1 1 260px',
                maxWidth: 360,
              }}
            >
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                }}
              />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Tìm tên hoặc mã học sinh..."
                style={{
                  width: '100%',
                  height: 38,
                  border: '1.5px solid rgba(148,163,184,0.35)',
                  borderRadius: 10,
                  padding: '0 38px 0 36px',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  background: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  title="Xóa tìm kiếm"
                  style={{
                    position: 'absolute',
                    right: 9,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 22,
                    height: 22,
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'grid',
                    placeItems: 'center',
                    padding: 0,
                  }}
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <button
                className="icon-btn"
                onClick={handleUndo}
                disabled={!history.length}
                title="Hoàn tác"
                style={{ opacity: history.length ? 1 : 0.45, cursor: history.length ? 'pointer' : 'not-allowed' }}
              >
                <Undo2 size={16} />
              </button>
              <button
                className="icon-btn"
                onClick={handleRedo}
                disabled={!future.length}
                title="Làm lại"
                style={{ opacity: future.length ? 1 : 0.45, cursor: future.length ? 'pointer' : 'not-allowed' }}
              >
                <Redo2 size={16} />
              </button>

              <span style={{ width: 1, height: 28, background: 'rgba(148,163,184,0.28)' }} />

              <button className="btn btn-secondary" onClick={handleShuffle} title="Xếp ngẫu nhiên">
                <Shuffle size={15} />
                Ngẫu nhiên
              </button>
              <button className="btn btn-secondary" onClick={handleArrangeByName} title="Xếp theo tên">
                <SortAsc size={15} />
                A-Z
              </button>
              <button className="btn btn-secondary" onClick={handleArrangeById} title="Xếp theo mã học sinh">
                <BookOpen size={15} />
                Mã HS
              </button>
              <button className="btn btn-secondary" onClick={handleArrangeByScore} title="Ưu tiên học sinh điểm cao phía trước">
                <Trophy size={15} />
                Theo điểm
              </button>
              <button className="btn btn-secondary" onClick={handleSyncRoster} title="Đồng bộ danh sách lớp">
                <RotateCcw size={15} />
                Đồng bộ
              </button>
              <button
                className={isDirty ? 'btn btn-primary' : 'btn btn-secondary'}
                onClick={handleSave}
                style={{ fontWeight: 800 }}
                title="Lưu trạng thái sơ đồ"
              >
                <Save size={15} />
                {isDirty ? 'Lưu sơ đồ' : 'Đã lưu'}
              </button>
            </div>
          </div>
        )}

        {/* ── Instruction Banner ── */}
        {selectedSeat !== null && (
          <div
            className="no-print animate-fade"
            style={{
              background: 'rgba(99,102,241,0.12)',
              border: '1.5px solid rgba(99,102,241,0.3)',
              borderRadius: 10,
              padding: '10px 16px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: 13,
              color: 'var(--accent-primary, #6366f1)',
            }}
          >
            <ArrowLeftRight size={15} />
            <span>
              Đã chọn <strong>{seats[selectedSeat]?.student?.name ?? `Ghế ${selectedSeat + 1}`}</strong>.
              Nhấn vào ghế khác để hoán đổi, hoặc nhấn lại để bỏ chọn.
            </span>
          </div>
        )}

        <div
          className="seating-workspace"
          style={{
            display: 'grid',
            gridTemplateColumns: isReadOnly ? '1fr' : 'minmax(0, 1fr) minmax(280px, 320px)',
            gap: 18,
            alignItems: 'start',
          }}
        >
        {/* ── Printable Area ── */}
        <div id="seating-print-area">

          {/* Class + date info for print */}
          <div style={{ textAlign: 'center', marginBottom: 12, display: 'none' }} className="print-only">
            <h2 style={{ margin: '0 0 4px' }}>Sơ Đồ Chỗ Ngồi Lớp {selectedClass}</h2>
          </div>

          {/* Teacher Desk */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.08))',
              border: '2px solid rgba(16,185,129,0.35)',
              borderRadius: 14,
              padding: '14px 20px',
              textAlign: 'center',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <BookOpen size={18} color="#10b981" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: '#10b981' }}>BÀN GIÁO VIÊN</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Lớp {selectedClass}</div>
            </div>
          </div>

          {/* Column labels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: 8,
              marginBottom: 6,
            }}
            className="no-print"
          >
            {Array.from({ length: COLS }, (_, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>
                Cột {i + 1}
              </div>
            ))}
          </div>

          {/* Seat grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gap: 8,
            }}
          >
            {seats.map(seat => (
              <SeatCard
                key={seat.index}
                seat={seat}
                isSelected={selectedSeat === seat.index}
                isHighlighted={!!(effectiveHighlightId && seat.student && seat.student.id === effectiveHighlightId)}
                isSearchMatch={searchMatches.has(seat.index)}
                isLocked={!!seat.locked}
                readOnly={isReadOnly}
                privateView={currentRole === 'parent'}
                onClick={handleSeatClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onPointerDown={handlePointerDragStart}
                onPointerMove={handlePointerDragMove}
                onPointerUp={finishPointerDrag}
                onPointerCancel={finishPointerDrag}
                isDragging={draggedSeat === seat.index || pointerDrag?.sourceIndex === seat.index}
                isDraggedOver={
                  (dragOverSeat === seat.index && draggedSeat !== seat.index)
                  || (pointerDrag?.targetIndex === seat.index && pointerDrag.sourceIndex !== seat.index)
                }
              />
            ))}
          </div>
        </div>

        {!isReadOnly && (
          <aside
            className="seating-side-panel no-print"
            style={{
              border: '1px solid rgba(148,163,184,0.22)',
              borderRadius: 14,
              padding: 16,
              background: 'rgba(255,255,255,0.64)',
              position: 'sticky',
              top: 88,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>Bảng điều khiển</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                  {lastAction || 'Sẵn sàng chỉnh sơ đồ'}
                </div>
              </div>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 9px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800,
                  color: isDirty ? '#b45309' : '#047857',
                  background: isDirty ? '#fef3c7' : '#dcfce7',
                  whiteSpace: 'nowrap',
                }}
              >
                {isDirty ? <XCircle size={12} /> : <CheckCircle size={12} />}
                {isDirty ? 'Chưa lưu' : 'Đã lưu'}
              </span>
            </div>

            <div style={{ height: 1, background: 'rgba(148,163,184,0.22)', margin: '0 0 14px' }} />

            <section style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>Ghế đang chọn</div>
              {selectedSeatData ? (
                <div
                  style={{
                    border: '1px solid rgba(148,163,184,0.18)',
                    borderRadius: 12,
                    padding: 12,
                    background: '#fff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: selectedSeatData.locked ? '#f1f5f9' : 'var(--accent-soft)',
                        color: selectedSeatData.locked ? '#64748b' : 'var(--accent-ink)',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                      }}
                    >
                      {selectedSeat + 1}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: 'var(--text-primary)' }}>
                        {selectedSeatData.student?.name || 'Ghế trống'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                        {selectedSeatData.student?.id || 'Có thể nhận học sinh khi đồng bộ'}
                      </div>
                    </div>
                  </div>

                  {selectedSeatData.student && (
                    <div style={{ display: 'grid', gap: 8, fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      {selectedStudentProfile?.avatarUrl && (
                        <img
                          src={selectedStudentProfile.avatarUrl}
                          alt={selectedSeatData.student.name}
                          style={{
                            width: '100%',
                            maxHeight: 112,
                            objectFit: 'cover',
                            borderRadius: 10,
                            border: '1px solid rgba(148,163,184,0.18)',
                          }}
                        />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span>Điểm TB</span>
                        <strong style={{ color: selectedStudentAverage !== null && selectedStudentAverage >= 8 ? '#059669' : 'var(--text-primary)' }}>
                          {selectedStudentAverage !== null ? selectedStudentAverage.toFixed(1) : 'Chưa có'}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                        <span>Phụ huynh</span>
                        <strong style={{ color: 'var(--text-primary)', textAlign: 'right' }}>
                          {selectedStudentProfile?.parentName || 'Chưa có'}
                        </strong>
                      </div>
                    </div>
                  )}

                  <button
                    className="btn btn-secondary"
                    onClick={() => toggleSeatLock(selectedSeat)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {selectedSeatData.locked ? <Unlock size={15} /> : <Lock size={15} />}
                    {selectedSeatData.locked ? 'Mở khóa ghế' : 'Khóa ghế này'}
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    border: '1px dashed rgba(148,163,184,0.35)',
                    borderRadius: 12,
                    padding: 16,
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    display: 'flex',
                    gap: 9,
                    alignItems: 'center',
                    background: 'rgba(248,250,252,0.8)',
                  }}
                >
                  <MousePointer2 size={16} />
                  Chọn một ghế để xem chi tiết và khóa vị trí.
                </div>
              )}
            </section>

            {normalizedSearch && (
              <section style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>
                  Kết quả tìm kiếm ({searchMatches.size})
                </div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {searchResults.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', padding: '8px 0' }}>Không tìm thấy học sinh phù hợp.</div>
                  ) : (
                    searchResults.map(result => (
                      <button
                        key={result.index}
                        type="button"
                        onClick={() => setSelectedSeat(result.index)}
                        style={{
                          border: '1px solid rgba(14,165,233,0.22)',
                          background: selectedSeat === result.index ? 'rgba(14,165,233,0.14)' : '#fff',
                          borderRadius: 10,
                          padding: '8px 10px',
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          gap: 10,
                          color: 'var(--text-primary)',
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: 800 }}>{result.student.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Ghế {result.index + 1}</span>
                      </button>
                    ))
                  )}
                </div>
              </section>
            )}

            <section>
              <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>Tổng quan nhanh</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Điểm TB lớp', value: classAverage !== null ? classAverage.toFixed(1) : '-' },
                  { label: 'Ghế khóa', value: lockedSeats },
                  { label: 'Undo', value: history.length },
                  { label: 'Redo', value: future.length },
                ].map(item => (
                  <div
                    key={item.label}
                    style={{
                      background: '#fff',
                      border: '1px solid rgba(148,163,184,0.18)',
                      borderRadius: 10,
                      padding: '9px 10px',
                    }}
                  >
                    <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text-primary)' }}>{item.value}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontWeight: 700 }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        )}
        </div>

        {/* ── Legend ── */}
        <div
          className="no-print"
          style={{
            display: 'flex', gap: 16, marginTop: 20,
            padding: '12px 16px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 18, borderRadius: 5, border: '2px solid rgba(99,102,241,0.7)', background: 'rgba(99,102,241,0.15)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Đang chọn</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 18, borderRadius: 5, border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Có học sinh</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{ width: 28, height: 18, borderRadius: 5, border: '2px dashed rgba(255,255,255,0.08)', background: 'transparent' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Ghế trống</span>
          </div>
          {!isReadOnly && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 28, height: 18, borderRadius: 5, border: '2px solid #0ea5e9', background: 'rgba(14,165,233,0.12)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Khớp tìm kiếm</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{ width: 28, height: 18, borderRadius: 5, border: '2px solid rgba(100,116,139,0.35)', background: 'rgba(100,116,139,0.08)' }} />
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Đã khóa</span>
              </div>
            </>
          )}
          {isReadOnly ? (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: 12 }}>
              <Star size={12} />
              Chỗ ngồi của {currentRole === 'parent' ? 'con bạn' : 'bạn'} được đánh dấu ngôi sao
            </div>
          ) : (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
              <Info size={12} />
              Kéo thả để đổi chỗ · Nhấp 2 ghế để hoán đổi
            </div>
          )}
        </div>

        {/* ── Mini Stats ── */}
        <div
          className="no-print"
          style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}
        >
          {[
            { label: 'Tổng ghế', value: TOTAL_SEATS, color: '#6366f1' },
            { label: 'Có học sinh', value: totalStudents, color: '#10b981' },
            { label: 'Ghế trống', value: emptySeats, color: '#f59e0b' },
            { label: 'Ghế khóa', value: lockedSeats, color: '#64748b' },
            { label: 'Số cột', value: COLS, color: '#8b5cf6' },
            { label: 'Số hàng', value: ROWS, color: '#ec4899' },
          ].map(item => (
            <div
              key={item.label}
              style={{
                flex: '1 1 100px',
                background: `${item.color}10`,
                border: `1.5px solid ${item.color}25`,
                borderRadius: 10,
                padding: '10px 14px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
