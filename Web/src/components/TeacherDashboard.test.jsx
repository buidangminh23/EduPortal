/**
 * What the giáo viên screen may say about a closed sổ điểm, and about who
 * changed a mark.
 *
 * Two things are being pinned here, and both are about not answering a question
 * the system has not asked:
 *
 *   1. A lock state that never arrived is not "mở". `isGradebookLocked` reads
 *      false while the read is in flight and false again when it failed, so a
 *      screen that treated false as an answer would open the form on a sổ điểm
 *      that may already be closed — and the teacher would find out at Cập nhật,
 *      after the column was full.
 *   2. An empty nhật ký sửa điểm is not "điểm chưa từng bị sửa". Row-level
 *      security shows assessment_history to Ban Giám Hiệu of that school and
 *      nobody else, so zero rows on a teacher's screen is the absence of an
 *      answer. Reading it as an acquittal would let this screen clear somebody
 *      on a question it never got to ask.
 *
 * The two pieces are rendered directly rather than through the dashboard: both
 * live inside modals that a static render never opens, and the dashboard puts
 * them there through `createPortal`, which react-dom/server does not do.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { GradebookLockNotice, MarkHistoryPanel } from './TeacherDashboard';

const YEAR = '2025-2026';
const SEMESTER = 2;

const STAFF = [
  { id: 'T01', name: 'Nguyễn Minh Triết', subject: 'Toán học' },
  { id: 'T02', name: 'Trần Thị Hồng Vân', subject: 'Ngữ văn' }
];

const CLOSED = {
  known: true,
  locked: true,
  row: { school_year: YEAR, semester: SEMESTER, locked_at: '2026-06-12T03:00:00.000Z', locked_by: 'T01' }
};

function notice(props) {
  return renderToStaticMarkup(
    <GradebookLockNotice schoolYear={YEAR} semester={SEMESTER} staff={STAFF} {...props} />
  );
}

function panel(props) {
  return renderToStaticMarkup(
    <MarkHistoryPanel subjectLabel="Toán học" staff={STAFF} {...props} />
  );
}

describe('GradebookLockNotice — a lock state nobody managed to read', () => {
  const html = notice({ lock: { known: false, locked: false, row: null }, isAdmin: false });

  it('says the state is unread rather than reporting the sổ điểm open', () => {
    expect(html).toContain('Chưa đọc được trạng thái khoá sổ điểm học kỳ II năm học 2025-2026');
    expect(html).toContain('không kết luận sổ đang mở');
  });

  it('claims neither that the book is closed nor that anybody closed it', () => {
    expect(html).not.toContain('đã khoá');
    expect(html).not.toContain('do ');
    expect(html).not.toContain('lúc ');
  });
});

describe('GradebookLockNotice — an open sổ điểm', () => {
  it('says nothing at all, so the one banner that appears means something', () => {
    expect(notice({ lock: { known: true, locked: false, row: null }, isAdmin: false })).toBe('');
  });
});

describe('GradebookLockNotice — a closed sổ điểm, read by a teacher', () => {
  const html = notice({ lock: CLOSED, isAdmin: false });

  it('names the học kỳ and the năm học, not just the term', () => {
    expect(html).toContain('Sổ điểm học kỳ II năm học 2025-2026 đã khoá');
  });

  it('says who closed it and when, from the lock row itself', () => {
    expect(html).toMatch(/lúc \d{2}:\d{2} ngày \d{2}\/\d{2}\/\d{4}/);
    expect(html).toContain('do Nguyễn Minh Triết');
  });

  it('tells the teacher they cannot write, and where to go instead', () => {
    expect(html).toContain('Giáo viên không nhập hay sửa được điểm của học kỳ này');
    expect(html).toContain('đề nghị Ban Giám Hiệu');
    expect(html).not.toContain('Ban Giám Hiệu vẫn sửa được');
  });
});

describe('GradebookLockNotice — a closed sổ điểm, read by Ban Giám Hiệu', () => {
  const html = notice({ lock: CLOSED, isAdmin: true });

  it('states the correction path and that the correction is recorded', () => {
    expect(html).toContain('Ban Giám Hiệu vẫn sửa được');
    expect(html).toContain('nhật ký sửa điểm');
  });
});

describe('GradebookLockNotice — a lock row that cannot say who or when', () => {
  const html = notice({
    lock: { known: true, locked: true, row: { locked_at: 'không rõ', locked_by: null } },
    isAdmin: false
  });

  it('drops the clause rather than printing a time it does not hold', () => {
    expect(html).toContain('đã khoá.');
    expect(html).not.toContain('lúc');
  });
});

describe('GradebookLockNotice — an account the staff list does not know', () => {
  const html = notice({
    lock: { known: true, locked: true, row: { locked_at: null, locked_by: '9f3c-uuid' } },
    isAdmin: false
  });

  it('labels the identifier as an account instead of dressing it as a name', () => {
    expect(html).toContain('do tài khoản 9f3c-uuid');
  });
});

describe('MarkHistoryPanel — before anybody asks', () => {
  it('renders nothing until the log is actually read', () => {
    expect(panel({ state: { status: 'idle', entries: [], error: null }, isAdmin: false })).toBe('');
  });
});

describe('MarkHistoryPanel — states that are not an answer', () => {
  it('says the read is running', () => {
    const html = panel({ state: { status: 'loading', entries: [], error: null }, isAdmin: false });
    expect(html).toContain('Đang đọc nhật ký sửa điểm');
  });

  it('calls a missing log a gap in the software, not a clean record', () => {
    const html = panel({ state: { status: 'unavailable', entries: [], error: null }, isAdmin: false });
    expect(html).toContain('không phải câu trả lời rằng điểm chưa từng bị sửa');
  });

  it('reports a failed read and refuses to conclude anything from it', () => {
    const html = panel({
      state: { status: 'failed', entries: [], error: 'Mất kết nối máy chủ.' },
      isAdmin: false
    });
    expect(html).toContain('Mất kết nối máy chủ.');
    expect(html).toContain('không kết luận điểm chưa từng bị sửa');
  });
});

describe('MarkHistoryPanel — an empty log', () => {
  const empty = { status: 'ready', entries: [], error: null };

  it('tells a teacher that an empty result is not a clean record', () => {
    const html = panel({ state: empty, isAdmin: false });
    expect(html).toContain('chỉ Ban Giám Hiệu đọc được');
    expect(html).toContain('hỏi Ban Giám Hiệu để có câu trả lời');
    expect(html).not.toContain('Nhật ký chưa ghi nhận lần sửa nào');
  });

  it('answers Ban Giám Hiệu plainly, because they are the reader of this table', () => {
    const html = panel({ state: empty, isAdmin: true });
    expect(html).toContain('Nhật ký chưa ghi nhận lần sửa nào cho môn Toán học');
    expect(html).not.toContain('chỉ Ban Giám Hiệu đọc được');
  });
});

describe('MarkHistoryPanel — a mark that was changed', () => {
  const html = panel({
    isAdmin: true,
    state: {
      status: 'ready',
      error: null,
      entries: [
        {
          id: 'h2',
          operation: 'UPDATE',
          changed_by: 'T02',
          changed_at: '2026-06-12T03:00:00.000Z',
          old_regular: [8, 7],
          new_regular: [8, 7],
          old_midterm: 7,
          new_midterm: 7,
          old_final: 6,
          new_final: 9,
          old_average: 6.8,
          new_average: 8.3
        },
        {
          id: 'h1',
          operation: 'INSERT',
          changed_by: 'T01',
          changed_at: null,
          old_regular: null,
          new_regular: [8, 7],
          old_midterm: null,
          new_midterm: 7,
          old_final: null,
          new_final: 6,
          old_average: null,
          new_average: 6.8
        }
      ]
    }
  });

  it('names who changed it and what kind of change it was', () => {
    expect(html).toContain('Trần Thị Hồng Vân');
    expect(html).toContain('sửa');
    expect(html).toContain('nhập lần đầu');
  });

  it('dates the change from the row, and says so plainly when it cannot', () => {
    expect(html).toMatch(/\d{2}:\d{2} ngày \d{2}\/\d{2}\/\d{4}/);
    expect(html).toContain('Không rõ thời điểm');
  });

  it('shows the columns that moved, from what to what', () => {
    expect(html).toContain('Cuối kỳ');
    expect(html).toContain('>6</td>');
    expect(html).toContain('>9</td>');
    expect(html).toContain('ĐTB môn');
    expect(html).toContain('>8.3</td>');
  });

  it('leaves out the columns nobody touched, so the edited digit is findable', () => {
    // Giữa kỳ went 7 → 7 on the UPDATE row; it appears only under the INSERT,
    // where it went from nothing to 7.
    expect(html.match(/Giữa kỳ/g)).toHaveLength(1);
    expect(html).toContain('chưa có');
  });

  it('counts the ĐĐGtx slots separately rather than as one lump', () => {
    expect(html).toContain('Thường xuyên 1');
    expect(html).toContain('Thường xuyên 2');
  });
});

describe('MarkHistoryPanel — a recorded change that moved no mark', () => {
  const html = panel({
    isAdmin: true,
    state: {
      status: 'ready',
      error: null,
      entries: [{
        id: 'h3',
        operation: 'UPDATE',
        changed_by: 'T01',
        changed_at: '2026-06-12T03:00:00.000Z',
        old_regular: [8],
        new_regular: [8],
        old_midterm: 7,
        new_midterm: 7,
        old_final: 6,
        new_final: 6,
        old_average: 6.8,
        new_average: 6.8
      }]
    }
  });

  it('says the row changed no column instead of drawing an empty table', () => {
    expect(html).toContain('Không có cột điểm nào đổi giá trị.');
    expect(html).not.toContain('Cột điểm');
  });
});
