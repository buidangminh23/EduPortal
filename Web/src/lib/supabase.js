import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if credentials are valid and not placeholders
const isRealSupabase = 
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'your_supabase_project_url_here' && 
  supabaseAnonKey !== 'your_supabase_anon_key_here';

const supabaseClient = isRealSupabase ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- SEED DATA FOR LOCAL SIMULATOR ---
const SEED_SCHOOLS = [
  {
    id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    name: 'Trường THPT Nguyễn Du',
    domain: 'school.edu.vn',
    sgk_series: 'canh_dieu',
    created_at: new Date().toISOString()
  }
];

const SEED_PROFILES = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'teacher',
    full_name: 'Nguyễn Minh Triết',
    email: 'triet.nm@school.edu.vn',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'e2000000-0000-0000-0000-000000000002',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'teacher',
    full_name: 'Trần Thị Hồng Vân',
    email: 'van.tth@school.edu.vn',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'e3000000-0000-0000-0000-000000000003',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'teacher',
    full_name: 'Phạm Đức Duy',
    email: 'duy.pd@school.edu.vn',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'e4000000-0000-0000-0000-000000000004',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'teacher',
    full_name: 'Lê Thu Hà',
    email: 'ha.lt@school.edu.vn',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 's0000000-0000-0000-0000-000000000001',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'student',
    full_name: 'Nguyễn Hoàng Nam',
    email: 'nam.nh@school.edu.vn',
    avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    created_at: new Date().toISOString()
  },
  {
    id: 'p0000000-0000-0000-0000-000000000001',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'parent',
    full_name: 'Nguyễn Văn Hùng',
    email: 'hung.nv@parent.school.edu.vn',
    avatar_url: null,
    created_at: new Date().toISOString()
  },
  {
    id: 'a0000000-0000-0000-0000-000000000001',
    school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d',
    role: 'admin',
    full_name: 'Hiệu trưởng BGH',
    email: 'hieutruong@school.edu.vn',
    avatar_url: null,
    created_at: new Date().toISOString()
  }
];

