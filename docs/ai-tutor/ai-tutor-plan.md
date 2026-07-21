---
type: implementation-plan
feature: ai-tutor
status: draft
updated: 2026-07-21
links:
  - Web/src/context/AppContext.jsx
  - Web/src/components/AITutor.jsx
  - Web/src/components/Login.jsx
  - Web/src/components/TeacherDashboard.jsx
---

# Kế hoạch thi công — Gia sư AI do giáo viên đào tạo

> Quy mô: 1 developer full-time. Giai đoạn 1–4 khoảng 9 tuần tới bản bán được.

## 1. Quyết định kiến trúc đã chốt

### 1.1. Hai trục, không phải nhiều tutor

Nội dung và phương pháp là hai thứ khác bản chất, tách thành hai trục độc lập. Chỉ có **một engine gia sư**; mỗi lượt hỏi là phép giải `(học sinh, môn, giáo viên) → stack nội dung × preset phương pháp`.

```
TRỤC NỘI DUNG (dạy CÁI GÌ)        ×    TRỤC PHƯƠNG PHÁP (dạy THẾ NÀO)
T3  Giáo viên   (mỏng, ghi đè)          Preset A · Gợi mở từng bước
T2  Tổ bộ môn   (chính)                 Preset B · Mẫu rồi luyện
T1  Nền GDPT 2018                       Preset C · Chắc lý thuyết trước
                                        Preset D · Ôn thi tốc độ
```

Truy hồi theo thứ tự T3 → T2 → T1. Tầng trên ghi đè tầng dưới, phạm vi ảnh hưởng chỉ trong học sinh của giáo viên đó.

### 1.2. Gộp kiến thức ở cấp tổ bộ môn, không phải cấp trường

Đơn vị gộp là **tổ chuyên môn** — cấu trúc đã có cơ sở pháp lý theo Thông tư 32/2020/TT-BGDĐT: có tổ trưởng do hiệu trưởng bổ nhiệm, sinh hoạt ít nhất 1 lần trong 2 tuần, và đã sẵn nhiệm vụ xây dựng kế hoạch dạy học chung.

Gộp cả trường thất bại vì hai lý do: mâu thuẫn sư phạm giữa các giáo viên cùng môn, và free-rider tăng theo quy mô nhóm.

### 1.3. LLM là động cơ ngôn ngữ, không phải nguồn kiến thức

| LLM được làm | LLM không được làm |
|---|---|
| Diễn đạt lại cho vừa trình độ học sinh | Cung cấp công thức từ trí nhớ của nó |
| Đặt câu hỏi gợi mở | Tự chế ví dụ chưa ai duyệt |
| Chọn thả bước nào, giữ bước nào | Trả lời khi không truy hồi được gì |
| Nhận ra học sinh đang sai ở đâu | Nói điều không dẫn được về nguồn |

Kiến thức đến từ kho đã kiểm định. Bịa bị chặn ở cả đầu vào (không truy hồi được thì không gọi LLM) lẫn đầu ra (không dẫn được nguồn thì không gửi).

### 1.4. Guardrail bật sẵn, giáo viên không viết

Khảo sát prompt do giáo viên K-12 tự viết cho thấy chỉ 29,8% có chứa guardrail, phổ biến nhất là "không đưa đáp án trực tiếp" (19,6%). Nếu đưa ô trống, khoảng 7/10 gia sư sinh ra sẽ đọc thẳng đáp án cho học sinh chép.

Giáo viên chỉ có ba động từ: **chọn** preset, **duyệt** bản nháp tự sinh, **sửa** câu trả lời sai. Không bao giờ đối diện ô trống.

### 1.5. Cloud cho generation, local cho phần còn lại

| Thành phần | Chạy ở | Lý do |
|---|---|---|
| App, DB, kho kiến thức | Server thuê datacenter | Dữ liệu ở Việt Nam, rẻ |
| Embedding, truy hồi | Server thuê, CPU | Input ngắn, tính trước offline |
| Lọc PII, kiểm duyệt | Server thuê, CPU | Phải chạy trước khi dữ liệu rời máy |
| Sinh câu trả lời | Cloud API | Thành phần duy nhất cần GPU |

