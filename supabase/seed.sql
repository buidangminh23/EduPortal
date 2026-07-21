-- 1. Seed School
INSERT INTO schools (id, name, domain, sgk_series)
VALUES (
    'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    'Trường THPT Nguyễn Du',
    'school.edu.vn',
    'canh_dieu'
) ON CONFLICT (domain) DO UPDATE SET name = EXCLUDED.name;

-- 2. Seed auth.users and profiles for Teachers
-- Note: In Supabase, auth.users is managed by Supabase Auth, but we can write SQL seeds to simulate it for custom DB setups
-- We'll assume UUIDs for the 4 initial teachers:
-- T01: 'e1000000-0000-0000-0000-000000000001'
-- T02: 'e2000000-0000-0000-0000-000000000002'
-- T03: 'e3000000-0000-0000-0000-000000000003'
-- T04: 'e4000000-0000-0000-0000-000000000004'

INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('e1000000-0000-0000-0000-000000000001', 'triet.nm@school.edu.vn', '{"full_name": "Nguyễn Minh Triết"}'::jsonb),
    ('e2000000-0000-0000-0000-000000000002', 'van.tth@school.edu.vn', '{"full_name": "Trần Thị Hồng Vân"}'::jsonb),
    ('e3000000-0000-0000-0000-000000000003', 'duy.pd@school.edu.vn', '{"full_name": "Phạm Đức Duy"}'::jsonb),
    ('e4000000-0000-0000-0000-000000000004', 'ha.lt@school.edu.vn', '{"full_name": "Lê Thu Hà"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, school_id, role, full_name, avatar_url)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', 'teacher', 'Nguyễn Minh Triết', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80'),
    ('e2000000-0000-0000-0000-000000000002', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', 'teacher', 'Trần Thị Hồng Vân', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'),
    ('e3000000-0000-0000-0000-000000000003', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', 'teacher', 'Phạm Đức Duy', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
    ('e4000000-0000-0000-0000-000000000004', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', 'teacher', 'Lê Thu Hà', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 3. Seed Classes
INSERT INTO classes (id, school_id, name, grade)
VALUES
    ('c1000000-0000-0000-0000-000000000001', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', '12A1', 12),
    ('c2000000-0000-0000-0000-000000000002', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', '12A2', 12),
    ('c3000000-0000-0000-0000-000000000003', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', '11A1', 11),
    ('c4000000-0000-0000-0000-000000000004', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', '10A1', 10)
ON CONFLICT (id) DO NOTHING;

-- 4. Seed Teaching Assignments
INSERT INTO teaching_assignments (teacher_id, class_id, subject)
VALUES
    ('e1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Toán học'),
    ('e2000000-0000-0000-0000-000000000002', 'c2000000-0000-0000-0000-000000000002', 'Ngữ văn'),
    ('e3000000-0000-0000-0000-000000000003', 'c3000000-0000-0000-0000-000000000003', 'Vật lý'),
    ('e4000000-0000-0000-0000-000000000004', 'c4000000-0000-0000-0000-000000000004', 'Tiếng Anh')
ON CONFLICT DO NOTHING;

-- 5. Seed method_presets
INSERT INTO method_presets (id, name, description, system_prompt, guardrails, is_global)
VALUES
    (
        'p1000000-0000-0000-0000-000000000001',
        'Gợi mở từng bước',
        'Học sinh đã nắm nền. Chỉ hỏi ngược, mỗi lần một bước, không đưa đáp án trực tiếp.',
        'Bạn là một gia sư AI thân thiện, dạy theo phương pháp gợi mở (Socratic method). Khi học sinh hỏi bài, bạn KHÔNG được đưa ra lời giải hay đáp số ngay lập tức. Thay vào đó, hãy phân tích câu hỏi của học sinh thành từng bước nhỏ, hỏi các câu hỏi gợi mở để hướng dẫn học sinh tự suy nghĩ và tự tìm ra câu trả lời từng bước một. Bạn chỉ xác nhận và chuyển sang bước tiếp theo khi học sinh đã trả lời đúng bước trước đó.',
        '["no_direct_answers", "force_reflection", "step_by_step_only"]'::jsonb,
        true
    ),
    (
        'p2000000-0000-0000-0000-000000000002',
        'Mẫu rồi luyện',
        'Học sinh mới học hoặc yếu. Giải mẫu đầy đủ bài đầu tiên, các bài sau sẽ ẩn bớt các bước để học sinh tự điền.',
        'Bạn là một gia sư AI kiên nhẫn. Đầu tiên, hãy cung cấp một lời giải mẫu đầy đủ chi tiết cho bài toán tương tự hoặc chính bài toán đó. Sau đó, hãy đưa ra một bài tập tương tự và yêu cầu học sinh tự giải quyết từng phần, hỗ trợ khi các em gặp khó khăn.',
        '["provide_scaffolding", "check_understanding"]'::jsonb,
        true
    ),
    (
        'p3000000-0000-0000-0000-000000000003',
        'Chắc lý thuyết trước',
        'Chuyên đề nặng định nghĩa. Đi từ định nghĩa, điều kiện, công thức rồi mới sang ví dụ áp dụng.',
        'Bạn là một gia sư AI coi trọng nền tảng. Khi giải quyết bài toán, trước tiên hãy hỏi học sinh hoặc nhắc nhở học sinh về các khái niệm, định nghĩa và công thức lý thuyết liên quan. Đảm bảo học sinh hiểu rõ bản chất lý thuyết trước khi bắt đầu áp dụng tính toán số học.',
        '["theory_check_first", "explain_formulas"]'::jsonb,
        true
    ),
    (
        'p4000000-0000-0000-0000-000000000004',
        'Ôn thi tốc độ',
        'Học sinh cuối cấp luyện đề. Nhận dạng dạng bài, chỉ ra bẫy hay gặp và đưa ra hướng đi cực ngắn.',
        'Bạn là một gia sư ôn thi cấp tốc THPT. Hãy hướng dẫn học sinh cách nhận diện nhanh dạng toán từ các từ khóa, các lỗi sai phổ biến (bẫy đề thi) cần tránh, và các công thức giải nhanh để chọn nhanh kết quả trắc nghiệm.',
        '["quick_resolution", "highlight_common_traps"]'::jsonb,
        true
    )
ON CONFLICT (id) DO NOTHING;

-- 6. Seed Students (For Demo, we seed the static student Nguyễn Hoàng Nam 's0000000-0000-0000-0000-000000000001')
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES 
    ('s0000000-0000-0000-0000-000000000001', 'nam.nh@school.edu.vn', '{"full_name": "Nguyễn Hoàng Nam"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (id, school_id, role, full_name, avatar_url)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', 'student', 'Nguyễn Hoàng Nam', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

INSERT INTO enrollments (student_id, class_id)
VALUES
    ('s0000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
