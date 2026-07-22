-- 1. Create conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read their own conversations"
    ON conversations FOR SELECT
    TO authenticated
    USING (student_id = auth.uid() OR teacher_id = auth.uid());

CREATE POLICY "Allow users to insert their own conversations"
    ON conversations FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid() OR teacher_id = auth.uid());

-- 2. Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
    sender TEXT NOT NULL CHECK (sender IN ('user', 'tutor')),
    content TEXT NOT NULL,
    resolved_from UUID REFERENCES knowledge_entries(id) ON DELETE SET NULL,
    confidence DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read messages in their conversations"
    ON messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
              AND (c.student_id = auth.uid() OR c.teacher_id = auth.uid())
        )
    );

CREATE POLICY "Allow users to insert messages in their conversations"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conversations c
            WHERE c.id = messages.conversation_id
              AND (c.student_id = auth.uid() OR c.teacher_id = auth.uid())
        )
    );