Kho kiến thức không bao giờ rời server. Chỉ `(câu hỏi đã lọc PII + đoạn trích)` đi ra ngoài.

Giai đoạn 1–5 không gọi LLM, chạy trọn trong server thuê.

## 2. Hiện trạng codebase

Khảo sát ngày 2026-07-21.

| Hạng mục | Trạng thái |
|---|---|
| Backend | Không có. Zero `fetch`, zero biến môi trường |
| Lưu trữ | 55 lần `localStorage.setItem`, toàn bộ state trong trình duyệt |
| Xác thực | Hardcode 4 tài khoản trong `Login.jsx:13-16`, **chỉ 1 giáo viên** (`minhtriet`), mật khẩu base64 trong frontend |
| Danh tính | Không có `currentUser` trong AppContext |
| "AI" | 15 nhánh `if/else` khớp từ khoá tại `AppContext.jsx:1686`, `setTimeout` 1200ms giả suy nghĩ |
| Dependency | Chỉ `react`, `react-dom`, `lucide-react` |

### 2.1. Hai lỗi phải biết

**Nhánh fallback bịa nội dung.** Khi không khớp từ khoá nào, `sendTutorMessage` sinh ra công thức giả và một con số ngẫu nhiên `(1.5 + Math.random()).toFixed(1)`, trình bày với heading, LaTeX và giọng sư phạm tự tin. Áp dụng cho mọi câu hỏi ngoài 15 từ khoá.

Phải gỡ ở Giai đoạn 3.

**Cơ chế xoá localStorage theo version.** `AppContext.jsx:725` xoá 50 key mỗi lần bump `CURRENT_DB_VERSION`. Với mô hình strangler fig đã chọn, dữ liệu gia sư nằm ở Supabase nên không bị ảnh hưởng. Nhưng dữ liệu người dùng khác (điểm đã nhập, bài đã giao) vẫn mất mỗi lần deploy — lỗi có sẵn, ngoài phạm vi kế hoạch này.

### 2.2. Nguyên tắc strangler fig

Chỉ dữ liệu gia sư lên Supabase. 50 key localStorage còn lại giữ nguyên, không migrate.

| Lên Supabase | Giữ localStorage |
|---|---|
| Danh tính (school, profile, class, tổ) | students, teachers, grades |
| tutor_configs, knowledge_entries | lessonPlans, journalEntries, flashcards |
| worked_solutions, topic_rules | assignments, submissions, attendance |
| conversations, review_queue, golden_tests | 40+ key khác |

Bộ sinh ở Giai đoạn 2 **đọc** localStorage (lessonPlans, journalEntries) và **ghi** vào Supabase. Một chiều, không đồng bộ ngược.

Migrate toàn bộ `AppContext` 2.879 dòng sẽ ngốn nhiều tuần và chặn mọi thứ khác. Để sau, khi tính năng gia sư đã chạy.

## 3. Mô hình dữ liệu

### 3.1. Danh tính

```sql
schools(id, name, domain, sgk_series, created_at)
-- sgk_series: 'canh_dieu' | 'ket_noi_tri_thuc' | 'chan_troi_sang_tao'

profiles(id → auth.users, school_id, role, full_name, avatar_url)
-- role: 'admin' | 'teacher' | 'student' | 'parent'

subject_groups(id, school_id, subject, leader_id → profiles)
group_members(group_id, teacher_id)

classes(id, school_id, name, grade)
teaching_assignments(teacher_id, class_id, subject)
enrollments(student_id, class_id)
```

`teaching_assignments` là bảng quyết định định tuyến: học sinh hỏi môn Toán thì tìm giáo viên dạy Toán ở lớp em đó.

`sgk_series` gắn ở cấp trường. Sau chương trình GDPT 2018, Việt Nam theo mô hình một chương trình nhiều bộ sách — cùng nội dung nhưng khác ký hiệu và thứ tự trình bày. Thiếu trường này thì gia sư dạy ký hiệu của bộ sách khác với sách học sinh đang cầm.

