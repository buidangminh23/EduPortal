import { normalizeVietnameseText } from './normalize';

export function isTopicInSyllabusScope(topicName, journalEntries = [], studentClass = '12A1') {
  if (!topicName || !journalEntries.length) return true; // Default to true if no journal entries exist

  const normTopic = normalizeVietnameseText(topicName);

  // Check if any journal entry for student's class matches topic keywords
  const matchedJournal = journalEntries.some(j => {
    if (j.classTarget && j.classTarget !== studentClass) return false;
    const normContent = normalizeVietnameseText(j.content || j.title || '');
    return normContent.includes(normTopic) || normTopic.includes(normContent);
  });

  return matchedJournal;
}
