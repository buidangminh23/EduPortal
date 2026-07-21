export function latexToHtml(latex) {
  if (!latex) return '';
  let s = latex;
  // \frac{a}{b} → a/b styled as fraction
  s = s.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '<span style="display:inline-block;text-align:center;vertical-align:middle;margin:0 2px"><span style="display:block;border-bottom:1px solid currentColor;padding:0 4px">$1</span><span style="display:block;padding:0 4px">$2</span></span>');
  // \sqrt{x} → √x
  s = s.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');
  // \vec{x} → x⃗ 
  s = s.replace(/\\vec\{([^}]*)\}/g, '$1\u20D7');
  // Named functions
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min|sup|inf)\b/g, '<span style="font-style:normal;font-weight:500">$1</span>');
  s = s.replace(/\\text\{([^}]*)\}/g, '<span style="font-style:normal">$1</span>');
  // Greek & math symbols
  s = s.replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β').replace(/\\gamma/g, 'γ').replace(/\\delta/g, 'δ');
  s = s.replace(/\\Delta/g, 'Δ').replace(/\\lambda/g, 'λ').replace(/\\omega/g, 'ω').replace(/\\pi/g, 'π');
  s = s.replace(/\\theta/g, 'θ').replace(/\\sigma/g, 'σ').replace(/\\mu/g, 'μ').replace(/\\phi/g, 'φ');
  // Operators & relations
  s = s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷');
  s = s.replace(/\\pm/g, '±').replace(/\\mp/g, '∓').replace(/\\neq/g, '≠');
  s = s.replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\approx/g, '≈');
  s = s.replace(/\\Rightarrow/g, '⇒').replace(/\\rightarrow/g, '→').replace(/\\Leftarrow/g, '⇐');
  s = s.replace(/\\infty/g, '∞').replace(/\\quad/g, '&nbsp;&nbsp;').replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
  s = s.replace(/\\in/g, '∈').replace(/\\subset/g, '⊂').replace(/\\cup/g, '∪').replace(/\\cap/g, '∩');
  // Integrals & sums with limits
  s = s.replace(/\\int_\{?([^}\s]+)\}?\^\{?([^}\s]+)\}?/g, '∫<sub>$1</sub><sup>$2</sup> ');
  s = s.replace(/\\int/g, '∫').replace(/\\sum/g, '∑').replace(/\\prod/g, '∏');
  // Subscripts & superscripts
  s = s.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>');
  s = s.replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>');
  s = s.replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\mathbb\{Z\}/g, 'ℤ').replace(/\\mathbb\{N\}/g, 'ℕ').replace(/\\mathbb\{Q\}/g, 'ℚ');
  return s;
}

export function formatTutorText(msgText) {
  if (!msgText) return null;
  let f = msgText
    .replace(/### (.*?)\n/g, '<h4 style="color:var(--accent,#3b82f6);margin:10px 0 6px;font-weight:700;font-size:1.05em">$1</h4>')
    .replace(/#### (.*?)\n/g, '<h5 style="color:var(--accent,#3b82f6);margin:8px 0 4px;font-weight:600;font-size:0.95em">$1</h5>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\$\$(.*?)\$\$/gs, (_, tex) => {
      return `<div style="background:rgba(59,130,246,0.08);padding:10px 14px;border-radius:8px;font-family:'Cambria Math','STIX Two Math',serif;margin:8px 0;font-size:1.05em;line-height:1.6;letter-spacing:0.3px;text-align:center">${latexToHtml(tex)}</div>`;
    })
    .replace(/\$([^$]+)\$/g, (_, tex) => {
      return `<code style="background:rgba(59,130,246,0.1);padding:2px 6px;border-radius:4px;font-family:'Cambria Math','STIX Two Math',serif;font-size:0.95em">${latexToHtml(tex)}</code>`;
    })
    .replace(/^-\s(.*?)(?:\n|$)/gm, '<li style="margin-left:16px;margin-bottom:4px">$1</li>')
    .replace(/\n/g, '<br/>');
  return <div dangerouslySetInnerHTML={{ __html: f }} />;
}
