-- Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create schools table
CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    sgk_series TEXT NOT NULL CHECK (sgk_series IN ('canh_dieu', 'ket_noi_tri_thuc', 'chan_troi_sang_tao')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on schools
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all authenticated users for schools"
    ON schools FOR SELECT
    TO authenticated
    USING (true);

-- 2. Create profiles table (linked to auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student', 'parent')),
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read profiles in the same school"
    ON profiles FOR SELECT
    TO authenticated
    USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Allow users to update their own profile"
    ON profiles FOR UPDATE
    TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 3. Create subject_groups table
CREATE TABLE subject_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    leader_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on subject_groups
ALTER TABLE subject_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read subject groups in their school"
    ON subject_groups FOR SELECT
    TO authenticated
    USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- 4. Create group_members table
CREATE TABLE group_members (
    group_id UUID REFERENCES subject_groups(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    PRIMARY KEY (group_id, teacher_id)
);

-- Enable RLS on group_members
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read group members in their school"
    ON group_members FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM subject_groups sg
            JOIN profiles p ON p.school_id = sg.school_id
            WHERE sg.id = group_members.group_id AND p.id = auth.uid()
        )
    );

-- 5. Create classes table
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read classes in their school"
    ON classes FOR SELECT
    TO authenticated
    USING (school_id = (SELECT school_id FROM profiles WHERE id = auth.uid()));

-- 6. Create teaching_assignments table
CREATE TABLE teaching_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (teacher_id, class_id, subject)
);

-- Enable RLS on teaching_assignments
ALTER TABLE teaching_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read teaching assignments in their school"
    ON teaching_assignments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM classes c
            JOIN profiles p ON p.school_id = c.school_id
            WHERE c.id = teaching_assignments.class_id AND p.id = auth.uid()
        )
    );

-- 7. Create enrollments table
CREATE TABLE enrollments (
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, class_id)
);

-- Enable RLS on enrollments
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow users to read enrollments in their school"
    ON enrollments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM classes c
            JOIN profiles p ON p.school_id = c.school_id
            WHERE c.id = enrollments.class_id AND p.id = auth.uid()
        )
    );
