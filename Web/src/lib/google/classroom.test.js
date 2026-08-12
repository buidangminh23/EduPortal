import { describe, it, expect, vi } from 'vitest';
import {
  fetchJson, listCourses, listCourseWork, listStudents, listSubmissions,
  toTenPointScale, buildClassroomPlan
} from './classroom';

const okFetch = (payload) => vi.fn(async () => ({ ok: true, status: 200, json: async () => payload }));

describe('fetchJson', () => {
  it('gắn phiếu truy cập vào tiêu đề Authorization', async () => {
    const fetchImpl = okFetch({});
    await fetchJson('/courses', { accessToken: 'tk', fetchImpl });
    expect(fetchImpl.mock.calls[0][1].headers.Authorization).toBe('Bearer tk');
  });

  it('tách riêng phiên hết hạn để bên gọi biết phải đăng nhập lại', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: false, status: 401, json: async () => ({}) }));
    const out = await fetchJson('/courses', { accessToken: 'tk', fetchImpl });
    expect(out.expired).toBe(true);
    expect(out.error).toMatch(/hết hạn/);
  });

  it('chuyển thông báo lỗi của Google thành câu đọc được', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false, status: 403, json: async () => ({ error: { message: 'Insufficient permission' } })
    }));
    const out = await fetchJson('/courses', { accessToken: 'tk', fetchImpl });
    expect(out.ok).toBe(false);
    expect(out.expired).toBe(false);
    expect(out.error).toMatch(/Insufficient permission/);
  });

  it('bỏ qua tham số rỗng thay vì gửi chuỗi trống', async () => {
    const fetchImpl = okFetch({});
    await fetchJson('/courses', { accessToken: 'tk', params: { a: 1, b: '', c: null }, fetchImpl });
    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get('a')).toBe('1');
    expect(url.searchParams.has('b')).toBe(false);
    expect(url.searchParams.has('c')).toBe(false);
  });
});

describe('listCourses', () => {
  it('chỉ lấy lớp đang hoạt động', async () => {
    const fetchImpl = okFetch({ courses: [{ id: '1', name: 'Toán 12A1', section: 'A' }] });
    const out = await listCourses({ accessToken: 'tk', fetchImpl });
    const url = new URL(fetchImpl.mock.calls[0][0]);
    expect(url.searchParams.get('courseStates')).toBe('ACTIVE');
    expect(out.data[0]).toMatchObject({ id: '1', name: 'Toán 12A1' });
  });

  it('lớp rỗng trả mảng rỗng, không nổ', async () => {
    const out = await listCourses({ accessToken: 'tk', fetchImpl: okFetch({}) });
    expect(out.data).toEqual([]);
  });
});

describe('listCourseWork', () => {
  it('loại bài không chấm điểm — không có gì để đưa vào sổ', async () => {
    const fetchImpl = okFetch({
      courseWork: [
        { id: 'a', title: 'Kiểm tra 15 phút', maxPoints: 10 },
        { id: 'b', title: 'Đọc tài liệu' },
        { id: 'c', title: 'Thảo luận', maxPoints: 0 }
      ]
    });
    const out = await listCourseWork({ courseId: '1', accessToken: 'tk', fetchImpl });
    expect(out.data).toHaveLength(1);
    expect(out.data[0].id).toBe('a');
  });
});

describe('listStudents', () => {
  it('lấy email làm khoá ghép', async () => {
    const fetchImpl = okFetch({
      students: [{ userId: 'u1', profile: { name: { fullName: 'Nguyễn Văn An' }, emailAddress: 'an@truong.edu.vn' } }]
    });
    const out = await listStudents({ courseId: '1', accessToken: 'tk', fetchImpl });
    expect(out.data[0]).toMatchObject({ userId: 'u1', email: 'an@truong.edu.vn' });
  });
});

