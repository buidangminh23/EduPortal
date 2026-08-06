/**
 * What a pupil's own overview is allowed to say about them.
 *
 * The screen used to answer from literals: hạng #3 trên 42 bạn, chuyên cần 98%,
 * a hạnh kiểm banded from an invented 100-point tally, four badges marked earned
 * for every child in the school, and a school day of six periods with invented
 * rooms and invented teachers. The assertions below are therefore as much about
 * what must NOT appear as about what must.
 *
 * Rendering goes through react-dom/server so no DOM environment is needed; the
 * modal is the only interactive part and it is closed on first paint.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext } from '../../context/AppContext';
import { ATTENDANCE_STATUS, LEAVE_STATUS } from '../../lib/domain/attendance';
import { BADGE_DEFS } from '../../lib/badges';
import OverviewTab from './OverviewTab';

/** The day label `timetableSlots` stores for today — the component's own table. */
const TODAY_LABEL = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][new Date().getDay()];

const STUDENT = { id: 'HS001', name: 'Nguyễn Hoàng Nam', class: '12A1' };

function render(context = {}, student = STUDENT) {
  return renderToStaticMarkup(
    <AppContext.Provider value={{ t: (vi) => vi, setStudentSubTab: () => {}, ...context }}>
      <OverviewTab student={student} />
    </AppContext.Provider>
  );
}

describe('OverviewTab — a pupil the school holds no records for', () => {
  const html = render();

  it('states chuyên cần as unrecorded instead of the old 98%', () => {
    expect(html).toContain('Chưa điểm danh');
    expect(html).toContain('Chưa có buổi điểm danh nào');
    expect(html).not.toContain('98%');
    // Matched against rendered stat text: "0%" alone also appears in the inline
    // width a zero-length bar would carry.
    expect(html).not.toContain('>0%<');
  });

  it('gives the pupil no rank, and no class size it does not know', () => {
    expect(html).not.toContain('#3');
    expect(html).not.toContain('42 bạn');
    expect(html).not.toContain('Hạng trong lớp');
  });

  it('says kết quả rèn luyện is unassessed rather than banding a tally', () => {
    expect(html).toContain('Chưa đánh giá');
    expect(html).not.toContain('Yếu');
  });

  it('publishes no average across subjects, because Thông tư 22 defines none', () => {
    expect(html).not.toContain('Điểm trung bình');
    expect(html).not.toContain('GPA');
  });

  it('shows no trend arrow where nothing computed a trend', () => {
    expect(html).not.toContain('+0.3');
    expect(html).not.toContain('stat-trend');
  });

  it('empties the school day rather than inventing one', () => {
    expect(html).toContain('Hôm nay thời khoá biểu chưa xếp tiết nào cho lớp bạn.');
    expect(html).not.toContain('07:50');
    expect(html).not.toContain('09:45');
    expect(html).not.toContain('P.201');
    expect(html).not.toContain('Cô Hoa');
    expect(html).not.toContain('Thầy Phúc');
    expect(html).not.toContain('6 tiết');
  });

  it('carries one badge list, the one with rules behind it', () => {
    BADGE_DEFS.forEach(badge => expect(html).toContain(badge.label));
    expect(html).toContain(`0/${BADGE_DEFS.length}`);
    expect(html).not.toContain('Top 3 lớp');
    expect(html).not.toContain('Streak 7');
    expect(html).not.toContain('Mọt sách');
    expect(html).not.toContain('Nhà vô địch');
  });

  it('claims no study streak, because nothing records one', () => {
    expect(html).not.toContain('Streak Học Tập');
    expect(html).not.toContain('ngày liên tiếp');
  });

  it('says the school has issued nothing rather than leaving the card blank', () => {
    expect(html).toContain('Nhà trường chưa phát hành thông báo nào.');
    expect(html).toContain('Chưa có mục nào trong lịch của lớp');
  });
});

