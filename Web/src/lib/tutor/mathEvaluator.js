export function evaluateMathExpression(query) {
  if (!query) return null;

  // Clean query: remove '=', '?', trailing spaces
  let cleaned = query.replace(/[=?]/g, '').trim();

  // Handle factorials (e.g. 5!)
  const factorialMatch = cleaned.match(/^(\d+)!$/);
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

  // Pre-process math functions: sqrt, sin, cos, tan, abs, log, pi
  let evalExpr = cleaned
    .toLowerCase()
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
      // Round to max 6 decimal places if needed
      const rounded = Math.abs(result - Math.round(result)) < 1e-9 ? Math.round(result) : parseFloat(result.toFixed(6));

      const formattedExpr = cleaned
        .replace(/\*/g, ' \\cdot ')
        .replace(/\//g, ' \\div ')
        .replace(/sqrt\(([^)]+)\)/gi, '\\sqrt{$1}');

      return {
        expression: cleaned,
        result: rounded,
        formattedOutput: `### 🧮 Lời giải phép tính toán học:\n\n$$${formattedExpr} = ${rounded}$$\n\n**Đáp số:** **${rounded}**`
      };
    }
  } catch (e) {
    return null;
  }

  return null;
}
