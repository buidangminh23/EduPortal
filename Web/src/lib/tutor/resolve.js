import { retrieveBestEntry } from './retrieve';
import { evaluateMathExpression } from './mathEvaluator';
import { solveDynamicWordProblem } from './problemParamSolver';

export function resolveTutorResponse(query, { teacherEntries = [], groupEntries = [], baseEntries = [] }) {
  // Layer T0-A: Dynamic Word Problem Solver (Parses custom numerical parameters e.g. R=40, ZL=100, ZC=70 or 4.6g Na)
  const wordProblemEval = solveDynamicWordProblem(query);
  if (wordProblemEval) {
    return {
      entry: {
        id: 'word-problem-dynamic',
        topic: wordProblemEval.topic,
        content: wordProblemEval.formattedOutput,
        source_ref: 'Giải toán tự động EduPortal Solver',
        solutions: [
          {
            problem: wordProblemEval.problem,
            steps: wordProblemEval.steps,
            answer: wordProblemEval.answer
          }
        ]
      },
      confidence: 1.0,
      layer: 'T0',
      layerName: 'Bộ giải toán cụ thể tự động'
    };
  }

  // Layer T0-B: Dynamic Arithmetic Engine (Evaluates math calculations like 1+4=, 25*4, 100/5)
  const mathEval = evaluateMathExpression(query);
  if (mathEval) {
    return {
      entry: {
        id: 'math-eval-dynamic',
        topic: `Phép tính: ${mathEval.expression}`,
        content: mathEval.formattedOutput,
        source_ref: 'Máy tính số học tự động EduPortal',
        solutions: []
      },
      confidence: 1.0,
      layer: 'T0',
      layerName: 'Máy tính số học'
    };
  }

  // Layer T3: Teacher specific entries (highest priority)
  const teacherResult = retrieveBestEntry(query, teacherEntries);
  if (teacherResult.entry) {
    return { ...teacherResult, layer: 'T3', layerName: 'Giáo viên bộ môn' };
  }

  // Layer T2: Subject Group entries (medium priority)
  const groupResult = retrieveBestEntry(query, groupEntries);
  if (groupResult.entry) {
    return { ...groupResult, layer: 'T2', layerName: 'Tổ bộ môn' };
  }

  // Layer T1: Base GDPT 2018 entries (base priority)
  const baseResult = retrieveBestEntry(query, baseEntries);
  if (baseResult.entry) {
    return { ...baseResult, layer: 'T1', layerName: 'Tầng nền GDPT 2018' };
  }

  return { entry: null, confidence: 0, layer: null, layerName: null };
}
