/**
 * Nạp một màn hình, và sống sót qua lần triển khai xảy ra giữa chừng.
 *
 * Mỗi màn hình của EduPortal là một gói mã riêng, tải về lúc người dùng bấm
 * vào. Tên gói mang dấu vân tay nội dung, nên bản dựng mới sinh ra tên mới và
 * tên cũ biến mất khỏi máy chủ.
 *
 * Hệ quả: một người mở ứng dụng lúc 8 giờ, đến 9 giờ có bản mới lên, 9 giờ rưỡi
 * họ bấm vào một màn hình chưa mở lần nào — trang đang chạy vẫn xin gói theo tên
 * cũ, máy chủ trả 404, và người đó nhận "Đã xảy ra lỗi hiển thị" trên một màn
 * hình chẳng có gì sai. Trình duyệt không tự chữa được: trang đã tải rồi.
 *
 * Cách chữa duy nhất đúng là tải lại trang để lấy danh sách gói mới. Việc đó chỉ
 * được làm **một lần** — nếu gói hỏng vì lý do khác thì tải lại mãi sẽ thành
 * vòng lặp, và một vòng lặp tải lại còn khó hiểu hơn một thông báo lỗi.
 */

import { lazy } from 'react';

/** Dấu đã tải lại. Ở sessionStorage nên nó mất khi đóng tab, đúng phạm vi. */
export const RELOAD_KEY = 'eduportal_chunk_reloaded';

/**
 * Quyết định có nên tải lại trang hay không, tách riêng để kiểm chứng được.
 *
 * @returns {boolean} true nếu nên tải lại; false nếu đã thử rồi, để lỗi nổi lên
 *   cho màn hình báo lỗi xử lý.
 */
export function shouldReloadForChunk(storage) {
  try {
    if (storage.getItem(RELOAD_KEY)) return false;
    storage.setItem(RELOAD_KEY, '1');
    return true;
  } catch {
    // Trình duyệt chặn sessionStorage (chế độ riêng tư trên vài máy) thì không
    // có chỗ ghi dấu, nên không tải lại: thà báo lỗi còn hơn lặp vô hạn.
    return false;
  }
}

/** Xoá dấu sau khi ứng dụng đã mở được — lần triển khai sau lại được cứu. */
export function clearChunkReloadMark(storage = globalThis.sessionStorage) {
  try {
    storage.removeItem(RELOAD_KEY);
  } catch {
    // Không ghi được thì cũng không có dấu nào để xoá.
  }
}

/**
 * Như React.lazy, nhưng gói mã biến mất thì tải lại trang thay vì báo lỗi.
 *
 * @param {() => Promise<any>} loader Hàm import động.
 */
export function lazyChunk(loader, {
  storage = globalThis.sessionStorage,
  reload = () => globalThis.location.reload()
} = {}) {
  return lazy(() => loader().catch((error) => {
    if (!shouldReloadForChunk(storage)) throw error;

    reload();
    // Giữ lời hứa treo: trang sắp bị thay, hiện thông báo lỗi lúc này chỉ làm
    // màn hình nháy một cái rồi biến mất.
    return new Promise(() => {});
  }));
}
