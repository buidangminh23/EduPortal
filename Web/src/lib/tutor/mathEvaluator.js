export function evaluateMathExpression(query) {
  if (!query) return null;

  let originalQuery = query;

  // 1. Pre-process Vietnamese natural language math queries:
  // e.g. "5 nhân 5 bằng mấy", "100 chia 4 bằng bao nhiêu", "10 cộng 20", "2 mũ 10"
  let norm = query
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove diacritics
    .replace(/\bbang may\b|\bbang bao nhieu\b|\bbang\b|\bket qua\b|\blabao nhieu\b/g, '')
    .replace(/\bcan bac hai cua\b|\bcan bac hai\b|\bcan\b/g, 'sqrt')
    .replace(/\bnhan cho\b|\bnhan\b|\bx\b/g, '*')
    .replace(/\bchia cho\b|\bchia\b/g, '/')
    .replace(/\bcong cho\b|\bcong\b/g, '+')
    .replace(/\btru cho\b|\btru\b/g, '-')
    .replace(/\bmu\b/g, '^')
    .replace(/[=?]/g, '')
    .trim();

  // Handle factorials (e.g. 5!)
  const factorialMatch = norm.match(/^(\d+)!$/);
  if (factorialMatch) {
    const num = parseInt(factorialMatch[1], 10);
    if (num >= 0 && num <= 20) {
      let fact = 1;
      for (let i = 2; i <= num; i++) fact *= i;
      return {
        expression: `${num}!`,
        result: fact,
        formattedOutput: `### 🧮 Lời giải phép tính Giai thừa:\n\n$$${num}! = ${fact}$$\n\n**Đáp số:** **${fact}**`
      };
    }
  }

  // Handle sqrt syntax: sqrt 144 -> sqrt(144)
  norm = norm.replace(/sqrt\s*(\d+(\.\d+)?)/g, 'sqrt($1)');

  // Pre-process math functions: sqrt, sin, cos, tan, abs, log, pi
  let evalExpr = norm
    .replace(/sqrt\(([^)]+)\)/g, 'Math.sqrt($1)')
    .replace(/abs\(([^)]+)\)/g, 'Math.abs($1)')
    .replace(/sin\(([^)]+)\)/g, 'Math.sin($1)')
    .replace(/cos\(([^)]+)\)/g, 'Math.cos($1)')
    .replace(/tan\(([^)]+)\)/g, 'Math.tan($1)')
    .replace(/log\(([^)]+)\)/g, 'Math.log10($1)')
    .replace(/ln\(([^)]+)\)/g, 'Math.log($1)')
    .replace(/\bpi\b/g, 'Math.PI')
    .replace(/\^/g, '**');

  // Verify whether the expression contains valid math elements
  const hasMathSymbols = /[+\-*/.^]|Math\./.test(evalExpr) && /\d/.test(evalExpr);
  if (!hasMathSymbols) return null;

  // Security check: only allow safe Math methods, numbers, and basic operators
  const isSafe = /^[0-9\s+\-*/.()MathsqrtabscostanlinPIe]+$/i.test(evalExpr);
  if (!isSafe) return null;

  try {
    const result = Function(`"use strict"; return (${evalExpr})`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      const rounded = Math.abs(result - Math.round(result)) < 1e-9 ? Math.round(result) : parseFloat(result.toFixed(6));

      const displayExpr = norm
        .replace(/\*/g, ' \\cdot ')
        .replace(/\//g, ' \\div ')
        .replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');

      return {
        expression: originalQuery,
        result: rounded,
        formattedOutput: `### 🧮 Lời giải phép tính:\n\n**Phép tính:** $$${displayExpr} = ${rounded}$$\n\n**Đáp số:** **${rounded}**`
      };
    }
  } catch (e) {
    return null;
  }

  return null;
}
