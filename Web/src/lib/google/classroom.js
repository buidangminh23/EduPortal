/**
 * Đọc lớp học và điểm từ Google Classroom.
 *
 * Chỉ đọc. Bốn quyền đã xin đều là readonly, nên dù có lỗi ở đây thì dữ liệu
 * trên Classroom của giáo viên cũng không bị đụng tới.
 *
 * Cạm bẫy lớn nhất của việc này không nằm ở chỗ gọi API, mà ở **thang điểm**.
 * Classroom chấm theo số điểm tối đa do giáo viên tự đặt cho từng bài — 100,
 * 20, 50, tuỳ bài. Sổ điểm Việt Nam thì luôn thang 10. Bê thẳng con số sang là
 * ghi 85 vào ô điểm, và 85 sẽ bị chặn vì vượt thang; tệ hơn là bài đặt thang 10
 * thì lọt qua im lặng còn bài thang 100 thì không, nên lỗi trông như ngẫu nhiên.
 */

import { normaliseName as normaliseVietnameseName } from '../integrations/gradeImport';

const API = 'https://classroom.googleapis.com/v1';

/**
 * Gọi một endpoint của Classroom.
 *
 * Tách riêng 401 vì nó có cách xử lý khác hẳn: phiếu hết hạn thì phải đăng nhập
 * lại, không phải thử lại.
 */
