export function decodeHtmlEntities(str) {
  if (!str) return '';
  let res = String(str);

  // Parse inline LaTeX math delimited by $$...$$ or $...$
  res = res
    .replace(/\$\$([\s\S]+?)\$\$/g, (_, math) => `<span style="font-family:'Cambria Math','Times New Roman',serif;font-style:italic;margin:0 2px">${latexToHtml(math)}</span>`)
    .replace(/\$([^$\n]+?)\$/g, (_, math) => `<span style="font-family:'Cambria Math','Times New Roman',serif;font-style:italic;margin:0 2px">${latexToHtml(math)}</span>`);

  res = res
    .replace(/&pi;/gi, 'π')
    .replace(/&lambda;/gi, 'λ')
    .replace(/&radic;/gi, '√')
    .replace(/&rArr;/gi, '⇒')
    .replace(/&lArr;/gi, '⇐')
    .replace(/&hArr;/gi, '⇔')
    .replace(/&asymp;/gi, '≈')
    .replace(/&middot;/gi, '·')
    .replace(/&int;/gi, '∫')
    .replace(/&plusmn;/gi, '±')
    .replace(/&Omega;/gi, 'Ω')
    .replace(/&mu;/gi, 'μ')
    .replace(/&Delta;/gi, 'Δ')
    .replace(/&deg;/gi, '°')
    .replace(/&rightleftharpoons;/gi, '⇌')
    .replace(/&uarr;/gi, '↑')
    .replace(/&rarr;/gi, '→')
    .replace(/&times;/gi, '×')
    .replace(/&divide;/gi, '÷')
    .replace(/&le;/gi, '≤')
    .replace(/&ge;/gi, '≥')
    .replace(/&ne;/gi, '≠')
    .replace(/&in;/gi, '∈')
    .replace(/&notin;/gi, '∉')
    .replace(/&infin;/gi, '∞')
    .replace(/&#8407;/gi, '⃗')
    .replace(/&nbsp;/gi, ' ');

  // Automatic spacing fix between <i> tags and adjacent words (e.g. <i>P</i>để -> <i>P</i> để, <i>X</i>là -> <i>X</i> là)
  res = res
    .replace(/<\/i>([a-zA-Zàáảãạăắtằẳẵặâấầnẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ])/gi, '</i> $1')
    .replace(/([a-zA-Zàáảãạăắtằẳẵặâấầnẩẫậèéẻẽẹêếềểễệđìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵ])<i>/gi, '$1 <i>');

  return res;
}

export function latexToHtml(latex) {
  if (!latex) return '';
  let s = latex;

  // 1. Greek letters first
  s = s.replace(/\\Delta/g, 'Δ').replace(/\\delta/g, 'δ')
       .replace(/\\alpha/g, 'α').replace(/\\beta/g, 'β')
       .replace(/\\gamma/g, 'γ').replace(/\\lambda/g, 'λ')
       .replace(/\\omega/g, 'ω').replace(/\\pi/g, 'π')
       .replace(/\\theta/g, 'θ').replace(/\\sigma/g, 'σ')
       .replace(/\\mu/g, 'μ').replace(/\\phi/g, 'φ');

  // 2. Process \sqrt{x} or \sqrt(x) FIRST before \frac so nested braces inside \frac numerators are expanded
  s = s.replace(/\\sqrt\s*\{([^}]*)\}/g, '√($1)');
  s = s.replace(/\\sqrt\s*\(([^)]*)\)/g, '√($1)');
  s = s.replace(/\\sqrt\s*([a-zA-Z0-9Δπθ]+)/g, '√$1');
  s = s.replace(/\\vec\{([^}]*)\}/g, '$1\u20D7');
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lim|max|min|sup|inf)\b/g, '<span style="font-style:normal;font-weight:500">$1</span>');
  s = s.replace(/\\text\{([^}]*)\}/g, '<span style="font-style:normal">$1</span>');

  // 3. Process \frac{a}{b} or \frac(a)(b) repeatedly to handle fractions
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\frac\s*\{([^}]*)\}\s*\{([^}]*)\}/g, '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 4px;font-size:0.95em"><span style="border-bottom:1.5px solid currentColor;padding:0 4px;width:100%;text-align:center">$1</span><span style="padding:0 4px;width:100%;text-align:center">$2</span></span>');
    s = s.replace(/\\frac\s*\(([^)]*)\)\s*\(([^)]*)\)/g, '<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 4px;font-size:0.95em"><span style="border-bottom:1.5px solid currentColor;padding:0 4px;width:100%;text-align:center">$1</span><span style="padding:0 4px;width:100%;text-align:center">$2</span></span>');
  }

  // Math operators
  s = s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷')
       .replace(/\\pm/g, '±').replace(/\\mp/g, '∓').replace(/\\neq/g, '≠')
       .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\approx/g, '≈')
       .replace(/\\Rightarrow/g, '⇒').replace(/\\rightarrow/g, '→').replace(/\\Leftarrow/g, '⇐')
       .replace(/\\infty/g, '∞').replace(/\\quad/g, '&nbsp;&nbsp;').replace(/\\qquad/g, '&nbsp;&nbsp;&nbsp;&nbsp;')
       .replace(/\\in/g, '∈').replace(/\\subset/g, '⊂').replace(/\\cup/g, '∪').replace(/\\cap/g, '∩');

  s = s.replace(/\\int_\{?([^}\s]+)\}?\^\{?([^}\s]+)\}?/g, '∫<sub>$1</sub><sup>$2</sup> ');
  s = s.replace(/\\int/g, '∫').replace(/\\sum/g, '∑').replace(/\\prod/g, '∏');

  // Subscripts & Superscripts
  s = s.replace(/_\{([^}]*)\}/g, '<sub>$1</sub>').replace(/_([0-9a-zA-Z])/g, '<sub>$1</sub>');
  s = s.replace(/\^\{([^}]*)\}/g, '<sup>$1</sup>').replace(/\^([0-9a-zA-Z])/g, '<sup>$1</sup>');
  s = s.replace(/\\mathbb\{R\}/g, 'ℝ').replace(/\\mathbb\{Z\}/g, 'ℤ').replace(/\\mathbb\{N\}/g, 'ℕ').replace(/\\mathbb\{Q\}/g, 'ℚ');

  return s;
}

