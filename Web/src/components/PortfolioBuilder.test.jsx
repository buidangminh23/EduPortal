/**
 * What the printed page is allowed to be, and to say.
 *
 * The page used to print a decorated card: four subjects, a hologram, a
 * fabricated 175/175 chuyên cần and a fake seal. It now prints a summary of what
 * the school has recorded. Two kinds of assertion follow from that, and both
 * matter equally — that every figure on the page traces to a record, and that
 * the page never dresses itself up as the học bạ, which follows a form of the Bộ
 * Giáo dục và Đào tạo that this app does not have.
 *
 * Rendering goes through react-dom/server: the document has no behaviour a
 * static render misses.
 */

import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AppContext } from '../context/AppContext';
import { ATTENDANCE_STATUS } from '../lib/domain/attendance';
import { COMMENT_RESULT, LEARNING_BAND } from '../lib/domain/grading';
import PortfolioBuilder from './PortfolioBuilder';

const STUDENT = { id: 'HS900', name: 'Trần Bảo An', class: '10A1' };

const SCHOOL_YEAR = '2025-2026';

/**
 * Rendered in the parent's role so only the document is on the page: the
 * teacher's editor and the admin's roster repeat the same achievements, and an
 * assertion could not then tell which panel it had matched.
 */
function render(student, context = {}) {
  const value = {
    currentRole: 'parent',
    students: [student],
    selectedStudentId: student.id,
    schoolYear: SCHOOL_YEAR,
    ...context
  };
  return renderToStaticMarkup(
    <AppContext.Provider value={value}>
      <PortfolioBuilder />
    </AppContext.Provider>
  );
}

/**
 * One titled block of the document, from its heading to the next block.
 *
 * "Chưa đạt" is both a verdict on a student and a word in the legend under the
 * table, so an assertion about the xếp loại lines has to be able to look at the
 * xếp loại lines rather than at the whole page.
 */
function section(html, title) {
  const start = html.indexOf(title);
  if (start < 0) throw new Error(`Không tìm thấy mục "${title}" trên trang.`);
  const end = html.indexOf('<section', start);
  return end < 0 ? html.slice(start) : html.slice(start, end);
}

/** Six subjects at 9,5 both học kỳ: enough for Điều 9 khoản 2 to reach Tốt. */
const STRAIGHT_NINES = {
  Literature: 9.5,
  Math: 9.5,
  English: 9.5,
  History: 9.5,
  DefenceEducation: 9.5,
  Physics: 9.5
};

describe('PortfolioBuilder — what the printed page says it is', () => {
  const html = render(STUDENT);

  it('states, before anything else, that it is not the học bạ', () => {
    expect(html).toContain('Bản tóm tắt nội bộ — không phải học bạ');
    expect(html).toContain('không phải học bạ');
    expect(html).toContain('theo mẫu của Bộ Giáo dục và Đào tạo');
  });

  it('says it carries no chữ ký số, and repeats it at the foot of the page', () => {
    expect(html).toContain('không có chữ ký số');
    expect(html.match(/không có chữ ký số/g).length).toBeGreaterThanOrEqual(2);
  });

  it('carries nothing that could pass for a signature, a seal or a code', () => {
    expect(html).not.toContain('blockchain');
    expect(html).not.toContain('Blockchain');
    expect(html).not.toContain('Mã xác thực');
    expect(html).not.toContain('QR');
    expect(html).not.toContain('Ký tên');
    expect(html).not.toContain('Hiệu trưởng');
    expect(html).not.toContain('CỘNG HÒA');
  });

  it('names the school and the năm học the results belong to', () => {
    expect(html).toContain('Tổng hợp kết quả học tập và rèn luyện');
    expect(html).toContain(SCHOOL_YEAR);
  });

  it('leaves the năm học unstated rather than guessing one', () => {
    const unstamped = render(STUDENT, { schoolYear: null });
    expect(unstamped).toContain('chưa xác định');
    expect(unstamped).not.toContain(SCHOOL_YEAR);
  });

  it('keeps the editing controls off the printed page', () => {
    expect(html).toContain('no-print');
    expect(html).toContain('.print-area');
    expect(html).toContain('@page');
  });
});

