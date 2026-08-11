import { describe, it, expect } from 'vitest';
import {
  normaliseDay, parsePeriod, detectTimetableColumns, findConflicts,
  buildTimetablePlan, toTimetableSlots, buildTimetableSampleCsv, MAX_PERIOD
} from './timetableImport';

describe('normaliseDay', () => {
  it('hiểu số trần', () => {
    expect(normaliseDay('2')).toBe('Thứ 2');
    expect(normaliseDay('6')).toBe('Thứ 6');
  });

  it('hiểu các cách viết tắt của trường', () => {
    expect(normaliseDay('T2')).toBe('Thứ 2');
    expect(normaliseDay('Thứ 2')).toBe('Thứ 2');
    expect(normaliseDay('thu hai')).toBe('Thứ 2');
    expect(normaliseDay('Thứ Hai')).toBe('Thứ 2');
  });

  it('hiểu chủ nhật ở mọi kiểu ghi', () => {
    expect(normaliseDay('CN')).toBe('Chủ nhật');
    expect(normaliseDay('Chủ nhật')).toBe('Chủ nhật');
    expect(normaliseDay('8')).toBe('Chủ nhật');
  });

  it('hiểu tiếng Anh, cho tệp xuất từ phần mềm nước ngoài', () => {
    expect(normaliseDay('Monday')).toBe('Thứ 2');
    expect(normaliseDay('friday')).toBe('Thứ 6');
  });

  it('trả null khi không hiểu, không đoán bừa', () => {
    expect(normaliseDay('hôm nào đó')).toBeNull();
    expect(normaliseDay('')).toBeNull();
  });
});

describe('parsePeriod', () => {
  it('đọc số tiết ở các dạng thường gặp', () => {
    expect(parsePeriod('1').value).toBe(1);
    expect(parsePeriod('Tiết 3').value).toBe(3);
    expect(parsePeriod('T5').value).toBe(5);
  });

  it('từ chối tiết 0 và tiết vượt ngưỡng', () => {
    expect(parsePeriod('0').valid).toBe(false);
    expect(parsePeriod(String(MAX_PERIOD + 1)).valid).toBe(false);
  });

  it('từ chối chữ không phải số', () => {
    expect(parsePeriod('sáng').valid).toBe(false);
  });
});

describe('detectTimetableColumns', () => {
  it('nhận đủ sáu cột từ tiêu đề tiếng Việt', () => {
    const c = detectTimetableColumns(['Lớp', 'Thứ', 'Tiết', 'Môn', 'Giáo viên', 'Phòng']);
    expect(c).toMatchObject({ classTarget: 0, dayOfWeek: 1, period: 2, subject: 3, teacherName: 4, room: 5 });
  });

  it('không để một cột bị nhận hai lần', () => {
    const c = detectTimetableColumns(['Lớp', 'Thứ', 'Tiết', 'Môn học', 'Họ tên giáo viên', 'Phòng học']);
    const used = [c.classTarget, c.dayOfWeek, c.period, c.subject, c.teacherName, c.room];
    expect(new Set(used).size).toBe(used.length);
  });
});

describe('findConflicts', () => {
  const slot = (over) => ({
    line: 2, classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1,
    subject: 'Toán', teacherName: 'Cô A', room: 'P401', ...over
  });

  it('bắt hai môn cùng một tiết của một lớp', () => {
    const out = findConflicts([slot(), slot({ line: 3, subject: 'Văn', teacherName: 'Cô B', room: 'P402' })]);
    expect(out.some((c) => c.kind === 'class')).toBe(true);
  });

  it('bắt một giáo viên bị xếp hai lớp cùng lúc', () => {
    const out = findConflicts([slot(), slot({ line: 3, classTarget: '12A2', room: 'P402' })]);
    const teacher = out.find((c) => c.kind === 'teacher');
    expect(teacher).toBeTruthy();
    expect(teacher.detail).toMatch(/12A1.*12A2|12A2.*12A1/);
  });

  it('bắt hai lớp cùng một phòng', () => {
    const out = findConflicts([slot(), slot({ line: 3, classTarget: '12A2', teacherName: 'Cô B' })]);
    expect(out.some((c) => c.kind === 'room')).toBe(true);
  });

  it('phòng để trống thì không tính là trùng', () => {
    const out = findConflicts([
      slot({ room: null, teacherName: 'Cô A' }),
      slot({ line: 3, classTarget: '12A2', teacherName: 'Cô B', room: null })
    ]);
    expect(out.some((c) => c.kind === 'room')).toBe(false);
  });

  it('khác tiết thì không trùng', () => {
    expect(findConflicts([slot(), slot({ line: 3, period: 2 })])).toHaveLength(0);
  });

  it('tên giáo viên khác cách viết dấu vẫn nhận ra là một người', () => {
    const out = findConflicts([
      slot({ teacherName: 'Nguyễn Văn An' }),
      slot({ line: 3, classTarget: '12A2', room: 'P402', teacherName: 'nguyen van an' })
    ]);
    expect(out.some((c) => c.kind === 'teacher')).toBe(true);
  });
});

