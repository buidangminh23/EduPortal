import { describe, it, expect } from 'vitest';
import {
  parseDelimited, normaliseName, detectColumns, matchStudents,
  buildImportPlan, applyScoreToRecord, buildSampleCsv, SLOT
} from './gradeImport';

const roster = [
  { id: 's1', fullName: 'Nguyễn Văn An', code: 'HS001' },
  { id: 's2', fullName: 'Trần Thị Bình', code: 'HS002' },
  { id: 's3', fullName: 'Lê Văn An', code: 'HS003' },
  { id: 's4', fullName: 'Nguyễn Văn An', code: 'HS004' }   // trùng tên với s1
];

describe('parseDelimited', () => {
  it('đọc tệp ngăn bằng dấu phẩy', () => {
    const { header, rows } = parseDelimited('Họ và tên,Điểm\nNguyễn Văn An,8.5');
    expect(header).toEqual(['Họ và tên', 'Điểm']);
    expect(rows).toEqual([['Nguyễn Văn An', '8.5']]);
  });

  it('đọc tệp Excel tiếng Việt ngăn bằng dấu chấm phẩy', () => {
    const { header, rows } = parseDelimited('Họ và tên;Điểm\nTrần Thị Bình;9');
    expect(header).toEqual(['Họ và tên', 'Điểm']);
    expect(rows[0]).toEqual(['Trần Thị Bình', '9']);
  });

  it('bỏ BOM mà Excel chèn vào đầu tệp', () => {
    const { header } = parseDelimited('﻿Họ và tên,Điểm\nA,1');
    expect(header[0]).toBe('Họ và tên');
  });

  it('giữ nguyên dấu phẩy nằm trong dấu ngoặc kép', () => {
    const { rows } = parseDelimited('Tên,Ghi chú\n"An, Nguyễn Văn",ổn');
    expect(rows[0]).toEqual(['An, Nguyễn Văn', 'ổn']);
  });

  it('hiểu hai dấu nháy liền nhau là một dấu nháy', () => {
    const { rows } = parseDelimited('Tên,Ghi chú\n"Bạn ""An""",tốt');
    expect(rows[0][0]).toBe('Bạn "An"');
  });

  it('tệp rỗng trả về bảng rỗng, không ném lỗi', () => {
    expect(parseDelimited('')).toEqual({ header: [], rows: [] });
  });
});

describe('normaliseName', () => {
  it('bỏ dấu và chuẩn hoá khoảng trắng', () => {
    expect(normaliseName('Nguyễn  Văn   An')).toBe('nguyen van an');
  });

  it('đưa đ và Đ về d', () => {
    expect(normaliseName('Đỗ Đức')).toBe('do duc');
  });
});

describe('detectColumns', () => {
  it('nhận ra cột tên và cột điểm từ tiêu đề tiếng Việt', () => {
    const cols = detectColumns(['STT', 'Họ và tên', 'Điểm']);
    expect(cols.nameColumn).toBe(1);
    expect(cols.scoreColumns).toContain(2);
  });

  it('nhận ra tiêu đề tiếng Anh', () => {
    const cols = detectColumns(['Student Name', 'Score']);
    expect(cols.nameColumn).toBe(0);
    expect(cols.scoreColumns).toContain(1);
  });

  it('không nhầm cột mã thành cột điểm', () => {
    const cols = detectColumns(['Mã học sinh', 'Họ và tên', 'Điểm']);
    expect(cols.codeColumn).toBe(0);
    expect(cols.scoreColumns).toEqual([2]);
  });
});

