/**
 * Nhận điểm từ tệp do phần mềm khác xuất ra.
 *
 * Giáo viên chấm bài trên Azota, Google Classroom hay một bảng tính riêng, rồi
 * gõ lại từng con điểm vào sổ. Đây là bước bị kêu nhiều nhất, và cũng là bước
 * dễ sai nhất — gõ nhầm một cột là sai học bạ, mà điểm học bạ nay chiếm 50%
 * xét tốt nghiệp.
 *
 * Module này chỉ đọc và đối chiếu. Nó **không ghi** gì cả: kết quả trả về là
 * một bản kê để giáo viên nhìn trước khi quyết định. Điểm là dữ liệu pháp lý,
 * nên bước xác nhận của con người không được bỏ, kể cả khi máy chắc chắn.
 *
 * Việc chấm điểm thuộc về lib/domain/grading.js. Ở đây không tự nghĩ ra luật
 * nào về khoảng điểm hay số chữ số thập phân — mọi con số đều đi qua
 * validateScore để một quy tắc chỉ được viết ở một chỗ.
 */

import { validateScore } from '../domain/grading';

/** Cột điểm rơi vào ô nào của sổ điểm. */
export const SLOT = {
  REGULAR: 'regular',   // ĐĐGtx — thường xuyên
  MIDTERM: 'midterm',   // ĐĐGgk — giữa kỳ
  FINAL: 'final'        // ĐĐGck — cuối kỳ
};

/**
 * Tách một dòng CSV/TSV, tôn trọng dấu ngoặc kép.
 *
 * Viết tay thay vì kéo thêm thư viện: tệp điểm là bảng phẳng vài trăm dòng,
 * và một phụ thuộc mới phải trả giá bằng bảo mật lẫn dung lượng gói tải về.
 * Quy tắc theo RFC 4180 — hai dấu nháy liền nhau bên trong chuỗi là một dấu.
 */
function splitLine(line, delimiter) {
  const out = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i += 1; } else { quoted = false; }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === delimiter) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((cell) => cell.trim());
}

/**
 * Đoán dấu phân cách.
 *
 * Excel bản tiếng Việt xuất ra tệp ngăn bằng dấu chấm phẩy, vì dấu phẩy đã
 * dùng làm dấu thập phân. Đoán sai thì cả bảng dồn vào một cột, nên thà đếm
 * trên dòng đầu còn hơn bắt người dùng khai báo.
 */