export async function fetchJson(path, { accessToken, params = {}, fetchImpl = globalThis.fetch } = {}) {
  const url = new URL(`${API}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });

  const res = await fetchImpl(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (res.status === 401) {
    return { ok: false, expired: true, error: 'Phiên đăng nhập Google đã hết hạn. Hãy đăng nhập lại.', data: null };
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const detail = data?.error?.message || `HTTP ${res.status}`;

    // Câu hay gặp nhất, và nguyên văn tiếng Anh của Google không nói ra lý do
    // thật: bốn quyền đã xin đều là quyền của người DẠY lớp đó. Tài khoản đang
    // đăng nhập là học sinh trong lớp thì Classroom trả đúng câu này, và giáo
    // viên nhìn vào sẽ tưởng ứng dụng hỏng.
    if (res.status === 403 && /does not have permission/i.test(detail)) {
      return {
        ok: false,
        expired: false,
        error: 'Tài khoản Google này không phải giáo viên của lớp đó. EduPortal chỉ lấy được điểm ở lớp mà thầy cô dạy hoặc quản lý — hãy kết nối lại bằng tài khoản dạy lớp này.',
        data: null
      };
    }

    return { ok: false, expired: false, error: `Google Classroom trả về lỗi: ${detail}`, data: null };
  }

  return { ok: true, expired: false, error: null, data };
}

/** Các lớp giáo viên đang dạy. Lớp đã lưu trữ không lấy — chúng thuộc năm học cũ. */
export async function listCourses(opts) {
  const res = await fetchJson('/courses', { ...opts, params: { courseStates: 'ACTIVE', pageSize: 100 } });
  if (!res.ok) return res;
  return { ...res, data: (res.data.courses || []).map((c) => ({ id: c.id, name: c.name, section: c.section || '' })) };
}

/** Các bài tập có chấm điểm của một lớp. */
export async function listCourseWork({ courseId, ...opts }) {
  const res = await fetchJson(`/courses/${courseId}/courseWork`, { ...opts, params: { pageSize: 100 } });
  if (!res.ok) return res;
  return {
    ...res,
    data: (res.data.courseWork || [])
      // Bài không đặt điểm tối đa là bài chỉ nhận xét, không có gì để đưa vào sổ.
      .filter((w) => typeof w.maxPoints === 'number' && w.maxPoints > 0)
      .map((w) => ({ id: w.id, title: w.title, maxPoints: w.maxPoints, dueDate: w.dueDate || null }))
  };
}

/** Học sinh trong lớp, kèm email — đây là khoá để ghép với danh sách của trường. */
export async function listStudents({ courseId, ...opts }) {
  const res = await fetchJson(`/courses/${courseId}/students`, { ...opts, params: { pageSize: 200 } });
  if (!res.ok) return res;
  return {
    ...res,
    data: (res.data.students || []).map((s) => ({
      userId: s.userId,
      fullName: s.profile?.name?.fullName || '',
      email: s.profile?.emailAddress || ''
    }))
  };
}

/** Bài nộp kèm điểm của một bài tập. */
export async function listSubmissions({ courseId, courseWorkId, ...opts }) {
  const res = await fetchJson(`/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`, {
    ...opts, params: { pageSize: 200 }
  });
  if (!res.ok) return res;
  return {
    ...res,
    data: (res.data.studentSubmissions || []).map((s) => ({
      userId: s.userId,
      // assignedGrade là điểm đã trả cho học sinh; draftGrade là điểm giáo viên
      // đang chấm dở, chưa công bố. Chỉ lấy điểm đã trả — kéo điểm nháp về sổ
      // là công bố hộ một con điểm giáo viên chưa muốn cho ai thấy.
      grade: typeof s.assignedGrade === 'number' ? s.assignedGrade : null,
      hasDraftOnly: typeof s.assignedGrade !== 'number' && typeof s.draftGrade === 'number',
      state: s.state || ''
    }))
  };
}

/**
 * Quy điểm Classroom về thang 10.
 *
 * Làm tròn tới một chữ số thập phân, đúng mức mà sổ điểm chấp nhận. Không làm
 * tròn ở đây thì 85/100 thành 8.5 (đẹp) còn 27/30 thành 8.999999999999998 và bị
 * lớp kiểm tra điểm từ chối vì thừa chữ số thập phân.
 */
export function toTenPointScale(grade, maxPoints) {
  if (typeof grade !== 'number' || !Number.isFinite(grade)) return null;
  if (typeof maxPoints !== 'number' || !(maxPoints > 0)) return null;
  return Math.round((grade / maxPoints) * 10 * 10) / 10;
}

/**
 * Ghép bài nộp với học sinh của trường, dựng bản kê để giáo viên duyệt.
 *
 * Ghép theo email, không theo tên: tài khoản Classroom luôn có email, còn tên
 * hiển thị do người dùng tự đặt và lớp thì hay có người trùng tên.
 *
 * @param {object} input
 * @param {Array} input.submissions  Từ listSubmissions.
 * @param {Array} input.students     Từ listStudents (có email).
 * @param {Array} input.roster       Học sinh trong EduPortal: { id, fullName, email }.
 * @param {number} input.maxPoints   Điểm tối đa của bài trên Classroom.
 */
export function buildClassroomPlan({
  submissions = [], students = [], roster = [], maxPoints, allowNameMatch = false
} = {}) {
  const byUserId = new Map(students.map((s) => [s.userId, s]));
  const byEmail = new Map(
    roster.filter((r) => r.email).map((r) => [String(r.email).trim().toLowerCase(), r])
  );

  // Chỉ dựng khi được cho phép. Danh sách học sinh của trường hiện chưa có email,
  // nên nếu không có lối này thì tính năng không dùng được; nhưng ghép theo tên
  // là phỏng đoán, nên phải do người dùng bật chứ không lặng lẽ bật sẵn.
  const byName = new Map();
  if (allowNameMatch) {
    roster.forEach((r) => {
      const key = normaliseVietnameseName(r.fullName);
      if (!key) return;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key).push(r);
    });
  }

  const ready = [];
  const failed = [];
  const unmatched = [];

  submissions.forEach((sub) => {
    const person = byUserId.get(sub.userId);
    const label = person?.fullName || sub.userId;

    if (!person) {
      unmatched.push({ label, problem: 'Không đọc được hồ sơ học sinh này trên Classroom.' });
      return;
    }

    let match = person.email ? byEmail.get(person.email.trim().toLowerCase()) : undefined;
    let matchedBy = match ? 'email' : null;

    if (!match && allowNameMatch) {
      const hits = byName.get(normaliseVietnameseName(person.fullName)) || [];
      if (hits.length === 1) {
        match = hits[0];
        matchedBy = 'name';
      } else if (hits.length > 1) {
        unmatched.push({
          label,
          problem: `Lớp có ${hits.length} học sinh cùng tên "${person.fullName}" — không ghép theo tên được, cần email để phân biệt.`
        });
        return;
      }
    }

    if (!match) {
      unmatched.push({
        label, email: person.email,
        problem: person.email
          ? `Không tìm thấy học sinh có email "${person.email}" trong danh sách lớp của trường.`
          : `Không ghép được "${label}" với học sinh nào của trường.`
      });
      return;
    }

    if (sub.grade === null) {
      failed.push({
        studentId: match.id, fullName: match.fullName,
        problem: sub.hasDraftOnly
          ? 'Điểm còn ở dạng nháp trên Classroom, chưa trả cho học sinh — chưa kéo về sổ.'
          : 'Bài này chưa được chấm điểm.'
      });
      return;
    }

    const score = toTenPointScale(sub.grade, maxPoints);
    if (score === null || score < 0 || score > 10) {
      failed.push({
        studentId: match.id, fullName: match.fullName,
        problem: `Không quy đổi được ${sub.grade}/${maxPoints} về thang 10.`
      });
      return;
    }

    ready.push({
      studentId: match.id,
      fullName: match.fullName,
      matchedBy,
      email: person.email,
      rawGrade: sub.grade,
      maxPoints,
      score
    });
  });

  return {
    ready, failed, unmatched,
    summary: { total: submissions.length, ready: ready.length, failed: failed.length, unmatched: unmatched.length }
  };
}