describe('matchStudents', () => {
  it('khớp theo mã học sinh', () => {
    const out = matchStudents([['HS002', 'Trần Thị Bình']], { codeColumn: 0, nameColumn: 1 }, roster);
    expect(out[0].student.id).toBe('s2');
    expect(out[0].matchedBy).toBe('code');
  });

  it('khớp theo tên khi tên là duy nhất, kể cả khi mất dấu', () => {
    const out = matchStudents([['tran thi binh']], { nameColumn: 0, codeColumn: null }, roster);
    expect(out[0].student.id).toBe('s2');
    expect(out[0].matchedBy).toBe('name');
  });

  it('từ chối gán khi lớp có hai học sinh trùng tên', () => {
    const out = matchStudents([['Nguyễn Văn An']], { nameColumn: 0, codeColumn: null }, roster);
    expect(out[0].student).toBeNull();
    expect(out[0].problem).toMatch(/cùng tên/);
  });

  it('mã học sinh thắng tên khi cả hai cùng có', () => {
    const out = matchStudents([['HS004', 'Nguyễn Văn An']], { codeColumn: 0, nameColumn: 1 }, roster);
    expect(out[0].student.id).toBe('s4');
  });

  it('báo không tìm thấy khi học sinh ngoài danh sách lớp', () => {
    const out = matchStudents([['Phạm Văn Xa']], { nameColumn: 0, codeColumn: null }, roster);
    expect(out[0].student).toBeNull();
    expect(out[0].problem).toMatch(/Không tìm thấy/);
  });
});

describe('buildImportPlan', () => {
  const base = { roster, subject: 'Toán', semester: 1, slot: SLOT.REGULAR };

  it('tách được ba nhóm: ghi được, lỗi, không khớp', () => {
    const text = [
      'Mã học sinh,Họ và tên,Điểm',
      'HS001,Nguyễn Văn An,8.5',
      'HS002,Trần Thị Bình,11',      // vượt thang 10
      'HS999,Người Lạ,7'             // không có trong lớp
    ].join('\n');

    const plan = buildImportPlan({ ...base, text });
    expect(plan.summary).toEqual({ total: 3, ready: 1, failed: 1, unmatched: 1 });
    expect(plan.ready[0]).toMatchObject({ studentId: 's1', score: 8.5, subject: 'Toán', semester: 1 });
    expect(plan.failed[0].problem).toMatch(/0–10/);
  });

  it('bỏ qua ô điểm trống thay vì ghi thành 0', () => {
    const text = 'Mã học sinh,Họ và tên,Điểm\nHS001,Nguyễn Văn An,';
    const plan = buildImportPlan({ ...base, text });
    expect(plan.summary.ready).toBe(0);
    expect(plan.failed[0].problem).toMatch(/để trống/);
  });

  it('chấp nhận dấu phẩy thập phân kiểu Việt Nam', () => {
    const text = 'Mã học sinh;Họ và tên;Điểm\nHS001;Nguyễn Văn An;7,5';
    const plan = buildImportPlan({ ...base, text });
    expect(plan.ready[0].score).toBe(7.5);
  });

  it('chặn dòng bị tách thêm ô do dấu phẩy thập phân, không ghi điểm cụt', () => {
    // "7,5" trong tệp ngăn bằng dấu phẩy thành hai ô: ô điểm còn "7".
    // Ghi 7 là hạ nửa điểm mà không ai biết, nên dòng này phải bị từ chối.
    const text = 'Mã học sinh,Họ và tên,Điểm\nHS001,Nguyễn Văn An,7,5';
    const plan = buildImportPlan({ ...base, text });
    expect(plan.summary.ready).toBe(0);
    expect(plan.failed[0].problem).toMatch(/dấu phẩy thập phân/);
  });

  it('dòng đủ số ô vẫn ghi bình thường', () => {
    const text = 'Mã học sinh,Họ và tên,Điểm\nHS001,Nguyễn Văn An,7.5';
    const plan = buildImportPlan({ ...base, text });
    expect(plan.ready[0].score).toBe(7.5);
  });

  it('số dòng báo lỗi tính theo dòng trong tệp, kể cả dòng tiêu đề', () => {
    const text = 'Mã học sinh,Họ và tên,Điểm\nHS001,Nguyễn Văn An,8\nHS002,Trần Thị Bình,99';
    const plan = buildImportPlan({ ...base, text });
    expect(plan.failed[0].line).toBe(3);
  });

  it('báo lỗi rõ ràng khi không nhận ra cột điểm', () => {
    const text = 'Họ và tên,Ghi chú\nNguyễn Văn An,ổn';
    const plan = buildImportPlan({ ...base, text });
    expect(plan.error).toMatch(/cột điểm/);
    expect(plan.ready).toHaveLength(0);
  });

  it('tôn trọng ánh xạ cột do người dùng chọn tay', () => {
    const text = 'A,B,C\nHS001,bỏ qua,9';
    const plan = buildImportPlan({
      ...base, text, mapping: { codeColumn: 0, nameColumn: null, scoreColumns: [2] }
    });
    expect(plan.ready[0]).toMatchObject({ studentId: 's1', score: 9 });
  });

  it('trả về scoreColumn cả khi báo lỗi, để màn hình chọn cột đổ đúng giá trị', () => {
    const noName = buildImportPlan({ ...base, text: 'A,B\n1,2' });
    expect(noName.error).toBeTruthy();
    expect(noName.mapping).toHaveProperty('scoreColumn');

    const noScore = buildImportPlan({ ...base, text: 'Họ và tên,Ghi chú\nNguyễn Văn An,ổn' });
    expect(noScore.error).toMatch(/cột điểm/);
    expect(noScore.mapping.nameColumn).toBe(0);
    expect(noScore.mapping.scoreColumn).toBeNull();
  });

  it('tệp rỗng không làm hỏng chương trình', () => {
    const plan = buildImportPlan({ ...base, text: '' });
    expect(plan.error).toMatch(/rỗng/);
    expect(plan.summary.total).toBe(0);
  });
});