function detectDelimiter(firstLine) {
  const counts = [
    { d: '\t', n: (firstLine.match(/\t/g) || []).length },
    { d: ';', n: (firstLine.match(/;/g) || []).length },
    { d: ',', n: (firstLine.match(/,/g) || []).length }
  ];
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

/**
 * Đọc nội dung tệp thành bảng.
 *
 * @param {string} text Nội dung tệp CSV/TSV đã đọc ra chuỗi.
 * @returns {{ header: string[], rows: string[][] }}
 */
export function parseDelimited(text) {
  const clean = String(text ?? '').replace(/^\uFEFF/, '');   // bỏ BOM của Excel
  const lines = clean.split(/\r\n|\n|\r/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { header: [], rows: [] };

  const delimiter = detectDelimiter(lines[0]);
  const header = splitLine(lines[0], delimiter);
  const rows = lines.slice(1).map((l) => splitLine(l, delimiter));
  return { header, rows };
}

/**
 * Bỏ dấu tiếng Việt và chuẩn hoá khoảng trắng, để so khớp tên.
 *
 * "Nguyễn  Văn  An" và "nguyen van an" phải khớp nhau: danh sách xuất từ phần
 * mềm khác thường mất dấu hoặc thừa khoảng trắng, và bắt giáo viên sửa tay
 * từng dòng thì module này mất hết ý nghĩa.
 */
export function normaliseName(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const NAME_HINTS = ['ho va ten', 'ho ten', 'hoten', 'ten hoc sinh', 'full name', 'student name', 'name'];
const CODE_HINTS = ['ma hoc sinh', 'ma hs', 'mahs', 'ma dinh danh', 'student id', 'id', 'email'];
const SCORE_HINTS = ['diem', 'score', 'grade', 'mark', 'ket qua', 'points'];

/**
 * Đoán xem cột nào là tên, cột nào là mã, cột nào là điểm.
 *
 * Chỉ là gợi ý ban đầu — giao diện vẫn phải cho giáo viên đổi lại. Tệp từ mỗi
 * phần mềm có tiêu đề khác nhau, và đoán sai mà im lặng thì tệ hơn không đoán.
 *
 * @returns {{ nameColumn: number|null, codeColumn: number|null, scoreColumns: number[] }}
 */
export function detectColumns(header = []) {
  const norm = header.map((h) => normaliseName(h));
  const findBy = (hints) => {
    for (let i = 0; i < norm.length; i += 1) {
      if (hints.some((hint) => norm[i] === hint)) return i;
    }
    for (let i = 0; i < norm.length; i += 1) {
      if (hints.some((hint) => norm[i].includes(hint))) return i;
    }
    return null;
  };

  const nameColumn = findBy(NAME_HINTS);
  const codeColumn = findBy(CODE_HINTS);

  const scoreColumns = [];
  norm.forEach((h, i) => {
    if (i === nameColumn || i === codeColumn) return;
    if (SCORE_HINTS.some((hint) => h.includes(hint))) scoreColumns.push(i);
  });

  return { nameColumn, codeColumn, scoreColumns };
}

/**
 * Ghép từng dòng của tệp với một học sinh trong lớp.
 *
 * Khớp theo mã trước, theo tên sau: mã là định danh, tên thì trùng nhau nhiều —
 * một lớp có hai "Nguyễn Văn An" là chuyện bình thường. Khi tên trùng mà không
 * có mã để phân biệt, dòng đó bị đánh dấu mập mờ chứ không gán bừa cho người
 * đầu tiên tìm thấy; gán nhầm điểm cho bạn cùng tên là lỗi không ai phát hiện
 * cho tới lúc phát học bạ.
 *
 * @param {string[][]} rows Các dòng dữ liệu.
 * @param {{ nameColumn: number|null, codeColumn: number|null }} mapping
 * @param {Array<{ id: string, fullName: string, code?: string }>} roster Học sinh của lớp.
 */
export function matchStudents(rows, mapping, roster = []) {
  const byCode = new Map();
  const byName = new Map();

  roster.forEach((student) => {
    if (student.code) byCode.set(normaliseName(student.code), student);
    const key = normaliseName(student.fullName);
    if (!byName.has(key)) byName.set(key, []);
    byName.get(key).push(student);
  });

  return rows.map((row, index) => {
    const rawCode = mapping.codeColumn === null || mapping.codeColumn === undefined
      ? '' : row[mapping.codeColumn] ?? '';
    const rawName = mapping.nameColumn === null || mapping.nameColumn === undefined
      ? '' : row[mapping.nameColumn] ?? '';

    if (rawCode) {
      const hit = byCode.get(normaliseName(rawCode));
      if (hit) return { rowIndex: index, student: hit, matchedBy: 'code', rawName, rawCode };
    }

    if (rawName) {
      const hits = byName.get(normaliseName(rawName)) || [];
      if (hits.length === 1) {
        return { rowIndex: index, student: hits[0], matchedBy: 'name', rawName, rawCode };
      }
      if (hits.length > 1) {
        return {
          rowIndex: index, student: null, matchedBy: null, rawName, rawCode,
          problem: `Lớp có ${hits.length} học sinh cùng tên "${rawName}" — cần mã học sinh để phân biệt.`
        };
      }
    }

    return {
      rowIndex: index, student: null, matchedBy: null, rawName, rawCode,
      problem: rawName || rawCode
        ? `Không tìm thấy "${rawName || rawCode}" trong danh sách lớp.`
        : 'Dòng không có tên và cũng không có mã học sinh.'
    };
  });
}

/**
 * Dựng bản kê để giáo viên duyệt trước khi ghi vào sổ.
 *
 * Trả về ba nhóm tách bạch — ghi được, có lỗi, không khớp học sinh — vì màn
 * hình xác nhận cần nói rõ "sẽ ghi bao nhiêu, bỏ qua bao nhiêu, vì sao".
 * Nhập một mạch rồi báo "xong" là cách chắc chắn để một con điểm sai lọt vào
 * học bạ mà không ai biết.
 *
 * @param {object} input
 * @param {string} input.text        Nội dung tệp.
 * @param {Array}  input.roster      Học sinh trong lớp: { id, fullName, code? }.
 * @param {object} [input.mapping]   Ánh xạ cột do người dùng chọn; thiếu thì tự đoán.
 * @param {string} input.subject     Môn học.
 * @param {number} input.semester    Học kỳ 1 hoặc 2.
 * @param {string} input.slot        Ô điểm đích, xem SLOT.
 */
export function buildImportPlan({
  text, roster = [], mapping, subject, semester, slot = SLOT.REGULAR
} = {}) {
  const { header, rows } = parseDelimited(text);

  if (header.length === 0) {
    return {
      header: [], mapping: null, ready: [], failed: [], unmatched: [],
      summary: { total: 0, ready: 0, failed: 0, unmatched: 0 },
      error: 'Tệp rỗng hoặc không đọc được nội dung.'
    };
  }

  const detected = detectColumns(header);
  const cols = { ...detected, ...(mapping || {}) };
  const scoreColumn = (cols.scoreColumns && cols.scoreColumns.length > 0)
    ? cols.scoreColumns[0] : null;

  // `scoreColumn` có mặt trong mọi đường trả về, kể cả đường báo lỗi. Màn hình
  // chọn cột đọc thẳng giá trị này để đổ vào ô chọn; thiếu nó ở nhánh lỗi thì
  // ô chọn hiện trống trong khi máy đã đoán đúng, và người dùng phải chọn lại
  // một thứ vốn không sai.
  const shape = { header, mapping: { ...cols, scoreColumn }, ready: [], failed: [], unmatched: [] };

  if (cols.nameColumn === null && cols.codeColumn === null) {
    return {
      ...shape,
      summary: { total: rows.length, ready: 0, failed: 0, unmatched: rows.length },
      error: 'Không nhận ra cột họ tên hoặc mã học sinh — hãy chọn cột thủ công.'
    };
  }

  if (scoreColumn === null) {
    return {
      ...shape,
      summary: { total: rows.length, ready: 0, failed: 0, unmatched: rows.length },
      error: 'Không nhận ra cột điểm — hãy chọn cột thủ công.'
    };
  }

  const matches = matchStudents(rows, cols, roster);
  const ready = [];
  const failed = [];
  const unmatched = [];

  matches.forEach((m) => {
    const row = rows[m.rowIndex];
    const raw = row[scoreColumn] ?? '';

    // Dòng nhiều ô hơn tiêu đề gần như luôn là dấu phẩy thập phân trong tệp
    // ngăn bằng dấu phẩy: "7,5" bị tách thành "7" và "5", nên ô điểm còn 7.
    // Đây là kiểu sai nguy hiểm nhất của cả module — không có thông báo nào,
    // con số vẫn hợp lệ, và điểm bị hạ đúng nửa điểm. Chặn thẳng ở đây thay vì
    // đoán ý người dùng, vì đoán sai thì lại ghi một con điểm khác cũng sai.
    if (row.length > header.length) {
      failed.push({
        line: m.rowIndex + 2,
        studentId: m.student?.id ?? null,
        fullName: m.student?.fullName ?? m.rawName,
        rawScore: raw,
        problem: `Dòng có ${row.length} ô nhưng tiêu đề chỉ có ${header.length} cột — nhiều khả năng điểm ghi dấu phẩy thập phân trong tệp ngăn bằng dấu phẩy. Hãy dùng dấu chấm, hoặc lưu tệp ngăn bằng dấu chấm phẩy.`
      });
      return;
    }

    if (!m.student) {
      unmatched.push({ line: m.rowIndex + 2, rawName: m.rawName, rawCode: m.rawCode, rawScore: raw, problem: m.problem });
      return;
    }

    // Ô trống là "chưa chấm", không phải điểm 0. Ghi 0 vào đó là hạ điểm một
    // học sinh chưa nộp bài — sai theo hướng gây thiệt hại cho người học.
    if (String(raw).trim() === '') {
      failed.push({
        line: m.rowIndex + 2, studentId: m.student.id, fullName: m.student.fullName,
        rawScore: raw, problem: 'Ô điểm để trống — bỏ qua để không ghi nhầm thành 0.'
      });
      return;
    }

    const check = validateScore(raw);
    if (!check.valid) {
      failed.push({
        line: m.rowIndex + 2, studentId: m.student.id, fullName: m.student.fullName,
        rawScore: raw, problem: check.error
      });
      return;
    }

    ready.push({
      line: m.rowIndex + 2,
      studentId: m.student.id,
      fullName: m.student.fullName,
      matchedBy: m.matchedBy,
      score: check.value,
      subject,
      semester,
      slot
    });
  });

  return {
    header,
    mapping: { ...cols, scoreColumn },
    ready,
    failed,
    unmatched,
    summary: { total: rows.length, ready: ready.length, failed: failed.length, unmatched: unmatched.length },
    error: null
  };
}

/**
 * Sinh tệp mẫu từ chính danh sách lớp.
 *
 * Hai lựa chọn ở đây đều là để tệp sống sót qua Excel bản tiếng Việt:
 *
 * Ngăn bằng dấu chấm phẩy, không phải dấu phẩy. Giáo viên quen gõ "7,5" chứ
 * không phải "7.5"; nếu tệp mẫu ngăn bằng dấu phẩy thì con điểm đó tự tách
 * làm hai ô. Bản kê sẽ chặn lại, nhưng chặn một lỗi do chính tệp mẫu gây ra
 * thì thà đừng gây ra.
 *
 * Có BOM ở đầu. Thiếu nó, Excel đọc UTF-8 thành bảng mã khác và toàn bộ tên
 * học sinh hiện thành ký tự lạ — người dùng sẽ nghĩ hệ thống hỏng.
 *
 * @param {Array<{ id: string, fullName: string }>} roster
 * @param {string} [scoreHeader] Nhãn cột điểm, mặc định là "Điểm".
 */
export function buildSampleCsv(roster = [], scoreHeader = 'Điểm') {
  const esc = (v) => {
    const s = String(v ?? '');
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  // Ghi mã học sinh, không phải khoá nội bộ. Trong bản chạy trên cơ sở dữ liệu
  // `id` là một chuỗi UUID: xuất ra thì thầy cô nhận một cột vô nghĩa, và lần
  // nạp lại cũng không khớp được vì việc đối chiếu đi theo mã.
  const lines = [['Mã học sinh', 'Họ và tên', scoreHeader].map(esc).join(';')];
  roster.forEach((s) => lines.push([esc(s.code ?? s.id), esc(s.fullName), ''].join(';')));
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}

/**
 * Ghép điểm mới vào bản ghi môn học đang có.
 *
 * Trả về bản ghi mới thay vì sửa tại chỗ, để bên gọi còn so được trước và sau
 * mà hiện lên cho giáo viên xem. Với ĐĐGtx, điểm rơi vào ô trống đầu tiên;
 * hết ô thì báo lỗi chứ không đẩy điểm cũ ra — ghi đè im lặng lên một con
 * điểm đã có là mất dữ liệu.
 *
 * @param {{ regular?: Array, midterm?: number|null, final?: number|null }} current
 * @param {number} score
 * @param {string} slot
 */
export function applyScoreToRecord(current, score, slot) {
  const record = {
    regular: Array.isArray(current?.regular) ? [...current.regular] : [],
    midterm: current?.midterm ?? null,
    final: current?.final ?? null
  };

  if (slot === SLOT.MIDTERM) return { record: { ...record, midterm: score }, error: null };
  if (slot === SLOT.FINAL) return { record: { ...record, final: score }, error: null };

  const emptyAt = record.regular.findIndex((v) => v === null || v === undefined);
  if (emptyAt === -1) {
    if (record.regular.length >= 4) {
      return { record: current, error: 'Đã đủ 4 điểm thường xuyên — không thêm được nữa.' };
    }
    record.regular.push(score);
    return { record, error: null };
  }

  record.regular[emptyAt] = score;
  return { record, error: null };
}