const SEED_CLASSES = [
  { id: 'c1000000-0000-0000-0000-000000000001', school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', name: '12A1', grade: 12 },
  { id: 'c2000000-0000-0000-0000-000000000002', school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', name: '12A2', grade: 12 },
  { id: 'c3000000-0000-0000-0000-000000000003', school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', name: '11A1', grade: 11 },
  { id: 'c4000000-0000-0000-0000-000000000004', school_id: 'a7b3c2d4-1e5f-4a6b-8c7d-9e0f1a2b3c4d', name: '10A1', grade: 10 }
];

const SEED_ASSIGNMENTS = [
  { id: '1', teacher_id: 'e1000000-0000-0000-0000-000000000001', class_id: 'c1000000-0000-0000-0000-000000000001', subject: 'Toán học' },
  { id: '2', teacher_id: 'e2000000-0000-0000-0000-000000000002', class_id: 'c2000000-0000-0000-0000-000000000002', subject: 'Ngữ văn' },
  { id: '3', teacher_id: 'e3000000-0000-0000-0000-000000000003', class_id: 'c3000000-0000-0000-0000-000000000003', subject: 'Vật lý' },
  { id: '4', teacher_id: 'e4000000-0000-0000-0000-000000000004', class_id: 'c4000000-0000-0000-0000-000000000004', subject: 'Tiếng Anh' }
];

const SEED_ENROLLMENTS = [
  { student_id: 's0000000-0000-0000-0000-000000000001', class_id: 'c1000000-0000-0000-0000-000000000001' }
];

const SEED_PRESETS = [
  {
    id: 'p1000000-0000-0000-0000-000000000001',
    name: 'Gợi mở từng bước',
    description: 'Học sinh đã nắm nền. Chỉ hỏi ngược, mỗi lần một bước, không đưa đáp án trực tiếp.',
    system_prompt: 'Bạn là một gia sư AI thân thiện, dạy theo phương pháp gợi mở (Socratic method). Khi học sinh hỏi bài, bạn KHÔNG được đưa ra lời giải hay đáp số ngay lập tức. Thay vào đó, hãy phân tích câu hỏi của học sinh thành từng bước nhỏ, hỏi các câu hỏi gợi mở để hướng dẫn học sinh tự suy nghĩ và tự tìm ra câu trả lời từng bước một. Bạn chỉ xác nhận và chuyển sang bước tiếp theo khi học sinh đã trả lời đúng bước trước đó.',
    guardrails: ['no_direct_answers', 'force_reflection', 'step_by_step_only'],
    is_global: true
  },
  {
    id: 'p2000000-0000-0000-0000-000000000002',
    name: 'Mẫu rồi luyện',
    description: 'Học sinh mới học hoặc yếu. Giải mẫu đầy đủ bài đầu tiên, các bài sau sẽ ẩn bớt các bước để học sinh tự điền.',
    system_prompt: 'Bạn là một gia sư AI kiên nhẫn. Đầu tiên, hãy cung cấp một lời giải mẫu đầy đủ chi tiết cho bài toán tương tự hoặc chính bài toán đó. Sau đó, hãy đưa ra một bài tập tương tự và yêu cầu học sinh tự giải quyết từng phần, hỗ trợ khi các em gặp khó khăn.',
    guardrails: ['provide_scaffolding', 'check_understanding'],
    is_global: true
  },
  {
    id: 'p3000000-0000-0000-0000-000000000003',
    name: 'Chắc lý thuyết trước',
    description: 'Chuyên đề nặng định nghĩa. Đi từ định nghĩa, điều kiện, công thức rồi mới sang ví dụ áp dụng.',
    system_prompt: 'Bạn là một gia sư AI coi trọng nền tảng. Khi giải quyết bài toán, trước tiên hãy hỏi học sinh hoặc nhắc nhở học sinh về các khái niệm, định nghĩa và công thức lý thuyết liên quan. Đảm bảo học sinh hiểu rõ bản chất lý thuyết trước khi bắt đầu áp dụng tính toán số học.',
    guardrails: ['theory_check_first', 'explain_formulas'],
    is_global: true
  },
  {
    id: 'p4000000-0000-0000-0000-000000000004',
    name: 'Ôn thi tốc độ',
    description: 'Học sinh cuối cấp luyện đề. Nhận dạng dạng bài, chỉ ra bẫy hay gặp và đưa ra hướng đi cực ngắn.',
    system_prompt: 'Bạn là một gia sư ôn thi cấp tốc THPT. Hãy hướng dẫn học sinh cách nhận diện nhanh dạng toán từ các từ khóa, các lỗi sai phổ biến (bẫy đề thi) cần tránh, và các công thức giải nhanh để chọn nhanh kết quả trắc nghiệm.',
    guardrails: ['quick_resolution', 'highlight_common_traps'],
    is_global: true
  }
];

// In Mock mode, initialize state in LocalStorage
const initLocalStorageMockDB = () => {
  const checkAndSeed = (key, defaultData) => {
    if (!localStorage.getItem(`mock_sb_${key}`)) {
      localStorage.setItem(`mock_sb_${key}`, JSON.stringify(defaultData));
    }
  };

  checkAndSeed('schools', SEED_SCHOOLS);
  checkAndSeed('profiles', SEED_PROFILES);
  checkAndSeed('classes', SEED_CLASSES);
  checkAndSeed('teaching_assignments', SEED_ASSIGNMENTS);
  checkAndSeed('enrollments', SEED_ENROLLMENTS);
  checkAndSeed('method_presets', SEED_PRESETS);
  checkAndSeed('tutor_configs', []);
  checkAndSeed('knowledge_entries', []);
  checkAndSeed('worked_solutions', []);
  checkAndSeed('topic_rules', []);
  checkAndSeed('conversations', []);
  checkAndSeed('messages', []);
  checkAndSeed('review_queue', []);
  checkAndSeed('golden_tests', []);
};

// Mock Query Builder
class MockQueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.data = JSON.parse(localStorage.getItem(`mock_sb_${tableName}`) || '[]');
    this.filters = [];
  }

  select() {
    // Basic select representation
    return this;
  }

  eq(column, value) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  in(column, values) {
    this.filters.push((item) => values.includes(item[column]));
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.orderConfig = { column, ascending };
    return this;
  }

  limit(num) {
    this.limitCount = num;
    return this;
  }

  async single() {
    const result = await this.execute();
    return {
      data: result.data && result.data.length > 0 ? result.data[0] : null,
      error: result.error
    };
  }

  async execute() {
    let filtered = [...this.data];
    for (const filter of this.filters) {
      filtered = filtered.filter(filter);
    }

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      filtered.sort((a, b) => {
        if (a[column] < b[column]) return ascending ? -1 : 1;
        if (a[column] > b[column]) return ascending ? 1 : -1;
        return 0;
      });
    }

    if (this.limitCount !== undefined) {
      filtered = filtered.slice(0, this.limitCount);
    }

    return { data: filtered, error: null };
  }

  // To support standard async/await or thenable calls on builder directly
  then(onfulfilled, onrejected) {
    return this.execute().then(onfulfilled, onrejected);
  }

  async insert(newData) {
    const recordsToInsert = Array.isArray(newData) ? newData : [newData];
    const newRecords = recordsToInsert.map(r => ({
      id: r.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
      ...r
    }));

    this.data.push(...newRecords);
    localStorage.setItem(`mock_sb_${this.tableName}`, JSON.stringify(this.data));
    return { data: Array.isArray(newData) ? newRecords : newRecords[0], error: null };
  }

  async update(updateData) {
    let updatedRecords = [];
    this.data = this.data.map(item => {
      let matches = true;
      for (const filter of this.filters) {
        if (!filter(item)) matches = false;
      }
      if (matches) {
        const updated = { ...item, ...updateData };
        updatedRecords.push(updated);
        return updated;
      }
      return item;
    });

    localStorage.setItem(`mock_sb_${this.tableName}`, JSON.stringify(this.data));
    return { data: updatedRecords, error: null };
  }

  async upsert(record) {
    const recordId = record.id;
    if (recordId) {
      const idx = this.data.findIndex(r => r.id === recordId);
      if (idx !== -1) {
        this.data[idx] = { ...this.data[idx], ...record };
        localStorage.setItem(`mock_sb_${this.tableName}`, JSON.stringify(this.data));
        return { data: this.data[idx], error: null };
      }
    }
    return this.insert(record);
  }

  async delete() {
    let deletedRecords = [];
    this.data = this.data.filter(item => {
      let matches = true;
      for (const filter of this.filters) {
        if (!filter(item)) matches = false;
      }
      if (matches) {
        deletedRecords.push(item);
        return false;
      }
      return true;
    });

    localStorage.setItem(`mock_sb_${this.tableName}`, JSON.stringify(this.data));
    return { data: deletedRecords, error: null };
  }
}