### 3.2. Gia sư

```sql
method_presets(id, name, description, system_prompt, guardrails jsonb, is_global)

tutor_configs(id, teacher_id, preset_id, tone, status, version, published_at)
-- status: 'draft' | 'published'
-- tone: 'than_mat' | 'trung_tinh' | 'nghiem_tuc'

knowledge_entries(
  id, layer, owner_id, school_id, subject, topic,
  triggers text[], content, source_ref, status, version, created_at
)
-- layer: 'teacher' | 'group' | 'base'
-- owner_id trỏ profiles nếu teacher, subject_groups nếu group, null nếu base

worked_solutions(
  id, entry_id → knowledge_entries,
  problem, steps jsonb, answer, answer_locked bool default true
)

topic_rules(id, layer, owner_id, subject, topic, rules jsonb)
```

**`worked_solutions.steps` phải là mảng bước, không phải văn bản liền:**

```json
[
  { "n": 1, "content": "Nhận dạng: tích của log và đa thức → từng phần",
    "hint": "Nhìn xem có mấy loại hàm?" },
  { "n": 2, "content": "Đặt u = ln(x), dv = x·dx",
    "hint": "Nhất lô nhì đa — cái nào làm u?" }
]
```

Lý do là ràng buộc sư phạm, không phải thẩm mỹ:

| Preset | Dùng cấu trúc bước thế nào |
|---|---|
| Gợi mở từng bước | Thả 1 bước mỗi lần, hỏi ngược trước khi thả tiếp |
| Mẫu rồi luyện | Bài đầu hiện đủ, bài sau bỏ dần bước cuối |
| Ôn thi tốc độ | Chỉ hiện bước 1 và đáp số |

`answer` tách riêng với cờ `answer_locked` để guardrail "không đưa đáp án cuối" biết chặn cái gì. Lưu thành đoạn văn liền thì cả bốn preset lẫn guardrail đều không hoạt động được.

### 3.3. Vòng lặp cải tiến

```sql
conversations(id, student_id, teacher_id, subject, class_id, started_at)

messages(
  id, conversation_id, sender, content,
  resolved_from → knowledge_entries, confidence, created_at
)
-- resolved_from null = không truy hồi được → vào review_queue

review_queue(
  id, message_id, teacher_id, status, correction, resolved_at
)
-- status: 'pending' | 'taught' | 'skipped'

golden_tests(
  id, owner_id, subject, question, expected_behavior,
  last_result, last_run_at
)
```

### 3.4. RLS

| Bảng | Chính sách |
|---|---|
| `knowledge_entries` layer='teacher' | Chỉ chủ sở hữu đọc/ghi |
| `knowledge_entries` layer='group' | Thành viên tổ đọc, tổ trưởng ghi |
| `knowledge_entries` layer='base' | Mọi người đọc, chỉ service role ghi |
| `conversations`, `messages` | Học sinh đọc của mình; giáo viên đọc của học sinh mình dạy |
| `review_queue` | Chỉ giáo viên sở hữu |

Test RLS bằng hai tài khoản giáo viên thật trước khi sang Giai đoạn 2. Sai chính sách ở đây thì giáo viên thấy dữ liệu của nhau, và phát hiện muộn sẽ rất tốn kém.

## 4. Bảy giai đoạn

```
GĐ1 Danh tính ──► GĐ2 Kho + Huấn luyện ──► GĐ3 Truy hồi ──► GĐ4 Duyệt + Cổng
   2 tuần              3 tuần                  2 tuần            2 tuần
                                                                    │
                                              ┌─────────────────────┤
                                              ▼                     ▼
                                    GĐ5 Tổ bộ môn          GĐ6 LLM
                                        2 tuần                3 tuần
                                              │                     │
                                              └──────────┬──────────┘
                                                         ▼
                                                  GĐ7 Tầng nền
                                                   (nội dung)
```

Giai đoạn 5 và 6 độc lập nhau, làm song song được nếu có thêm người.

