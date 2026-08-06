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

/**
 * Reads a balanced `{...}` beginning at `i`, or null if one does not start there.
 *
 * The regexes this replaces matched arguments with `[^}]*`, which cannot count
 * braces. On `\frac{x^{n+1}}{n+1}` the numerator stopped at the brace closing
 * the exponent; on `\sqrt{\frac{m}{k}}` it stopped inside the fraction. Both
 * left the command on the page for a pupil to read.
 */
function readGroup(s, i) {
  if (s[i] !== '{') return null;
  let depth = 0;
  for (let j = i; j < s.length; j += 1) {
    if (s[j] === '{') depth += 1;
    else if (s[j] === '}') {
      depth -= 1;
      if (depth === 0) return { body: s.slice(i + 1, j), end: j + 1 };
    }
  }
  return null;
}

const FRACTION_WRAP = 'display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;margin:0 4px;font-size:0.95em';
const FRACTION_TOP = 'border-bottom:1.5px solid currentColor;padding:0 4px;width:100%;text-align:center';
const FRACTION_BOTTOM = 'padding:0 4px;width:100%;text-align:center';
const BLACKBOARD = { R: 'ℝ', Z: 'ℤ', N: 'ℕ', Q: 'ℚ', C: 'ℂ' };
const UPRIGHT = 'font-style:normal';

/** Commands taking `{...}` arguments: how many, and what they become. */
const BRACE_COMMANDS = [
  ['frac', 2, (a, b) => `<span style="${FRACTION_WRAP}"><span style="${FRACTION_TOP}">${a}</span><span style="${FRACTION_BOTTOM}">${b}</span></span>`],
  ['sqrt', 1, (a) => `√(${a})`],
  ['text', 1, (a) => `<span style="${UPRIGHT}">${a}</span>`],
  ['mathrm', 1, (a) => `<span style="${UPRIGHT}">${a}</span>`],
  ['mathbf', 1, (a) => `<b>${a}</b>`],
  ['vec', 1, (a) => `${a}⃗`],
  ['mathbb', 1, (a) => BLACKBOARD[a] ?? a],
  ['overline', 1, (a) => `<span style="border-top:1.5px solid currentColor">${a}</span>`]
];

/**
 * Expands every brace-taking command, innermost first.
 *
 * Rightmost-first *is* innermost-first: a nested command always begins after
 * the backslash of the one holding it, so the inner fraction becomes HTML —
 * which carries no braces — before the outer command reads its argument. That
 * is what the old three-pass loop was reaching for and could not get, because
 * the passes re-ran a regex that had already failed.
 *
 * A malformed command loses its name rather than surviving. Its arguments still
 * read as maths, whereas a bare `\frac` in the middle of a formula reads as a
 * bug — which it is, but a pupil revising for an exam is the wrong person to
 * show it to.
 */
function expandBraceCommands(input) {
  let s = input;
  for (let guard = 0; guard < 200; guard += 1) {
    let at = -1;
    let cmd = null;
    for (const entry of BRACE_COMMANDS) {
      const idx = s.lastIndexOf(`\\${entry[0]}`);
      if (idx > at) { at = idx; cmd = entry; }
    }
    if (at < 0) return s;

    const [name, arity, render] = cmd;
    let i = at + name.length + 1;
    const args = [];
    for (let k = 0; k < arity; k += 1) {
      while (s[i] === ' ') i += 1;
      const group = readGroup(s, i);
      if (!group) break;
      args.push(group.body);
      i = group.end;
    }

    s = args.length === arity
      ? s.slice(0, at) + render(...args) + s.slice(i)
      : s.slice(0, at) + s.slice(at + name.length + 1);
  }
  return s;
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

  s = s.replace(/\\Omega/g, 'Ω').replace(/\\varphi/g, 'φ').replace(/\\varepsilon/g, 'ε')
       .replace(/\\rho/g, 'ρ').replace(/\\tau/g, 'τ').replace(/\\psi/g, 'ψ');

  // \left( \right] — sizing hints with no meaning outside a real TeX engine.
  // Dropped before \frac, or the command text survives inside a rendered
  // fraction: \log_a\left(\frac{b}{c}\right) showed a literal "\left(".
  s = s.replace(/\\left\s*([([\]{|.])?/g, (_, d) => (d && d !== '.' ? d : ''));
  s = s.replace(/\\right\s*([)\]([{|.])?/g, (_, d) => (d && d !== '.' ? d : ''));

  // Brace-taking commands, innermost first, with real brace matching — see
  // expandBraceCommands. The `{...}` forms below are gone from here because a
  // regex cannot count braces.
  s = expandBraceCommands(s);
  s = s.replace(/\\sqrt\s*\(([^)]*)\)/g, '√($1)');
  s = s.replace(/\\sqrt\s*([a-zA-Z0-9Δπθ]+)/g, '√$1');
  /* `(?![a-zA-Z])` and not `\b`: an underscore is a word character, so `\b`
     never fires after `log` in `\log_a` — the most common form in the whole
     knowledge base. It rendered as a literal "\loga". */
  s = s.replace(/\\(sin|cos|tan|cot|sec|csc|log|ln|lg|exp|lim|max|min|sup|inf|deg|arg|gcd)(?![a-zA-Z])/g,
                '<span style="font-style:normal;font-weight:500">$1</span>');

  // Math operators
  s = s.replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, '÷')
       .replace(/\\pm/g, '±').replace(/\\mp/g, '∓').replace(/\\neq/g, '≠')
       .replace(/\\leq/g, '≤').replace(/\\geq/g, '≥').replace(/\\approx/g, '≈')
       .replace(/\\xrightarrow\s*(?:\[[^\]]*\])?\s*\{([^}]*)\}/g, ' —<sup>$1</sup>→ ')
       .replace(/\\Rightarrow/g, '⇒').replace(/\\rightarrow/g, '→').replace(/\\Leftarrow/g, '⇐')
       .replace(/\\Leftrightarrow/g, '⇔').replace(/\\leftrightarrow/g, '↔')
       .replace(/\\uparrow/g, '↑').replace(/\\downarrow/g, '↓')
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
