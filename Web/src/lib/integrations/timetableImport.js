/**
 * Nhận thời khoá biểu từ tệp do phần mềm xếp lịch xuất ra.
 *
 * Trường xếp thời khoá biểu bằng phần mềm chạy trên một máy tính ở phòng văn
 * thư, rồi in ra giấy dán bảng và gửi ảnh vào nhóm lớp. Ai cần tra thì nhìn
 * ảnh. Module này nhận tệp đó vào hệ thống để mỗi vai trò thấy đúng phần của
 * mình, và để điểm danh theo tiết có chỗ bám vào.
 *
 * Giá trị thật không nằm ở việc đọc tệp — mà ở chỗ **soát trùng lịch**. Một
 * tệp thời khoá biểu nhìn bằng mắt thì không thấy được một thầy cô bị xếp dạy
 * hai lớp cùng một tiết, hay hai lớp cùng vào một phòng. Sai kiểu đó chỉ lộ ra
 * vào đúng sáng thứ Hai khi hai lớp đứng trước một cửa phòng.
 *
 * Như gradeImport, module này **không ghi** gì: nó dựng bản kê và danh sách
 * xung đột để người phụ trách quyết định.
 */

import { parseDelimited, normaliseName } from './gradeImport';

/** Thứ trong tuần, theo cách nhà trường gọi. */
export const DAYS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

/** Số tiết tối đa một buổi học chính khoá kéo dài. */
export const MAX_PERIOD = 10;

/**
 * Đưa mọi cách viết thứ về một dạng.
 *
 * Mỗi phần mềm ghi một kiểu: "2", "T2", "Thứ 2", "Thứ Hai", "Monday". Không
 * chuẩn hoá thì cùng một buổi sáng bị tách thành bốn ngày khác nhau.
 *
 * @returns {string|null} Một giá trị trong DAYS, hoặc null nếu không hiểu.
 */
export function normaliseDay(value) {
  const raw = normaliseName(value);
  if (!raw) return null;

  const WORDS = {
    hai: 'Thứ 2', ba: 'Thứ 3', tu: 'Thứ 4', nam: 'Thứ 5',
    sau: 'Thứ 6', bay: 'Thứ 7', 'chu nhat': 'Chủ nhật', cn: 'Chủ nhật',
    monday: 'Thứ 2', tuesday: 'Thứ 3', wednesday: 'Thứ 4', thursday: 'Thứ 5',
    friday: 'Thứ 6', saturday: 'Thứ 7', sunday: 'Chủ nhật'
  };

  const cleaned = raw.replace(/^(thu|t)\s*/, '').trim();
  if (WORDS[cleaned]) return WORDS[cleaned];
  if (WORDS[raw]) return WORDS[raw];

  const num = Number.parseInt(cleaned, 10);
  if (Number.isInteger(num) && num >= 2 && num <= 7) return `Thứ ${num}`;
  if (num === 8 || num === 1) return 'Chủ nhật';   // vài nơi đánh CN là 1 hoặc 8

  return null;
}

/**
 * Đọc số tiết.
 *
 * Chấp nhận "1", "Tiết 1", "T1". Từ chối 0 và số vượt MAX_PERIOD: một tiết thứ
 * 15 gần như luôn là cột bị đọc lệch, và xếp nó vào lịch thì không ai phát hiện.
 */
export function parsePeriod(value) {
  const raw = normaliseName(value).replace(/^(tiet|t)\s*/, '').trim();
  const num = Number.parseInt(raw, 10);
  if (!Number.isInteger(num)) return { valid: false, error: 'Số tiết không đọc được.', value: null };
  if (num < 1 || num > MAX_PERIOD) {
    return { valid: false, error: `Số tiết phải nằm trong khoảng 1–${MAX_PERIOD}.`, value: null };
  }
  return { valid: true, error: null, value: num };
}

const HINTS = {
  classTarget: ['lop', 'ten lop', 'class'],
  dayOfWeek: ['thu', 'ngay', 'day'],
  period: ['tiet', 'period', 'ca'],
  subject: ['mon', 'mon hoc', 'subject'],
  teacherName: ['giao vien', 'gv', 'teacher', 'ho ten'],
  room: ['phong', 'phong hoc', 'room']
};