**Mốc bán được: hết Giai đoạn 4, khoảng 9 tuần.**

## 5. Chi tiết từng giai đoạn

### Giai đoạn 1 — Nền tảng danh tính (2 tuần)

Mục tiêu: app biết "tôi là giáo viên nào".

Hiện `Login.jsx` hardcode đúng một tài khoản giáo viên. Không có khái niệm "mỗi giáo viên" thì tính năng "gia sư của tôi" không có chỗ bám.

**Việc**

1. Tạo Supabase project, bật Auth (email/password + Google)
2. Migration `001_identity.sql` — 6 bảng ở Mục 3.1
3. Seed từ `initialTeachers`, `initialStudents` trong AppContext
4. `AuthContext` mới, độc lập với AppContext
5. RLS cho toàn bộ bảng danh tính
6. `Login.jsx`: thay `QUICK_CREDS` bằng auth thật, giữ 4 nút demo để đăng nhập nhanh khi phát triển
7. Test RLS bằng 2 tài khoản giáo viên khác nhau

**Files**

| Action | Path |
|---|---|
| create | `Web/src/lib/supabase.js` |
| create | `Web/src/context/AuthContext.jsx` |
| create | `supabase/migrations/001_identity.sql` |
| create | `supabase/seed.sql` |
| create | `Web/.env.example` |
| edit | `Web/src/components/Login.jsx` |
| edit | `Web/src/App.jsx` (bọc `AuthProvider`) |
| edit | `Web/src/context/AppContext.jsx` (đọc `currentUser`, chỉ thêm) |

**Xong khi:** ba tài khoản giáo viên khác nhau đăng nhập được, mỗi người thấy đúng lớp mình dạy, và 50 key localStorage cũ chạy y nguyên không lỗi.

**Rủi ro:** RLS sai làm giáo viên thấy dữ liệu của nhau. Không được sang Giai đoạn 2 khi chưa test xong bằng tài khoản thật.

### Giai đoạn 2 — Kho kiến thức và màn hình huấn luyện (3 tuần)

Mục tiêu: giáo viên dựng xong gia sư trong khoảng 10 phút.

Đây là giai đoạn quyết định. Không có kho kiến thức thì mọi thứ sau đều vô nghĩa — model mạnh cỡ nào cũng chỉ là chatbot có logo trường.

**Việc**

1. Migration `002_tutor.sql` — bảng ở Mục 3.2
2. Seed 4 preset với guardrail đầy đủ
3. Bộ sinh bản nháp: quét `lessonPlans` + `journalEntries` + `flashcards` + `assignments` của chính giáo viên đó
4. Tab mới với 3 sub-tab: Phương pháp / Kiến thức / Cần duyệt (sub-tab thứ ba để rỗng tới Giai đoạn 4)
5. Editor cho knowledge entry
6. Editor cho worked solution theo bước, có ô đáp số riêng
7. Ô thử nghiệm: nhúng `AITutor`, trỏ vào bản nháp
8. Trạng thái draft/published, tăng version mỗi lần xuất bản

**Preset khởi điểm**

| Preset | Dùng khi | Hành vi |
|---|---|---|
| Gợi mở từng bước | Học sinh đã nắm nền | Chỉ hỏi ngược, mỗi lần một bước, không đưa đáp án |
| Mẫu rồi luyện | Học sinh mới học hoặc yếu | Giải mẫu đầy đủ, bài sau bỏ dần bước |
| Chắc lý thuyết trước | Chuyên đề nặng định nghĩa | Định nghĩa, điều kiện, công thức rồi mới ví dụ |
| Ôn thi tốc độ | Học sinh cuối cấp luyện đề | Nhận dạng dạng bài, bẫy hay gặp, cực ngắn |

Mọi preset bật sẵn: giọng ấm áp khích lệ, chặn đưa đáp án cuối, chặn nội dung ngoài phạm vi đã dạy. Giáo viên chỉnh được mức độ, không xoá được nhóm an toàn.

**Files**

