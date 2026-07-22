export function solveDynamicWordProblem(query) {
  if (!query) return null;
  const norm = query.toLowerCase();

  // 1. Dynamic RLC Circuit Solver: R = ..., ZL = ..., ZC = ...
  const rMatch = norm.match(/\br\s*=\s*(\d+(\.\d+)?)/);
  const zlMatch = norm.match(/\bz_?l\s*=\s*(\d+(\.\d+)?)/);
  const zcMatch = norm.match(/\bz_?c\s*=\s*(\d+(\.\d+)?)/);

  if (rMatch && zlMatch && zcMatch) {
    const R = parseFloat(rMatch[1]);
    const ZL = parseFloat(zlMatch[1]);
    const ZC = parseFloat(zcMatch[1]);
    const diff = ZL - ZC;
    const Z = Math.sqrt(R * R + diff * diff);
    const roundedZ = Math.round(Z * 100) / 100;

    return {
      topic: 'Dòng điện xoay chiều RLC (Giải tự động bài toán cụ thể)',
      problem: `Cho $R = ${R}\\Omega$, $Z_L = ${ZL}\\Omega$, $Z_C = ${ZC}\\Omega$. Tính tổng trở $Z$.`,
      steps: [
        { n: 1, content: `Tính hiệu giữa cảm kháng và dung kháng: $Z_L - Z_C = ${ZL} - ${ZC} = ${diff}\\Omega$`, hint: 'Lấy ZL trừ ZC.' },
        { n: 2, content: `Áp dụng công thức tổng trở: $Z = \\sqrt{${R}^2 + (${diff})^2} = \\sqrt{${R * R} + ${diff * diff}} = ${roundedZ}\\Omega$`, hint: 'Tính căn bậc hai.' }
      ],
      answer: `${roundedZ}\\Omega`,
      formattedOutput: `### 📐 Lời giải chi tiết bài toán RLC:\n\n**Đề bài:** Cho $R = ${R}\\Omega$, $Z_L = ${ZL}\\Omega$, $Z_C = ${ZC}\\Omega$. Tính tổng trở $Z$.\n\n**Các bước giải chi tiết:**\n- **Bước 1:** Tính hiệu $(Z_L - Z_C) = ${ZL} - ${ZC} = ${diff}\\Omega$\n- **Bước 2:** Tính tổng trở $Z = \\sqrt{${R}^2 + (${diff})^2} = \\sqrt{${R*R + diff*diff}} = \\mathbf{${roundedZ}}\\Omega$\n\n---\n**Đáp số:** **${roundedZ}\\Omega**`
    };
  }

  // 2. Dynamic Na + H2O Stoichiometry Solver: <m> gam Natri/Na
  const naMatch = norm.match(/(\d+(\.\d+)?)\s*(gam|g)\s*(natri|na)/i) || norm.match(/(natri|na)\s*(\d+(\.\d+)?)\s*(gam|g)/i);
  if (naMatch) {
    const m = parseFloat(naMatch[1] || naMatch[2]);
    if (!isNaN(m) && m > 0) {
      const nNa = m / 23;
      const nH2 = nNa / 2;
      const vH2 = nH2 * 22.4;
      const roundedV = Math.round(vH2 * 1000) / 1000;

      return {
        topic: 'Hóa học Natri tác dụng với Nước (Giải tự động bài toán cụ thể)',
        problem: `Cho ${m} gam Na tác dụng với nước dư. Tính thể tích khí H2 sinh ra ở ĐKTC.`,
        steps: [
          { n: 1, content: `Tính số mol Na: $n_{Na} = \\frac{${m}}{23} = ${nNa.toFixed(4)} \\text{ mol}$`, hint: 'Lấy m chia M_Na.' },
          { n: 2, content: `Theo phương trình $2\\text{Na} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2\\uparrow$: $n_{H_2} = \\frac{n_{Na}}{2} = ${nH2.toFixed(4)} \\text{ mol}$`, hint: 'Số mol H2 bằng nửa số mol Na.' },
          { n: 3, content: `Thể tích $V_{H_2} = ${nH2.toFixed(4)} \\times 22.4 = ${roundedV} \\text{ lít}$`, hint: 'Nhân với 22.4.' }
        ],
        answer: `${roundedV} lít`,
        formattedOutput: `### 🧪 Lời giải chi tiết bài toán Hóa học:\n\n**Đề bài:** Cho ${m} gam Na tác dụng hoàn toàn với nước dư. Tính thể tích khí $H_2$ (ĐKTC).\n\n**Các bước giải chi tiết:**\n- **Bước 1:** Số mol Na: $n_{Na} = \\frac{${m}}{23} \\approx ${nNa.toFixed(4)} \\text{ mol}$\n- **Bước 2:** Theo PTHH $2\\text{Na} + 2\\text{H}_2\\text{O} \\rightarrow 2\\text{NaOH} + \\text{H}_2\\uparrow \\Rightarrow n_{H_2} = ${nH2.toFixed(4)} \\text{ mol}$\n- **Bước 3:** Thể tích khí $V_{H_2} = ${nH2.toFixed(4)} \\times 22.4 = \\mathbf{${roundedV}} \\text{ lít}$\n\n---\n**Đáp số:** **${roundedV} lít**`
      };
    }
  }

  return null;
}