describe('listSubmissions', () => {
  it('chỉ nhận điểm đã trả, không nhận điểm nháp', async () => {
    const fetchImpl = okFetch({
      studentSubmissions: [
        { userId: 'u1', assignedGrade: 8 },
        { userId: 'u2', draftGrade: 9 }
      ]
    });
    const out = await listSubmissions({ courseId: '1', courseWorkId: 'w1', accessToken: 'tk', fetchImpl });
    expect(out.data[0].grade).toBe(8);
    expect(out.data[1].grade).toBeNull();
    expect(out.data[1].hasDraftOnly).toBe(true);
  });

  it('điểm 0 là điểm thật, không được coi là chưa chấm', async () => {
    // 0 là giá trị falsy — chỗ này rất dễ viết thành `s.assignedGrade || null`
    // và biến một điểm 0 có thật thành "chưa chấm", tức xoá điểm của một em
    // đã nộp bài và bị 0.
    const fetchImpl = okFetch({ studentSubmissions: [{ userId: 'u1', assignedGrade: 0 }] });
    const out = await listSubmissions({ courseId: '1', courseWorkId: 'w1', accessToken: 'tk', fetchImpl });
    expect(out.data[0].grade).toBe(0);
    expect(out.data[0].hasDraftOnly).toBe(false);
  });
});

describe('toTenPointScale', () => {
  it('quy đổi từ thang 100', () => {
    expect(toTenPointScale(85, 100)).toBe(8.5);
  });

  it('thang 10 thì giữ nguyên', () => {
    expect(toTenPointScale(7.5, 10)).toBe(7.5);
  });

  it('làm tròn tới một chữ số thập phân', () => {
    // 27/30 = 9.000000000000002 nếu không làm tròn, và sổ điểm sẽ từ chối.
    expect(toTenPointScale(27, 30)).toBe(9);
    expect(toTenPointScale(17, 30)).toBe(5.7);
  });

  it('điểm 0 quy đổi thành 0, không thành null', () => {
    expect(toTenPointScale(0, 100)).toBe(0);
  });

  it('thiếu thang điểm thì trả null thay vì chia cho 0', () => {
    expect(toTenPointScale(5, 0)).toBeNull();
    expect(toTenPointScale(5, undefined)).toBeNull();
    expect(toTenPointScale(null, 100)).toBeNull();
  });
});

describe('buildClassroomPlan', () => {
  const students = [
    { userId: 'u1', fullName: 'Nguyễn Văn An', email: 'an@truong.edu.vn' },
    { userId: 'u2', fullName: 'Trần Thị Bình', email: 'binh@truong.edu.vn' },
    { userId: 'u3', fullName: 'Người Lạ', email: 'la@ngoai.com' }
  ];
  const roster = [
    { id: 'HS001', fullName: 'Nguyễn Văn An', email: 'an@truong.edu.vn' },
    { id: 'HS002', fullName: 'Trần Thị Bình', email: 'BINH@truong.edu.vn' }
  ];

  it('quy đổi thang điểm và ghép theo email', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 85 }],
      students, roster, maxPoints: 100
    });
    expect(plan.ready[0]).toMatchObject({ studentId: 'HS001', score: 8.5, rawGrade: 85, maxPoints: 100 });
  });

  it('ghép email không phân biệt hoa thường', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u2', grade: 9 }], students, roster, maxPoints: 10
    });
    expect(plan.ready[0].studentId).toBe('HS002');
  });

  it('học sinh ngoài danh sách trường thì báo rõ, không bỏ im', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u3', grade: 8 }], students, roster, maxPoints: 10
    });
    expect(plan.summary.unmatched).toBe(1);
    expect(plan.unmatched[0].problem).toMatch(/la@ngoai.com/);
  });

  it('bài chưa chấm và điểm nháp đều bị giữ lại, với lý do khác nhau', () => {
    const plan = buildClassroomPlan({
      submissions: [
        { userId: 'u1', grade: null, hasDraftOnly: false },
        { userId: 'u2', grade: null, hasDraftOnly: true }
      ],
      students, roster, maxPoints: 10
    });
    expect(plan.summary.ready).toBe(0);
    expect(plan.failed[0].problem).toMatch(/chưa được chấm/);
    expect(plan.failed[1].problem).toMatch(/nháp/);
  });

  it('điểm 0 vẫn được đưa vào danh sách ghi được', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 0 }], students, roster, maxPoints: 100
    });
    expect(plan.summary.ready).toBe(1);
    expect(plan.ready[0].score).toBe(0);
  });

  it('điểm vượt thang tối đa bị chặn thay vì ghi quá 10', () => {
    // Classroom cho phép chấm vượt điểm tối đa để cộng thưởng: 110/100 = 11.
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 110 }], students, roster, maxPoints: 100
    });
    expect(plan.summary.ready).toBe(0);
    expect(plan.failed[0].problem).toMatch(/110\/100/);
  });

  it('đếm đủ ba nhóm', () => {
    const plan = buildClassroomPlan({
      submissions: [
        { userId: 'u1', grade: 80 },
        { userId: 'u2', grade: null },
        { userId: 'u3', grade: 70 }
      ],
      students, roster, maxPoints: 100
    });
    expect(plan.summary).toEqual({ total: 3, ready: 1, failed: 1, unmatched: 1 });
  });
});