| Action | Path |
|---|---|
| create | `supabase/migrations/002_tutor.sql` |
| create | `Web/src/components/teacher/AiTutorTrainerTab.jsx` |
| create | `Web/src/components/teacher/tutor/PresetPicker.jsx` |
| create | `Web/src/components/teacher/tutor/KnowledgeList.jsx` |
| create | `Web/src/components/teacher/tutor/KnowledgeEditor.jsx` |
| create | `Web/src/components/teacher/tutor/SolutionEditor.jsx` |
| create | `Web/src/components/teacher/tutor/TestPanel.jsx` |
| create | `Web/src/lib/tutor/generateFromExisting.js` |
| create | `Web/src/lib/tutor/api.js` |
| edit | `Web/src/components/TeacherDashboard.jsx` |
| edit | `Web/src/components/Sidebar.jsx` |

**Xong khi:** một giáo viên chưa từng dùng, đăng nhập lần đầu, bấm "Sinh từ giáo án của tôi", thấy 30–50 mục nháp, duyệt và xuất bản — **đo bằng đồng hồ, phải dưới 15 phút**.

**Rủi ro:** bộ sinh cho ra nội dung rác thì giáo viên bỏ cuộc ngay lần đầu. Ưu tiên `flashcards` (đã đúng dạng hỏi–đáp) trước `lessonPlans` (dạng tự do, khó tách).

### Giai đoạn 3 — Truy hồi và định tuyến (2 tuần)

**Bản chạy được đầu tiên.** Kết thúc giai đoạn này, chuỗi `if/else` biến mất.

**Việc**

1. Chuẩn hoá tiếng Việt: NFD, bỏ dấu tổ hợp, lowercase, bỏ stopword (`của, là, và, cho, một, các`)
2. Sinh unigram và bigram
3. Chấm điểm: **bigram nhân 3, unigram nhân 1**, chuẩn hoá theo độ dài trigger
4. Ngưỡng chấp nhận, dưới ngưỡng thì fallback
5. Định tuyến T3 → T2 (rỗng tới GĐ5) → T1 (rỗng tới GĐ7)
6. Kiểm phạm vi qua `journalEntries`: chuyên đề lớp chưa học thì trả lời "chưa học tới"
7. Thay `sendTutorMessage` tại `AppContext.jsx:1686`
8. **Gỡ nhánh fallback bịa công thức**
9. Ghi câu không trả lời được vào `review_queue`

Bigram nhân 3 là bắt buộc với tiếng Việt. Tiếng Việt là ngôn ngữ âm tiết rời — "tích phân" là hai token nhưng một khái niệm. Chỉ dùng unigram thì "phân" khớp cả "phân tích", "phân bón", "phân số".

**Files**

| Action | Path |
|---|---|
| create | `Web/src/lib/tutor/normalize.js` |
| create | `Web/src/lib/tutor/retrieve.js` |
| create | `Web/src/lib/tutor/resolve.js` |
| create | `Web/src/lib/tutor/syllabusScope.js` |
| create | `supabase/migrations/003_conversations.sql` |
| edit | `Web/src/context/AppContext.jsx` (thay `sendTutorMessage`) |
| edit | `Web/src/components/AITutor.jsx` (hiện nguồn, hiện trạng thái) |
| edit | `Web/src/components/FloatingChatWidget.jsx` |

**Xong khi:** học sinh lớp 12A1 hỏi tích phân, nhận câu trả lời từ kiến thức giáo viên dạy lớp đó soạn, và thấy được nguồn. Hỏi chuyên đề chưa học thì được báo chưa học tới. **Không còn bất kỳ câu trả lời bịa nào.**

### Giai đoạn 4 — Vòng lặp duyệt và cổng chất lượng (2 tuần)

**Việc**

