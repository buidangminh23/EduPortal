import { describe, it, expect } from 'vitest';
import { isAllowedRedirect } from '../../../../api/google/token.mjs';

/**
 * Luật soi địa chỉ quay về của serverless function đổi mã.
 *
 * Test này sống ở đây vì bộ test chạy trong Web/, còn hàm thì thuộc về function
 * — nó là thứ duy nhất đứng giữa endpoint và người lạ muốn mượn danh nghĩa
 * trường để gọi Google.
 */

const HOST = 'edu-portal-bay.vercel.app';

describe('isAllowedRedirect', () => {
  it('nhận đúng địa chỉ của trường', () => {
    expect(isAllowedRedirect(`https://${HOST}/oauth/google`, HOST)).toBe(true);
  });

  it('từ chối tên miền lạ, dù https và đúng đường dẫn', () => {
    // Đây là chỗ đã lỏng: luật cũ chỉ đòi https + đúng path nên tên miền nào
    // cũng lọt, và lời gọi vẫn đi một vòng tới Google mới bị chặn.
    expect(isAllowedRedirect('https://ke-xau.example.com/oauth/google', HOST)).toBe(false);
  });

  it('từ chối đường dẫn khác trên đúng tên miền', () => {
    expect(isAllowedRedirect(`https://${HOST}/oauth/google/them`, HOST)).toBe(false);
    expect(isAllowedRedirect(`https://${HOST}/`, HOST)).toBe(false);
  });

  it('từ chối http với tên miền thật', () => {
    expect(isAllowedRedirect(`http://${HOST}/oauth/google`, HOST)).toBe(false);
  });

  it('cho phép máy của người đang lập trình', () => {
    expect(isAllowedRedirect('http://localhost:5173/oauth/google', 'localhost:3000')).toBe(true);
    expect(isAllowedRedirect('http://127.0.0.1:5173/oauth/google', HOST)).toBe(true);
  });

  it('không có tên miền của lời gọi thì không đoán bừa', () => {
    expect(isAllowedRedirect(`https://${HOST}/oauth/google`, undefined)).toBe(false);
    expect(isAllowedRedirect(`https://${HOST}/oauth/google`, '')).toBe(false);
  });

  it('chuỗi không phải địa chỉ thì trả false chứ không ném', () => {
    expect(isAllowedRedirect('không-phải-địa-chỉ', HOST)).toBe(false);
    expect(isAllowedRedirect('', HOST)).toBe(false);
    expect(isAllowedRedirect(undefined, HOST)).toBe(false);
  });

  it('không nhầm tên miền chỉ vì nó kết thúc giống', () => {
    expect(isAllowedRedirect(`https://gia-mao-${HOST}/oauth/google`, HOST)).toBe(false);
    expect(isAllowedRedirect(`https://${HOST}.ke-xau.com/oauth/google`, HOST)).toBe(false);
  });
});
