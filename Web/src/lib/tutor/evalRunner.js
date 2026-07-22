import { matchEntryWithQuery } from './retrieve';

export function runGoldenEvaluation(goldenTests = [], entries = []) {
  if (!goldenTests.length) {
    return { passed: true, score: 100, results: [] };
  }

  let passCount = 0;
  const results = [];

  for (const test of goldenTests) {
    let matched = false;
    let score = 0;

    for (const entry of entries) {
      const matchScore = matchEntryWithQuery(test.question, entry);
      if (matchScore > score) {
        score = matchScore;
      }
    }

    // Threshold score of 0.35 required to pass golden test
    if (score >= 0.35) {
      matched = true;
      passCount++;
    }

    results.push({
      testId: test.id,
      question: test.question,
      expected: test.expected_behavior,
      score,
      passed: matched
    });
  }

  const overallScore = Math.round((passCount / goldenTests.length) * 100);
  const passed = overallScore === 100;

  return {
    passed,
    score: overallScore,
    passCount,
    totalCount: goldenTests.length,
    results
  };
}
