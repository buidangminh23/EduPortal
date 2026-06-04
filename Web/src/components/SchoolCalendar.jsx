import { useState, useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  BookOpen, 
  Filter, 
  DollarSign, 
  X,
  FileText,
  UserCheck
} from 'lucide-react';

export default function SchoolCalendar() {
  const { 
    currentRole, 
    selectedStudentId, 
    students, 
    assignments, 
    submissions,
    leaveRequests,
    lessonPlans
  } = useContext(AppContext);

  // Focus Date: Wednesday June 3, 2026
  const today = new Date(2026, 5, 3);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 3));
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date(2026, 5, 3));
  const [filterType, setFilterType] = useState('all'); // all, schedule, deadline, fee, leave, event

  const activeStudent = students ? (students.find(s => s.id === selectedStudentId) || students[0]) : null;

  // Helper for calendar days grid
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay(); // 0 is Sunday, 1 is Monday
    
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month filler days (greyed out)
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const dayNum = prevMonthTotalDays - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      days.push({
        day: dayNum,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        dateString: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`
      });
    }
    
    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        month: month,
        year: year,
        isCurrentMonth: true,
        dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    // Next month filler days (greyed out)
    const remainingCells = 42 - days.length; // Standard 6-row calendar grid
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      days.push({
        day: i,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        dateString: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      });
    }
    
    return days;
  };

  // Generate static & dynamic events tailored to the current role
  const getEvents = () => {
    const eventList = [];

    // 1. GLOBAL SCHOOL EVENTS (Seen by all roles)
    // Every Monday in June 2026: Chào cờ đầu tuần
    for (let d = 1; d <= 30; d++) {
      const dateVal = new Date(2026, 5, d);
      if (dateVal.getDay() === 1) { // Monday
        eventList.push({
          id: `G-CC-${d}`,
          title: 'Chào cờ đầu tuần',
          time: '07:30 - 08:30',
          date: `2026-06-${String(d).padStart(2, '0')}`,
          type: 'event',
          color: 'indigo',
          desc: 'Nghi lễ chào cờ đầu tuần của trường THPT EduPortal. Yêu cầu học sinh mặc đồng phục chỉnh tề, giáo viên tham gia đầy đủ.'
        });
      }
    }

    // Họp Hội đồng Sư phạm: 2026-06-01
    eventList.push({
      id: 'G-HHD',
      title: 'Họp Hội đồng Sư phạm đầu tháng',
      time: '09:00 - 11:30',
      date: '2026-06-01',
      type: 'event',
      color: 'rose',
      desc: 'Họp toàn thể cán bộ, giáo viên, nhân viên nhà trường nhằm đánh giá hoạt động tháng 5 và triển khai kế hoạch giáo dục tháng 6/2026.'
    });

    // Kỳ thi học kỳ 2 bổ sung: 2026-06-08 -> 2026-06-12 (All days)
    for (let d = 8; d <= 12; d++) {
      eventList.push({
        id: `G-THK-${d}`,
        title: 'Kỳ thi Học kỳ II bổ sung',
        time: '08:00 - 11:30',
        date: `2026-06-${String(d).padStart(2, '0')}`,
        type: 'event',
        color: 'rose',
        desc: 'Tổ chức kiểm tra học kỳ II bổ sung đối với học sinh khối 10, 11 và 12 chưa hoàn thành hoặc cần thi cải thiện điểm.'
      });
    }

    // Họp BGH: 2026-06-25
    eventList.push({
      id: 'G-HBGH',
      title: 'Họp Ban Giám Hiệu tổng kết tháng',
      time: '14:00 - 17:00',
      date: '2026-06-25',
      type: 'event',
      color: 'rose',
      desc: 'Ban giám hiệu họp rà soát kết quả dạy học, công tác tài chính học phí và chuẩn bị cho Lễ bế giảng.'
    });

    // Lễ Bế giảng: 2026-06-30
    eventList.push({
      id: 'G-LBG',
      title: 'Lễ Bế giảng năm học 2025 - 2026',
      time: '08:00 - 11:30',
      date: '2026-06-30',
      type: 'event',
      color: 'rose',
      desc: 'Tổ chức Lễ bế giảng, tuyên dương khen thưởng tập thể lớp xuất sắc và cá nhân học sinh đạt giải học sinh giỏi các cấp.'
    });


    // 2. EVENTS BY ROLE
    // --- STUDENT & PARENT ROLE (Focused on activeStudent) ---
    if (currentRole === 'student' || currentRole === 'parent') {
      const cls = activeStudent?.class || '12A1';

      // Timetable for 12A1:
      // Mon Morning: Math (08:00 - 12:00)
      // Tue Morning: English (09:00 - 12:00)
      // Wed Afternoon: Physics (13:00 - 16:00)
      // Thu Morning: Literature (08:00 - 11:30)
      // Fri Morning: Physics (09:00 - 12:00)
      // Mon Afternoon: Homeroom Class Session (13:00 - 16:00)
      for (let d = 1; d <= 30; d++) {
        const dateVal = new Date(2026, 5, d);
        const dayOfWeek = dateVal.getDay();
        const dateStr = `2026-06-${String(d).padStart(2, '0')}`;

        if (dayOfWeek === 1) { // Mon
          eventList.push({
            id: `T-M-${d}`,
            title: `Học: Toán học - Lớp ${cls}`,
            time: '08:00 - 12:00',
            date: dateStr,
            type: 'schedule',
            color: 'emerald',
            desc: 'Khảo sát hàm số nâng cao & Luyện đề trắc nghiệm thi THPT QG cùng Thầy Nguyễn Minh Triết.'
          });
          eventList.push({
            id: `T-H-${d}`,
            title: `Học: Sinh hoạt lớp - Lớp ${cls}`,
            time: '13:00 - 16:00',
            date: dateStr,
            type: 'schedule',
            color: 'emerald',
            desc: 'Thầy chủ nhiệm nhận xét nề nếp tuần qua, bầu chọn danh hiệu và phổ biến kế hoạch tuần tới.'
          });
        } else if (dayOfWeek === 2) { // Tue
          eventList.push({
            id: `T-E-${d}`,
            title: `Học: Tiếng Anh - Lớp ${cls}`,
            time: '09:00 - 12:00',
            date: dateStr,
            type: 'schedule',
            color: 'emerald',
            desc: 'Luyện đề đọc hiểu, từ vựng và ngữ pháp trọng tâm chuẩn bị thi tốt nghiệp cùng Cô Lê Thu Hà.'
          });
        } else if (dayOfWeek === 3) { // Wed
          eventList.push({
            id: `T-P-${d}`,
            title: `Học: Vật lý - Lớp ${cls}`,
            time: '13:00 - 16:00',
            date: dateStr,
            type: 'schedule',
            color: 'emerald',
            desc: 'Lý thuyết hạt nhân nguyên tử, phóng xạ và giải đề chuyên đề cùng Thầy Phạm Đức Duy.'
          });
        } else if (dayOfWeek === 4) { // Thu
          eventList.push({
            id: `T-L-${d}`,
            title: `Học: Ngữ văn - Lớp ${cls}`,
            time: '08:00 - 11:30',
            date: dateStr,
            type: 'schedule',
            color: 'emerald',
            desc: 'Nghị luận xã hội & Phân tích các tác phẩm trọng điểm học kỳ II cùng Cô Trần Thị Hồng Vân.'
          });
        }
      }

      // Homework assignments deadlines (from context)
      assignments.forEach(assign => {
        if (assign.classTarget === cls) {
          const sub = submissions.find(s => s.assignmentId === assign.id && s.studentId === activeStudent.id);
          const isDone = !!sub;
          eventList.push({
            id: `DL-A-${assign.id}`,
            title: `Hạn nộp: Bài tập ${assign.subject}`,
            time: 'Hạn chót: 23:59',
            date: assign.deadline,
            type: 'deadline',
            color: isDone ? 'sky' : 'amber',
            desc: `Đề bài: ${assign.title}\n\nNội dung: ${assign.content}\n\nTrạng thái con em: ${isDone ? `ĐÃ NỘP bài (${sub.status === 'graded' ? `Đạt ${sub.grade}/10đ` : 'Chờ chấm điểm'})` : 'CHƯA NỘP BÀI'}`
          });
        }
      });

      // Tuition Fee deadlines (from student data)
      activeStudent.feeStatus.forEach(fee => {
        eventList.push({
          id: `F-DL-${fee.id}`,
          title: `${fee.paid ? 'Đã đóng' : 'Hạn nộp'}: ${fee.name}`,
          time: 'Trong ngày',
          date: fee.deadline,
          type: 'fee',
          color: fee.paid ? 'sky' : 'purple',
          desc: `Khoản phí: ${fee.name}\nSố tiền: ${fee.amount.toLocaleString()} VNĐ\n\nTrạng thái: ${fee.paid ? 'Đã nộp học phí thành công.' : 'Chưa nộp tiền. Vui lòng thanh toán qua cổng Phụ huynh trước hạn chót.'}`
        });
      });

      // Approved Leave requests
      leaveRequests.forEach(req => {
        if (req.studentId === activeStudent.id) {
          eventList.push({
            id: `LV-${req.id}`,
            title: `Nghỉ phép: ${req.studentName} (${req.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'})`,
            time: 'Cả ngày',
            date: req.date,
            type: 'leave',
            color: req.status === 'approved' ? 'slate' : 'orange',
            desc: `Lý do xin nghỉ phép học: ${req.reason}`
          });
        }
      });
    }

    // --- TEACHER ROLE (Focused on Thầy Minh Triết) ---
    if (currentRole === 'teacher') {
      // Teaching Timetable (Toán học):
      // Mon Morning: 08:00 - 12:00: Dạy Toán 12A1
      // Mon Afternoon: 13:00 - 16:00: Sinh hoạt lớp chủ nhiệm 12A1
      // Tue Afternoon: 13:00 - 17:00: Dạy Toán Lớp 12A2
      // Wed Morning: 08:00 - 12:00: Dạy Toán 12A1
      // Thu Afternoon: 14:00 - 17:00: Dự giờ chuyên môn bộ môn
      for (let d = 1; d <= 30; d++) {
        const dateVal = new Date(2026, 5, d);
        const dayOfWeek = dateVal.getDay();
        const dateStr = `2026-06-${String(d).padStart(2, '0')}`;

        if (dayOfWeek === 1) { // Mon
          eventList.push({
            id: `TE-12A1-${d}`,
            title: 'Dạy: Toán 12A1',
            time: '08:00 - 12:00',
            date: dateStr,
            type: 'schedule',
            color: 'teal',
            desc: 'Dạy chuyên đề ôn thi tốt nghiệp THPT tại phòng học lớp 12A1.'
          });
          eventList.push({
            id: `TE-SH-${d}`,
            title: 'Sinh hoạt chủ nhiệm: 12A1',
            time: '13:00 - 16:00',
            date: dateStr,
            type: 'schedule',
            color: 'teal',
            desc: 'Tổng kết nề nếp thi đua, xét điểm rèn luyện và duyệt phép tuần vừa qua.'
          });
        } else if (dayOfWeek === 2) { // Tue
          eventList.push({
            id: `TE-12A2-${d}`,
            title: 'Dạy: Toán 12A2',
            time: '13:00 - 17:00',
            date: dateStr,
            type: 'schedule',
            color: 'teal',
            desc: 'Khảo sát đồ thị hàm số và kiểm tra bài cũ 15 phút tại lớp 12A2.'
          });
        } else if (dayOfWeek === 3) { // Wed
          eventList.push({
            id: `TE-12A1W-${d}`,
            title: 'Dạy: Toán 12A1',
            time: '08:00 - 12:00',
            date: dateStr,
            type: 'schedule',
            color: 'teal',
            desc: 'Chữa đề thi trắc nghiệm học kỳ số 6 và ôn tập tích phân từng phần.'
          });
        } else if (dayOfWeek === 4) { // Thu
          eventList.push({
            id: `TE-DG-${d}`,
            title: 'Họp chuyên môn / Dự giờ',
            time: '14:00 - 17:00',
            date: dateStr,
            type: 'schedule',
            color: 'teal',
            desc: 'Tham gia dự giờ tiết học đồng nghiệp và sinh hoạt tổ chuyên môn môn Toán.'
          });
        }
      }

      // Homework grading deadlines (from assignments)
      assignments.forEach(assign => {
        if (assign.teacherName.includes('Triết') || assign.teacherId === 'T01') {
          // Homework grading deadline (usually 3 days after creation / on deadline day)
          const gradingDate = new Date(new Date(assign.deadline).getTime() + 2 * 24 * 60 * 60 * 1000)
            .toISOString().split('T')[0];
          
          const ungradedCount = submissions.filter(s => s.assignmentId === assign.id && s.status === 'submitted').length;

          eventList.push({
            id: `TE-GD-${assign.id}`,
            title: `Hạn chấm điểm: ${assign.title}`,
            time: 'Hạn cuối: 17:00',
            date: gradingDate,
            type: 'deadline',
            color: ungradedCount > 0 ? 'amber' : 'sky',
            desc: `Giao bài ngày: ${assign.dateCreated}\nLớp: ${assign.classTarget}\n\nHiện tại còn ${ungradedCount} bài làm của học sinh đang chờ chấm điểm.`
          });
        }
      });

      // Leave Requests of students in class 12A1 (Teacher is advisor)
      leaveRequests.forEach(req => {
        if (req.class === '12A1') {
          eventList.push({
            id: `TE-LV-${req.id}`,
            title: `Nghỉ phép lớp: ${req.studentName} (${req.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'})`,
            time: 'Vắng cả ngày',
            date: req.date,
            type: 'leave',
            color: req.status === 'approved' ? 'slate' : 'orange',
            desc: `Học sinh lớp chủ nhiệm xin phép nghỉ học.\nLý do: ${req.reason}\n\nTrạng thái: ${req.status.toUpperCase()}`
          });
        }
      });

      // Lesson plans submission deadlines
      lessonPlans.forEach(plan => {
        if (plan.teacherName.includes('Triết')) {
          eventList.push({
            id: `TE-LP-${plan.id}`,
            title: `Kế hoạch giáo án: ${plan.subject}`,
            time: 'Cả ngày',
            date: plan.date,
            type: 'deadline',
            color: plan.status === 'approved' ? 'sky' : 'orange',
            desc: `Tên giáo án: ${plan.title}\nTrạng thái duyệt của Ban Giám Hiệu: ${plan.status.toUpperCase()}\nNhận xét BGH: ${plan.feedback || 'Chưa có phản hồi'}`
          });
        }
      });
    }

    // --- BGH / PRINCIPAL ROLE ---
    if (currentRole === 'admin') {
      // Administrative work deadlines
      // June 5th: Deadline teachers submit lesson plans
      eventList.push({
        id: `AD-LP-DL`,
        title: 'Hạn chót GV nộp giáo án tuần 36',
        time: 'Hạn chót: 17:00',
        date: '2026-06-05',
        type: 'deadline',
        color: 'amber',
        desc: 'Hạn chót để tất cả các tổ chuyên môn bộ môn hoàn thành việc cập nhật kế hoạch bài dạy lên hệ thống.'
      });

      // June 7th: Principal needs to review plans
      eventList.push({
        id: `AD-LP-RV`,
        title: 'Hạn duyệt giáo án toàn trường',
        time: 'Trong ngày',
        date: '2026-06-07',
        type: 'deadline',
        color: 'teal',
        desc: 'Ban giám hiệu tiến hành rà soát, đánh giá chất lượng và phê duyệt các giáo án môn học tuần 36.'
      });

      // June 15th: Tuition fee summary check
      eventList.push({
        id: `AD-FEE-DL`,
        title: 'Hạn chót thu học phí các lớp',
        time: 'Hạn chót: 16:30',
        date: '2026-06-15',
        type: 'fee',
        color: 'purple',
        desc: 'Hạn cuối thu học phí tháng 6/2026. Bộ phận Kế toán tổng hợp danh sách gửi báo cáo về Ban Giám Hiệu.'
      });

      // General class leave stats on calendar
      leaveRequests.forEach(req => {
        eventList.push({
          id: `AD-LV-${req.id}`,
          title: `Đơn nghỉ: ${req.studentName} (${req.class})`,
          time: 'Nghỉ học',
          date: req.date,
          type: 'leave',
          color: 'slate',
          desc: `Lớp: ${req.class}\nHọc sinh: ${req.studentName}\nLý do: ${req.reason}\nTrạng thái: ${req.status}`
        });
      });
    }

    return eventList;
  };

  const allEvents = getEvents();

  // Filter events based on active category filter
  const filteredEvents = allEvents.filter(evt => {
    if (filterType === 'all') return true;
    return evt.type === filterType;
  });

  // Dynamic Navigation Handlers
  const handlePrevMonth = () => {
    const prev = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prev);
  };

  const handleNextMonth = () => {
    const next = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(next);
  };

  const handleGoToday = () => {
    setCurrentDate(today);
    setSelectedDay(today);
  };

  // Day renderer helper
  const monthDays = getDaysInMonth(currentDate);

  // Translate month names to Vietnamese
  const getVnMonthName = (date) => {
    const months = [
      'THÁNG MỘT', 'THÁNG HAI', 'THÁNG BA', 'THÁNG TƯ', 'THÁNG NĂM', 'THÁNG SÁU',
      'THÁNG BẢY', 'THÁNG TÁM', 'THÁNG CHÍN', 'THÁNG MƯỜI', 'THÁNG MƯỜI MỘT', 'THÁNG MƯỜI HAI'
    ];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // Week days formatter
  const weekdaysVn = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  // Color code class names for badges
  const getColorClass = (color) => {
    switch (color) {
      case 'emerald': return 'cal-badge-emerald';
      case 'teal': return 'cal-badge-teal';
      case 'rose': return 'cal-badge-rose';
      case 'indigo': return 'cal-badge-indigo';
      case 'sky': return 'cal-badge-sky';
      case 'amber': return 'cal-badge-amber';
      case 'purple': return 'cal-badge-purple';
      case 'slate': return 'cal-badge-slate';
      case 'orange': return 'cal-badge-orange';
      default: return 'cal-badge-default';
    }
  };

  // Check if a date string represents "today" (2026-06-03)
  const isToday = (dateStr) => {
    const tStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === tStr;
  };

  // Check if date string matches selected day
  const isSelected = (dateStr) => {
    const selStr = `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`;
    return dateStr === selStr;
  };

  // Filter out upcoming deadlines in general timeline
  const deadlinesList = allEvents
    .filter(evt => evt.type === 'deadline' || evt.type === 'fee')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!activeStudent && (currentRole === 'student' || currentRole === 'parent')) {
    return (
      <div className="glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
        <h3>Không tìm thấy thông tin học sinh</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Calendar Header Panel */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '16px',
        borderBottom: '1px solid var(--border-card)',
        paddingBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '42px', 
            height: '42px', 
            borderRadius: '12px', 
            background: 'rgba(99, 102, 241, 0.08)', 
            color: 'var(--accent-primary)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center'
          }}>
            <CalendarIcon size={22} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Thời khóa biểu & Lịch công tác</h1>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Theo dõi lịch giảng dạy, lịch học và mốc thời gian bài tập, học phí
            </p>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="btn-group" style={{ background: 'rgba(0,0,0,0.02)', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
          {[
            { id: 'month', label: 'Tháng' },
            { id: 'week', label: 'Tuần' },
            { id: 'day', label: 'Ngày' }
          ].map(view => (
            <button
              key={view.id}
              onClick={() => setViewMode(view.id)}
              className="btn"
              style={{
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                border: 'none',
                fontWeight: viewMode === view.id ? 600 : 500,
                background: viewMode === view.id ? 'var(--accent-primary)' : 'transparent',
                color: viewMode === view.id ? 'white' : 'var(--text-secondary)',
                boxShadow: viewMode === view.id ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none'
              }}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Row */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        flexWrap: 'wrap',
        background: 'rgba(79, 70, 229, 0.02)', 
        border: '1px solid rgba(79, 70, 229, 0.05)',
        borderRadius: '12px',
        padding: '10px 16px'
      }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} /> Lọc lịch biểu:
        </span>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'Tất cả', color: '#64748b' },
            { id: 'schedule', label: 'Thời khóa biểu', color: '#10b981' },
            { id: 'deadline', label: 'Deadline bài tập', color: '#eab308' },
            { id: 'fee', label: 'Học phí / Quỹ', color: '#a855f7' },
            { id: 'leave', label: 'Lịch nghỉ phép', color: '#f97316' },
            { id: 'event', label: 'Sự kiện trường', color: '#f43f5e' }
          ].map(tag => (
            <button
              key={tag.id}
              onClick={() => setFilterType(tag.id)}
              className="btn"
              style={{
                padding: '4px 10px',
                fontSize: '0.75rem',
                borderRadius: '20px',
                fontWeight: 600,
                border: filterType === tag.id ? `1.5px solid ${tag.color}` : '1px solid rgba(0,0,0,0.08)',
                background: filterType === tag.id ? `${tag.color}0c` : 'white',
                color: filterType === tag.id ? tag.color : 'var(--text-muted)'
              }}
            >
              {tag.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout containing Grid + Sidebar Deadlines */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: The Scheduler view */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid var(--border-card)', padding: '16px', overflow: 'hidden' }}>
          
          {/* Calendar Month Navigation Control bar */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '16px' 
          }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '8px', minWidth: 0, borderRadius: '8px' }}>
                <ChevronLeft size={16} />
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '8px', minWidth: 0, borderRadius: '8px' }}>
                <ChevronRight size={16} />
              </button>
              <button onClick={handleGoToday} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0 12px', borderRadius: '8px' }}>
                Hôm nay
              </button>
            </div>
            
            <h4 style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em' }}>
              {getVnMonthName(currentDate)}
            </h4>

            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              Hôm nay: 03/06/2026
            </div>
          </div>

          {/* Render Calendar based on Selected ViewMode */}
          {viewMode === 'month' && (
            <div>
              {/* Day header row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-secondary)', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                {weekdaysVn.map(wd => (
                  <div key={wd}>{wd}</div>
                ))}
              </div>

              {/* Grid Cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gridAutoRows: '100px', gap: '1px', background: '#e2e8f0', border: '1px solid #e2e8f0', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                {monthDays.map((cell, idx) => {
                  const dayEvents = filteredEvents.filter(evt => evt.date === cell.dateString);
                  const cellIsToday = isToday(cell.dateString);
                  const cellIsSelected = isSelected(new Date(cell.year, cell.month, cell.day));

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedDay(new Date(cell.year, cell.month, cell.day));
                      }}
                      style={{
                        background: cellIsToday ? '#fefcbf' : cellIsSelected ? '#eff6ff' : cell.isCurrentMonth ? '#ffffff' : '#f8fafc',
                        padding: '6px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'background 0.2s',
                        border: cellIsToday ? '1.5px solid #f6e05e' : 'none'
                      }}
                      className="calendar-grid-cell"
                    >
                      {/* Date number */}
                      <span style={{ 
                        fontSize: '0.8rem', 
                        fontWeight: cell.isCurrentMonth ? 600 : 400, 
                        color: cellIsToday ? '#b7791f' : cell.isCurrentMonth ? 'var(--text-primary)' : 'var(--text-muted)',
                        alignSelf: 'flex-end'
                      }}>
                        {cell.day}
                      </span>

                      {/* Badges container */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', flex: 1, paddingRight: '2px' }} className="custom-scroll">
                        {dayEvents.slice(0, 3).map(evt => (
                          <div
                            key={evt.id}
                            onClick={(e) => {
                              e.stopPropagation(); // Avoid triggering cell select
                              setSelectedEvent(evt);
                            }}
                            className={`cal-event-badge ${getColorClass(evt.color)}`}
                            title={evt.title}
                          >
                            <span className="cal-dot"></span>
                            <span className="cal-title">{evt.time.split(' ')[0]} {evt.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600, paddingLeft: '4px' }}>
                            + {dayEvents.length - 3} sự kiện khác
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'week' && (
            <div>
              {/* Display weekly dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', border: '1px solid #f1f5f9', borderRadius: '12px', overflow: 'hidden' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Giờ</div>
                  {['08:00', '10:00', '12:00', '14:00', '16:00'].map(t => (
                    <div key={t} style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', height: '40px' }}>{t}</div>
                  ))}
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {weekdaysVn.map((wd, dayIdx) => {
                    // Calculate day of the week relative to current selectedDay
                    const startOfWeek = new Date(selectedDay);
                    startOfWeek.setDate(selectedDay.getDate() - selectedDay.getDay() + dayIdx);
                    
                    const dateStr = `${startOfWeek.getFullYear()}-${String(startOfWeek.getMonth() + 1).padStart(2, '0')}-${String(startOfWeek.getDate()).padStart(2, '0')}`;
                    const dayEvents = filteredEvents.filter(evt => evt.date === dateStr);
                    const isCellToday = isToday(dateStr);

                    return (
                      <div 
                        key={wd} 
                        style={{ 
                          borderRight: dayIdx < 6 ? '1px solid #f1f5f9' : 'none', 
                          minHeight: '260px',
                          background: isCellToday ? '#fefcbf' : 'white',
                          padding: '8px'
                        }}
                      >
                        <div style={{ textAlign: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>{wd}</span>
                          <div style={{ 
                            fontSize: '0.9rem', 
                            fontWeight: 700, 
                            color: isCellToday ? '#b7791f' : 'var(--text-primary)',
                            width: '24px',
                            height: '24px',
                            lineHeight: '24px',
                            margin: '2px auto',
                            background: isCellToday ? '#fef08a' : 'transparent',
                            borderRadius: '50%'
                          }}>
                            {startOfWeek.getDate()}
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {dayEvents.map(evt => (
                            <div
                              key={evt.id}
                              onClick={() => setSelectedEvent(evt)}
                              className={`cal-week-event-card ${getColorClass(evt.color)}`}
                              style={{ 
                                padding: '8px', 
                                borderRadius: '8px', 
                                borderLeft: '3px solid',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                transition: 'transform 0.15s'
                              }}
                            >
                              <div style={{ fontWeight: 600, marginBottom: '2px' }}>{evt.title}</div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', opacity: 0.8 }}>
                                <Clock size={10} /> {evt.time}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'day' && (
            <div>
              {/* Day view timeline list */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '12px', background: 'rgba(99, 102, 241, 0.03)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.08)', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-primary)' }}>
                  {selectedDay.getDate()}
                </span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>
                    {weekdaysVn[selectedDay.getDay()]} - {getVnMonthName(selectedDay)}
                  </h4>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Lịch chi tiết ngày {selectedDay.toLocaleDateString('vi-VN')}
                  </span>
                </div>
              </div>

              {/* Day Events Checklist */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredEvents.filter(evt => evt.date === `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    <CalendarIcon size={32} style={{ opacity: 0.3, marginBottom: '10px' }} />
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Không có lịch trình hay mốc thời gian nào được ghi nhận cho ngày này.</p>
                  </div>
                ) : (
                  filteredEvents
                    .filter(evt => evt.date === `${selectedDay.getFullYear()}-${String(selectedDay.getMonth() + 1).padStart(2, '0')}-${String(selectedDay.getDate()).padStart(2, '0')}`)
                    .map(evt => (
                      <div
                        key={evt.id}
                        onClick={() => setSelectedEvent(evt)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '16px', 
                          background: '#f8fafc',
                          borderRadius: '12px',
                          borderLeft: `4px solid ${evt.color === 'emerald' ? '#10b981' : evt.color === 'rose' ? '#f43f5e' : evt.color === 'amber' ? '#eab308' : evt.color === 'purple' ? '#a855f7' : '#3b82f6'}`,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                        className="day-event-row"
                      >
                        <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                          <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'white',
                            border: '1px solid #cbd5e1'
                          }}>
                            {evt.type === 'schedule' ? <Clock size={16} color="#10b981" /> : 
                             evt.type === 'deadline' ? <FileText size={16} color="#eab308" /> : 
                             evt.type === 'fee' ? <DollarSign size={16} color="#a855f7" /> : 
                             evt.type === 'leave' ? <UserCheck size={16} color="#f97316" /> : 
                             <BookOpen size={16} color="#f43f5e" />}
                          </span>
                          <div>
                            <span className="badge" style={{ fontSize: '0.65rem', marginBottom: '2px', background: '#e2e8f0', color: '#475569' }}>
                              {evt.type.toUpperCase()}
                            </span>
                            <h5 style={{ margin: 0, fontWeight: 700 }}>{evt.title}</h5>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          <Clock size={14} /> {evt.time}
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: Deadlines Checklist Timeline */}
        <div style={{ 
          background: 'rgba(255,255,255,0.7)', 
          borderRadius: '16px', 
          border: '1px solid var(--border-card)', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Thời gian biểu các Deadline</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Các mốc hạn bài tập & nộp học phí sắp tới</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }} className="custom-scroll">
            {deadlinesList.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Không có deadline sắp tới.</p>
            ) : (
              deadlinesList.map(dl => {
                // Check if date is past current day (June 3, 2026)
                const dlDate = new Date(dl.date);
                const isOverdue = dlDate < today;

                return (
                  <div
                    key={dl.id}
                    onClick={() => setSelectedEvent(dl)}
                    style={{
                      padding: '12px',
                      borderRadius: '10px',
                      background: isOverdue ? 'rgba(239, 68, 68, 0.03)' : 'white',
                      border: isOverdue ? '1px solid rgba(239, 68, 68, 0.1)' : '1px solid var(--border-card)',
                      cursor: 'pointer',
                      transition: 'transform 0.15s'
                    }}
                    className="deadline-item-card"
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className={`badge ${dl.type === 'fee' ? 'badge-info' : 'badge-danger'}`} style={{ fontSize: '0.65rem' }}>
                        {dl.type === 'fee' ? 'Học Phí' : 'Bài Tập'}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: isOverdue ? 'var(--accent-danger)' : 'var(--text-muted)', fontWeight: 600 }}>
                        {isOverdue ? 'Đã hết hạn' : `Hạn: ${dl.date.split('-').reverse().slice(0, 2).join('/')}`}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dl.title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={10} />
                      <span>{dl.time}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ 
            marginTop: 'auto', 
            padding: '12px', 
            background: 'rgba(99, 102, 241, 0.05)', 
            borderRadius: '10px', 
            fontSize: '0.75rem',
            color: 'var(--accent-primary)',
            fontWeight: 500,
            lineHeight: 1.4
          }}>
            <strong>💡 Gợi ý:</strong> Bạn có thể nhấp chọn từng ngày hoặc từng ô sự kiện trên lịch để mở xem chi tiết các yêu cầu công việc.
          </div>
        </div>

      </div>

      {/* EVENT DETAIL POPUP MODAL */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="modal-content animate-fade" style={{ background: 'white' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedEvent(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
            >
              <X size={20} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span className={`badge ${getColorClass(selectedEvent.color)}`} style={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>
                {selectedEvent.type}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {selectedEvent.date.split('-').reverse().join('/')}
              </span>
            </div>

            <h2 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {selectedEvent.title}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <Clock size={14} />
                <strong>Thời gian:</strong> {selectedEvent.time}
              </div>
            </div>

            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-line' }}>
              {selectedEvent.desc}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedEvent(null)} className="btn btn-primary" style={{ padding: '8px 20px' }}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
