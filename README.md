# 🎓 EduPortal — Hệ Thống Quản Lý Trường Học Toàn Diện & Tích Hợp AI

EduPortal là giải pháp quản lý trường học tất cả trong một (All-in-One School Platform) được thiết kế hiện đại, mượt mà và trực quan với 4 phân quyền trải nghiệm cá nhân hóa sâu sắc: **Ban Giám Hiệu (Hiệu Trưởng)**, **Giáo Viên**, **Học Sinh** và **Phụ Huynh**. Hệ thống bao gồm đầy đủ các phân hệ quản lý học tập, nghiệp vụ vận hành trường lớp, kết nối liên lạc, các công cụ trợ lý học tập AI và phân tích xu hướng.

Ứng dụng chính nằm trong thư mục [Web/](file:///l:/Minh%20Spark/Education/Web).

---

## 🛠️ Công Nghệ Sử Dụng (Tech Stack)

EduPortal được xây dựng dựa trên các công nghệ web hiện đại, tối ưu hóa tốc độ tải và hiệu năng hiển thị:
- **Core Framework**: React 19 (sử dụng tính năng Lazy Loading & Suspense để tối ưu hóa hiệu năng render).
- **Build Tool**: Vite 8 (Hot Module Replacement cực nhanh).
- **Styling**: Vanilla CSS thuần với hệ thống biến CSS toàn cục (`--accent-primary`, `--bg-glass`...) thiết kế theo ngôn ngữ **Glassmorphism** và **Dark/Light Mode** thích ứng.
- **Icons**: `lucide-react` để hiển thị bộ icon tối giản và đồng bộ.
- **Hosting / Deploy**: Tối ưu hóa cấu hình cho **Vercel** thông qua file `vercel.json` ở thư mục gốc.

---

## 📂 Cấu Trúc Thư Mục Dự Án

Cấu trúc mã nguồn được phân bổ khoa học, tách biệt giữa giao diện chính (App shell), trạng thái dùng chung (Context) và các thành phần giao diện nhỏ (Components):

```text
Education/
├── vercel.json               # Cấu hình deploy Vercel từ root
├── package.json              # Script build tổng hợp từ thư mục gốc
├── README.md                 # Tài liệu hướng dẫn sử dụng (File này)
└── Web/                      # Thư mục mã nguồn ứng dụng React
    ├── index.html            # File HTML entry point
    ├── package.json          # Dependencies & scripts của ứng dụng Web
    ├── vite.config.js        # Cấu hình Vite
    └── src/                  # Thư mục chứa code logic chính
        ├── main.jsx          # Entry point khởi tạo React DOM
        ├── App.jsx           # Bộ điều phối giao diện & Router phân quyền
        ├── App.css           # CSS layout khung chính
        ├── index.css         # CSS reset & biến style hệ thống
        ├── context/          
        │   └── AppContext.jsx # Quản lý toàn bộ State, Mock data & các hàm nghiệp vụ
        ├── data/             
        │   └── mockExamsData.js # Dữ liệu đề thi thử, lịch sử làm bài thi
        ├── styles/           
        │   ├── theme.css     # Định nghĩa biến màu sáng/tối (Dark/Light mode)
        │   ├── design-system.css # Style chuẩn cho các nút, panel kính (glassmorphism)
        │   └── components.css # CSS đặc thù cho các thành phần giao diện riêng lẻ
        └── components/       # Kho chứa các Component chức năng giao diện
            ├── PrincipalDashboard.jsx # Dashboard dành cho Hiệu trưởng / Admin
            ├── TeacherDashboard.jsx   # Dashboard dành cho Giáo viên
            ├── StudentDashboard.jsx   # Giao diện tổng quan cho Học sinh
            ├── ParentHub.jsx          # Cổng thông tin cho Phụ huynh
            ├── student/               # Các tab chức năng riêng biệt của Học sinh
            │   ├── AiAdvisorTab.jsx   # Định hướng nghề nghiệp & tư vấn AI
            │   ├── UniversityMatchmakerTab.jsx # Gợi ý trường đại học phù hợp
            │   ├── StudyPlanTab.jsx   # Kế hoạch học tập cá nhân hóa
            │   ├── MockExamTab.jsx    # Luyện thi thử THPT Quốc gia trực tuyến
            │   ├── WalletIdTab.jsx    # Thẻ học sinh thông minh tích hợp ví VietQR
            │   └── ...
            ├── teacher/               # Các tab chức năng riêng biệt của Giáo viên
            │   └── AiLessonPlannerTab.jsx # Trợ lý AI soạn giáo án giảng dạy
            └── ... (Các phân hệ tiện ích dùng chung)
```

---

## 🔑 Bản Đồ Tính Năng Theo Phân Quyền (Role-Based Features)

Hệ thống tự động thay đổi cấu trúc thanh điều hướng bên (Sidebar) và nội dung hiển thị dựa trên tài khoản người dùng đăng nhập:

### 1. 🎓 Ban Giám Hiệu (Principal / Admin)
Đóng vai trò quản trị toàn diện, theo dõi bức tranh tổng thể của nhà trường:
*   **KPIs vận hành toàn trường**: Doanh thu học phí, tỉ lệ chuyên cần, tổng số học sinh/giáo viên đang hoạt động.
*   **Quản lý nhân sự**: Quản lý hồ sơ Học sinh & Giáo viên (hỗ trợ bộ lọc theo Khối, Lớp và thêm mới nhân sự nhanh).
*   **Sổ đầu bài điện tử (Class Journal)**: Xem nhật ký giảng dạy chi tiết của từng lớp học.
*   **Phân tích rủi ro học tập (AI Risk Analysis)**: Sử dụng các chỉ số cảnh báo sớm để phát hiện học sinh sa sút học lực hoặc vi phạm kỷ luật.
*   **So sánh hiệu suất lớp học (Class Comparison)**: Trực quan hóa kết quả học tập giữa các lớp qua biểu đồ.
*   **Quản lý cơ sở vật chất (Asset Manager)**: Giám sát tình trạng trang thiết bị trường học.
*   **Lịch trực tuần (Duty Schedule)** & **Quản lý điểm danh Giáo viên (Teacher Attendance)**.

### 2. 👩‍🏫 Giáo Viên (Teacher)
Quản lý trực tiếp các hoạt động dạy học và tương tác phụ huynh:
*   **Bảng điểm học sinh**: Chỉnh sửa trực tiếp điểm số các môn học theo từng lớp được phân công.
*   **Sơ đồ chỗ ngồi động (Seating Chart)**: Sắp xếp chỗ ngồi học sinh trực quan thông qua kéo thả.
*   **Trợ lý soạn giáo án AI (AI Lesson Planner)**: Tự động lên khung nội dung bài học theo khối, môn học và thời lượng chỉ với vài từ khóa.
*   **Quản lý hoạt động lớp**: Tạo bình chọn lớp học (Class Voting), viết bài trên Bảng tin nội bộ (Bulletin Board).
*   **Kết nối phụ huynh**: Đặt lịch họp phụ huynh (Meeting Booking) và chat trực tiếp (Direct Chat).
*   **EduMeet**: Tạo phòng họp/dạy học trực tuyến với giao diện mô phỏng hội nghị truyền hình chuyên nghiệp.

### 3. 🧑‍🎓 Học Sinh (Student)
Môi trường học tập cá nhân hóa kết hợp các yếu tố tương tác game hóa (Gamification):
*   **Gia sư ảo AI 24/7 (AI Tutor)**: Hỗ trợ giải bài tập Toán, Lý, Hóa, Văn, Anh tức thì với các công thức hiển thị chuẩn LaTeX.
*   **Chấm điểm văn nghị luận AI (Essay Grader)**: Phân tích bài viết tự luận, đưa ra điểm số chi tiết theo tiêu chí và gợi ý sửa lỗi ngữ pháp.
*   **Luyện thi thử THPT Quốc gia (Mock Exam)**: Làm bài thi thử trắc nghiệm có đếm ngược thời gian và phân tích điểm yếu sau khi nộp bài.
*   **Định hướng Đại học (University Matchmaker)**: Phân tích điểm thi THPT, sở thích để gợi ý danh sách ngành học và trường phù hợp.
*   **Tủ sách số (Library Hub)**: Tra cứu sách thư viện, gửi yêu cầu mượn/trả sách.
*   **Thẻ học sinh & Ví VietQR (Wallet ID)**: Xem số dư, quét mã VietQR giả lập để thanh toán dịch vụ căn tin.
*   **Lớp học lập trình (Web Lab)**: Trình biên soạn code mini hỗ trợ viết và chạy mã HTML/JS/CSS trực tiếp trên trình duyệt.
*   **Khỏe mạnh thể chất & tinh thần (Wellness Hub)**: Theo dõi tâm trạng hàng ngày, kết nối với chuyên viên tư vấn tâm lý học đường.
*   **Huy hiệu & Bảng xếp hạng (Gamification)**: Tích lũy huy hiệu chuyên cần, học tập chăm chỉ và đua top xếp hạng học đường.

### 4. 👨‍👩‍👦 Phụ Huynh (Parent)
Cổng liên lạc chặt chẽ giữa gia đình và nhà trường:
*   **Theo dõi tiến độ học tập**: Xem trực quan bảng điểm chi tiết học kỳ 1, học kỳ 2 và nhận xét của giáo viên.
*   **Điểm danh & Xin nghỉ học**: Giám sát thời gian check-in/out của con tại cổng trường qua mô phỏng RFID và gửi đơn xin nghỉ phép.
*   **Xác nhận sổ liên lạc (Parent Signature)**: Ký điện tử duyệt học bạ trực tuyến.
*   **Thanh toán học phí**: Theo dõi hóa đơn dịch vụ (học phí, tiền ăn bán trú) và thực hiện thanh toán nhanh bằng VietQR.
*   **Tương tác nhanh**: Đăng ký lịch họp trực tiếp với Giáo viên chủ nhiệm, chat giải đáp thắc mắc.

---

## 🤖 Deep Dive: Các Công Cụ Trí Tuệ Nhân Tạo (AI Tools)

Điểm nhấn đặc biệt của EduPortal là việc tích hợp các tính năng giả lập AI thông minh hoạt động trực tiếp trên Client giúp người dùng trải nghiệm cảm giác tương tác AI chân thực:

1.  **AI Tutor**: Quét nội dung câu hỏi nhập từ học sinh. Nếu phát hiện các từ khóa liên quan đến môn học, hệ thống sẽ trả về các hướng dẫn chuyên sâu có cấu trúc kèm công thức định dạng LaTeX đẹp mắt.
2.  **Essay Grader (Chấm điểm tự luận)**: Phân tích bài viết của học sinh dựa trên cấu trúc ngữ pháp và độ dài. Trả về biểu đồ radar đánh giá 4 khía cạnh: *Ý tưởng (Ideas), Tổ chức (Organization), Từ vựng (Vocabulary)* và *Ngữ pháp (Grammar)* kèm các lỗi viết câu cụ thể cần khắc phục.
3.  **AIRisk Analysis (Đánh giá rủi ro học tập)**: Phân tích chéo giữa điểm số trung bình (GPA), tỷ lệ vắng mặt không phép và số lần nhận xét tiêu cực của giáo viên để gắn nhãn rủi ro (Cao, Trung bình, Thấp) giúp Ban giám hiệu kịp thời can thiệp.
4.  **University Matchmaker (Định hướng đại học)**: Sử dụng tổ hợp điểm thi thử và các lựa chọn lĩnh vực yêu thích của học sinh (như Công nghệ thông tin, Kinh tế, Y dược...) để đối chiếu với điểm chuẩn các trường Đại học lớn tại Việt Nam, đưa ra tỷ lệ đỗ khuyến nghị.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Local

Bạn có thể dễ dàng chạy ứng dụng EduPortal trên máy tính cá nhân bằng các bước sau:

### Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (Khuyến nghị phiên bản LTS 18 hoặc mới hơn).
- Trình quản lý gói `npm` (được cài đặt sẵn kèm Node.js).

### Các bước thực hiện

1.  **Clone mã nguồn dự án**:
    ```bash
    git clone https://github.com/buidangminh23/Education.git
    cd Education
    ```

2.  **Cài đặt dependencies và khởi chạy môi trường phát triển (Development Mode)**:
    Bạn có thể chạy trực tiếp từ thư mục gốc nhờ vào script cấu hình sẵn:
    ```bash
    npm run build   # Cài đặt tự động và build
    ```
    
    *Hoặc thực hiện thủ công trong thư mục `Web/`:*
    ```bash
    cd Web
    npm install
    npm run dev
    ```

3.  **Truy cập ứng dụng**:
    Sau khi terminal hiển thị đường dẫn local, mở trình duyệt và truy cập:
    ```text
    http://localhost:5173
    ```

---

## ☁️ Hướng Dẫn Deploy Lên Vercel

Dự án đã được cấu hình sẵn sàng để triển khai lên Vercel chỉ với 1 click. File [vercel.json](file:///l:/Minh%20Spark/Education/vercel.json) ở thư mục gốc đảm bảo quá trình build diễn ra chính xác:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "Web/dist",
  "installCommand": "npm install --prefix Web",
  "framework": null
}
```

**Cách Deploy:**
1. Kết nối tài khoản GitHub của bạn với Vercel.
2. Chọn repository `Education`.
3. Vercel sẽ tự động phát hiện cấu hình và kích hoạt lệnh cài đặt trong `Web/` và xuất kết quả tại `Web/dist` mà không cần bạn phải thiết lập thủ công các thư mục con.