describe('OverviewTab — chuyên cần', () => {
  const logs = [
    { id: 'AT1', studentId: 'HS001', date: '2026-06-01', status: ATTENDANCE_STATUS.PRESENT },
    { id: 'AT2', studentId: 'HS001', date: '2026-06-02', status: ATTENDANCE_STATUS.LATE },
    { id: 'AT3', studentId: 'HS001', date: '2026-06-03', status: ATTENDANCE_STATUS.UNEXCUSED },
    { id: 'AT4', studentId: 'HS002', date: '2026-06-03', status: ATTENDANCE_STATUS.UNEXCUSED }
  ];

  it('counts an unexcused absence as an absence', () => {
    const html = render({ attendanceLogs: logs });
    // The old sum kept every status except 'absent', a status this domain has
    // never had, so these three sessions read 100%.
    expect(html).toContain('66.7%');
    // Matched against the rendered stat text: "100%" alone also appears in the
    // inline width of a full-width button.
    expect(html).not.toContain('>100%<');
    expect(html).toContain('Trên 3 buổi đã ghi nhận');
  });

  it('counts only this pupil, and only what an approved đơn nghỉ excuses', () => {
    const html = render({
      attendanceLogs: logs,
      leaveRequests: [
        { id: 'LR1', studentId: 'HS001', fromDate: '2026-06-03', toDate: '2026-06-03', status: LEAVE_STATUS.APPROVED }
      ]
    });
    // Nghỉ có phép is still a session the pupil was not present for, so the rate
    // is unchanged; what changes is that it is no longer counted as truancy.
    expect(html).toContain('66.7%');
    expect(html).toContain('Trên 3 buổi đã ghi nhận');
  });
});

describe('OverviewTab — kết quả học tập', () => {
  const student = {
    ...STUDENT,
    gradesSem1: { Math: 8.2, Chemistry: 7.0 },
    grades: { Math: 8.5, Chemistry: 9.0 }
  };

  it('counts every subject the pupil holds a mark in, Hoá học included', () => {
    const html = render({}, student);
    expect(html).toContain('Hoá học');
    expect(html).toContain('9.0');
    expect(html).toContain('Toán');
    expect(html).toContain('8.5');
  });

  it('refuses to xếp loại on four subjects, and says why', () => {
    const html = render({}, student);
    expect(html).toContain('Chưa xếp loại');
    expect(html).toContain('Mới có 2/6 môn đủ điểm');
  });

  it('draws a trend arrow only where both học kỳ carry a mark', () => {
    const html = render({}, { ...STUDENT, gradesSem1: { Math: 8.2 }, grades: { Math: 8.5, Physics: 7.0 } });
    expect(html).toContain('Tăng 0.3 so với HK I');
    // Vật lí has a mark this semester and none last, so there is nothing to
    // compare it against and no arrow is drawn.
    expect(html.match(/so với HK I/g)).toHaveLength(1);
  });

  it('names a subject with no mark as such rather than as a zero', () => {
    const html = render({}, { ...STUDENT, grades: {} });
    expect(html).toContain('Chưa đánh giá');
    expect(html).not.toContain('>0.0<');
  });
});

describe('OverviewTab — kết quả rèn luyện', () => {
  it('reports the mức the form teacher entered', () => {
    const html = render({}, { ...STUDENT, conductResults: { semester2: 'Khá' } });
    expect(html).toContain('Khá');
    expect(html).toContain('Do giáo viên chủ nhiệm đánh giá');
  });

  it('ignores the điểm thi đua tally that used to band the pupil', () => {
    const html = render({
      conductLogs: [
        { id: 'CD1', studentId: 'HS001', date: '2026-06-01', points: -60, reason: 'Vi phạm nội quy' }
      ]
    });
    // 100 - 60 banded as "TB" on the old scale; neither TB nor Yếu is one of the
    // four mức in Thông tư 22 Điều 8, so neither can appear on this screen.
    expect(html).toContain('Chưa đánh giá');
    expect(html).not.toContain('Yếu');
  });
});