1. Màn hình "Cần duyệt": câu hỏi, câu gia sư đã trả lời, ô sửa
2. Nút "Dạy lại" tạo `knowledge_entry` mới từ câu sửa
3. Soạn bộ đề vàng: 15–20 câu kèm kỳ vọng hành vi
4. Chạy bộ đề vàng mỗi lần xuất bản, so với lần trước
5. Chặn nút Xuất bản khi có hồi quy, chỉ rõ câu nào hỏng
6. Bảng độ phủ: tuần này bao nhiêu câu, trả lời được bao nhiêu, bao nhiêu rơi ra ngoài
7. Lịch sử phiên bản và hoàn tác

**Files**

| Action | Path |
|---|---|
| create | `Web/src/components/teacher/tutor/ReviewQueue.jsx` |
| create | `Web/src/components/teacher/tutor/GoldenSet.jsx` |
| create | `Web/src/components/teacher/tutor/CoverageBoard.jsx` |
| create | `Web/src/lib/tutor/evalRunner.js` |
| create | `supabase/migrations/004_review_golden.sql` |

**Xong khi:** giáo viên vào "Cần duyệt", sửa 5 câu trong 10 phút, xuất bản, và bộ đề vàng chặn được một thay đổi làm hỏng câu khác.

Bộ đề vàng là thứ ngăn gia sư mục ruỗng âm thầm. Không có nó, giáo viên sửa cho câu A đúng và vô tình làm hỏng câu B mà không ai biết.

### Giai đoạn 5 — Tổ bộ môn (2 tuần)

**Việc**

1. Thành viên tổ và tổ trưởng, đã có bảng ở Giai đoạn 1
2. `knowledge_entries` với `layer='group'`
3. Nút "Đề xuất lên tổ", hàng chờ duyệt của tổ trưởng
4. Bảng độ phủ của tổ, phân công chuyên đề cho từng thành viên
5. Bổ sung T2 vào chuỗi định tuyến

Phân công chuyên đề thay cho kêu gọi tự nguyện. Tổ chuyên môn vốn đã phân công khi xây kế hoạch dạy học, và đã có lịch sinh hoạt 2 tuần một lần để chốt. Không phát minh quy trình mới.

**Xong khi:** tổ trưởng phân công 5 chuyên đề, thành viên nộp, tổ trưởng duyệt, và học sinh của giáo viên chưa soạn gì vẫn nhận được câu trả lời từ tầng tổ.

### Giai đoạn 6 — LLM (3 tuần)

**Việc**

1. `api/tutor.js` serverless trên Vercel, API key ở biến môi trường phía server
2. Lớp trừu tượng nhà cung cấp, định tuyến theo độ khó, fallback khi nhà cung cấp sập
3. Lọc PII trước khi gửi: bỏ tên, mã học sinh, lớp, trường
4. Sinh có ràng buộc, bắt model gắn mã nguồn cho từng ý
5. Kiểm chứng trích dẫn bằng code, mã không tồn tại thì không gửi
6. Điều chỉnh giàn giáo theo `gradeHistory` và competency heatmap
7. Streaming và prompt caching
8. Đường thoát khủng hoảng nối vào `WellnessHub`

**Điều chỉnh giàn giáo theo trình độ**

Hiệu ứng ví dụ mẫu và hiệu ứng đảo chiều theo trình độ: học sinh yếu học tốt hơn từ bài giải mẫu, nhưng học sinh khá học *kém đi* với bài giải mẫu so với tự giải, vì hướng dẫn thừa làm tăng tải nhận thức.

```
Học sinh hỏi chuyên đề X
  → tra năng lực của em này ở chuyên đề X
     4/10  → khởi động ở "Mẫu rồi luyện", giải mẫu đầy đủ
     7/10  → bỏ bớt bước, để học sinh điền chỗ trống
     9/10  → chuyển thẳng sang gợi mở, không giải mẫu
  → trong khuôn khổ preset và quy tắc giáo viên đã đặt
```

Giáo viên đặt chính sách và giới hạn, gia sư điều chỉnh mức giàn giáo trong giới hạn đó.

**Chọn nhà cung cấp**

Không chốt tên trong kế hoạch này. Đến Giai đoạn 6 mới quyết, vì lúc đó đã có dữ liệu thật để test. Quy trình:

