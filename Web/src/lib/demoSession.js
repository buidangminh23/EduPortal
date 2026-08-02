/**
 * The people you can look through in the demo.
 *
 * A demo needs a viewpoint, not an account. Picking "GV Bộ môn" here is the
 * same kind of act as choosing a tab — it changes what the screen shows and
 * nothing else. There is deliberately no password: a password implies the app
 * is deciding whether to trust you, and in the demo it is not. Pretending
 * otherwise is what let `teacher123` exist in the first place.
 *
 * Every session carries `isDemo`, so anything downstream can tell demo data
 * from real data without having to know how the app was configured.
 */

const AVATAR = {
  student: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  teacher: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
  homeroom: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  parent: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  admin: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'
};

/**
 * Matches the seeded demo data, so the marks and classes on screen belong to
 * the person named at the top of it.
 */
export const DEMO_PERSONAS = {
  student: {
    username: 'hoangnam',
    displayName: 'Nguyễn Hoàng Nam',
    email: 'nam.nh@school.edu.vn',
    avatarUrl: AVATAR.student,
    class: '12A1',
    studentId: 'HS001'
  },
  teacher_subject: {
    username: 'minhtriet',
    displayName: 'Nguyễn Minh Triết',
    email: 'triet.nm@school.edu.vn',
    avatarUrl: AVATAR.teacher,
    class: null,
    studentId: null
  },
  teacher_homeroom: {
    username: 'hongvan',
    displayName: 'Trần Thị Hồng Vân',
    email: 'van.tth@school.edu.vn',
    avatarUrl: AVATAR.homeroom,
    class: '12A1',
    studentId: null
  },
  parent: {
    username: 'phuhuynh_nam',
    displayName: 'Nguyễn Văn Hùng (PH Nam)',
    email: 'hung.nv@parent.school.edu.vn',
    avatarUrl: AVATAR.parent,
    class: '12A1',
    studentId: 'HS001',
    parentName: 'Nguyễn Văn Hùng',
    parentId: 'parent_HS001'
  },
  admin: {
    username: 'hieutruong',
    displayName: 'Thầy Nguyễn Văn Hùng (Hiệu Trưởng)',
    email: 'hieutruong@school.edu.vn',
    avatarUrl: AVATAR.admin,
    class: null,
    studentId: null
  }
};

/** Roles the demo can be viewed as, in the order they are offered. */
export const DEMO_ROLES = Object.keys(DEMO_PERSONAS);

/**
 * Builds the session for a demo role.
 *
 * @param {string} role One of DEMO_ROLES. Anything else falls back to student,
 *   because a demo that refuses to open teaches nobody anything.
 */
export function demoSessionFor(role) {
  const persona = DEMO_PERSONAS[role] ?? DEMO_PERSONAS.student;
  const resolvedRole = DEMO_PERSONAS[role] ? role : 'student';
  return { ...persona, role: resolvedRole, isDemo: true };
}
