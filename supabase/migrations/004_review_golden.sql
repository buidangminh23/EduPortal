-- 1. Create review_queue table
CREATE TABLE review_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'taught', 'skipped')),
    correction TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on review_queue
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own review queue"
    ON review_queue FOR ALL
    TO authenticated
    USING (teacher_id = auth.uid())
    WITH CHECK (teacher_id = auth.uid());

-- 2. Create golden_tests table
CREATE TABLE golden_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    subject TEXT NOT NULL,
    question TEXT NOT NULL,
    expected_behavior TEXT NOT NULL,
    last_result TEXT,
    last_run_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on golden_tests
ALTER TABLE golden_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their own golden tests"
    ON golden_tests FOR ALL
    TO authenticated
    USING (owner_id = auth.uid())
    WITH CHECK (owner_id = auth.uid());