describe('PortfolioBuilder — the transcript table', () => {
  const student = {
    ...STUDENT,
    gradesSem1: { Math: 8.2 },
    grades: { Math: 8.5 }
  };

  it('reports học kỳ I, học kỳ II and cả năm for a subject that carries marks', () => {
    const html = render(student);
    expect(html).toContain('Học kỳ I');
    expect(html).toContain('Học kỳ II');
    expect(html).toContain('Cả năm');
    expect(html).toContain('8.2');
    expect(html).toContain('8.5');
    // ĐTBmcn = (8,2 + 2×8,5) / 3 — Điều 9 khoản 1.
    expect(html).toContain('8.4');
  });

  it('prints a row for every compulsory subject, blank while it is unmarked', () => {
    const html = render(student);
    expect(html).toContain('Ngữ văn');
    expect(html).toContain('Lịch sử');
    expect(html).toContain('Giáo dục quốc phòng và an ninh');
    expect(html).toContain('—');
  });

  it('lists no elective the school has recorded nothing for', () => {
    const html = render(student);
    expect(html).not.toContain('Hoá học');
    expect(html).not.toContain('Âm nhạc');
    expect(html).not.toContain('Mĩ thuật');
  });

  it('lists an elective once a result exists for it', () => {
    const html = render({ ...student, grades: { ...student.grades, Chemistry: 7.5 } });
    expect(html).toContain('Hoá học');
    expect(html).toContain('7.5');
  });

  it('keeps a mark whose subject the curriculum table no longer lists', () => {
    const html = render({ ...student, grades: { ...student.grades, Latin: 6.5 } });
    expect(html).toContain('Latin');
    expect(html).toContain('6.5');
  });

  it('reports a nhận xét subject as Đạt, never as a number', () => {
    const html = render({
      ...student,
      commentResults: { PhysicalEducation: { semester2: COMMENT_RESULT.PASS } }
    });
    expect(html).toContain('Giáo dục thể chất');
    expect(html).toContain(COMMENT_RESULT.PASS);
  });

  it('refuses to print a number that was stored against a nhận xét subject', () => {
    // Điều 5 gives these subjects no mark at all, so a number in that column is
    // a defect somewhere upstream — printing it would publish the defect as the
    // student's result.
    const html = render({ ...student, commentResults: { PhysicalEducation: { semester2: 9 } } });
    expect(html).not.toContain('>9<');
    expect(html).not.toContain('9.0');
  });
});

describe('PortfolioBuilder — xếp loại', () => {
  it('says why it cannot classify rather than reporting Chưa đạt', () => {
    // Điều 9 khoản 2 classifies over at least six subjects, so applied to one it
    // would report Chưa đạt for a student holding an 8,5.
    const bands = section(render({ ...STUDENT, grades: { Math: 8.5 } }), 'Xếp loại kết quả học tập');
    expect(bands).toContain('Chưa xếp loại');
    expect(bands).toContain('Mới có 1/6 môn đủ điểm');
    expect(bands).not.toContain(LEARNING_BAND.FAIL);
  });

  it('reports the band a full record supports', () => {
    const bands = section(
      render({ ...STUDENT, gradesSem1: STRAIGHT_NINES, grades: STRAIGHT_NINES }),
      'Xếp loại kết quả học tập'
    );
    expect(bands).toContain(LEARNING_BAND.GOOD);
    expect(bands).not.toContain('Chưa xếp loại');
  });
});

describe('PortfolioBuilder — kết quả rèn luyện', () => {
  it('prints the mức the giáo viên chủ nhiệm recorded for each học kỳ', () => {
    const html = render({
      ...STUDENT,
      conductResults: { semester1: LEARNING_BAND.FAIR, semester2: LEARNING_BAND.GOOD }
    });
    expect(html).toContain(LEARNING_BAND.FAIR);
    expect(html).toContain(LEARNING_BAND.GOOD);
  });

  it('says chưa đánh giá rather than defaulting a mức nobody chose', () => {
    expect(render(STUDENT)).toContain('Chưa đánh giá');
  });

  it('ignores a mức the circular does not recognise', () => {
    const html = render({ ...STUDENT, conductResults: { semester2: 'Xuất sắc' } });
    expect(html).not.toContain('Xuất sắc');
    expect(html).toContain('Chưa đánh giá');
  });
});