describe('buildTimetablePlan', () => {
  const head = 'Lớp;Thứ;Tiết;Môn;Giáo viên;Phòng';

  it('đọc được tệp đúng định dạng', () => {
    const text = `${head}\n12A1;Thứ 2;1;Toán;Cô A;P401`;
    const plan = buildTimetablePlan({ text });
    expect(plan.summary).toMatchObject({ total: 1, ready: 1, failed: 0, conflicts: 0 });
    expect(plan.ready[0]).toMatchObject({ classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán' });
  });

  it('gom mọi lỗi của một dòng vào một thông báo', () => {
    const text = `${head}\n;hôm nào;99;;Cô A;P401`;
    const plan = buildTimetablePlan({ text });
    expect(plan.summary.ready).toBe(0);
    expect(plan.failed[0].problem).toMatch(/thiếu tên lớp/);
    expect(plan.failed[0].problem).toMatch(/không hiểu thứ/);
  });

  it('báo trùng lịch giáo viên', () => {
    const text = `${head}\n12A1;2;1;Toán;Cô A;P401\n12A2;2;1;Toán;Cô A;P402`;
    const plan = buildTimetablePlan({ text });
    expect(plan.summary.ready).toBe(2);
    expect(plan.conflicts.some((c) => c.kind === 'teacher')).toBe(true);
  });

  it('đánh dấu lớp không có trong hệ thống', () => {
    const text = `${head}\n12A9;2;1;Toán;Cô A;P401`;
    const plan = buildTimetablePlan({ text, knownClasses: ['12A1', '12A2'] });
    expect(plan.ready[0].unknownClass).toBe(true);
    expect(plan.summary.unknownClasses).toBe(1);
  });

  it('không đánh dấu lớp lạ khi chưa biết danh sách lớp', () => {
    const text = `${head}\n12A9;2;1;Toán;Cô A;P401`;
    const plan = buildTimetablePlan({ text });
    expect(plan.ready[0].unknownClass).toBe(false);
  });

  it('báo rõ thiếu cột nào khi không đoán được', () => {
    const plan = buildTimetablePlan({ text: 'A;B\n1;2' });
    expect(plan.error).toMatch(/Chưa nhận ra cột/);
  });

  it('tệp rỗng không làm hỏng chương trình', () => {
    expect(buildTimetablePlan({ text: '' }).error).toMatch(/rỗng/);
  });
});

describe('toTimetableSlots', () => {
  it('sinh mã tiết ổn định để nạp lại thì thay đúng chỗ', () => {
    const ready = [{ classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán', teacherName: 'Cô A', room: 'P401' }];
    const a = toTimetableSlots(ready);
    const b = toTimetableSlots(ready);
    expect(a[0].id).toBe(b[0].id);
  });

  it('hai tiết khác nhau không dùng chung mã', () => {
    const slots = toTimetableSlots([
      { classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán' },
      { classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 2, subject: 'Văn' }
    ]);
    expect(slots[0].id).not.toBe(slots[1].id);
  });

  it('mã vẫn duy nhất khi tệp có lớp trùng tiết', () => {
    // Người phụ trách được cảnh báo trùng lịch nhưng vẫn có quyền nạp. Nếu hai
    // tiết dùng chung một mã thì danh sách hiển thị hỏng và hàm đổi tiết bắt
    // nhầm tiết — lỗi phát sinh sau, xa chỗ gây ra.
    const slots = toTimetableSlots([
      { classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán' },
      { classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Tiếng Anh' },
      { classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Vật lý' }
    ]);
    const ids = slots.map((s) => s.id);
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).not.toContain('-2');
  });

  it('trường trống thành chuỗi rỗng, không phải null', () => {
    const [slot] = toTimetableSlots([{ classTarget: '12A1', dayOfWeek: 'Thứ 2', period: 1, subject: 'Toán', teacherName: null, room: null }]);
    expect(slot.teacherName).toBe('');
    expect(slot.room).toBe('');
  });
});

describe('buildTimetableSampleCsv', () => {
  it('có BOM và ngăn bằng dấu chấm phẩy', () => {
    const csv = buildTimetableSampleCsv(['12A1']);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toContain('Lớp;Thứ;Tiết;Môn;Giáo viên;Phòng');
  });

  it('tệp mẫu tự nạp lại được', () => {
    const plan = buildTimetablePlan({ text: buildTimetableSampleCsv(['12A1']) });
    expect(plan.error).toBeNull();
    expect(plan.summary.ready).toBe(2);
    expect(plan.summary.conflicts).toBe(0);
  });
});
