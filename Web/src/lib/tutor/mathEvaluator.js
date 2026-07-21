export function evaluateMathExpression(query) {
  if (!query) return null;

  // Clean query: remove '=', '?', spaces around operators
  const cleaned = query.replace(/[=?]/g, '').trim();

  // Pattern check: only digits, +, -, *, /, ^, ., (, ) and spaces
  // Must contain at least one digit and at least one math operator
  const isArithmetic = /^[\d\s+\-*/.^()]+$/.test(cleaned) && /[\d]/.test(cleaned) && /[+\-*/.^]/.test(cleaned);

  if (!isArithmetic) return null;

  try {
    // Replace ^ with ** for exponentiation
    let expr = cleaned.replace(/\^/g, '**');

    // Security check: ensure only valid arithmetic tokens exist
    if (!/^[0-9\s+\-*/.()]+$/.test(expr)) return null;

    // Evaluate mathematical expression safely
    const result = Function(`"use strict"; return (${expr})`)();

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      const formattedExpr = cleaned
        .replace(/\*/g, ' \\cdot ')
        .replace(/\//g, ' \\div ');

      return {
        expression: cleaned,
        result: result,
        formattedOutput: `### 🧮 Lời giải phép tính:\n\n$$${formattedExpr} = ${result}$$\n\n**Đáp số:** **${result}**`
      };
    }
  } catch (e) {
    return null;
  }

  return null;
}