export function formatTutorText(msgText) {
  if (!msgText) return null;
  let text = String(msgText);

  // 1. Process block math $$...$$ first (High contrast light text on slate dark card)
  text = text.replace(/\$\$\s*([\s\S]+?)\s*\$\$/g, (_, tex) => {
    return `<div style="background:rgba(30,41,59,0.85);color:#f8fafc;padding:12px 18px;border-radius:12px;font-family:'Cambria Math','STIX Two Math',serif;margin:12px 0;font-size:1.08em;line-height:1.6;text-align:center;border:1.5px solid rgba(129,140,248,0.35);box-shadow:0 4px 12px rgba(0,0,0,0.25)">${latexToHtml(tex)}</div>`;
  });

  // 2. Process inline math $...$ (High contrast light periwinkle tag)
  text = text.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    return `<code style="background:rgba(99,102,241,0.25);color:#818cf8;border:1px solid rgba(129,140,248,0.3);padding:2px 8px;border-radius:6px;font-family:'Cambria Math','STIX Two Math',serif;font-size:0.95em;font-weight:700">${latexToHtml(tex)}</code>`;
  });

  // 3. Process markdown headings and lists (Bright Indigo/Violet for headers)
  text = text
    .replace(/### (.*?)(?:\n|$)/g, '<h4 style="color:#818cf8;margin:12px 0 6px;font-weight:800;font-size:1.08em;letter-spacing:0.2px">$1</h4>')
    .replace(/#### (.*?)(?:\n|$)/g, '<h5 style="color:#a5b4fc;margin:10px 0 4px;font-weight:700;font-size:0.98em">$1</h5>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#ffffff">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/^-\s(.*?)(?:\n|$)/gm, '<li style="margin-left:16px;margin-bottom:4px">$1</li>')
    .replace(/\n/g, '<br/>');

  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}