describe('buildClassroomPlan — ghép theo tên khi chưa có email', () => {
  const students = [
    { userId: 'u1', fullName: 'Nguyễn Văn An', email: 'an@gmail.com' },
    { userId: 'u2', fullName: 'Trần Thị Bình', email: 'binh@gmail.com' }
  ];
  // Đúng như danh sách học sinh hiện tại của EduPortal: có tên, không có email.
  const rosterNoEmail = [
    { id: 'HS001', fullName: 'Nguyễn Văn An' },
    { id: 'HS002', fullName: 'Trần Thị Bình' }
  ];

  it('mặc định KHÔNG ghép theo tên — im lặng đoán tên là cách ghi nhầm điểm', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 8 }], students, roster: rosterNoEmail, maxPoints: 10
    });
    expect(plan.summary.ready).toBe(0);
    expect(plan.summary.unmatched).toBe(1);
  });

  it('bật lên thì ghép được, và ghi rõ đã ghép bằng cách nào', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 8 }], students, roster: rosterNoEmail,
      maxPoints: 10, allowNameMatch: true
    });
    expect(plan.ready[0]).toMatchObject({ studentId: 'HS001', matchedBy: 'name' });
  });

  it('ghép theo tên bỏ qua khác biệt dấu và khoảng trắng', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 8 }],
      students: [{ userId: 'u1', fullName: 'nguyen  van an', email: '' }],
      roster: rosterNoEmail, maxPoints: 10, allowNameMatch: true
    });
    expect(plan.ready[0].studentId).toBe('HS001');
  });

  it('trùng tên thì vẫn từ chối, kể cả khi đã bật ghép theo tên', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 8 }], students,
      roster: [...rosterNoEmail, { id: 'HS009', fullName: 'Nguyễn Văn An' }],
      maxPoints: 10, allowNameMatch: true
    });
    expect(plan.summary.ready).toBe(0);
    expect(plan.unmatched[0].problem).toMatch(/cùng tên/);
  });

  it('email vẫn được ưu tiên hơn tên khi có cả hai', () => {
    const plan = buildClassroomPlan({
      submissions: [{ userId: 'u1', grade: 8 }], students,
      roster: [{ id: 'HS777', fullName: 'Tên Khác Hẳn', email: 'an@gmail.com' }, ...rosterNoEmail],
      maxPoints: 10, allowNameMatch: true
    });
    expect(plan.ready[0]).toMatchObject({ studentId: 'HS777', matchedBy: 'email' });
  });
});

describe('lỗi thiếu quyền — câu hay gặp nhất khi dùng nhầm tài khoản', () => {
  it('nói ra lý do thật thay vì chép nguyên văn tiếng Anh của Google', async () => {
    // Bốn quyền đã xin đều là quyền của người DẠY lớp. Đăng nhập bằng tài khoản
    // là học sinh trong lớp đó thì Classroom trả đúng câu này — gặp thật khi
    // chạy thử trên production.
    const fetchImpl = vi.fn(async () => ({
      ok: false, status: 403,
      json: async () => ({ error: { message: 'The caller does not have permission' } })
    }));
    const out = await fetchJson('/courses/1/courseWork', { accessToken: 'tk', fetchImpl });

    expect(out.ok).toBe(false);
    expect(out.expired).toBe(false);
    expect(out.error).toMatch(/không phải giáo viên của lớp đó/);
    expect(out.error).not.toMatch(/caller does not have permission/);
  });

  it('403 vì lý do khác thì vẫn giữ nguyên văn của Google', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false, status: 403, json: async () => ({ error: { message: 'Quota exceeded' } })
    }));
    const out = await fetchJson('/courses', { accessToken: 'tk', fetchImpl });
    expect(out.error).toMatch(/Quota exceeded/);
  });
});
