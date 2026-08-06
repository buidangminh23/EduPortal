/**
 * The Ban Giám hiệu control that closes a học kỳ, and what the screen has to
 * say before it does.
 *
 * Closing a sổ điểm stops every teacher in the school entering or correcting a
 * mark, so the card is held to three things:
 *
 *   - it names the năm học, because a lock is keyed by (năm học, học kỳ) and a
 *     học bạ follows a pupil for three years — "đã khoá học kỳ II" alone names
 *     one book of three;
 *   - it does not report the sổ điểm open when nobody has managed to read the
 *     lock state;
 *   - re-opening is not drawn as the peer of closing. Ban Giám Hiệu can correct
 *     a mark inside a closed book, and that correction is recorded; handing the
 *     whole staff a chốt học kỳ back is the rare thing, and it looks rare.
 *
 * Kept apart from `AdminOverview.test.jsx`, which is about the figures the page
 * is allowed to print.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext } from '../../context/AppContext';
import AdminOverview, { GradebookLockCard } from './AdminOverview';

const YEAR = '2025-2026';
const SEMESTER = 2;

const STAFF = [{ id: 'T01', name: 'Nguyễn Minh Triết', subject: 'Toán học' }];

function card(props) {
  return renderToStaticMarkup(
    <GradebookLockCard schoolYear={YEAR} semester={SEMESTER} staff={STAFF} {...props} />
  );
}

function page(context = {}) {
  return renderToStaticMarkup(
    <AppContext.Provider value={context}>
      <AdminOverview />
    </AppContext.Provider>
  );
}

describe('GradebookLockCard — a lock state nobody managed to read', () => {
  const html = card({ lock: { known: false, locked: false, row: null } });

  it('says so, instead of reporting the sổ điểm open', () => {
    expect(html).toContain('Chưa đọc được trạng thái khoá sổ điểm học kỳ II năm học 2025-2026');
    expect(html).toContain('không kết luận sổ đang mở');
  });

  it('offers neither closing nor re-opening on a state it does not have', () => {
    expect(html).not.toContain('Khoá sổ điểm học kỳ');
    expect(html).not.toContain('Mở lại sổ điểm');
  });
});

describe('GradebookLockCard — an open sổ điểm', () => {
  const html = card({ lock: { known: true, locked: false, row: null }, onSetLocked: () => ({ ok: true, errors: [] }) });

  it('names the năm học the sổ điểm belongs to', () => {
    expect(html).toContain('học kỳ II năm học 2025-2026');
  });

  it('offers closing, and nothing to re-open', () => {
    expect(html).toContain('Khoá sổ điểm học kỳ II');
    expect(html).not.toContain('Mở lại sổ điểm');
  });

  it('does not close on the first click — the confirmation is a separate step', () => {
    expect(html).not.toContain('Xác nhận khoá sổ điểm');
    expect(html).not.toContain('sẽ chặn mọi giáo viên');
  });
});

describe('GradebookLockCard — a closed sổ điểm', () => {
  const html = card({
    lock: {
      known: true,
      locked: true,
      row: { locked_at: '2026-06-12T03:00:00.000Z', locked_by: 'T01' }
    },
    onSetLocked: () => ({ ok: true, errors: [] })
  });

  it('says when it was closed and by whom, from the lock row', () => {
    expect(html).toContain('đã khoá');
    expect(html).toMatch(/lúc \d{2}:\d{2} ngày \d{2}\/\d{2}\/\d{4}/);
    expect(html).toContain('do Nguyễn Minh Triết');
  });

  it('states the correction path, so nobody re-opens the book to fix one digit', () => {
    expect(html).toContain('Ban Giám Hiệu sửa được');
    expect(html).toContain('nhật ký sửa điểm');
  });

  it('draws re-opening as an exception, not as a button beside the others', () => {
    expect(html).toContain('Mở lại sổ điểm — trường hợp ngoại lệ');
    // Nothing on a closed card is a primary action: the only button offered is
    // the plain text link above.
    expect(html).not.toContain('btn btn-primary');
  });
});

describe('GradebookLockCard — an account the staff list does not know', () => {
  it('labels the identifier as an account rather than dressing it as a name', () => {
    const html = card({
      lock: { known: true, locked: true, row: { locked_at: null, locked_by: '9f3c-uuid' } }
    });
    expect(html).toContain('do tài khoản 9f3c-uuid');
    expect(html).not.toContain('lúc');
  });
});

describe('AdminOverview — the năm học the page is about', () => {
  it('prints the năm học once the store records one', () => {
    expect(page({ schoolYear: YEAR, semester: SEMESTER })).toContain('Năm học 2025-2026');
  });

  it('prints no năm học when nothing has supplied one', () => {
    const html = page();
    expect(html).toContain('Học kỳ II');
    expect(html).not.toContain('Năm học');
  });

  it('carries the lock card, and says the state is unread on an empty context', () => {
    expect(page()).toContain('Chưa đọc được trạng thái khoá sổ điểm');
  });

  // The open state is the only one that asserts anything in bold; the unread
  // notice contains the words "sổ đang mở" inside the sentence denying them, so
  // the assertion is against the claim, not against the substring.
  const CLAIMS_OPEN = '<b>đang mở</b>';

  it('reports the sổ điểm open only when the context says so', () => {
    const html = page({ schoolYear: YEAR, semester: SEMESTER, isGradebookLocked: false });
    expect(html).toContain(CLAIMS_OPEN);
    expect(html).toContain('Khoá sổ điểm học kỳ II');
  });

  it('treats a failed lock read as unread rather than as open', () => {
    const html = page({
      schoolYear: YEAR,
      semester: SEMESTER,
      isGradebookLocked: false,
      storeError: { what: 'kiểm tra trạng thái khoá sổ điểm', message: 'Mất kết nối.' }
    });
    expect(html).toContain('Chưa đọc được trạng thái khoá sổ điểm');
    expect(html).not.toContain(CLAIMS_OPEN);
    expect(html).not.toContain('Khoá sổ điểm học kỳ II');
  });

  it('leaves an unrelated store error alone, and still reports the lock it read', () => {
    const html = page({
      schoolYear: YEAR,
      semester: SEMESTER,
      isGradebookLocked: false,
      storeError: { what: 'lưu điểm môn Math', message: 'Mất kết nối.' }
    });
    expect(html).toContain(CLAIMS_OPEN);
  });
});