describe('PortfolioBuilder — danh hiệu', () => {
  const decorated = {
    ...STUDENT,
    gradesSem1: STRAIGHT_NINES,
    grades: STRAIGHT_NINES,
    conductResults: { semester1: LEARNING_BAND.GOOD, semester2: LEARNING_BAND.GOOD }
  };

  it('awards the danh hiệu Điều 15 supports', () => {
    expect(render(decorated)).toContain('Học sinh Xuất sắc');
  });

  it('waits for both cả năm results before saying anything about a danh hiệu', () => {
    const html = render({ ...decorated, conductResults: { semester2: LEARNING_BAND.GOOD } });
    expect(html).toContain('Chưa xét được');
    expect(html).not.toContain('Học sinh Xuất sắc');
  });
});

describe('PortfolioBuilder — chuyên cần', () => {
  const records = [
    { id: 'AT1', studentId: STUDENT.id, date: '2026-03-02', status: ATTENDANCE_STATUS.PRESENT },
    { id: 'AT2', studentId: STUDENT.id, date: '2026-03-03', status: ATTENDANCE_STATUS.PRESENT },
    { id: 'AT3', studentId: STUDENT.id, date: '2026-03-04', status: ATTENDANCE_STATUS.LATE },
    { id: 'AT4', studentId: STUDENT.id, date: '2026-03-05', status: ATTENDANCE_STATUS.UNEXCUSED }
  ];

  it('counts only the sessions the register actually holds', () => {
    const html = render(STUDENT, { attendanceLogs: records });
    expect(html).toContain('3/4');
    expect(html).toContain('nghỉ không phép');
    expect(html).not.toContain('175/175');
  });

  it('says chưa điểm danh for a child the register has not opened on', () => {
    expect(render(STUDENT)).toContain('Chưa điểm danh');
  });

  it('counts another child’s sessions towards that child only', () => {
    const html = render(STUDENT, {
      attendanceLogs: [...records, { id: 'AT5', studentId: 'HS901', date: '2026-03-05', status: ATTENDANCE_STATUS.UNEXCUSED }]
    });
    expect(html).toContain('3/4');
  });
});

describe('PortfolioBuilder — hoạt động ngoại khóa và xác nhận', () => {
  it('lists the achievements the school entered, and nothing else', () => {
    const html = render(STUDENT, {
      studentPortfolios: [{
        studentId: STUDENT.id,
        studentName: STUDENT.name,
        extracurricularAchievements: ['Giải Nhì Tin học trẻ cấp tỉnh 2026'],
        bghConfirmation: null
      }]
    });
    expect(html).toContain('Giải Nhì Tin học trẻ cấp tỉnh 2026');
  });

  it('reports the confirmation as an internal one, naming who made it and when', () => {
    const html = render(STUDENT, {
      studentPortfolios: [{
        studentId: STUDENT.id,
        studentName: STUDENT.name,
        extracurricularAchievements: [],
        bghConfirmation: { confirmedBy: 'Phạm Thị Hoa', confirmedAt: '2026-05-20' }
      }]
    });
    expect(html).toContain('Phạm Thị Hoa');
    expect(html).toContain('20/05/2026');
    expect(html).toContain('không phải chữ ký số có giá trị pháp lý');
  });

  it('says the date is unknown rather than printing a value it cannot read', () => {
    const html = render(STUDENT, {
      studentPortfolios: [{
        studentId: STUDENT.id,
        studentName: STUDENT.name,
        extracurricularAchievements: [],
        bghConfirmation: { confirmedBy: 'Phạm Thị Hoa', confirmedAt: null }
      }]
    });
    expect(html).toContain('không rõ');
  });

  it('says so plainly when nobody has confirmed the hồ sơ', () => {
    expect(render(STUDENT)).toContain('Ban Giám hiệu chưa xác nhận hồ sơ này.');
  });
});
