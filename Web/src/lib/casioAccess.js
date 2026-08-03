/**
 * Who the Casio fx-580VN X emulator belongs to.
 *
 * It is a working tool, not a dashboard: học sinh dùng để giải bài, giáo viên
 * dùng để làm mẫu trên lớp. Ban giám hiệu và phụ huynh không có bài nào để bấm
 * trên đó, nên máy tính — cả trang riêng, mục sidebar lẫn nút nổi — không xuất
 * hiện trong không gian làm việc của họ.
 *
 * Vai trò giáo viên có nhiều biến thể (`teacher`, `teacher_subject`,
 * `teacher_homeroom`), nên chỗ nào cần hỏi "có được dùng Casio không" đều gọi
 * hàm này thay vì tự so chuỗi, để thêm một biến thể mới không phải sửa bốn nơi.
 */

/**
 * @param {string|null|undefined} role Giá trị `currentRole` của phiên hiện tại.
 * @returns {boolean} true nếu vai trò đó được dùng máy tính Casio fx-580.
 */
export function canUseCasio(role) {
  if (typeof role !== 'string') return false;
  return role === 'student' || role.startsWith('teacher');
}
