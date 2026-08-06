/**
 * What the teacher screen is allowed to say about a teacher's own work.
 *
 * These tests exist because the screen used to answer from literals: three
 * classes nobody was assigned to, four students who do not attend this school,
 * and a timetable that sent the teacher to Lớp 10A2 at 07:50 for a lesson the
 * school never scheduled. The assertions below are therefore as much about what
 * must NOT appear as about what must.
 *
 * Rendering goes through react-dom/server so no DOM environment is needed; the
 * class modal is the only interactive part and its data is asserted through the
 * class card that opens it.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext } from '../../context/AppContext';
import { ATTENDANCE_STATUS, LEAVE_STATUS } from '../../lib/domain/attendance';
import TeacherOverview from './TeacherOverview';

const TEACHER = { id: 'T90', name: 'Nguyễn Minh Triết', subject: 'Toán học', classJoined: '12A1' };

const ROSTER = [
  { id: 'HS901', name: 'Lê Mai Chi', class: '12A1', parentPhone: '0987654321', grades: { Math: 8.0, Literature: 7.0 } },
  { id: 'HS902', name: 'Vũ Khánh Linh', class: '12A1', grades: { Math: 9.0 } },
  { id: 'HS903', name: 'Đỗ Gia Bảo', class: '11A3', grades: { Math: 6.0 } }
];

function render(context = {}, props = {}) {
  return renderToStaticMarkup(
    <AppContext.Provider value={{ teachers: [TEACHER], ...context }}>
      <TeacherOverview teacherName={TEACHER.name} {...props} />
    </AppContext.Provider>
  );
}

describe('TeacherOverview — a teacher the school has recorded nothing for', () => {
  const html = render();

  it('claims no classes when neither the timetable nor the teachers table gives any', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={{ teachers: [{ ...TEACHER, classJoined: null }] }}>
        <TeacherOverview teacherName={TEACHER.name} />
      </AppContext.Provider>
    );
    expect(html).toContain('Chưa có lớp nào được phân công cho thầy cô trong thời khoá biểu.');
    expect(html).not.toContain('10A2');
    expect(html).not.toContain('10A5');
    expect(html).not.toContain('11A1');
  });

  it('names no students in the grading queue', () => {
    expect(html).toContain('Thầy cô chưa giao bài tập nào trên hệ thống.');
    expect(html).not.toContain('Lê Hoàng Nam');
    expect(html).not.toContain('Phạm Thuý Vy');
    expect(html).not.toContain('pravatar');
  });

  it('publishes no count of papers waiting that no submission stands behind', () => {
    expect(html).toContain('0 bài');
    expect(html).not.toContain('43');
    expect(html).not.toContain('12 bài chờ chấm');
  });

  it('sends the teacher nowhere, because the timetable schedules nothing today', () => {
    expect(html).toContain('Hôm nay thời khoá biểu không xếp tiết nào cho thầy cô.');
    expect(html).not.toContain('07:50');
    expect(html).not.toContain('Hàm số bậc hai');
    expect(html).not.toContain('Tổ hợp');
  });

  it('reports chuyên cần as unrecorded rather than as a percentage', () => {
    expect(html).toContain('Chưa có buổi điểm danh nào');
    expect(html).not.toContain('97%');
    expect(html).not.toContain('99%');
  });

  it('publishes no class GPA, because nothing in the app computes one', () => {
    expect(html).toContain('Chưa có môn nào được nhập điểm cho các lớp của thầy cô.');
    expect(html).not.toContain('GPA');
    expect(html).not.toContain('8.1');
    expect(html).not.toContain('8.4');
  });
});

describe('TeacherOverview — greeting', () => {
  it('does not guess a title the session name never carried', () => {
    const html = render();
    expect(html).toContain('Chào thầy cô Nguyễn Minh Triết');
    expect(html).not.toContain('Chào cô');
  });

  it('keeps a title the session name was typed with', () => {
    const html = render({}, { teacherName: 'Cô Trần Thị Hồng Vân' });
    expect(html).toContain('Chào cô Vân');
  });

  it('invents no name for a session it cannot identify', () => {
    const html = render({}, { teacherName: undefined });
    expect(html).toContain('Chào thầy cô');
    expect(html).not.toContain('Hoa');
  });
});

describe('TeacherOverview — lớp của tôi', () => {
  const context = {
    students: ROSTER,
    timetableSlots: [
      { id: 'TT1', classTarget: '11A3', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán học', teacherName: TEACHER.name, room: 'Phòng 402' },
      { id: 'TT2', classTarget: '10A9', dayOfWeek: 'Thứ 2', period: 2, subject: 'Vật lý', teacherName: 'Phạm Đức Duy', room: 'Phòng 305' }
    ]
  };

  it('lists the homeroom class and every class the timetable gives this teacher', () => {
    const html = render(context);
    expect(html).toContain('Lớp 12A1');
    expect(html).toContain('Lớp 11A3');
  });

  it('does not claim a class another teacher is timetabled for', () => {
    expect(render(context)).not.toContain('10A9');
  });

  it('counts the students actually enrolled in each class', () => {
    const html = render(context);
    expect(html).toContain('2 HS');
    expect(html).toContain('1 HS');
    expect(html).not.toContain('42 HS');
    expect(html).not.toContain('44 HS');
  });
});

describe('TeacherOverview — chuyên cần', () => {
  const context = {
    students: ROSTER,
    attendanceLogs: [
      { id: 'AT1', studentId: 'HS901', date: '2026-06-01', status: ATTENDANCE_STATUS.PRESENT },
      { id: 'AT2', studentId: 'HS901', date: '2026-06-02', status: ATTENDANCE_STATUS.LATE },
      { id: 'AT3', studentId: 'HS902', date: '2026-06-01', status: ATTENDANCE_STATUS.PRESENT },
      { id: 'AT4', studentId: 'HS902', date: '2026-06-02', status: ATTENDANCE_STATUS.UNEXCUSED }
    ]
  };

  it('reports the rate the register supports for the teacher’s own roster', () => {
    const html = render(context);
    expect(html).toContain('75%');
    expect(html).toContain('Trên 4 buổi đã ghi nhận');
  });

  it('reads an absence as có phép once an approved leave request covers it', () => {
    const html = render({
      ...context,
      leaveRequests: [{ id: 'LV1', studentId: 'HS902', fromDate: '2026-06-02', toDate: '2026-06-02', status: LEAVE_STATUS.APPROVED }]
    });
    expect(html).toContain('75%');
  });

  it('ignores sessions belonging to a class this teacher does not hold', () => {
    const html = render({
      ...context,
      attendanceLogs: [...context.attendanceLogs, { id: 'AT5', studentId: 'HS903', date: '2026-06-02', status: ATTENDANCE_STATUS.UNEXCUSED }]
    });
    expect(html).toContain('Trên 4 buổi đã ghi nhận');
  });
});

describe('TeacherOverview — hàng đợi chấm bài', () => {
  const context = {
    students: ROSTER,
    assignments: [
      { id: 'A90', teacherName: TEACHER.name, classTarget: '12A1', title: 'Luyện đề số 6', subject: 'Toán học' },
      { id: 'A91', teacherName: 'Trần Thị Hồng Vân', classTarget: '12A1', title: 'Nghị luận xã hội', subject: 'Ngữ văn' }
    ],
    submissions: [
      { id: 'S90', assignmentId: 'A90', studentId: 'HS901', studentName: 'Lê Mai Chi', class: '12A1', status: 'submitted' },
      { id: 'S91', assignmentId: 'A90', studentId: 'HS902', studentName: 'Vũ Khánh Linh', class: '12A1', status: 'graded' },
      { id: 'S92', assignmentId: 'A91', studentId: 'HS901', studentName: 'Lê Mai Chi', class: '12A1', status: 'submitted' }
    ]
  };

  it('lists only papers answering an assignment this teacher set', () => {
    const html = render(context);
    expect(html).toContain('Luyện đề số 6');
    expect(html).not.toContain('Nghị luận xã hội');
  });

  it('drops a paper once it has been marked', () => {
    const html = render(context);
    expect(html).toContain('Lê Mai Chi');
    expect(html).not.toContain('Vũ Khánh Linh');
  });

  it('counts the queue the same way in the header, the tile and the class card', () => {
    const html = render(context);
    expect(html).toContain('1 bài');
    expect(html).toContain('1 bài chờ chấm');
    // Two assignments exist; one belongs to another teacher and is not counted.
    expect(html).toContain('Trên 1 bài tập đã giao');
  });
});

describe('TeacherOverview — lịch dạy hôm nay', () => {
  const dayLabel = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date().getDay()];

  const context = {
    students: ROSTER,
    timetableSlots: [
      { id: 'TT1', classTarget: '12A1', dayOfWeek: dayLabel, period: 3, subject: 'Toán học', teacherName: TEACHER.name, room: 'Phòng 402' },
      { id: 'TT2', classTarget: '11A3', dayOfWeek: dayLabel, period: 1, subject: 'Toán học', teacherName: TEACHER.name, room: 'Phòng 305' },
      { id: 'TT3', classTarget: '12A1', dayOfWeek: 'Ngày không có thật', period: 2, subject: 'Toán học', teacherName: TEACHER.name, room: 'Phòng 402' }
    ]
  };

  it('shows the room the timetable names, in lesson order', () => {
    const html = render(context);
    expect(html.indexOf('Phòng 305')).toBeLessThan(html.indexOf('Phòng 402'));
    expect(html).toContain('Tiết 1');
    expect(html).toContain('Tiết 3');
  });

  it('shows a period as a period, inventing no clock time for it', () => {
    const html = render(context);
    expect(html).not.toMatch(/\d{2}:\d{2}/);
  });

  it('leaves out a lesson scheduled for another day', () => {
    expect(render(context)).not.toContain('Tiết 2');
  });
});

describe('TeacherOverview — điểm trung bình môn', () => {
  const context = {
    students: ROSTER,
    timetableSlots: [
      { id: 'TT1', classTarget: '11A3', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán học', teacherName: TEACHER.name, room: 'Phòng 305' }
    ]
  };

  it('averages only the marks the gradebook holds, and says how many stand behind each', () => {
    const html = render(context);
    expect(html).toContain('8.5');
    expect(html).toContain('7.0');
    expect(html).toContain('Trung bình của 2/2 học sinh đã có điểm');
    expect(html).toContain('Trung bình của 1/2 học sinh đã có điểm');
  });

  it('names subjects by the curriculum rather than by their storage key', () => {
    const html = render(context);
    expect(html).toContain('Toán');
    expect(html).toContain('Ngữ văn');
    expect(html).not.toContain('>Math<');
  });
});

describe('TeacherOverview — a teacher the school does not hold', () => {
  it('reports nothing rather than another teacher’s classes and papers', () => {
    const html = renderToStaticMarkup(
      <AppContext.Provider value={{
        teachers: [TEACHER],
        students: ROSTER,
        timetableSlots: [{ id: 'TT1', classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán học', teacherName: TEACHER.name }],
        assignments: [{ id: 'A90', teacherName: TEACHER.name, classTarget: '12A1', title: 'Luyện đề số 6' }],
        submissions: [{ id: 'S90', assignmentId: 'A90', studentId: 'HS901', studentName: 'Lê Mai Chi', class: '12A1', status: 'submitted' }]
      }}>
        <TeacherOverview teacherName="Người lạ" />
      </AppContext.Provider>
    );
    expect(html).toContain('Chưa có lớp nào được phân công cho thầy cô trong thời khoá biểu.');
    expect(html).not.toContain('Luyện đề số 6');
    expect(html).not.toContain('Lê Mai Chi');
  });
});