/**
 * Đoán cột theo tiêu đề.
 *
 * `dayOfWeek` được dò sau `subject` và `teacherName` một cách có chủ ý: chuỗi
 * "thu" nằm trong "thứ" nhưng cũng nằm trong "thủ" của nhiều tiêu đề khác, nên
 * để nó dò trước thì nó cướp mất cột của người khác.
 */
export function detectTimetableColumns(header = []) {
  const norm = header.map((h) => normaliseName(h));
  const used = new Set();

  const find = (hints) => {
    for (let i = 0; i < norm.length; i += 1) {
      if (!used.has(i) && hints.some((h) => norm[i] === h)) { used.add(i); return i; }
    }
    for (let i = 0; i < norm.length; i += 1) {
      if (!used.has(i) && hints.some((h) => norm[i].includes(h))) { used.add(i); return i; }
    }
    return null;
  };

  const order = ['classTarget', 'subject', 'teacherName', 'room', 'period', 'dayOfWeek'];
  const out = {};
  order.forEach((field) => { out[field] = find(HINTS[field]); });
  return out;
}

const keyOf = (a, b, c) => `${a}|${b}|${c}`;

/**
 * Tìm các tiết đụng nhau.
 *
 * Ba loại, tách riêng vì cách xử lý khác nhau:
 *   - `class`   hai môn cùng rơi vào một tiết của một lớp
 *   - `teacher` một thầy cô bị xếp dạy hai lớp cùng lúc
 *   - `room`    hai lớp cùng vào một phòng
 *
 * Phòng để trống thì không tính là đụng nhau — nhiều trường không ghi phòng cho
 * tiết học tại lớp của mình, và báo trùng ở đó chỉ tạo nhiễu.
 */
export function findConflicts(slots = []) {
  const seen = { class: new Map(), teacher: new Map(), room: new Map() };
  const conflicts = [];

  slots.forEach((slot) => {
    const checks = [
      { kind: 'class', key: keyOf(slot.classTarget, slot.dayOfWeek, slot.period), label: `lớp ${slot.classTarget}` },
      slot.teacherName
        ? { kind: 'teacher', key: keyOf(normaliseName(slot.teacherName), slot.dayOfWeek, slot.period), label: slot.teacherName }
        : null,
      slot.room
        ? { kind: 'room', key: keyOf(normaliseName(slot.room), slot.dayOfWeek, slot.period), label: slot.room }
        : null
    ].filter(Boolean);

    checks.forEach(({ kind, key, label }) => {
      const first = seen[kind].get(key);
      if (first) {
        conflicts.push({
          kind,
          label,
          dayOfWeek: slot.dayOfWeek,
          period: slot.period,
          lines: [first.line, slot.line],
          detail: kind === 'class'
            ? `${label} có hai môn cùng ${slot.dayOfWeek} tiết ${slot.period}: ${first.subject} và ${slot.subject}.`
            : kind === 'teacher'
              ? `${label} bị xếp dạy hai lớp cùng ${slot.dayOfWeek} tiết ${slot.period}: ${first.classTarget} và ${slot.classTarget}.`
              : `Phòng ${label} có hai lớp cùng ${slot.dayOfWeek} tiết ${slot.period}: ${first.classTarget} và ${slot.classTarget}.`
        });
      } else {
        seen[kind].set(key, slot);
      }
    });
  });

  return conflicts;
}

/**
 * Dựng bản kê thời khoá biểu để người phụ trách duyệt.
 *
 * @param {object} input
 * @param {string} input.text             Nội dung tệp.
 * @param {object} [input.mapping]        Ánh xạ cột do người dùng chọn.
 * @param {string[]} [input.knownClasses] Danh sách lớp có thật, để cảnh báo lớp lạ.
 */