1. Gom 50 câu hỏi thật của học sinh, đủ các môn
2. Chạy qua 3–4 model, cùng prompt, cùng nội dung truy hồi
3. Giấu tên model, 2–3 giáo viên chấm mù
4. Chọn cái thắng, giữ á quân làm fallback

Bộ 50 câu này chính là bộ đề vàng ở Giai đoạn 4 — làm một lần dùng cho cả hai việc.

Bảng xếp hạng công khai đều đo tiếng Anh, không đo việc giải toán tiếng Việt theo từng bước.

### Giai đoạn 7 — Tầng nền GDPT 2018

Việc nội dung, không phải việc kỹ thuật. Ước lượng theo môn, thuê giáo viên giỏi soạn và kiểm định.

Nguồn: chương trình GDPT 2018, sách giáo khoa theo từng bộ, đề thi tốt nghiệp THPT chính thức các năm.

Mỗi mục phải gắn nhãn bộ sách. Trường nào dùng bộ nào thì lấy đúng bộ đó.

Đây là thứ biến cold start thành vũ khí bán hàng: trường mới ký hợp đồng có gia sư chạy được ngay trong buổi demo, thay vì phải chờ giáo viên soạn một học kỳ.

## 6. Tổng thời gian

| Giai đoạn | Tuần | Cộng dồn |
|---|---|---|
| 1 Danh tính | 2 | 2 |
| 2 Kho và huấn luyện | 3 | 5 |
| 3 Truy hồi | 2 | 7 |
| 4 Duyệt và cổng | 2 | **9 — bán được** |
| 5 Tổ bộ môn | 2 | 11 |
| 6 LLM | 3 | 14 |
| 7 Tầng nền | — | theo nội dung |

Ước lượng cho 1 developer full-time, chưa tính thời gian phỏng vấn giáo viên và sửa theo phản hồi. Cộng thêm 30% đệm là hợp lý.

## 7. Rủi ro

| Rủi ro | Ảnh hưởng | Giảm thiểu |
|---|---|---|
| RLS sai, giáo viên thấy dữ liệu nhau | Nghiêm trọng | Test 2 tài khoản thật, chặn cửa cuối GĐ1 |
| Bộ sinh cho ra nội dung rác | Giáo viên bỏ cuộc lần đầu | Ưu tiên `flashcards` trước, thử với 1 giáo viên thật trước khi mở rộng |
| Truy hồi tiếng Việt khớp sai | Câu trả lời lạc đề | Bigram nhân 3, có ngưỡng, thà không trả lời còn hơn trả lời sai |
| Học sinh phá guardrail | Sự cố an toàn, có thể lên tới cấp quản lý | Preamble khoá cứng, input học sinh là dữ liệu không phải lệnh, log toàn bộ |
| Giáo viên không dùng sau tuần đầu | Sản phẩm chết âm thầm | Bảng độ phủ hiện số giờ tiết kiệm, không hiện điểm chất lượng |

## 8. Quyết định để ngỏ

| Câu hỏi | Cần chốt trước | Ghi chú |
|---|---|---|
| Multi-tenant hay 1 server mỗi trường | GĐ1 | 20 trường = 20 server phải vá và sao lưu. Multi-tenant với RLS rẻ hơn nhiều. Chỉ tách khi khách yêu cầu bằng hợp đồng và tính thêm phí |
| Nhà cung cấp LLM | GĐ6 | Để đến khi có dữ liệu thật |
| Dữ liệu có được rời Việt Nam không | GĐ6 | Nếu không: FPT AI Factory, Viettel, VNG. Nghị định 13/2023 Điều 25 yêu cầu hồ sơ đánh giá tác động khi chuyển dữ liệu công dân ra nước ngoài, và học sinh là trẻ em |
| Số phận 50 key localStorage cũ | Sau GĐ4 | Cơ chế xoá theo version vẫn đang mất dữ liệu người dùng mỗi lần deploy |

## 9. Bước kế tiếp

Bắt đầu Giai đoạn 1. Việc đầu tiên là tạo Supabase project và viết `001_identity.sql`.