describe('buildSampleCsv', () => {
  it('ngăn bằng dấu chấm phẩy để điểm lẻ ghi dấu phẩy vẫn an toàn', () => {
    const csv = buildSampleCsv(roster.slice(0, 1));
    expect(csv).toContain('Mã học sinh;Họ và tên;Điểm');
    expect(csv).toContain('HS001;Nguyễn Văn An;');
  });

  it('có BOM để Excel đọc đúng tiếng Việt', () => {
    expect(buildSampleCsv(roster).startsWith('﻿')).toBe(true);
  });

  it('tệp mẫu nạp lại được và khớp học sinh theo mã', () => {
    // Vòng khép kín: xuất ra, điền điểm, nạp lại — nếu định dạng tự sinh mà
    // chính mình đọc không nổi thì tệp mẫu là cái bẫy chứ không phải trợ giúp.
    const sample = buildSampleCsv(roster.slice(0, 2));
    const filled = sample.replace('HS001;Nguyễn Văn An;', 'HS001;Nguyễn Văn An;7,5');
    const plan = buildImportPlan({
      text: filled, roster, subject: 'Toán', semester: 1, slot: SLOT.REGULAR
    });
    expect(plan.ready).toHaveLength(1);
    expect(plan.ready[0]).toMatchObject({ studentId: 's1', score: 7.5, matchedBy: 'code' });
  });

  it('bọc dấu nháy khi tên có dấu chấm phẩy', () => {
    const csv = buildSampleCsv([{ id: 'X1', fullName: 'Trần; Văn B' }]);
    expect(csv).toContain('"Trần; Văn B"');
  });
});

describe('applyScoreToRecord', () => {
  it('điền vào ô thường xuyên còn trống đầu tiên', () => {
    const { record } = applyScoreToRecord({ regular: [8, null], midterm: null, final: null }, 9, SLOT.REGULAR);
    expect(record.regular).toEqual([8, 9]);
  });

  it('không ghi đè điểm đã có khi các ô đều đầy', () => {
    const current = { regular: [7, 8, 9, 10], midterm: null, final: null };
    const { record, error } = applyScoreToRecord(current, 6, SLOT.REGULAR);
    expect(error).toMatch(/đủ 4 điểm/);
    expect(record).toBe(current);
  });

  it('ghi đúng ô giữa kỳ và cuối kỳ', () => {
    expect(applyScoreToRecord({ regular: [] }, 8, SLOT.MIDTERM).record.midterm).toBe(8);
    expect(applyScoreToRecord({ regular: [] }, 9, SLOT.FINAL).record.final).toBe(9);
  });

  it('không sửa bản ghi gốc', () => {
    const current = { regular: [null, null], midterm: null, final: null };
    applyScoreToRecord(current, 5, SLOT.REGULAR);
    expect(current.regular).toEqual([null, null]);
  });
});
