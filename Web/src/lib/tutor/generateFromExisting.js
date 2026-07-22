import { saveKnowledgeEntry } from './api';

// Utility to normalize string for trigger generation
function cleanTrigger(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove tone marks
    .replace(/[.?/!]/g, '')
    .trim();
}

export async function generateDraftsFromExisting({ teacherProfile, schoolId, subject, flashcards = [], assignments = [] }) {
  const draftsCreated = [];

  // 1. Generate from Flashcards
  // Flashcards are high quality question-answer pairs
  for (const fc of flashcards) {
    // Generate topic name from front of flashcard (up to 40 chars)
    const topic = fc.front.length > 40 ? fc.front.substring(0, 37) + '...' : fc.front;
    
    // Create triggers
    const trigger1 = cleanTrigger(fc.front);
    const trigger2 = trigger1.replace(/công thức |định luật |trạng thái /g, '');
    const triggers = [trigger1];
    if (trigger2 && trigger2 !== trigger1) {
      triggers.push(trigger2);
    }

    const entry = {
      layer: 'teacher',
      owner_id: teacherProfile.id,
      school_id: schoolId,
      subject: subject,
      topic: topic,
      triggers: triggers,
      content: fc.back,
      source_ref: 'Học liệu Flashcard',
      status: 'draft',
      version: 1
    };

    // If it contains formulas, we can extract steps or keep it simple
    let solutions = [];
    if (fc.back.includes('steps') || fc.back.includes('\n')) {
      // Mock extract some steps
      const lines = fc.back.split('\n');
      const steps = lines.map((line, idx) => ({
        n: idx + 1,
        content: line,
        hint: `Xem lại dòng: ${line.substring(0, 15)}...`
      }));
      
      solutions.push({
        problem: fc.front,
        steps: steps,
        answer: lines[0],
        answer_locked: true
      });
    }

    try {
      const saved = await saveKnowledgeEntry(entry, solutions);
      draftsCreated.push(saved);
    } catch (err) {
      console.error('Error generating draft from flashcard:', err);
    }
  }

  // 2. Generate from Homework Assignments
  // Assignments have topics and descriptions
  for (const assign of assignments) {
    if (assign.subject === subject) {
      const topic = assign.title;
      const trigger = cleanTrigger(assign.title);
      
      const entry = {
        layer: 'teacher',
        owner_id: teacherProfile.id,
        school_id: schoolId,
        subject: subject,
        topic: topic,
        triggers: [trigger],
        content: assign.content,
        source_ref: 'Bài tập: ' + assign.title,
        status: 'draft',
        version: 1
      };

      try {
        const saved = await saveKnowledgeEntry(entry, []);
        draftsCreated.push(saved);
      } catch (err) {
        console.error('Error generating draft from assignment:', err);
      }
    }
  }

  return draftsCreated;
}
