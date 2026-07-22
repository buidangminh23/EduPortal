import { supabase } from '../supabase';

// 1. Fetch all pedagogical presets
export async function fetchPresets() {
  const { data, error } = await supabase
    .from('method_presets')
    .select('*');
  if (error) throw error;
  return data;
}

// 2. Fetch or create config for teacher
export async function fetchTutorConfig(teacherId) {
  const { data, error } = await supabase
    .from('tutor_configs')
    .select('*')
    .eq('teacher_id', teacherId)
    .limit(1);

  if (error) throw error;

  if (data && data.length > 0) {
    return data[0];
  }

  // Create a default draft config if none exists
  const presets = await fetchPresets();
  const defaultPreset = presets.find(p => p.name === 'Gợi mở từng bước') || presets[0];

  const defaultConfig = {
    teacher_id: teacherId,
    preset_id: defaultPreset?.id || null,
    tone: 'than_mat',
    status: 'draft',
    version: 1
  };

  const { data: created, error: createErr } = await supabase
    .from('tutor_configs')
    .insert(defaultConfig);

  if (createErr) throw createErr;
  return created;
}

// 3. Save/Update tutor config
export async function saveTutorConfig(config) {
  const { data, error } = await supabase
    .from('tutor_configs')
    .upsert(config);
  if (error) throw error;
  return data;
}

// 4. Fetch all knowledge entries with their solutions for teacher/subject
export async function fetchKnowledgeEntries(teacherId, schoolId, subject) {
  // 1. Get entries
  const { data: entries, error: entriesErr } = await supabase
    .from('knowledge_entries')
    .select('*')
    .eq('school_id', schoolId)
    .eq('subject', subject);

  if (entriesErr) throw entriesErr;

  // 2. Fetch worked solutions for these entries
  if (entries && entries.length > 0) {
    const entryIds = entries.map(e => e.id);
    const { data: solutions, error: solErr } = await supabase
      .from('worked_solutions')
      .select('*')
      .in('entry_id', entryIds);

    if (solErr) throw solErr;

    // Map solutions to their respective entries
    return entries.map(entry => ({
      ...entry,
      solutions: (solutions || []).filter(sol => sol.entry_id === entry.id)
    }));
  }

  return [];
}

// 5. Save/Update knowledge entry and its worked solutions
export async function saveKnowledgeEntry(entry, solutions = []) {
  const { data: savedEntry, error: entryErr } = await supabase
    .from('knowledge_entries')
    .upsert(entry);

  if (entryErr) throw entryErr;
  const actualEntry = Array.isArray(savedEntry) ? savedEntry[0] : savedEntry;

  // Sync worked solutions
  // First, delete existing solutions for this entry
  const { error: delErr } = await supabase
    .from('worked_solutions')
    .delete()
    .eq('entry_id', actualEntry.id);

  if (delErr) throw delErr;

  // Insert new solutions
  if (solutions.length > 0) {
    const solutionsToInsert = solutions.map(sol => ({
      entry_id: actualEntry.id,
      problem: sol.problem,
      steps: sol.steps,
      answer: sol.answer,
      answer_locked: sol.answer_locked ?? true
    }));

    const { data: savedSols, error: solErr } = await supabase
      .from('worked_solutions')
      .insert(solutionsToInsert);

    if (solErr) throw solErr;
    actualEntry.solutions = Array.isArray(savedSols) ? savedSols : [savedSols];
  } else {
    actualEntry.solutions = [];
  }

  return actualEntry;
}

// 6. Delete knowledge entry
export async function deleteKnowledgeEntry(entryId) {
  const { error } = await supabase
    .from('knowledge_entries')
    .delete()
    .eq('id', entryId);
  if (error) throw error;
  return true;
}

// 7. Fetch topic rules
export async function fetchTopicRules(ownerId, subject) {
  const { data, error } = await supabase
    .from('topic_rules')
    .select('*')
    .eq('owner_id', ownerId)
    .eq('subject', subject);
  if (error) throw error;
  return data;
}

// 8. Save/Update topic rules
export async function saveTopicRules(rule) {
  const { data, error } = await supabase
    .from('topic_rules')
    .upsert(rule);
  if (error) throw error;
  return data;
}
