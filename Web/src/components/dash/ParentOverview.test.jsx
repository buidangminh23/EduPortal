/**
 * What the parent screen is allowed to say about a child.
 *
 * These tests exist because the screen used to answer from literals: every
 * parent in the school read Hạng #3, Hạnh kiểm Tốt and Chuyên cần 98% about
 * their own child, and four subjects carried marks nobody had entered. The
 * assertions below are therefore as much about what must NOT appear as about
 * what must.
 *
 * Rendering goes through react-dom/server so no DOM environment is needed; the
 * screen has no behaviour that a static render misses.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext } from '../../context/AppContext';
import { ATTENDANCE_STATUS, LEAVE_STATUS } from '../../lib/domain/attendance';
import { LEARNING_BAND } from '../../lib/domain/grading';
import ParentOverview from './ParentOverview';

const CHILD = { id: 'HS900', name: 'Trần Bảo An', class: '10A1' };

function render(student, context = {}) {
  return renderToStaticMarkup(
    <AppContext.Provider value={context}>
      <ParentOverview student={student} />
    </AppContext.Provider>
  );
}

describe('ParentOverview — a child the school has recorded nothing for', () => {
  const html = render(CHILD);

  it('says chuyên cần is unrecorded rather than naming a percentage', () => {
    expect(html).toContain('Chưa điểm danh');
    expect(html).toContain('Chưa có buổi điểm danh nào được ghi nhận cho con.');
    expect(html).not.toContain('98%');
    // Matched against the rendered stat text, not the raw string: "0%" alone
    // also appears inside the inline width:100% of every full-width button.
    expect(html).not.toContain('>0%<');
  });

  it('says kết quả rèn luyện is unassessed rather than printing a mức', () => {
    expect(html).toContain('Kết quả rèn luyện HK II');
    expect(html).toContain('Chưa đánh giá');
    expect(html).not.toContain('Hạnh kiểm');
  });

  it('publishes no class rank, because nothing in the app ranks students', () => {
    expect(html).not.toContain('Hạng');
    expect(html).not.toContain('#3');
  });

  it('invents no marks for subjects the gradebook does not hold', () => {
    expect(html).toContain('Chưa xếp loại');
    expect(html).not.toContain('Hoá học');
    expect(html).not.toContain('Sinh học');
    expect(html).not.toContain('8.0');
    expect(html).not.toContain('8.7');
  });

  it('shows no fee rows the school has not issued', () => {
    expect(html).toContain('Nhà trường chưa phát hành khoản thu nào cho con.');
    expect(html).not.toContain('4.500.000');
    expect(html).not.toContain('Quỹ lớp');
  });

  it('shows no bus route, driver or phone number for an unregistered child', () => {
    expect(html).toContain('Con chưa đăng ký tuyến xe đưa đón nào.');
    expect(html).not.toContain('Tuyến 04');
    expect(html).not.toContain('12 phút');
    expect(html).not.toContain('0909123456');
    expect(html).not.toContain('29B-123.45');
  });

  it('attributes no message to a teacher who never sent one', () => {
    expect(html).toContain('Chưa có trao đổi nào giữa gia đình và giáo viên.');
    expect(html).not.toContain('Cô Hoa');
    expect(html).not.toContain('2 giờ trước');
  });
});

describe('ParentOverview — chuyên cần', () => {
  const records = [
    { id: 'AT1', studentId: CHILD.id, date: '2026-06-01', status: ATTENDANCE_STATUS.PRESENT },
    { id: 'AT2', studentId: CHILD.id, date: '2026-06-02', status: ATTENDANCE_STATUS.PRESENT },
    { id: 'AT3', studentId: CHILD.id, date: '2026-06-03', status: ATTENDANCE_STATUS.LATE },
    { id: 'AT4', studentId: CHILD.id, date: '2026-06-04', status: ATTENDANCE_STATUS.UNEXCUSED }
  ];

  it('reports the rate the register supports', () => {
    const html = render(CHILD, { attendanceLogs: records });
    expect(html).toContain('75%');
    expect(html).toContain('Đã ghi nhận 4 buổi · có mặt 3 buổi');
    expect(html).toContain('vắng không phép 1 buổi');
  });

  it('counts another child’s sessions towards that child only', () => {
    const html = render(CHILD, {
      attendanceLogs: [...records, { id: 'AT5', studentId: 'HS901', date: '2026-06-04', status: ATTENDANCE_STATUS.UNEXCUSED }]
    });
    expect(html).toContain('Đã ghi nhận 4 buổi');
  });

  it('reads an absence as có phép once a leave request covers it', () => {
    const html = render(CHILD, {
      attendanceLogs: records,
      leaveRequests: [{
        id: 'LV1',
        studentId: CHILD.id,
        fromDate: '2026-06-04',
        toDate: '2026-06-04',
        status: LEAVE_STATUS.APPROVED
      }]
    });
    expect(html).toContain('Nghỉ có phép');
    expect(html).not.toContain('vắng không phép');
  });
});

describe('ParentOverview — điểm các môn', () => {
  const student = {
    ...CHILD,
    gradesSem1: { Math: 8.2, Literature: 8.0 },
    grades: { Math: 8.5, Literature: 7.4, Physics: 9.1 }
  };

  it('shows the semester II mark for each subject the student holds one for', () => {
    const html = render(student);
    expect(html).toContain('Toán');
    expect(html).toContain('8.5');
    expect(html).toContain('9.1');
  });

  it('draws a trend only where both semesters carry a mark, and states the difference', () => {
    const html = render(student);
    expect(html).toContain('Tăng 0.3 so với HK I');
    expect(html).toContain('Giảm 0.6 so với HK I');
    // Vật lí has no semester I mark, so no arrow is drawn for it at all.
    expect(html.match(/so với HK I/g)).toHaveLength(2);
  });

  it('marks an unassessed nhận xét subject as such instead of scoring it', () => {
    const html = render(student);
    expect(html).toContain('Giáo dục thể chất');
    expect(html).toContain('Chưa đánh giá');
  });

  it('reports a recorded nhận xét result', () => {
    const html = render({ ...student, commentResults: { PhysicalEducation: { semester2: 'Đạt' } } });
    expect(html).toContain('Đạt');
  });
});

describe('ParentOverview — kết quả rèn luyện', () => {
  it('prints the mức the giáo viên chủ nhiệm recorded', () => {
    const html = render({ ...CHILD, conductResults: { semester2: LEARNING_BAND.FAIR } });
    expect(html).toContain('Khá');
  });

  it('ignores a value the circular does not recognise', () => {
    const html = render({ ...CHILD, conductResults: { semester2: 'Xuất sắc' } });
    expect(html).not.toContain('Xuất sắc');
    expect(html).toContain('Chưa đánh giá');
  });
});

describe('ParentOverview — học phí', () => {
  const student = {
    ...CHILD,
    feeStatus: [
      { id: 'F01', name: 'Học phí tháng 6/2026', amount: 2500000, paid: false, deadline: '2026-06-15' },
      { id: 'F02', name: 'Quỹ hội phụ huynh', amount: 300000, paid: true, deadline: '2026-06-05' }
    ]
  };

  it('lists the school’s own fee rows', () => {
    const html = render(student);
    expect(html).toContain('Học phí tháng 6/2026');
    expect(html).toContain('Quỹ hội phụ huynh');
    expect(html).toContain('Hạn 15/06/2026');
  });

  it('keeps the pay button in step with the rows above it', () => {
    expect(render(student)).toContain('Thanh toán 1 khoản còn lại');
  });
});

describe('ParentOverview — xe đưa đón', () => {
  const route = {
    id: 'BUS01',
    name: 'Tuyến Xe Cầu Giấy - Đống Đa',
    driverName: 'Bác Nguyễn Văn Tài',
    plateNumber: '29B-123.45',
    status: 'driving',
    stops: ['Cổng trường', 'Chùa Láng'],
    studentsRegistered: [CHILD.id]
  };

  it('shows the route the child is actually registered on', () => {
    const html = render(CHILD, { busRoutes: [route] });
    expect(html).toContain('Tuyến Xe Cầu Giấy - Đống Đa');
    expect(html).toContain('Bác Nguyễn Văn Tài');
    expect(html).toContain('Xe đang chạy');
  });

  it('offers no arrival estimate, because nothing in the app computes one', () => {
    const html = render(CHILD, { busRoutes: [route] });
    expect(html).not.toContain('phút');
  });

  it('lists the child’s own card scans and nobody else’s', () => {
    const html = render(CHILD, {
      busRoutes: [route],
      busScanLogs: [
        { id: 'BSL1', studentId: CHILD.id, time: '07:15', direction: 'boarding', stopName: 'Chùa Láng' },
        { id: 'BSL2', studentId: 'HS901', time: '07:20', direction: 'boarding', stopName: 'Cổng trường' }
      ]
    });
    expect(html).toContain('Lên xe · Chùa Láng');
    expect(html).toContain('07:15');
    expect(html).not.toContain('07:20');
  });
});

describe('ParentOverview — trao đổi với giáo viên', () => {
  it('shows the reply a teacher actually wrote', () => {
    const html = render(CHILD, {
      parentQAs: [{
        id: 'Q1',
        studentName: CHILD.name,
        question: 'Cháu có tập trung học không ạ?',
        reply: 'Cháu học ổn định, chỉ cần chú ý phần hình học.',
        status: 'resolved',
        date: '2026-06-02'
      }]
    });
    expect(html).toContain('Cháu học ổn định, chỉ cần chú ý phần hình học.');
    expect(html).toContain('Câu hỏi ngày 02/06/2026');
  });

  it('reports an unanswered question as waiting rather than as a reply', () => {
    const html = render(CHILD, {
      parentQAs: [{ id: 'Q1', studentName: CHILD.name, question: 'Cháu thế nào ạ?', reply: '', status: 'pending', date: '2026-06-03' }]
    });
    expect(html).toContain('Câu hỏi gửi ngày 03/06/2026 đang chờ giáo viên trả lời.');
  });

  it('does not show another family’s conversation', () => {
    const html = render(CHILD, {
      parentQAs: [{ id: 'Q1', studentName: 'Lê Mai Chi', question: 'Hỏi', reply: 'Trả lời riêng', status: 'resolved', date: '2026-06-02' }]
    });
    expect(html).not.toContain('Trả lời riêng');
    expect(html).toContain('Chưa có trao đổi nào giữa gia đình và giáo viên.');
  });
});
