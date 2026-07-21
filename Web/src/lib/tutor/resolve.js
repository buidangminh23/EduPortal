import { retrieveBestEntry } from './retrieve';

export function resolveTutorResponse(query, { teacherEntries = [], groupEntries = [], baseEntries = [] }) {
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
