# 🚀 Hướng Dẫn Triển Khai EduPortal Lên Production & Cấu Hình Tên Miền Tùy Chỉnh

Tài liệu này hướng dẫn chi tiết từng bước để đưa hệ thống **EduPortal** từ môi trường phát triển cục bộ (Local) lên môi trường **Production hoàn chỉnh** sử dụng **Vercel** (Hosting Frontend) và **Supabase** (Backend & Database), cũng như các bước trỏ tên miền (Custom Domain) khi bạn mua sau này.

---

## 📋 Danh Sách Chuẩn Bị (Checklist)

- [x] Codebase đã được tối ưu hóa build & phân tách bundle (Vite code splitting).
- [x] Tích hợp màn hình bắt lỗi tự động (React Error Boundary).
- [x] Cấu hình tiêu chuẩn SEO, Open Graph & HTTP Security Headers (`vercel.json`).
- [ ] Tài khoản hosting [Vercel](https://vercel.com) (Miễn phí / Pro).
- [ ] Tài khoản [Supabase](https://supabase.com) (Miễn phí / Pro).
- [ ] Tên miền tùy chỉnh (Mua sau: ví dụ `eduportal.vn` hoặc `truonghocso.edu.vn`).

---

## 🌐 BƯỚC 1: Triển Khai Frontend Lên Vercel

### Cách A: Kết Nối Qua GitHub (Khuyên dùng)
1. Đẩy toàn bộ codebase của dự án lên kho lưu trữ **GitHub** (chế độ Public hoặc Private).
2. Đăng nhập vào [Vercel Dashboard](https://vercel.com/dashboard) -> Chọn **Add New...** -> **Project**.
3. Chọn Repository `EduPortal` từ danh sách GitHub của bạn.
4. **Cấu hình dự án (Project Configuration)**:
   - **Framework Preset**: Vite
   - **Root Directory**: `./` (để mặc định thư mục gốc)
   - **Build Command**: `npm run build` (Vercel tự nhận qua `vercel.json`)
   - **Output Directory**: `Web/dist`
5. Nhấn **Deploy**. Vercel sẽ tự động build ứng dụng và cấp cho bạn một đường dẫn chạy thử có dạng: `https://eduportal-xxx.vercel.app`.

---

## 🗄️ BƯỚC 2: Cấu Hình Cơ Sở Dữ Liệu Real Supabase (Tùy chọn)

> **Lưu ý**: Thiếu cấu hình Supabase, EduPortal **không tự chạy ở chế độ demo** — nó từ chối khởi động. Muốn demo thì phải khai `VITE_DEMO_MODE=true` một cách cố ý. Sở dĩ như vậy vì quy tắc cũ ("không có Supabase thì coi là demo") mở sai chiều: một biến môi trường gõ nhầm trên Vercel biến bản triển khai của trường thành bản giả nhận mọi mật khẩu và lưu điểm trong trình duyệt người xem, mà trên màn hình không có gì báo. Chi tiết ở [appMode.js](Web/src/lib/appMode.js).
>
> Muốn dữ liệu nằm trong trường thay vì trên đám mây, xem [server/SELF-HOST.md](server/SELF-HOST.md) — cùng mã nguồn Supabase, dựng trên máy của trường, không sửa code ứng dụng.

### 1. Tạo Dự Án Supabase
1. Truy cập [Supabase Console](https://supabase.com/dashboard) -> Chọn **New Project**.
2. Nhập tên dự án (ví dụ: `eduportal-production`), đặt mật khẩu cho Database và chọn Region (ví dụ: *Singapore* cho tốc độ truy cập tốt nhất tại Việt Nam).

### 2. Chạy Migration Khởi Tạo Bảng & Dữ Liệu
1. Vào mục **SQL Editor** trong Supabase Dashboard.
2. Mở **toàn bộ** file SQL trong thư mục `supabase/migrations/`, theo đúng thứ tự số, dán vào SQL Editor để thực thi (Run). Chạy thiếu một file là để lại một lỗ hổng hoặc một tính năng hỏng — mỗi file dưới đây nói rõ hậu quả nếu bỏ qua:
   - `001_identity.sql`: Khởi tạo bảng danh mục trường học, tài khoản người dùng, lớp học, phân công giảng dạy.
   - `002_tutor.sql`: Khởi tạo bảng lưu trữ cấu hình AI Tutor, bộ quy tắc môn học, lời giải mẫu.
   - `003_conversations.sql`: Khởi tạo bảng lưu trữ lịch sử chat & tin nhắn với AI Tutor.
   - `004_review_golden.sql`: Khởi tạo bảng đánh giá và bài kiểm tra mẫu.
   - `005_fix_profile_recursion.sql`: **Bắt buộc.** Sửa policy đệ quy trên `profiles` (thiếu file này thì đăng nhập hỏng ngay lần đọc hồ sơ đầu tiên), thêm bảng `guardians` và cấp quyền cho toàn bộ bảng ở 001–004.
   - `006_academics.sql`: Bảng điểm, nhận xét, điểm danh, đơn xin nghỉ, hoá đơn học phí và kho tài liệu.
   - `007_mock_exams.sql`: Bảng lưu bài thi thử đã nộp. Thiếu file này thì mọi lần nộp bài thi đều lỗi vì không có bảng để ghi vào.
   - `008_mock_exam_idempotency.sql`: **Bắt buộc.** Thêm cột `local_id` và ràng buộc chống ghi trùng. Thiếu file này thì mọi lần nộp bài thi đều lỗi vì mã nguồn ghi vào cột chưa tồn tại.
   - `009_policy_indexes.sql`: Các chỉ mục cho cột mà phân quyền và màn hình thật sự lọc theo. Thiếu thì hệ thống vẫn chạy đúng nhưng chậm dần khi dữ liệu nhiều lên.
   - `010_profile_privilege_guard.sql`: **Bắt buộc — đây là bản vá bảo mật.** Khoá quyền tự sửa cột `role` và `school_id` trên `profiles`. Thiếu file này thì bất kỳ tài khoản nào đã đăng nhập, kể cả học sinh, đều có thể tự đặt mình thành `admin` bằng một dòng lệnh trong trình duyệt — xem được điểm, học phí, hồ sơ tư vấn tâm lý của toàn trường và cả camera.
3. **Kiểm tra lại sau khi chạy.** Mở `supabase/tests/rls_check.sql` và chạy nó trên chính cơ sở dữ liệu vừa khởi tạo. File này đóng vai từng nhóm người dùng và tự báo lỗi nếu phân quyền sai — trong đó có phép thử "học sinh tự đặt mình thành admin". Nó phải chạy hết mà không báo lỗi nào.
4. **KHÔNG chạy `supabase/seed.sql` trên cơ sở dữ liệu thật.** File đó tạo tài khoản đăng nhập được ở miền `school.edu.vn` — miền nhà trường không sở hữu — và một trường tên "THPT Nguyễn Du". Nó chỉ dành cho môi trường thử. Dữ liệu thật của trường nhập qua giao diện quản trị.

### 3. Cấu Hình Biến Môi Trường (Environment Variables) Trên Vercel
1. Trong Supabase Dashboard, truy cập **Project Settings** -> **API**.
2. Lấy 2 thông số:
   - `Project URL` (Ví dụ: `https://xyzcompany.supabase.co`)
   - `anon / public key` (Chuỗi JWT token công khai)
3. Mở **Vercel Dashboard** -> Chọn dự án `EduPortal` -> Vào **Settings** -> **Environment Variables**.
4. Thêm 2 biến môi trường:
   - **Key**: `VITE_SUPABASE_URL` | **Value**: `<Project URL của bạn>`
   - **Key**: `VITE_SUPABASE_ANON_KEY` | **Value**: `<anon key của bạn>`
5. Vào mục **Deployments** trên Vercel và bấm **Redeploy** để áp dụng biến môi trường mới.

---

## 🔗 BƯỚC 3: Cấu Hình Tên Miền Tùy Chỉnh (Khi Bạn Mua Domain)

Khi bạn đã hoàn tất mua tên miền tại các nhà cung cấp (Cloudflare, Namecheap, Mắt Bão, Tên Tên, PA Việt Nam, GoDaddy, v.v.):

### 1. Thêm Tên Miền Vào Vercel
1. Vào **Vercel Dashboard** -> Chọn dự án `EduPortal` -> **Settings** -> **Domains**.
2. Nhập tên miền của bạn (ví dụ: `eduportal.vn` hoặc `subdomain.school.edu.vn`) và bấm **Add**.
3. Vercel sẽ đề xuất các bản ghi DNS bạn cần trỏ.

### 2. Cấu Hình Bản Ghi DNS (DNS Records) Tại Nhà Cung Cấp Tên Miền
Truy cập trang quản trị DNS của nhà cung cấp tên miền và thêm 2 bản ghi sau:

| Loại bản ghi (Type) | Tên bản ghi (Host / Name) | Giá trị (Value / Points to) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **A** | `@` (hoặc để trống) | `76.76.21.21` | Trỏ tên miền gốc về Vercel IP |
| **CNAME** | `www` | `cname.vercel-dns.com` | Trỏ sub-domain www về Vercel |

*(Nếu bạn dùng Cloudflare, hãy bật chế độ Proxy (đám mây vàng) hoặc DNS only tùy theo nhu cầu bảo mật).*

### 3. Kiểm Tra Chứng Chỉ SSL
Vercel sẽ tự động cấp phát chứng chỉ **SSL / HTTPS miễn phí (Let's Encrypt)** cho tên miền của bạn chỉ sau vài phút kể từ khi DNS nhận bản ghi.

### 4. Cập Nhật URL Xác Thực Trong Supabase (Auth Callback)
Nếu có dùng tính năng đăng nhập qua Email / OAuth của Supabase:
1. Vào **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Cập nhật **Site URL**: `https://ten-mien-cua-ban.com`
3. Thêm vào danh sách **Redirect URLs**: `https://ten-mien-cua-ban.com/**`

---

## 🛠️ Bảo Trì & Cập Nhật

Mỗi khi bạn muốn cập nhật tính năng mới:
1. Commit và push code lên nhánh `main` trên GitHub.
2. Vercel sẽ tự động phát hiện, chạy `npm run build` và deploy phiên bản mới nhất lên Production trong vòng 1-2 phút mà **không làm gián đoạn người dùng**.