// Mock Auth Client
class MockAuthClient {
  constructor() {
    this.listeners = [];
  }

  onAuthStateChange(callback) {
    this.listeners.push(callback);
    // Trigger immediately with current state
    const session = this.getSessionSync();
    callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this.listeners = this.listeners.filter(l => l !== callback);
          }
        }
      }
    };
  }

  getSessionSync() {
    const saved = localStorage.getItem('mock_sb_session');
    return saved ? JSON.parse(saved) : null;
  }

  async getSession() {
    return { data: { session: this.getSessionSync() }, error: null };
  }

  async signInWithPassword({ email, password }) {
    const profiles = JSON.parse(localStorage.getItem('mock_sb_profiles') || '[]');
    
    // Support login via email or short username mapping
    let matchedProfile = profiles.find(p => p.email === email);
    if (!matchedProfile) {
      // Map short usernames for demo quick creds compat
      const mappedEmail = 
        email === 'minhtriet' ? 'triet.nm@school.edu.vn' :
        email === 'hoangnam' ? 'nam.nh@school.edu.vn' :
        email === 'phuhuynh_nam' ? 'hung.nv@parent.school.edu.vn' :
        email === 'hieutruong' ? 'hieutruong@school.edu.vn' : null;
        
      if (mappedEmail) {
        matchedProfile = profiles.find(p => p.email === mappedEmail);
      }
    }

    if (!matchedProfile) {
      return { data: null, error: { message: 'Tài khoản không tồn tại!' } };
    }

    // Mock password checking
    const validPassword = 
      matchedProfile.role === 'teacher' ? 'teacher123' :
      matchedProfile.role === 'student' ? 'student123' :
      matchedProfile.role === 'parent' ? 'parent123' :
      matchedProfile.role === 'admin' ? 'admin123' : '123';

    if (password !== validPassword) {
      return { data: null, error: { message: 'Mật khẩu không chính xác!' } };
    }

    const session = {
      user: {
        id: matchedProfile.id,
        email: matchedProfile.email,
        user_metadata: { full_name: matchedProfile.full_name }
      },
      access_token: 'mock-jwt-token-' + matchedProfile.id,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };

    localStorage.setItem('mock_sb_session', JSON.stringify(session));
    this.notifyListeners('SIGNED_IN', session);
    return { data: session, error: null };
  }

  async signOut() {
    localStorage.removeItem('mock_sb_session');
    this.notifyListeners('SIGNED_OUT', null);
    return { error: null };
  }

  notifyListeners(event, session) {
    this.listeners.forEach(l => l(event, session));
  }
}

// Mock Supabase Client Object
const mockSupabase = {
  auth: new MockAuthClient(),
  from(tableName) {
    return new MockQueryBuilder(tableName);
  }
};

// Initialize mock DB on startup if mock mode active
if (!isRealSupabase) {
  initLocalStorageMockDB();
}

export const supabase = isRealSupabase ? supabaseClient : mockSupabase;
export const isMockMode = !isRealSupabase;