describe('OverviewTab — lịch học hôm nay', () => {
  const slots = [
    { id: 'TBT01', classTarget: '12A1', dayOfWeek: TODAY_LABEL, period: 2, subject: 'Ngữ văn', teacherName: 'Trần Thị Hồng Vân', room: 'Phòng 402' },
    { id: 'TBT02', classTarget: '12A1', dayOfWeek: TODAY_LABEL, period: 1, subject: 'Toán học', teacherName: 'Nguyễn Minh Triết', room: 'Phòng 402' },
    { id: 'TBT03', classTarget: '12A2', dayOfWeek: TODAY_LABEL, period: 1, subject: 'Vật lý', teacherName: 'Phạm Đức Duy', room: 'Phòng 105' },
    { id: 'TBT04', classTarget: '12A1', dayOfWeek: 'Thứ 7', period: 1, subject: 'Tiếng Anh', teacherName: 'Lê Thu Hà', room: 'Phòng 403' }
  ];
  const html = render({ timetableSlots: slots });

  it('reads today off the timetable the school entered', () => {
    expect(html).toContain('Toán học');
    expect(html).toContain('Phòng 402 · Nguyễn Minh Triết');
    expect(html).toContain('Hôm nay lớp bạn có 2 tiết theo thời khoá biểu.');
  });

  it('shows a tiết as a tiết, because no bell schedule is on file', () => {
    expect(html).toContain('Tiết 1');
    expect(html).toContain('Tiết 2');
    expect(html).not.toContain('07:00');
    expect(html).not.toContain('07:50');
  });

  it('puts the lessons in period order', () => {
    expect(html.indexOf('Toán học')).toBeLessThan(html.indexOf('Ngữ văn'));
  });

  it('leaves out another class, and another day', () => {
    expect(html).not.toContain('Vật lý');
    expect(html).not.toContain('Tiếng Anh');
  });
});

describe('OverviewTab — huy hiệu', () => {
  it('awards only what the rules in lib/badges.js award', () => {
    const html = render({}, { ...STUDENT, grades: { Math: 9.5, Literature: 9.2 } });
    expect(html).toContain(`2/${BADGE_DEFS.length}`);
    expect(html).toContain('Học Bá');
    expect(html).toContain('Xuất Sắc Môn Học');
  });

  it('says what a locked badge is short of', () => {
    const html = render({ attendanceLogs: [{ id: 'AT1', studentId: 'HS001', date: '2026-06-01', status: ATTENDANCE_STATUS.PRESENT }] });
    expect(html).toContain('Mới ghi nhận 1/43 buổi');
  });
});

describe('OverviewTab — sắp đến hạn', () => {
  const html = render({
    deadlines: [
      { id: 'DL2', title: 'Nộp bài Nghị luận Ngữ văn', date: '2026-06-08', classTarget: '12A1' },
      { id: 'DL1', title: 'Kiểm tra 1 tiết Toán học', date: '2026-06-01', classTarget: '12A1' },
      { id: 'DL3', title: 'Kiểm tra Hoá học lớp khác', date: '2026-06-02', classTarget: '12A2' }
    ]
  });

  it('lists the pupil’s own class, soonest first', () => {
    expect(html).toContain('Kiểm tra 1 tiết Toán học');
    expect(html).toContain('Nộp bài Nghị luận Ngữ văn');
    expect(html).not.toContain('Kiểm tra Hoá học lớp khác');
    expect(html.indexOf('Kiểm tra 1 tiết Toán học')).toBeLessThan(html.indexOf('Nộp bài Nghị luận Ngữ văn'));
  });

  it('dates a deadline from the record, and invents no cut-off time', () => {
    expect(html).toContain('Quá hạn');
    expect(html).not.toContain('23:59');
  });
});

describe('OverviewTab — ghi chú học tập', () => {
  /** Runs one render against a stand-in store, leaving the real one as found. */
  function withStorage(store, run) {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true, writable: true });
    try {
      return run();
    } finally {
      if (original) Object.defineProperty(globalThis, 'localStorage', original);
      else delete globalThis.localStorage;
    }
  }

  it('reads the scratchpad of the pupil the page is about, not a default one', () => {
    const asked = [];
    const html = withStorage(
      {
        getItem: (key) => {
          asked.push(key);
          return JSON.stringify([{ id: 'N1', text: 'Ôn giao thoa sóng', createdAt: '2026-06-01T00:00:00.000Z' }]);
        },
        setItem: () => {}
      },
      () => render({}, { ...STUDENT, id: 'HS002' })
    );

    expect(asked).toContain('student_notes_HS002');
    expect(asked).not.toContain('student_notes_HS001');
    expect(html).toContain('Ôn giao thoa sóng');
  });

  it('survives a stored value that is not a list of notes', () => {
    // Parses cleanly and then has no .map, which took the whole overview down —
    // today's timetable included — over a scratchpad nobody would miss.
    const html = withStorage(
      { getItem: () => '"ghi chú cũ chưa đúng định dạng"', setItem: () => {} },
      () => render()
    );

    expect(html).toContain('Lịch học hôm nay');
    expect(html).not.toContain('Ghi chú học tập');
  });
});