export function buildTimetablePlan({ text, mapping, knownClasses = [] } = {}) {
  const { header, rows } = parseDelimited(text);

  const empty = {
    header, mapping: null, ready: [], failed: [], conflicts: [],
    summary: { total: 0, ready: 0, failed: 0, conflicts: 0 }
  };

  if (header.length === 0) {
    return { ...empty, error: 'Tệp rỗng hoặc không đọc được nội dung.' };
  }

  const cols = { ...detectTimetableColumns(header), ...(mapping || {}) };
  const shape = { header, mapping: cols, ready: [], failed: [], conflicts: [] };

  const missing = ['classTarget', 'dayOfWeek', 'period', 'subject']
    .filter((f) => cols[f] === null || cols[f] === undefined);

  if (missing.length > 0) {
    const names = { classTarget: 'lớp', dayOfWeek: 'thứ', period: 'tiết', subject: 'môn' };
    return {
      ...shape,
      summary: { total: rows.length, ready: 0, failed: rows.length, conflicts: 0 },
      error: `Chưa nhận ra cột: ${missing.map((f) => names[f]).join(', ')} — hãy chọn cột thủ công.`
    };
  }

  const knownSet = new Set(knownClasses.map((c) => normaliseName(c)));
  const ready = [];
  const failed = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const cell = (field) => (cols[field] === null || cols[field] === undefined ? '' : (row[cols[field]] ?? '').trim());

    const classTarget = cell('classTarget');
    const subject = cell('subject');
    const day = normaliseDay(cell('dayOfWeek'));
    const period = parsePeriod(cell('period'));

    const problems = [];
    if (!classTarget) problems.push('thiếu tên lớp');
    if (!subject) problems.push('thiếu tên môn');
    if (!day) problems.push(`không hiểu thứ "${cell('dayOfWeek')}"`);
    if (!period.valid) problems.push(period.error.replace(/\.$/, '').toLowerCase());

    if (problems.length > 0) {
      failed.push({ line, classTarget, problem: problems.join('; ') + '.' });
      return;
    }

    ready.push({
      line,
      classTarget,
      dayOfWeek: day,
      period: period.value,
      subject,
      teacherName: cell('teacherName') || null,
      room: cell('room') || null,
      // Lớp lạ không phải lỗi chặn: trường có thể vừa mở lớp mới mà chưa nhập
      // vào hệ thống. Nhưng nó thường là gõ sai tên lớp, nên phải nói ra.
      unknownClass: knownSet.size > 0 && !knownSet.has(normaliseName(classTarget))
    });
  });

  const conflicts = findConflicts(ready);

  return {
    ...shape,
    ready,
    failed,
    conflicts,
    summary: {
      total: rows.length,
      ready: ready.length,
      failed: failed.length,
      conflicts: conflicts.length,
      unknownClasses: ready.filter((s) => s.unknownClass).length
    },
    error: null
  };
}

/**
 * Đổi bản kê thành các tiết để lưu.
 *
 * Mã sinh từ nội dung (lớp + thứ + tiết) để đọc được bằng mắt khi cần dò lỗi.
 * Nhưng nội dung một mình không đủ làm mã duy nhất: khi tệp có chỗ "lớp trùng
 * tiết" — thứ bản kê đã cảnh báo mà người phụ trách vẫn có quyền nạp — hai tiết
 * sẽ rơi vào cùng một mã. Mã trùng làm hỏng danh sách hiển thị và làm hàm đổi
 * tiết bắt nhầm tiết, nên chỗ đụng được thêm hậu tố.
 *
 * Không cần mã ổn định giữa các lần nạp: `importTimetableSlots` thay trọn gói
 * theo lớp, nên việc khớp tiết cũ với tiết mới không đi qua mã.
 */
export function toTimetableSlots(ready = []) {
  const used = new Set();

  return ready.map((s) => {
    const base = `TB-${normaliseName(s.classTarget).replace(/\s+/g, '')}-${s.dayOfWeek.replace(/\s+/g, '')}-${s.period}`;
    let id = base;
    let n = 2;
    while (used.has(id)) { id = `${base}-${n}`; n += 1; }
    used.add(id);

    return {
      id,
      classTarget: s.classTarget,
      dayOfWeek: s.dayOfWeek,
      period: s.period,
      subject: s.subject,
      teacherName: s.teacherName || '',
      room: s.room || ''
    };
  });
}

/** Tệp mẫu, ngăn bằng dấu chấm phẩy và có BOM — cùng lý do như tệp điểm mẫu. */
export function buildTimetableSampleCsv(classes = ['12A1']) {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [['Lớp', 'Thứ', 'Tiết', 'Môn', 'Giáo viên', 'Phòng'].map(esc).join(';')];
  const cls = classes[0] || '12A1';
  lines.push([esc(cls), 'Thứ 2', '1', 'Toán học', '', ''].join(';'));
  lines.push([esc(cls), 'Thứ 2', '2', 'Ngữ văn', '', ''].join(';'));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}
