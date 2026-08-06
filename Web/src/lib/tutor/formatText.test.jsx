/**
 * The tutor writes LaTeX and this app has no TeX engine, so `latexToHtml` is a
 * hand-written substitute. Its failure mode is silent and specific: a command
 * it has never been taught survives as raw markup, and a pupil who asked about
 * phương trình bậc hai is shown `\frac{-b + \sqrt{\Delta}}{2a}` where the
 * formula should be.
 *
 * The sweep at the bottom is the part that matters. Naming cases by hand only
 * catches the commands somebody already noticed; scanning the knowledge base
 * itself fails the moment a lesson is written with a command the converter does
 * not know — which is how both bugs below reached a screen.
 */

import { describe, it, expect } from 'vitest';
import { latexToHtml } from './formatText';
import { GDPT2018_BASE_KNOWLEDGE } from '../../data/gdpt2018BaseKnowledge';

/** What a pupil is left staring at when a rule is missing. */
const rawCommands = (html) => [...html.matchAll(/\\[a-zA-Z]+/g)].map(m => m[0]);

describe('latexToHtml — the two that reached a screen', () => {
  it('renders \\log_a, where an underscore used to defeat the word boundary', () => {
    // `\b` never fires between `g` and `_` — both are word characters — so the
    // operator rule skipped every `\log_a` in the maths knowledge base.
    const out = latexToHtml('\\log_a(b \\cdot c) = \\log_a b + \\log_a c');
    expect(rawCommands(out)).toEqual([]);
    expect(out).toContain('<sub>a</sub>');
    expect(out).toContain('·');
  });

  it('drops \\left and \\right instead of printing them', () => {
    const out = latexToHtml('\\log_a\\left(\\frac{b}{c}\\right) = \\log_a b - \\log_a c');
    expect(rawCommands(out)).toEqual([]);
    expect(out).not.toContain('left');
    expect(out).toContain('border-bottom');  // the fraction actually rendered
  });

  it('renders the quadratic formula, nested \\sqrt inside \\frac included', () => {
    const out = latexToHtml('x_1 = \\frac{-b + \\sqrt{\\Delta}}{2a}');
    expect(rawCommands(out)).toEqual([]);
    expect(out).toContain('Δ');
    expect(out).toContain('√');
    expect(out).toContain('<sub>1</sub>');
  });

  it('keeps ℝ, ≠ and superscripts out of raw form', () => {
    const out = latexToHtml('ax^2 + bx + c = 0, a \\neq 0, x \\in \\mathbb{R}');
    expect(rawCommands(out)).toEqual([]);
    expect(out).toContain('<sup>2</sup>');
    expect(out).toContain('≠');
    expect(out).toContain('ℝ');
  });

  it('leaves ordinary prose alone', () => {
    const prose = 'Phương trình có 2 nghiệm phân biệt khi biệt thức lớn hơn 0.';
    expect(latexToHtml(prose)).toBe(prose);
  });

  it('returns empty for nothing rather than throwing', () => {
    expect(latexToHtml('')).toBe('');
    expect(latexToHtml(null)).toBe('');
    expect(latexToHtml(undefined)).toBe('');
  });
});

describe('latexToHtml — every command the knowledge base actually uses', () => {
  const entries = GDPT2018_BASE_KNOWLEDGE.filter(e => typeof e.content === 'string');

  it('has lessons to check', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries.map(e => [e.id, e.topic, e.content]))(
    'converts %s (%s) with nothing left in raw form',
    (_id, _topic, content) => {
      const leftovers = [...new Set(rawCommands(latexToHtml(content)))];
      // A failure here names the command to teach the converter — it is not a
      // reason to edit the lesson, which is written in ordinary LaTeX.
      expect(leftovers).toEqual([]);
    }
  );
});
