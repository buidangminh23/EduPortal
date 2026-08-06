/**
 * What the Ban Giám hiệu screen is allowed to say about the school.
 *
 * These tests exist because the screen used to answer from literals: 1.842 học
 * sinh, 128 giáo viên, 96.8% chuyên cần, GPA 7.9, three khối with invented
 * averages, and a feed in which "Hệ thống" reported a successful backup this
 * application has never taken. The assertions below are therefore as much about
 * what must NOT appear as about what must.
 *
 * Rendering goes through react-dom/server so no DOM environment is needed; the
 * screen has no behaviour that a static render misses.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext } from '../../context/AppContext';
import { ATTENDANCE_STATUS } from '../../lib/domain/attendance';
import AdminOverview from './AdminOverview';

function render(context = {}) {
  return renderToStaticMarkup(
    <AppContext.Provider value={context}>
      <AdminOverview />
    </AppContext.Provider>
  );
}

const STUDENTS = [
  { id: 'HS1', name: 'Trần Bảo An', class: '10A1', grade: '10' },
  { id: 'HS2', name: 'Lê Mai Chi', class: '10A1', grade: '10' },
  { id: 'HS3', name: 'Phan Minh Triết', class: '11A1', grade: '11' }
];

describe('AdminOverview — a school the system holds no records for', () => {
  const html = render();

  it('counts the roster it has instead of naming a headcount', () => {
    expect(html).toContain('Tổng học sinh');
    expect(html).toContain('Chưa xếp lớp');
    expect(html).not.toContain('1.842');
    expect(html).not.toContain('+64');
    // Matched against the rendered stat text: "128" on its own also appears
    // inside the path geometry of the lucide icons.
    expect(html).not.toContain('>128<');
    expect(html).not.toContain('tổ bộ môn');
  });

  it('says chuyên cần is unrecorded rather than printing a percentage', () => {
    expect(html).toContain('Chưa điểm danh');
    expect(html).toContain('Chưa có buổi điểm danh nào được ghi nhận');
    expect(html).not.toContain('96.8%');
    // Matched against rendered stat text: "0%" alone also appears inside the
    // inline width:0% a zero-length bar would carry.
    expect(html).not.toContain('>0%<');
  });

  it('publishes no school-wide or per-khối GPA, because nothing computes one', () => {
    expect(html).not.toContain('GPA');
    expect(html).not.toContain('7.9');
    expect(html).not.toContain('8.4');
  });

  it('shows an empty roster chart rather than three invented khối', () => {
    expect(html).toContain('Chưa có học sinh nào trong danh sách của trường.');
    expect(html).not.toContain('Khối 12');
    expect(html).not.toContain('624');
  });

  it('claims no backup, and attributes nothing to staff who filed nothing', () => {
    expect(html).toContain('Chưa có hoạt động nào được ghi nhận trên hệ thống.');
    expect(html).not.toContain('sao lưu');
    expect(html).not.toContain('Phạm Lan');
    expect(html).not.toContain('Trần Hải');
  });

  it('shows no notice the school has not issued, and no relative time', () => {
    expect(html).toContain('Nhà trường chưa phát hành thông báo nào.');
    expect(html).not.toContain('2 giờ trước');
    expect(html).not.toContain('Hôm qua');
    expect(html).not.toContain('trước');
  });

  it('does not date the page to a school year nothing records', () => {
    expect(html).toContain('Học kỳ II');
    expect(html).not.toContain('2025–2026');
  });
});

describe('AdminOverview — sĩ số', () => {
  const html = render({ students: STUDENTS });

  it('counts the students on the roster', () => {
    expect(html).toContain('>3</div>');
  });

  it('reports the lớp the roster actually holds', () => {
    expect(html).toContain('2 lớp');
  });

  it('groups the bars by the khối the roster actually holds', () => {
    expect(html).toContain('Khối 10');
    expect(html).toContain('Khối 11');
    expect(html).not.toContain('Khối 12');
  });
});

describe('AdminOverview — giáo viên', () => {
  it('counts the staff list and the subjects it covers, not tổ bộ môn', () => {
    const html = render({
      teachers: [
        { id: 'T1', name: 'Nguyễn Minh Triết', subject: 'Toán học' },
        { id: 'T2', name: 'Trần Thị Hồng Vân', subject: 'Ngữ văn' },
        { id: 'T3', name: 'Phạm Đức Duy', subject: 'Toán học' }
      ]
    });
    expect(html).toContain('2 môn giảng dạy');
    expect(html).not.toContain('tổ bộ môn');
  });
});

describe('AdminOverview — chuyên cần', () => {
  const logs = [
    { id: 'AT0', studentId: 'HS1', date: '2026-06-02', status: ATTENDANCE_STATUS.UNEXCUSED },
    { id: 'AT1', studentId: 'HS1', date: '2026-06-03', status: ATTENDANCE_STATUS.PRESENT },
    { id: 'AT2', studentId: 'HS2', date: '2026-06-03', status: ATTENDANCE_STATUS.LATE }
  ];
  const html = render({ students: STUDENTS, attendanceLogs: logs });

  it('reads the rate off the last day the register was opened', () => {
    expect(html).toContain('100%');
    expect(html).toContain('Số liệu của buổi điểm danh gần nhất, ngày 03/06/2026.');
  });

  it('never lets an earlier day drag the figure for that one', () => {
    expect(html).not.toContain('66.7');
  });

  it('carries the denominator beside the school-wide rate', () => {
    expect(html).toContain('Buổi 03/06 · đã điểm danh 2/3 HS');
  });

  it('states a lớp nobody ticked off as unrecorded, not as 0%', () => {
    expect(html).toContain('Lớp 11A1');
    expect(html).toContain('Chưa điểm danh');
    expect(html).toContain('Đã điểm danh 0/1 HS');
    expect(html).not.toContain('>0%<');
  });

  it('reports each lớp against its own roster', () => {
    expect(html).toContain('Lớp 10A1');
    expect(html).toContain('Đã điểm danh 2/2 HS');
  });
});

describe('AdminOverview — hoạt động gần đây', () => {
  const html = render({
    bulletins: [{ id: 'B1', date: '2026-05-30', authorName: 'Ban Giám Hiệu', title: 'Lịch thi học kỳ II' }],
    journalEntries: [{ id: 'J1', date: '2026-06-01', teacher: 'Nguyễn Minh Triết', subject: 'Toán học', class: '12A1' }],
    lessonPlans: [{ id: 'LP1', date: '2026-06-02', teacherName: 'Trần Thị Hồng Vân', title: 'Giáo án Vợ Nhặt' }]
  });

  it('names the person each record says filed it', () => {
    expect(html).toContain('Trần Thị Hồng Vân');
    expect(html).toContain('đã nộp giáo án “Giáo án Vợ Nhặt”');
    expect(html).toContain('đã ghi sổ đầu bài môn Toán học lớp 12A1');
    expect(html).toContain('đã đăng bảng tin “Lịch thi học kỳ II”');
  });

  it('dates each row from the record, never as a time ago', () => {
    expect(html).toContain('Ngày 02/06/2026');
    expect(html).toContain('Ngày 30/05/2026');
    expect(html).not.toContain('trước');
  });

  it('puts the newest record first', () => {
    expect(html.indexOf('Trần Thị Hồng Vân')).toBeLessThan(html.indexOf('Nguyễn Minh Triết'));
    expect(html.indexOf('Nguyễn Minh Triết')).toBeLessThan(html.indexOf('Ban Giám Hiệu'));
  });
});

describe('AdminOverview — thông báo mới nhất', () => {
  const html = render({
    announcements: [
      { id: 'A2', date: '2026-06-01', sender: 'GVCN Lớp 12A1', title: 'Nộp các khoản phí tháng 6' },
      { id: 'A1', date: '2026-06-02', sender: 'Ban Giám Hiệu', title: 'Kế hoạch thi học kỳ II' }
    ]
  });

  it('lists the notices the school actually issued, newest first', () => {
    expect(html).toContain('Kế hoạch thi học kỳ II');
    expect(html).toContain('Nộp các khoản phí tháng 6');
    expect(html.indexOf('Kế hoạch thi học kỳ II')).toBeLessThan(html.indexOf('Nộp các khoản phí tháng 6'));
  });

  it('credits each notice to its sender and its own date', () => {
    expect(html).toContain('Ban Giám Hiệu · Ngày 02/06/2026');
    expect(html).toContain('GVCN Lớp 12A1 · Ngày 01/06/2026');
  });
});
