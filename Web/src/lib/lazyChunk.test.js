import { describe, it, expect, vi } from 'vitest';
import { shouldReloadForChunk, clearChunkReloadMark, lazyChunk, RELOAD_KEY } from './lazyChunk';

function fakeStorage(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    removeItem: (k) => { delete data[k]; },
    _data: data
  };
}

describe('shouldReloadForChunk', () => {
  it('lần đầu thì cho tải lại, và ghi dấu', () => {
    const storage = fakeStorage();
    expect(shouldReloadForChunk(storage)).toBe(true);
    expect(storage.getItem(RELOAD_KEY)).toBe('1');
  });

  it('lần thứ hai thì thôi — tải lại mãi còn khó hiểu hơn báo lỗi', () => {
    const storage = fakeStorage({ [RELOAD_KEY]: '1' });
    expect(shouldReloadForChunk(storage)).toBe(false);
  });

  it('không ghi được thì không tải lại, thay vì lặp vô hạn', () => {
    // Vài trình duyệt ở chế độ riêng tư ném lỗi ngay khi ghi sessionStorage.
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('QuotaExceeded'); }
    };
    expect(shouldReloadForChunk(storage)).toBe(false);
  });

  it('đọc cũng ném thì vẫn không nổ ra ngoài', () => {
    const storage = { getItem: () => { throw new Error('bị chặn'); }, setItem: () => {} };
    expect(shouldReloadForChunk(storage)).toBe(false);
  });
});

describe('clearChunkReloadMark', () => {
  it('xoá dấu để lần triển khai sau lại được cứu', () => {
    const storage = fakeStorage({ [RELOAD_KEY]: '1' });
    clearChunkReloadMark(storage);
    expect(storage.getItem(RELOAD_KEY)).toBeNull();
  });

  it('trình duyệt chặn thì im lặng bỏ qua', () => {
    const storage = { removeItem: () => { throw new Error('bị chặn'); } };
    expect(() => clearChunkReloadMark(storage)).not.toThrow();
  });
});

describe('lazyChunk', () => {
  // React.lazy chỉ gọi loader lúc render, nên các test dưới đây gọi thẳng phần
  // xử lý lỗi qua ._payload._result — cách React phơi loader ra.
  const runLoader = (component) => component._payload._result();

  it('gói tải được thì trả nguyên kết quả, không đụng gì', async () => {
    const mod = { default: () => null };
    const reload = vi.fn();
    const C = lazyChunk(async () => mod, { storage: fakeStorage(), reload });

    await expect(runLoader(C)).resolves.toBe(mod);
    expect(reload).not.toHaveBeenCalled();
  });

  it('gói biến mất sau khi triển khai thì tải lại trang', async () => {
    const reload = vi.fn();
    const storage = fakeStorage();
    const C = lazyChunk(
      async () => { throw new TypeError('Failed to fetch dynamically imported module'); },
      { storage, reload }
    );

    let settled = false;
    runLoader(C).then(() => { settled = true; }, () => { settled = true; });
    await new Promise((r) => setTimeout(r, 0));

    expect(reload).toHaveBeenCalledTimes(1);
    // Lời hứa phải treo: trang sắp bị thay, để lỗi nổi lên lúc này chỉ làm màn
    // hình nháy một cái rồi biến mất.
    expect(settled).toBe(false);
  });

  it('tải lại rồi mà vẫn hỏng thì để lỗi nổi lên', async () => {
    const reload = vi.fn();
    const storage = fakeStorage({ [RELOAD_KEY]: '1' });
    const boom = new TypeError('Failed to fetch dynamically imported module');
    const C = lazyChunk(async () => { throw boom; }, { storage, reload });

    await expect(runLoader(C)).rejects.toBe(boom);
    expect(reload).not.toHaveBeenCalled();
  });
});
