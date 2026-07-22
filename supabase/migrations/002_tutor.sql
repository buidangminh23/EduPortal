-- 1. Create method_presets table
CREATE TABLE method_presets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL,
    guardrails JSONB DEFAULT '[]'::jsonb NOT NULL,
    is_global BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on method_presets
ALTER TABLE method_presets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to method presets for authenticated users"
    ON method_presets FOR SELECT
    TO authenticated
    USING (true);

-- 2. Create tutor_configs table
CREATE TABLE tutor_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    preset_id UUID REFERENCES method_presets(id) ON DELETE SET NULL,
    tone TEXT NOT NULL CHECK (tone IN ('than_mat', 'trung_tinh', 'nghiem_tuc')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    version INTEGER DEFAULT 1 NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on tutor_configs
ALTER TABLE tutor_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can read and write their own tutor configurations"
    ON tutor_configs FOR ALL
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Students can read published tutor configurations"
    ON tutor_configs FOR SELECT
    TO authenticated
    USING (status = 'published');

-- 3. Create knowledge_entries table
CREATE TABLE knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer TEXT NOT NULL CHECK (layer IN ('teacher', 'group', 'base')),
    owner_id UUID NOT NULL, -- references profiles(id) if layer='teacher', subject_groups(id) if layer='group', or school_id if layer='base'
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    triggers TEXT[] DEFAULT '{}'::text[] NOT NULL,
    content TEXT NOT NULL,
    source_ref TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
    version INTEGER DEFAULT 1 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on knowledge_entries
ALTER TABLE knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access to knowledge entries"
    ON knowledge_entries FOR SELECT
    TO authenticated
    USING (
        (layer = 'base' AND school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())) OR
        (layer = 'teacher' AND owner_id = auth.uid()) OR
        (layer = 'group' AND EXISTS (
            SELECT 1 FROM group_members gm WHERE gm.group_id = owner_id AND gm.teacher_id = auth.uid()
        ))
    );

CREATE POLICY "Write access for teachers on their own entries"
    ON knowledge_entries FOR ALL
    TO authenticated
    USING (layer = 'teacher' AND owner_id = auth.uid())
    WITH CHECK (layer = 'teacher' AND owner_id = auth.uid());

CREATE POLICY "Write access for group leaders on group entries"
    ON knowledge_entries FOR ALL
    TO authenticated
    USING (
        layer = 'group' AND EXISTS (
            SELECT 1 FROM subject_groups sg WHERE sg.id = owner_id AND sg.leader_id = auth.uid()
        )
    )
    WITH CHECK (
        layer = 'group' AND EXISTS (
            SELECT 1 FROM subject_groups sg WHERE sg.id = owner_id AND sg.leader_id = auth.uid()
        )
    );

-- 4. Create worked_solutions table
CREATE TABLE worked_solutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES knowledge_entries(id) ON DELETE CASCADE NOT NULL,
    problem TEXT NOT NULL,
    steps JSONB DEFAULT '[]'::jsonb NOT NULL,
    answer TEXT NOT NULL,
    answer_locked BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on worked_solutions
ALTER TABLE worked_solutions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access to worked solutions"
    ON worked_solutions FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM knowledge_entries ke
            WHERE ke.id = worked_solutions.entry_id
        )
    );

CREATE POLICY "Write access to worked solutions"
    ON worked_solutions FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM knowledge_entries ke
            WHERE ke.id = worked_solutions.entry_id
              AND (
                (ke.layer = 'teacher' AND ke.owner_id = auth.uid()) OR
                (ke.layer = 'group' AND EXISTS (
                    SELECT 1 FROM subject_groups sg WHERE sg.id = ke.owner_id AND sg.leader_id = auth.uid()
                ))
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM knowledge_entries ke
            WHERE ke.id = worked_solutions.entry_id
              AND (
                (ke.layer = 'teacher' AND ke.owner_id = auth.uid()) OR
                (ke.layer = 'group' AND EXISTS (
                    SELECT 1 FROM subject_groups sg WHERE sg.id = ke.owner_id AND sg.leader_id = auth.uid()
                ))
              )
        )
    );

-- 5. Create topic_rules table
CREATE TABLE topic_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layer TEXT NOT NULL CHECK (layer IN ('teacher', 'group')),
    owner_id UUID NOT NULL, -- references profiles(id) or subject_groups(id)
    subject TEXT NOT NULL,
    topic TEXT NOT NULL,
    rules JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on topic_rules
ALTER TABLE topic_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read access to topic rules"
    ON topic_rules FOR SELECT
    TO authenticated
    USING (
        (layer = 'teacher' AND owner_id = auth.uid()) OR
        (layer = 'group' AND EXISTS (
            SELECT 1 FROM group_members gm WHERE gm.group_id = owner_id AND gm.teacher_id = auth.uid()
        ))
    );

CREATE POLICY "Write access to topic rules"
    ON topic_rules FOR ALL
    TO authenticated
    USING (
        (layer = 'teacher' AND owner_id = auth.uid()) OR
        (layer = 'group' AND EXISTS (
            SELECT 1 FROM subject_groups sg WHERE sg.id = owner_id AND sg.leader_id = auth.uid()
        ))
    )
    WITH CHECK (
        (layer = 'teacher' AND owner_id = auth.uid()) OR
        (layer = 'group' AND EXISTS (
            SELECT 1 FROM subject_groups sg WHERE sg.id = owner_id AND sg.leader_id = auth.uid()
        ))
    );
