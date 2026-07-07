import { useState, useContext, useCallback, useMemo } from 'react';
import {
  LayoutGrid,
  Shuffle,
  Printer,
  User,
  BookOpen,
  ArrowLeftRight,
  Info,
  Star,
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

/* ─────────────────────────────────────────────
   Seat Card
───────────────────────────────────────────── */
function SeatCard({ seat, isSelected, onClick, onDragStart, onDragEnd, onDragOver, onDrop, isDraggedOver, isHighlighted, readOnly }) {
  const { student } = seat;
  const isEmpty = !student;

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
  } else if (isDraggedOver) {
    borderColor = 'var(--accent-secondary, #10b981)';
    bg = 'rgba(16,185,129,0.15)';
    glowStyle = { boxShadow: '0 0 0 4px rgba(16,185,129,0.35)', transform: 'scale(1.02)' };
  } else if (isEmpty) {
    borderColor = 'rgba(255,255,255,0.08)';
    bg = 'transparent';
  }

  return (
    <div
      draggable={!isEmpty && !readOnly}
      onDragStart={readOnly ? undefined : (e) => onDragStart(e, seat.index)}
      onDragEnd={readOnly ? undefined : onDragEnd}
      onDragOver={readOnly ? undefined : (e) => onDragOver(e, seat.index)}
      onDrop={readOnly ? undefined : (e) => onDrop(e, seat.index)}
      onClick={readOnly ? undefined : () => onClick(seat.index)}
      style={{
        width: '100%',
        aspectRatio: '3/2',
        borderRadius: 12,
        border: `2px ${isEmpty ? 'dashed' : 'solid'} ${borderColor}`,
        background: bg,
        cursor: readOnly ? 'default' : (isEmpty ? 'default' : 'grab'),
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6px 4px',
        transition: 'all 0.18s ease',
        position: 'relative',
        overflow: 'hidden',
        userSelect: 'none',
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
            {student.name}
          </span>
          {/* ID */}
          <span style={{ fontSize: 9, color: 'var(--text-secondary)', marginTop: 1 }}>
            {student.id}
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
  const isReadOnly = readOnly || currentRole === 'student' || currentRole === 'parent';
  const activeStudent = contextStudents?.find(s => s.id === selectedStudentId);
  const effectiveFixedClass = fixedClass || (isReadOnly && activeStudent ? activeStudent.class : null);
  const effectiveHighlightId = highlightStudentId || (isReadOnly ? selectedStudentId : null);

  const [selectedClass, setSelectedClass] = useState(effectiveFixedClass || CLASS_LIST[0]);
  const [selectedSeat, setSelectedSeat] = useState(null); // index | null
  const [draggedSeat, setDraggedSeat] = useState(null); // index | null
  const [dragOverSeat, setDragOverSeat] = useState(null); // index | null

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
    if (changed) {
      setTimeout(() => setSeatingCharts(charts), 0);
    }
    return charts;
  }, [seatingCharts, contextStudents, setSeatingCharts]);

  const seatsByClass = activeCharts;
  const setSeatsByClass = setSeatingCharts;
  const [swapCount, setSwapCount] = useState(0);

  const seats = useMemo(() => seatsByClass[selectedClass] ?? [], [seatsByClass, selectedClass]);

  const swapSeats = useCallback((prev, index) => {
    setSeatsByClass(map => {
      const cls = selectedClass;
      const newSeats = [...map[cls]];
      const tmp = newSeats[prev].student;
      newSeats[prev] = { ...newSeats[prev], student: newSeats[index].student };
      newSeats[index] = { ...newSeats[index], student: tmp };
      return { ...map, [cls]: newSeats };
    });
    setSwapCount(c => c + 1);
  }, [selectedClass, setSeatsByClass]);

  /* Handle seat click: first click selects, second click swaps */
  const handleSeatClick = useCallback((index) => {
    setSelectedSeat(prev => {
      if (prev === null) return index;
      if (prev === index) return null; // deselect same
      // Swap
      swapSeats(prev, index);
      return null;
    });
  }, [swapSeats]);

  const handleDragStart = useCallback((e, index) => {
    setDraggedSeat(index);
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedSeat(null);
    setDragOverSeat(null);
  }, []);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    setDragOverSeat(index);
  }, []);

  const handleDrop = useCallback((e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = draggedSeat;
    if (sourceIndex !== null && sourceIndex !== targetIndex) {
      swapSeats(sourceIndex, targetIndex);
    }
    setDraggedSeat(null);
    setDragOverSeat(null);
  }, [draggedSeat, swapSeats]);

  /* Shuffle all students in current class */
  const handleShuffle = useCallback(() => {
    setSeatsByClass(map => {
      const cls = selectedClass;
      const students = map[cls].map(s => s.student).filter(Boolean);
      const shuffled = shuffle(students);
      const newSeats = map[cls].map((seat, i) => ({
        ...seat,
        student: shuffled[i] ?? null,
      }));
      return { ...map, [cls]: newSeats };
    });
    setSelectedSeat(null);
  }, [selectedClass, setSeatsByClass]);

  /* Class change */
  const handleClassChange = useCallback((cls) => {
    setSelectedClass(cls);
    setSelectedSeat(null);
  }, []);

  /* Stats */
  const totalStudents = useMemo(() => seats.filter(s => s.student).length, [seats]);
  const emptySeats = TOTAL_SEATS - totalStudents;

  const printStyles = `
    @media print {
      body * { visibility: hidden !important; }
      #seating-print-area, #seating-print-area * { visibility: visible !important; }
      #seating-print-area { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; }
      .no-print { display: none !important; }
    }
  `;

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
                {swapCount > 0 && ` · ${swapCount} lần hoán đổi`}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Class selector */}
            <div style={{ display: 'flex', gap: 6 }}>
              {CLASS_LIST.map(cls => (
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

            {!isReadOnly && (
              <button className="btn btn-secondary" onClick={handleShuffle} title="Xếp ngẫu nhiên">
                <Shuffle size={15} />
                Xếp ngẫu nhiên
              </button>
            )}

            {!isReadOnly && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  alert(`Đã lưu sơ đồ chỗ ngồi của lớp ${selectedClass} vào cấu hình hệ thống thành công!`);
                }}
                style={{ background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', fontWeight: 700 }}
                title="Lưu sơ đồ hiện tại"
              >
                Lưu sơ đồ
              </button>
            )}

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
                readOnly={isReadOnly}
                onClick={handleSeatClick}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                isDraggedOver={dragOverSeat === seat.index && draggedSeat !== seat.index}
              />
            ))}
          </div>
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
          {isReadOnly ? (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: '#f59e0b', fontSize: 12 }}>
              <Star size={12} />
              Chỗ ngồi của {currentRole === 'parent' ? 'con bạn' : 'bạn'} được đánh dấu ngôi sao
            </div>
          ) : (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-secondary)', fontSize: 12 }}>
              <Info size={12} />
              Nhấp ghế để chọn · Nhấp ghế thứ hai để hoán đổi
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
