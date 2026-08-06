# PHƯƠNG ÁN TÍCH HỢP EDUPORTAL VÀO HẠ TẦNG SẴN CÓ CỦA NHÀ TRƯỜNG

**Dự án EduPortal — Trường THPT Phúc Thịnh**
Tài liệu kỹ thuật do Công ty soạn để trao đổi với nhà trường · Cập nhật 06/08/2026

---

Nhà trường **đã có** website và tên miền đang chạy ổn định. Tài liệu này không đề nghị
thay thế thứ gì đang chạy. Nó trả lời đúng một câu: **EduPortal ghép vào hạ tầng sẵn có
của trường bằng cách nào**, và vì sao Công ty chọn cách đó chứ không chọn cách khác.

Mỗi vấn đề được viết theo cùng một khuôn:

| Mục | Trả lời điều gì |
|---|---|
| **Đang có** | Nhà trường và phần mềm hiện đã có sẵn cái gì cho việc này |
| **Đang thiếu** | Cái gì còn trống, chưa quyết, hoặc đang sai |
| **Chỗ đang ổn** | Vì sao phần đã có là đúng hướng — để không sửa nhầm thứ đang chạy tốt |
| **Chỗ chưa ổn** | Vì sao phần thiếu gây hậu quả thật |
| **Hướng giải quyết** | 2–4 lựa chọn kèm được gì / mất gì |
| **Đề xuất** | Công ty nghiêng về hướng nào và vì sao — nhà trường vẫn toàn quyền chọn khác |

Tài liệu này **chỉ bàn phần kỹ thuật**: website, tên miền, đăng nhập, dữ liệu, máy chủ,
mạng, camera. Phần quy tắc nghiệp vụ (công thức tính điểm, ký hiệu điểm danh, quy trình
thu chi, học bạ) và phần thủ tục pháp lý nằm ở hai tài liệu riêng.

**Mục lục**

| Phần | Nội dung | Mục |
|---|---|---|
| I | Website và tên miền sẵn có | 1–6 |
| II | Dữ liệu: nhà trường cung cấp như thế nào | 7–14 |
| III | Máy chủ đặt tại trường | 15–21 |
| IV | Camera và lớp nhận diện | 22–28 |
| V | Bốn lỗi kỹ thuật trên website hiện tại | 29–32 |
| VI | Việc cần nhà trường xác nhận | 33–35 |

---

# PHẦN I — WEBSITE VÀ TÊN MIỀN SẴN CÓ

## 1. Website nhà trường hiện đang chạy bằng gì

Trước khi đề xuất cách ghép, Công ty đã kiểm tra website `c3phucthinh.edu.vn` từ bên
ngoài — chỉ bằng cách mở trang như một người truy cập bình thường, không thử mật khẩu,
không dò quyền. Kết quả:

| Hạng mục | Kết quả kiểm tra | Căn cứ |
|---|---|---|
| Ngôn ngữ lập trình | **PHP** | Toàn bộ dấu hiệu bên dưới |
| Nền tảng (framework) | **Laravel** | Máy chủ đặt cookie `laravel_session` và `XSRF-TOKEN`; trang không tồn tại trả về đúng trang lỗi mặc định của Laravel |
| Giao diện | **Blade** (bộ khuôn mẫu của Laravel) | Một thẻ `<meta>` trong trang chủ còn in thô mã khuôn mẫu chưa dịch — xem Mục 30 |
| Máy chủ web | **Apache 2.4.29 trên Ubuntu** | Máy chủ tự khai trong phần đầu phản hồi |
| Phần trước mắt người dùng | HTML tĩnh + **jQuery**, kèm tiện ích dịch của Google | Các tệp `frontend/js/jquery.min.js`, `plugins.js`, `scripts.js` |
| Đăng nhập giáo viên | **Đã có sẵn**, ở địa chỉ `/teacher/dang-nhap.html`, gửi biểu mẫu theo kiểu không tải lại trang | Biểu mẫu đăng nhập trên trang chủ trỏ tới đúng địa chỉ đó |
| Phiên đăng nhập | Giữ 2 giờ | Cookie khai `Max-Age=7200` |

**Đang có.** Một website Laravel/PHP hoàn chỉnh, có sẵn cụm đường dẫn dành riêng cho giáo
viên (`/teacher/...`) và một hệ thống đăng nhập giáo viên đang hoạt động. Danh sách giáo
viên trong đó là danh sách đúng — do nhà trường quản lý, cập nhật khi có người vào, người
chuyển đi.

**Đang thiếu.** Công ty chưa biết ba điều chỉ nhà trường trả lời được: đơn vị nào đang
quản trị website, hợp đồng còn hiệu lực đến bao giờ, và nhà trường có đang giữ mã nguồn
cùng tài khoản quản trị hosting hay không.

**Chỗ đang ổn.** Laravel là nền tảng phổ biến nhất của PHP hiện nay, có tài liệu đầy đủ và
dễ tìm người sửa. Quan trọng hơn: website **đã có sẵn cụm `/teacher/`**, nghĩa là việc thêm
một đường dẫn mới cho giáo viên là thêm vào chỗ đã có, không phải dựng mới. Đây là điều
kiện thuận lợi nhất có thể cho phương án đăng nhập một lần ở Mục 4.

**Chỗ chưa ổn.** Apache 2.4.29 là bản đi kèm Ubuntu 18.04 — phiên bản đã hết thời hạn hỗ
trợ miễn phí từ tháng 4/2023. Không có nghĩa website sẽ sập, nhưng có nghĩa các bản vá bảo
mật của hệ điều hành không còn về tự động nữa. Cộng với dấu hiệu ở Mục 29 (tệp sơ đồ trang
bị thay nội dung), Công ty đánh giá **không nên đặt sổ điểm và học phí chung một máy chủ
với website hiện tại**. Đây là lý do kỹ thuật quan trọng nhất dẫn tới Mục 2 và Mục 3.

**Cách nhà trường tự xác nhận lại các con số trên.** Không cần biết lập trình:

1. Mở website, bấm chuột phải chọn "Xem nguồn trang" (View Page Source).
2. Nhấn `Ctrl+F`, tìm chữ `lang=` — sẽ thấy `lang="en"` (Mục 31).
3. Tìm chữ `url()` — sẽ thấy đoạn mã khuôn mẫu in thô ra ngoài (Mục 30).
4. Mở `c3phucthinh.edu.vn/sitemap.xml` — sẽ thấy các địa chỉ không thuộc nhà trường (Mục 29).

---

## 2. Vì sao Công ty **không** đưa EduPortal vào thẳng bên trong website trường

Đây là câu hỏi nhà trường nên hỏi, và Công ty trả lời trước khi được hỏi. Cách nghe có vẻ
gọn nhất — "gắn luôn EduPortal vào website trường cho cùng một chỗ" — là cách Công ty
không chọn. Sáu lý do, xếp theo mức quan trọng:

### 2.1. Hai phần mềm chạy bằng hai công nghệ khác nhau, không nằm chung nhà được

| | Website trường | EduPortal |
|---|---|---|
| Ngôn ngữ | PHP (Laravel) | JavaScript — React ở phía người dùng, Node.js ở phía máy chủ |
| Máy chủ web | Apache | Node.js, kèm MediaMTX cho luồng camera |
| Cơ sở dữ liệu | MySQL (theo mặc định của Laravel) | PostgreSQL |
| Kiểu ứng dụng | Trang tải lại mỗi lần bấm | Ứng dụng một trang, giữ kết nối liên tục |
| Cách nhận biết người dùng | Cookie `laravel_session` | Vé đăng nhập dạng chữ ký số của Supabase |

Đây không phải hai cách viết khác nhau của cùng một thứ. Đó là hai **bộ máy** khác nhau:
Apache không chạy được mã EduPortal, và Node.js không chạy được mã website. Muốn "gắn vào
trong" thì vẫn phải dựng hai máy, rồi bắt Apache đứng giữa chuyển tiếp mọi yêu cầu sang
Node — thêm một tầng nữa để sai, chứ không bớt tầng nào.

### 2.2. Sự cố sẽ lan từ bên này sang bên kia

Đặt chung địa chỉ nghĩa là chung số phận. Website trường quá tải ngày công bố điểm thi thì
sổ điểm cũng không vào được. Website bị chèn nội dung trái phép (Mục 29 cho thấy khả năng
này là có thật) thì kẻ chèn được đứng cùng nhà với dữ liệu học sinh. Website cần nâng cấp
PHP thì phải hẹn giờ cùng lúc với EduPortal.

Tách ra thì mỗi bên hỏng một mình. Đây là lợi ích lớn nhất và cũng là lý do dễ bị bỏ qua
nhất, vì nó chỉ hiện ra vào đúng ngày có sự cố.

### 2.3. Cookie và phiên đăng nhập sẽ đánh nhau

Cả hai hệ thống đều lưu dấu đăng nhập trong trình duyệt. Đặt chung một tên miền, cùng
đường dẫn gốc, thì cookie của bên này ghi lên vùng của bên kia. Biểu hiện ra ngoài là kiểu
lỗi khó chịu nhất: giáo viên đang nhập điểm thì bị đăng xuất, hoặc đăng nhập website xong
thì mất phiên EduPortal — mỗi lần một kiểu, không lặp lại được, nên gần như không tìm ra
nguyên nhân.

Tên miền con tạo hai vùng cookie riêng. Vấn đề này biến mất, không cần xử lý gì.

### 2.4. Luồng camera không đi qua hosting website được

Tường camera của EduPortal nhận hình từ camera trong mạng nội bộ của trường (giao thức
RTSP), đổi sang định dạng trình duyệt xem được (WebRTC), rồi phát cho máy Ban Giám hiệu.
Việc này cần một máy chạy 24/7 **trong trường**, giữ kết nối liên tục. Hosting website
chia sẻ không làm được — và nếu làm được thì toàn bộ hình ảnh học sinh sẽ phải chạy ra
Internet rồi quay lại, thay vì chỉ chạy trong mạng nhà trường. Chi tiết ở Mục 22.

### 2.5. Hai bên do hai đơn vị vận hành, cần sửa được độc lập

Website do đơn vị quản trị website cập nhật. EduPortal do Công ty cập nhật. Nếu chung một
thư mục, mỗi lần Công ty cập nhật phần mềm lại phải xin quyền vào máy chủ website của
trường, và mỗi lần đơn vị kia sửa website lại có nguy cơ chạm vào tệp của EduPortal. Tách
ra thì **Công ty không cần và không xin quyền truy cập vào máy chủ website của nhà trường** —
điều này cũng bảo vệ nhà trường.

### 2.6. Cập nhật và lùi bản phải làm riêng được

Khi một bản cập nhật EduPortal có lỗi, cách xử lý là lùi về bản trước trong vài phút. Lùi
được là vì EduPortal đứng riêng. Nếu nó nằm lồng trong website, việc lùi bản sẽ kéo theo
cả website — và đơn vị quản trị website không có lý do gì phải chấp nhận rủi ro đó.

> **Tóm lại:** tên miền con không phải cách làm "cho nhanh". Nó là cách duy nhất giữ được
> uy tín tên miền `.edu.vn` của trường mà không trộn hai bộ máy khác nhau vào một chỗ.

---

## 3. EduPortal đặt ở địa chỉ nào

**Đang có.** Trường sở hữu `c3phucthinh.edu.vn` đang chạy ổn định. Phía Công ty đã dựng
xong cơ chế đăng nhập một lần, mã nguồn ở `server/src/routes/sso.js`, tài liệu triển khai
ở `docs/sso-school-integration.md`.

**Đang thiếu.** Chưa chốt EduPortal nằm ở địa chỉ nào.

**Chỗ đang ổn.** Trường đã có tên miền `.edu.vn` — đây là tài sản không mua lại được. Đặt
EduPortal dưới tên miền đó thì phụ huynh nhìn địa chỉ là biết đúng của trường, không nghi
ngờ lừa đảo. Nếu đặt ở tên miền của Công ty thì mỗi lần gửi link cho phụ huynh, nhà trường
phải giải thích.

**Chỗ chưa ổn.** Chưa chốt địa chỉ thì chưa cài được chứng chỉ bảo mật, chưa cấu hình được
đăng nhập một lần, và mọi tài liệu hướng dẫn in ra sau này đều phải sửa lại.

**Hướng giải quyết**

| | Hướng | Được | Mất |
|---|---|---|---|
| **A** | Tên miền con `portal.c3phucthinh.edu.vn` | Uy tín tên miền trường; tách hoàn toàn khỏi website; thêm 1 bản ghi DNS là xong; cookie hai bên không đụng nhau | Phụ huynh phải nhớ thêm một địa chỉ |
| **B** | Thư mục con `c3phucthinh.edu.vn/portal` | Cùng một địa chỉ, dễ nhớ | Phải cấu hình chuyển tiếp trên máy chủ website; website trường gặp sự cố là EduPortal cũng không vào được; cookie hai bên tranh nhau (Mục 2.3) |
| **C** | Tên miền riêng, ví dụ `eduportal-phucthinh.vn` | Độc lập hoàn toàn | Mất uy tín `.edu.vn`; tốn phí duy trì; phụ huynh khó tin |

**Đề xuất: A.** Chi phí gần bằng không, giữ được uy tín tên miền trường, và quan trọng
nhất là hai hệ thống hỏng độc lập — website trường sập không kéo theo sổ điểm.

**Ba tên miền con sẽ dùng.** Kiến trúc EduPortal có ba phần cần địa chỉ riêng — đây là
cách dựng an toàn hơn, vì mỗi tên miền con chỉ mở đúng những đường dẫn nó cần (Mục 19):

| Tên miền con | Phục vụ | Ai gọi tới |
|---|---|---|
| `portal.c3phucthinh.edu.vn` | Giao diện web — giáo viên, học sinh, phụ huynh mở cái này | Người dùng |
| `api.c3phucthinh.edu.vn` | Máy chủ ứng dụng: cấp vé xem camera, phiên âm, tóm tắt | Trình duyệt của người dùng |
| `db.c3phucthinh.edu.vn` | Cơ sở dữ liệu và phần đăng nhập | Trình duyệt của người dùng |

**Việc cụ thể nếu chọn A** — tổng khoảng 30 phút, do bên quản trị tên miền làm:

| # | Việc | Ai làm | Thời gian |
|---|---|---|---|
| 1 | Thêm 3 bản ghi DNS (`portal`, `api`, `db`) trỏ về địa chỉ máy chủ EduPortal | Đơn vị giữ tên miền | 5 phút |
| 2 | Chờ bản ghi lan ra Internet | — | 5 phút – 2 giờ |
| 3 | Cài chứng chỉ bảo mật (HTTPS) tự động, tự gia hạn — xem cảnh báo về cách xin chứng chỉ ở Mục 19 | Công ty | 15 phút |
| 4 | Bật buộc dùng HTTPS, chặn truy cập bằng HTTP | Công ty | 5 phút |
| 5 | Đặt đúng số tầng trung gian (`TRUST_PROXY`) — thiếu bước này thì giới hạn chống dò mật khẩu biến thành một rổ chung cho cả trường: một người gõ sai liên tục là khoá cửa của mọi giáo viên | Công ty | 2 phút |

Không cần đổi gì trên website hiện tại ở bước này. Website vẫn ở `c3phucthinh.edu.vn`
nguyên như cũ.

---

## 4. Đăng nhập một lần: giáo viên không phải nhớ mật khẩu thứ hai

**Đang có.** Website trường đã có hệ thống đăng nhập giáo viên tại `/teacher/dang-nhap.html`.
Phía EduPortal, cơ chế nhận và kiểm tra vé đăng nhập đã viết xong và có kiểm thử:
`server/src/lib/schoolToken.js`, `server/src/routes/sso.js`, `server/src/routes/sso.test.js`.

**Đang thiếu.** Một đường dẫn mới trên website trường để sinh vé, và một chuỗi bí mật dùng
chung giữa hai bên.

**Chỗ đang ổn.** Cơ chế này **không gửi mật khẩu** sang EduPortal. Website trường ký một
tờ phiếu điện tử ghi "người này là giáo viên Nguyễn Văn A, mã GV001", đóng dấu bằng chuỗi
bí mật mà chỉ hai bên biết. Phiếu **hết hạn sau 60 giây** và **chỉ dùng được một lần** —
sao chép đường link để dùng lại không vào được. Ai chặn được đường truyền cũng không đọc
ra mật khẩu, vì mật khẩu không đi qua đó.

Đường đi, gọn trong sáu bước:

```
  Giáo viên                Website trường              EduPortal
      │                          │                          │
      │  1. đăng nhập như cũ     │                          │
      ├─────────────────────────▶│                          │
      │                          │ (kiểm tra mật khẩu       │
      │                          │  bằng CSDL sẵn có)       │
      │  2. bấm "Mở EduPortal"   │                          │
      ├─────────────────────────▶│                          │
      │                          │ 3. ký một phiếu điện tử  │
      │                          │    hạn 60 giây           │
      │  4. chuyển trang kèm phiếu                          │
      │◀─────────────────────────┤                          │
      ├────────────────────────────────────────────────────▶│
      │                                                     │ 5. kiểm tra chữ ký
      │  6. vào thẳng EduPortal                             │
      │◀────────────────────────────────────────────────────┤
```

Dữ liệu chuyển sang **đúng bốn trường, không hơn**: mã giáo viên, email, họ tên, vai trò.
Không chuyển mật khẩu, không chuyển số điện thoại, số căn cước, lương, hồ sơ nhân sự, hay
bất cứ dữ liệu học sinh nào.

**Chỗ chưa ổn.** Ba điểm cần nhà trường biết trước:

1. **Việc này cần sửa mã nguồn website** — khoảng 30 dòng, đặt trong cụm `/teacher/` đã có.
   Nếu đơn vị quản trị website không còn phối hợp, hoặc mã nguồn chưa được bàn giao, thì
   việc "nửa buổi" này thành việc không làm được. Cần biết sớm, không phải sau khi đã hứa
   với giáo viên.
2. **Vé chỉ xin được vai "giáo viên".** Vé xin vai quản trị bị EduPortal từ chối thẳng.
   Quyền quản trị mở được tường camera lớp học, nên câu "ai được làm quản trị" không thể có
   đáp án "bất cứ ai ký được phiếu". Website trường bị chỉnh sửa, hay chuỗi bí mật lọt ra
   ngoài, cũng không tự tạo được quyền quản trị.
3. **Tài khoản EduPortal tạo tay từ trước phải được gắn mã giáo viên trước khi bật.** Nếu
   bỏ bước này, chính những người có tài khoản sớm nhất — thường là Ban Giám hiệu — bị từ
   chối ngay lần đăng nhập đầu tiên. Ngày khai trương mà Hiệu trưởng không đăng nhập được
   là ấn tượng khó gỡ. Công ty chạy một lệnh kiểm tra, in ra danh sách tài khoản thiếu mã,
   văn thư điền, rồi mới bật.

**Hướng giải quyết**

| | Hướng | Được | Mất |
|---|---|---|---|
| **A** | Đơn vị quản trị website thêm đường dẫn sinh vé; Công ty cấp mã mẫu và hỗ trợ | Rẻ nhất, nhanh nhất; giáo viên một mật khẩu | Phụ thuộc thiện chí bên thứ ba |
| **B** | Nhà trường xuất danh sách giáo viên định kỳ, EduPortal nạp vào | Không cần sửa website | Hai mật khẩu; danh sách lệch nhau giữa hai lần xuất |
| **C** | Chỉ thêm một liên kết "EduPortal" trên website, giáo viên đăng nhập lại | Làm trong 5 phút, không phụ thuộc ai | Giáo viên nhớ thêm một mật khẩu |

**Đề xuất: A, dự phòng C.** Đăng nhập một lần là tiện lợi, không phải điều kiện sống còn.
Nếu bên quản trị website không phối hợp được trong 2 tuần, chuyển sang C để không chặn
toàn bộ dự án vì một tính năng phụ. Chuyển từ C lên A sau này không mất dữ liệu.

**Việc phía nhà trường, nếu chọn A** — ba việc:

| # | Việc | Khối lượng |
|---|---|---|
| 1 | Sinh một chuỗi bí mật 32 ký tự, lưu trong tệp cấu hình của website | 1 phút |
| 2 | Thêm đường dẫn `/teacher/sang-eduportal`, chỉ chạy khi giáo viên đã đăng nhập | ~30 dòng PHP, Công ty cấp mã mẫu |
| 3 | Thêm một mục vào menu sau khi đăng nhập: "Mở EduPortal" | 1 dòng |

Mã mẫu đầy đủ nằm ở `docs/sso-school-integration.md` Mục 6. Nhà trường tự đọc, tự sửa,
tự triển khai.

---

## 5. Ai giữ chuỗi bí mật

**Đang có.** Cơ chế đăng nhập một lần dùng một chuỗi bí mật dùng chung. Vé hết hạn sau
60 giây và chỉ dùng một lần, nên kể cả bị chặn bắt trên đường truyền cũng khó lợi dụng.

**Đang thiếu.** Chưa chốt ai giữ chuỗi này và bao lâu đổi một lần.

**Chỗ đang ổn.** Vé hết hạn nhanh và dùng một lần là hai lớp bảo vệ có sẵn, không phụ
thuộc vào việc con người có cẩn thận hay không. Và nhà trường **đổi chuỗi bí mật là toàn
bộ liên kết ngừng hoạt động ngay lập tức**, không cần Công ty hợp tác — quyền tắt luôn nằm
trong tay nhà trường.

**Chỗ chưa ổn.** Ai cầm chuỗi bí mật thì tạo được vé đăng nhập cho bất kỳ giáo viên nào.
Nếu người giữ chuỗi cũng chính là người viết mã website thì không có ai kiểm soát chéo. Và
nếu người đó nghỉ việc mà không đổi chuỗi thì quyền đó theo họ ra khỏi trường.

**Hướng giải quyết**

| | Hướng | Được | Mất |
|---|---|---|---|
| **A** | Ban Giám hiệu giữ, cấp cho bên kỹ thuật khi cần | Tách quyền rõ; người viết mã không tự cấp quyền cho mình | BGH phải cất giữ; chậm hơn khi cần cấu hình gấp |
| **B** | Người quản trị website giữ | Nhanh, đúng người dùng nó | Không ai kiểm soát chéo |
| **C** | Chia đôi — mỗi bên giữ một nửa, ghép lại mới dùng được | An toàn nhất | Rườm rà, mỗi lần đổi phải hẹn gặp |

**Đề xuất: A**, đổi 6 tháng một lần và đổi ngay khi người quản trị website thay đổi. Trao
chuỗi bằng cách gặp trực tiếp hoặc gọi điện đọc, **không gửi qua Zalo hay email**.

Ngoài chuỗi này, còn bốn chuỗi bí mật nữa sinh ra khi dựng máy chủ. Danh sách đầy đủ và
nơi cất giữ ở Mục 20.

---

## 6. Ba cửa vào cho ba nhóm người dùng

**Đang có.** Website trường có cửa vào cho giáo viên. EduPortal có cửa vào riêng cho cả
bốn vai: quản trị, giáo viên, học sinh, phụ huynh.

**Đang thiếu.** Chưa chốt học sinh và phụ huynh vào bằng đường nào.

**Chỗ đang ổn.** Ba nhóm không nhất thiết phải đi cùng một cửa, và việc chọn khác nhau cho
từng nhóm không làm phức tạp hệ thống.

**Chỗ chưa ổn.** Nếu để học sinh cũng đi qua website trường thì website phải có hệ thống
đăng nhập cho học sinh — hiện chưa có, và dựng mới thì tốn hơn nhiều so với để các em vào
thẳng EduPortal.

**Hướng giải quyết**

| Nhóm | Cửa vào đề xuất | Vì sao |
|---|---|---|
| Giáo viên | Bấm "Mở EduPortal" sau khi đăng nhập website trường | Danh sách giáo viên đã có sẵn và đúng ở website |
| Học sinh | Vào thẳng `portal.c3phucthinh.edu.vn`, đăng nhập bằng mã học sinh do trường cấp | Mã học sinh là thứ trường tự quản; website không có danh sách học sinh |
| Phụ huynh | Vào thẳng địa chỉ trên, đăng nhập bằng số điện thoại đã khai trong hồ sơ | Số điện thoại là thứ trường chắc chắn đã có, đồng thời là kênh nhận thông báo |
| Ban Giám hiệu | Như giáo viên, nhưng quyền quản trị được cấp **trong EduPortal**, một lần | Xem Mục 4, điểm 2 |

**Đề xuất:** đặt một liên kết "Cổng học tập EduPortal" ở chân trang và trong menu chính
của website trường, để phụ huynh tìm được đường mà không phải nhớ địa chỉ. Liên kết này là
một dòng HTML, không cần sửa gì khác.

---

# PHẦN II — DỮ LIỆU: NHÀ TRƯỜNG CUNG CẤP NHƯ THẾ NÀO

Đây là phần dài nhất của tài liệu, vì đây là phần quyết định dự án bắt đầu được trong một
buổi hay trong ba tuần. Công ty viết chi tiết tới mức văn phòng có thể làm theo mà không
cần hỏi lại.

## 7. EduPortal cần đúng những dữ liệu gì

Không cần toàn bộ hồ sơ. Chỉ cần đủ để hệ thống biết "ai là ai, học lớp nào, ai dạy lớp
nào". Bảng dưới là toàn bộ, không có mục ẩn:

### Nhóm 1 — Bắt buộc, thiếu là không mở máy được

| # | Dữ liệu | Gồm những gì | Ước lượng số dòng |
|---|---|---|---|
| 1 | **Thông tin trường** | Tên đầy đủ, tên miền email của trường, bộ sách giáo khoa đang dùng (Cánh Diều / Kết nối tri thức / Chân trời sáng tạo) | 1 dòng |
| 2 | **Năm học** | Dạng `2025-2026` | 1 dòng |
| 3 | **Danh sách lớp** | Tên lớp (`10A1`), khối (`10`) | Bằng số lớp của trường |
| 4 | **Danh sách giáo viên** | Mã giáo viên, họ tên, email, vai (giáo viên / quản trị) | Bằng số giáo viên |
| 5 | **Danh sách học sinh** | Mã học sinh, họ tên, ngày sinh, lớp đang học | Bằng sĩ số toàn trường |

### Nhóm 2 — Cần cho từng nghiệp vụ, nạp sau cũng được

| # | Dữ liệu | Cần cho | Ghi chú |
|---|---|---|---|
| 6 | **Phân công giảng dạy** — giáo viên nào dạy môn nào ở lớp nào | Sổ điểm | Thiếu cái này thì giáo viên đăng nhập được nhưng không thấy lớp nào |
| 7 | **Giáo viên chủ nhiệm mỗi lớp** | Sổ điểm, điểm danh, học bạ | 1 dòng mỗi lớp |
| 8 | **Tổ chuyên môn và tổ trưởng** | Phân quyền theo tổ | Có thể bỏ qua ở giai đoạn đầu |
| 9 | **Liên kết phụ huynh – học sinh** | Tra cứu của phụ huynh | Họ tên, số điện thoại, quan hệ, con là học sinh nào |
| 10 | **Danh mục khoản thu** | Học phí | Tên khoản, số tiền, hạn nộp |
| 11 | **Ảnh chân dung học sinh** | Nhận diện ở cổng (nếu triển khai) | Xem Mục 28 |

**Chỗ đang ổn.** Danh sách này ngắn hơn hầu hết phần mềm cùng loại, vì EduPortal không đòi
những thứ nó không dùng: không cần số căn cước, không cần địa chỉ thường trú, không cần hộ
khẩu, không cần nghề nghiệp cha mẹ.

**Chỗ chưa ổn.** Bốn mục đầu của Nhóm 1 nhỏ, nhưng mục 5 (học sinh) và mục 6 (phân công)
là hai mục tốn công nhất — và cũng là hai mục dễ sai nhất khi gõ tay. Mục 8 đến 11 của
Phần II tồn tại để xử lý đúng chỗ đó.

---

## 8. Bước 1: kiểm kê xem nhà trường **đang có sẵn** dữ liệu số nào

Trước khi bàn gõ tay hay không, phải biết trường đã có gì. Đây là việc 30 phút và tiết
kiệm được hàng chục giờ.

**Bốn câu hỏi gửi đơn vị quản trị website** (chỉ cần trả lời có/không):

1. Cơ sở dữ liệu của website có bảng danh sách **học sinh** không, hay chỉ có giáo viên?
2. Nếu có: gồm những cột nào, và có bao nhiêu dòng?
3. Nhà trường có quyền truy cập cơ sở dữ liệu đó không (tài khoản, hoặc công cụ quản trị)?
4. Xuất được ra tệp Excel hoặc CSV không?

**Ba nguồn còn lại nhà trường tự kiểm tra**, không cần bên thứ ba:

| Nguồn | Cách kiểm tra | Nếu có thì |
|---|---|---|
| **vnEdu / SMAS** | Đăng nhập, tìm mục "Báo cáo" hoặc "Xuất dữ liệu", xem có nút xuất Excel danh sách học sinh không | Đây thường là con đường ngắn nhất — và là con đường ít người nghĩ tới nhất |
| **Excel của văn phòng** | Hỏi văn thư: danh sách lớp đầu năm, danh sách trúng tuyển lớp 10, bảng chia lớp | Dùng được ngay, chỉ cần sắp lại cột |
| **Hồ sơ giấy** | Sổ đăng bộ, học bạ | Đây là trường hợp tốn công nhất, xem Mục 12 |

**Đề nghị cụ thể:** nhà trường kiểm tra vnEdu **trước**, vì nếu có nút xuất Excel thì toàn
bộ Mục 12 (gõ tay) không cần đọc nữa.

---

## 9. Bước 2: chọn cách nạp

**Đang có.** Về phía Công ty: cơ sở dữ liệu đã dựng xong cấu trúc (13 tệp cấu trúc bảng
trong `supabase/migrations/`), có sẵn bộ kiểm tra phân quyền chạy tự động
(`supabase/tests/rls_check.sql`), và có sẵn bộ đôi sao lưu / thử khôi phục
(`server/scripts/backup-db.sh`, `restore-check.sh`).

**Đang thiếu.** Hai thứ, và Công ty nói thẳng cả hai:

1. **Dữ liệu thật của trường** — chưa có dòng nào.
2. **Màn hình "nạp danh sách từ Excel" trong giao diện EduPortal** — **chưa có**. Hiện việc
   nạp do Công ty thực hiện bằng lệnh trực tiếp trên máy chủ tại trường, có bước kiểm tra
   trước khi ghi. Việc tạo màn hình để văn thư tự nạp về sau nằm trong danh sách phải làm,
   nhưng nhà trường **không cần chờ nó** mới bắt đầu được.

**Chỗ đang ổn.** Dù nguồn dữ liệu là gì — cơ sở dữ liệu website, tệp Excel của văn phòng,
bản xuất từ vnEdu, hay gõ mới hoàn toàn — Công ty đều nạp được. Không có tình huống nào là
bế tắc.

**Chỗ chưa ổn.** Khác biệt không nằm ở việc nạp được hay không, mà ở **khối lượng lao động
của nhà trường**. Có sẵn dữ liệu số thì nạp trong một buổi. Chỉ có hồ sơ giấy thì phải gõ
tay hàng nghìn dòng — công việc hàng chục tới hàng trăm giờ mà không ai muốn nhận, và nếu
không phân công rõ thì nó sẽ trôi.

**Hướng giải quyết**

| | Hướng | Điều kiện | Công sức nhà trường | Chất lượng |
|---|---|---|---|---|
| **A** | Xuất trực tiếp từ cơ sở dữ liệu website | Website có danh sách HS, và nhà trường có quyền truy cập | Gần bằng 0 | Cao, nhưng cần đối chiếu vì dữ liệu website có thể cũ |
| **B** | Xuất Excel từ vnEdu / SMAS rồi Công ty nạp | Trường đang dùng một trong hai | ~2 giờ | Cao nhất — đây là dữ liệu trường vẫn đang dùng để báo cáo |
| **C** | Văn phòng gõ theo mẫu Excel Công ty cấp | Không có dữ liệu số nào | 40–120 giờ tuỳ sĩ số | Tuỳ người gõ; cần bước rà soát |
| **D** | Công ty nhập thay theo hồ sơ nhà trường cung cấp | Có ngân sách, và nhà trường đồng ý giao bản sao hồ sơ | 0 giờ, nhưng tốn chi phí | Cần nhà trường ký xác nhận sau khi nạp |

**Đề xuất: thử theo thứ tự B → A → C.** Ưu tiên vnEdu trước cơ sở dữ liệu website, vì dữ
liệu vnEdu là dữ liệu nhà trường vẫn đang dùng để báo cáo Phòng/Sở, nên chắc chắn cập nhật
hơn. Chỉ chọn C khi hai hướng đầu đều không có. Hướng D chỉ nên dùng cho phần hồ sơ cũ,
không dùng cho danh sách năm học hiện tại.

---

## 10. Bước 3: mẫu tệp Excel — từng sheet, từng cột

Công ty cấp một tệp Excel có sẵn 7 sheet, mỗi sheet đã có dòng tiêu đề và một dòng ví dụ.
Nhà trường **chỉ điền, không đổi tên cột, không thêm bớt cột, không xoá dòng tiêu đề**.

Ký hiệu: **[BB]** = bắt buộc · **[TC]** = tuỳ chọn, để trống được.

### Sheet 1 — `1_TRUONG` (1 dòng)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ten_truong` | [BB] | Chữ | `Trường THPT Phúc Thịnh` | Ghi đúng tên trong quyết định thành lập |
| `ten_mien_email` | [BB] | Chữ | `c3phucthinh.edu.vn` | Không có `@`, không có `https://` |
| `bo_sgk` | [BB] | Chọn 1 | `Cánh Diều` | Chỉ nhận 3 giá trị: `Cánh Diều`, `Kết nối tri thức`, `Chân trời sáng tạo` |
| `nam_hoc` | [BB] | Chữ | `2025-2026` | Đúng định dạng bốn số – gạch – bốn số |

### Sheet 2 — `2_LOP` (1 dòng mỗi lớp)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ten_lop` | [BB] | Chữ | `10A1` | **Viết đúng một kiểu duy nhất trong cả tệp.** `10A1` và `10 A1` bị hiểu là hai lớp khác nhau |
| `khoi` | [BB] | Số | `10` | Chỉ `10`, `11`, hoặc `12` |
| `ma_gvcn` | [TC] | Chữ | `GV001` | Phải khớp một mã ở Sheet 3 |
| `si_so_du_kien` | [TC] | Số | `42` | Dùng để đối chiếu sau khi nạp — xem Mục 11 bước 5 |

### Sheet 3 — `3_GIAO_VIEN` (1 dòng mỗi giáo viên)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ma_gv` | [BB] | Chữ | `GV001` | **Duy nhất trong toàn trường.** Đây là thứ nối hai hệ thống — phải trùng khớp với mã trong cơ sở dữ liệu website (Mục 4) |
| `ho_ten` | [BB] | Chữ | `Nguyễn Văn A` | Có dấu, viết hoa đầu từ |
| `email` | [BB] | Chữ | `a.nv@c3phucthinh.edu.vn` | **Phải thuộc tên miền của trường.** Email ngoài tên miền bị EduPortal từ chối |
| `vai` | [BB] | Chọn 1 | `giao_vien` | `giao_vien` hoặc `quan_tri`. Chỉ Ban Giám hiệu ghi `quan_tri` |
| `to_chuyen_mon` | [TC] | Chữ | `Toán` | Để trống nếu chưa khai tổ |
| `la_to_truong` | [TC] | Chọn 1 | `x` | Ghi `x` nếu là tổ trưởng, để trống nếu không |

### Sheet 4 — `4_HOC_SINH` (1 dòng mỗi học sinh — sheet dài nhất)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ma_hs` | [BB] | **Chữ** | `HS2025001` | Duy nhất toàn trường. **Định dạng ô phải là Text**, xem cảnh báo bên dưới |
| `ho_ten` | [BB] | Chữ | `Trần Thị B` | Có dấu |
| `ngay_sinh` | [BB] | Ngày | `15/03/2009` | Đúng `dd/mm/yyyy`. Không dùng `2009-03-15` hay `3/15/2009` |
| `gioi_tinh` | [TC] | Chọn 1 | `Nữ` | `Nam` hoặc `Nữ` |
| `ten_lop` | [BB] | Chữ | `10A1` | Phải khớp **chính xác** một tên ở Sheet 2 |
| `sdt_phu_huynh` | [TC] | **Chữ** | `0912345678` | 10 số, không dấu cách, không `+84`. Định dạng ô là Text để không mất số 0 đầu |
| `ghi_chu` | [TC] | Chữ | | Để trống nếu không có |

> **Cảnh báo quan trọng — Excel tự ý sửa dữ liệu.** Nếu ô để định dạng mặc định, Excel
> biến `0912345678` thành `912345678` (mất số 0 đầu) và biến `2025001` thành `2.03E+06`.
> Cách phòng: **chọn cột → Format Cells → Text trước khi gõ**. Tệp mẫu Công ty cấp đã đặt
> sẵn định dạng Text cho hai cột này; nhà trường chỉ cần đừng tạo tệp mới từ đầu.

### Sheet 5 — `5_PHAN_CONG` (1 dòng cho mỗi cặp giáo viên × lớp × môn)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ma_gv` | [BB] | Chữ | `GV001` | Khớp Sheet 3 |
| `ten_lop` | [BB] | Chữ | `10A1` | Khớp Sheet 2 |
| `mon` | [BB] | Chữ | `Toán học` | Viết **thống nhất** trong cả tệp — `Toán học` và `Toán` bị hiểu là hai môn |

> Một giáo viên dạy 5 lớp thì có 5 dòng. Một giáo viên dạy 2 môn ở cùng 1 lớp thì có 2
> dòng. Đây là sheet nhiều dòng thứ hai sau danh sách học sinh, và là sheet quyết định
> giáo viên đăng nhập vào có thấy lớp của mình hay không.

### Sheet 6 — `6_PHU_HUYNH` (1 dòng mỗi phụ huynh — chỉ cần nếu bật tra cứu cho phụ huynh)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ma_hs` | [BB] | Chữ | `HS2025001` | Khớp Sheet 4 |
| `ho_ten_ph` | [BB] | Chữ | `Trần Văn C` | |
| `sdt` | [BB] | **Chữ** | `0912345678` | Đây là thứ phụ huynh dùng để đăng nhập |
| `quan_he` | [BB] | Chọn 1 | `Bố` | `Bố`, `Mẹ`, hoặc `Người bảo hộ` |
| `nhan_thong_bao` | [TC] | Chọn 1 | `x` | Ghi `x` cho người nhận thông báo chính, nếu một em có 2 phụ huynh |

### Sheet 7 — `7_KHOAN_THU` (chỉ cần nếu bật học phí)

| Cột | | Kiểu | Ví dụ | Quy tắc |
|---|---|---|---|---|
| `ten_khoan` | [BB] | Chữ | `Học phí tháng 9/2025` | |
| `so_tien` | [BB] | Số nguyên | `300000` | **Đồng, không có dấu chấm, không có chữ "đ", không thập phân** |
| `han_nop` | [BB] | Ngày | `10/09/2025` | `dd/mm/yyyy` |
| `ap_dung_cho` | [BB] | Chữ | `Toàn trường` | `Toàn trường`, hoặc tên một lớp, hoặc danh sách mã học sinh cách nhau bởi dấu `;` |

### Mười hai quy tắc chung cho cả tệp

1. Một dòng = một người hoặc một việc. Không gộp hai học sinh vào một dòng.
2. **Không gộp ô** (merge cells) ở bất kỳ đâu trong vùng dữ liệu.
3. Không dùng màu ô hay ghi chú để thay dữ liệu — máy không đọc được màu.
4. Không xoá, không đổi tên, không đổi thứ tự dòng tiêu đề.
5. Cột không có dữ liệu thì **để trống**, đừng ghi `không có`, `-`, `N/A`, hay `chưa rõ`.
6. Không thêm dòng tổng cộng, dòng trống phân cách, hay dòng chú thích giữa vùng dữ liệu.
7. Không thêm sheet mới. Cần trao đổi thì ghi vào email kèm, không ghi trong tệp.
8. Tên lớp, tên môn, tên tổ: **mỗi thứ đúng một cách viết** trong toàn tệp.
9. Chữ tiếng Việt có dấu, gõ bình thường (Unicode). Không dùng bảng mã cũ TCVN3/VNI.
10. Lưu ở dạng `.xlsx`. Nếu buộc dùng `.csv` thì phải là CSV **UTF-8**.
11. Xong mỗi sheet thì ghi số dòng đã điền vào email kèm — dùng để đối chiếu ở Mục 11.
12. Gửi **một tệp duy nhất**. Nhiều tệp rời của nhiều người là nguồn gốc của trùng lặp.

---

## 11. Bước 4: gửi tệp và quy trình nạp

**Đang có.** Máy chủ EduPortal đặt tại trường, nên dữ liệu học sinh không cần rời khỏi
khuôn viên trường ở bất kỳ bước nào.

**Đang thiếu.** Chưa chốt cách gửi tệp và ai chịu trách nhiệm bản cuối.

**Chỗ đang ổn.** Vì máy chủ ở trong trường, cách gửi an toàn nhất cũng là cách đơn giản
nhất: copy trực tiếp. Không cần tải lên đâu cả.

**Chỗ chưa ổn.** Tệp danh sách học sinh kèm ngày sinh và số điện thoại phụ huynh là dữ liệu
cá nhân của hàng nghìn người. Gửi qua Zalo hay email cá nhân nghĩa là nó nằm lại trên máy
chủ của bên thứ ba, trong lịch sử chat của nhiều người, không thu hồi được. Đây là rủi ro
thật và tránh được bằng một thao tác.

**Hướng gửi tệp**

| | Cách | An toàn | Tiện |
|---|---|---|---|
| **A** | Copy vào máy chủ EduPortal ngay tại trường (USB trao tay, có biên bản giao nhận) | Cao nhất — tệp không ra khỏi trường | Cần hẹn giờ, 15 phút |
| **B** | Tải lên qua trang nội bộ chỉ chạy trong mạng LAN của trường | Cao | Tiện nhất khi Công ty có mặt |
| **C** | Gửi qua email/Zalo | **Thấp — Công ty không khuyến nghị** | Tiện nhất |

**Đề xuất: A.** Nếu buộc phải dùng C vì lý do thời gian, thì đặt mật khẩu cho tệp nén và
đọc mật khẩu qua điện thoại, không gửi kèm cùng kênh.

### Quy trình nạp — 6 bước, tổng khoảng một buổi

| Bước | Việc | Ai | Thời gian |
|---|---|---|---|
| 1 | Nhận tệp, sao lưu nguyên bản (để đối chiếu về sau) | Công ty | 5 phút |
| 2 | **Kiểm tra khô** — chạy nạp thử, không ghi vào cơ sở dữ liệu thật | Công ty | 10 phút |
| 3 | In **báo cáo lỗi**: dòng nào thiếu cột bắt buộc, mã nào trùng, tên lớp nào không khớp | Công ty | — |
| 4 | Văn phòng sửa theo báo cáo, gửi lại. Lặp bước 2–4 tới khi hết lỗi | Nhà trường | Tuỳ số lỗi |
| 5 | Nạp thật, rồi **đối chiếu số lượng**: số học sinh mỗi lớp trên hệ thống so với sĩ số nhà trường khai ở Sheet 2 | Hai bên | 20 phút |
| 6 | Ký biên bản: số lớp, số giáo viên, số học sinh đã nạp | Hai bên | 10 phút |

**Bước 5 là bước không được bỏ.** Nạp xong mà không đếm lại thì một lớp bị thiếu 3 em sẽ
chỉ lộ ra vào cuối kỳ, lúc học bạ in ra thiếu người.

### Mười lỗi thường gặp và cách xử lý

| # | Lỗi | Biểu hiện | Cách xử lý |
|---|---|---|---|
| 1 | Mã học sinh mất số 0 đầu | `0025001` thành `25001` | Đặt định dạng cột là Text rồi gõ lại cột đó |
| 2 | Mã học sinh thành số khoa học | `2.03E+06` | Như trên |
| 3 | Số điện thoại mất số 0 | `912345678` | Như trên |
| 4 | Tên lớp không thống nhất | `10A1` và `10 A1` cùng tồn tại | Dùng Find & Replace, chọn một cách viết |
| 5 | Tên môn không thống nhất | `Toán`, `Toán học`, `TOÁN` | Như trên |
| 6 | Mã giáo viên trùng | Hai người cùng `GV015` | Nhà trường quyết định ai giữ mã cũ |
| 7 | Học sinh trùng tên, không có mã | Hai `Nguyễn Văn A` cùng lớp | **Bắt buộc phải có mã học sinh** — không ghép bằng họ tên |
| 8 | Ngày sinh sai định dạng | `15-3-2009`, `3/15/2009` | Định dạng lại cả cột về `dd/mm/yyyy` |
| 9 | Email ngoài tên miền trường | `abc@gmail.com` | EduPortal từ chối. Dùng email trường, hoặc bỏ trống và dùng mã đăng nhập |
| 10 | Dòng trống giữa vùng dữ liệu | Nạp dừng giữa chừng | Xoá dòng trống, không để dòng phân cách |

Lỗi 1–3 chiếm phần lớn số lần phải làm lại. Cả ba đều do Excel tự ý sửa dữ liệu, và cả ba
đều phòng được bằng một thao tác đặt định dạng Text trước khi gõ.

---

## 12. Nếu nhà trường không có dữ liệu số nào

**Đang có.** Hồ sơ giấy: sổ đăng bộ, danh sách lớp, học bạ.

**Đang thiếu.** Bản số của những thứ đó.

**Chỗ đang ổn.** Đây là việc làm **một lần**. Sau năm đầu, mỗi năm chỉ phải thêm khối 10
mới và chuyển lớp cho ba khối cũ — việc của một buổi, không phải của một tuần.

**Chỗ chưa ổn.** Nếu không chia việc rõ và không có hạn, việc này sẽ trôi. Kịch bản thường
gặp: giao chung cho "văn phòng", không ai nhận, tới ngày hẹn triển khai vẫn chưa có dòng
nào.

**Hướng giải quyết**

| | Hướng | Cách chia | Thời gian | Chất lượng |
|---|---|---|---|---|
| **A** | Mỗi giáo viên chủ nhiệm gõ đúng lớp mình | ~40 dòng/người | 30–45 phút mỗi người, làm song song → xong trong 2–3 ngày | Cao — GVCN biết rõ học sinh của mình |
| **B** | Văn thư gõ toàn trường | Một người làm tất | 40–120 giờ | Đồng nhất về cách viết, nhưng chậm và dễ mỏi mắt sai |
| **C** | Thuê nhập liệu ngoài | Theo hợp đồng | 3–5 ngày | Cần rà soát lại; và phải cân nhắc việc giao hồ sơ ra ngoài |
| **D** | Nhập dần theo lớp, dùng tới đâu nhập tới đó | Theo tiến độ triển khai | Rải ra | Thấp — hệ thống nửa vời trong nhiều tuần |

**Đề xuất: A.** Chia theo lớp là cách duy nhất biến một việc 100 giờ thành nhiều việc
45 phút. Kèm ba điều kiện để nó thật sự chạy:

1. Công ty cấp **tệp mẫu riêng cho từng lớp**, đã điền sẵn tên lớp và mã lớp — GVCN chỉ gõ
   danh sách học sinh.
2. Đặt **hạn cụ thể** (ví dụ: trước 17h thứ Sáu tuần sau), thông báo trong họp hội đồng.
3. Văn thư gom lại và **rà một lượt** cách viết tên lớp trước khi gửi Công ty — 20 phút này
   tiết kiệm một vòng sửa lỗi cho 40 người.

---

## 13. Sau lần nạp đầu: dữ liệu được cập nhật thế nào

**Đang có.** Trong EduPortal, việc tạo tài khoản, khoá tài khoản, cấp lại mật khẩu và
chuyển lớp cho một học sinh làm được trực tiếp trên giao diện, không cần Công ty.

**Đang thiếu.** Chưa có màn hình nạp theo lô từ Excel (đã nêu ở Mục 9), nên việc thêm cùng
lúc vài chục người vẫn cần Công ty chạy.

**Chỗ đang ổn.** Việc gấp thì nhà trường tự làm được trong một phút: giáo viên nghỉ việc
thì khoá tài khoản ngay, không phải gọi điện chờ Công ty trong giờ hành chính. Đây là ranh
giới quan trọng — **việc gấp thuộc nhà trường, việc khối lượng lớn thuộc Công ty**.

**Chỗ chưa ổn.** Có một khoảng trống Công ty nói thẳng: hiện đăng nhập một lần chỉ **chặn
đường vào từ website trường**. Giáo viên đã chuyển đi không đi qua cửa đó được nữa, nhưng
tài khoản EduPortal của họ vẫn còn. Chưa làm được vì phần thiếu không nằm ở mã nguồn —
EduPortal cần biết "người này đã nghỉ" bằng cách nào, và đó là quy trình của nhà trường.
Trong lúc chờ, quy trình tạm: **khi có giáo viên chuyển đi, quản trị viên vô hiệu hoá tài
khoản tương ứng, cùng lúc với các thủ tục bàn giao khác.**

**Bảng phân việc cập nhật**

| Việc | Tần suất | Ai làm | Cách làm |
|---|---|---|---|
| Học sinh chuyển đến (1–2 em) | Rải rác | Nhà trường | Thêm trực tiếp trên giao diện |
| Học sinh chuyển đi | Rải rác | Nhà trường | Đánh dấu chuyển đi, **không xoá** — xoá là mất điểm đã có |
| Giáo viên mới | Đầu năm, giữa năm | Nhà trường | Thêm trên giao diện, gắn mã giáo viên |
| Giáo viên nghỉ / chuyển | Rải rác | Nhà trường | Vô hiệu hoá tài khoản ngay trong ngày |
| Khối 10 mới nhập học | Mỗi năm 1 lần | Công ty nạp theo tệp | Theo đúng quy trình Mục 10–11 |
| Chuyển lớp toàn trường lên khối trên | Mỗi năm 1 lần | Công ty | Một lệnh, có bước xác nhận |
| Phân công giảng dạy năm mới | Mỗi năm 1 lần | Công ty nạp theo tệp | Sheet 5 của tệp mẫu |

---

## 14. Dữ liệu được lưu ở đâu trong hệ thống

Mục này để nhà trường biết dữ liệu của mình nằm đâu, không phải để làm theo.

| Loại dữ liệu | Nằm ở | Sao lưu bởi |
|---|---|---|
| Học sinh, giáo viên, lớp, điểm, điểm danh, học phí | Cơ sở dữ liệu PostgreSQL trên máy chủ tại trường | `backup-db.sh`, hằng ngày (Mục 20) |
| Tệp tài liệu, đề thi giáo viên tải lên | Kho tệp riêng trên cùng máy, **không công khai** — mỗi lần mở là một đường dẫn tạm có hạn | Cùng cơ chế sao lưu |
| Nhật ký ai đăng nhập qua cửa website trường | Tệp `data/sso-access.log` | Cần sao lưu như dữ liệu |
| Nhật ký ai xem camera nào lúc nào | Tệp `data/camera-access.log` (Mục 27) | Cần sao lưu như dữ liệu |
| Mật khẩu từng camera | Tệp `data/cameras.json`, chỉ tài khoản dịch vụ đọc được | Cần sao lưu **riêng và có kiểm soát** |
| Đoạn ghi hình camera | Ổ cứng của đầu ghi, hoặc ổ riêng trên máy chủ (Mục 25) | Không đưa vào bản sao lưu hằng ngày — quá lớn |

---

# PHẦN III — MÁY CHỦ ĐẶT TẠI TRƯỜNG

## 15. Một máy chủ, ba phần mềm chạy cùng lúc

**Đang có.** Cấu hình máy chủ đã khảo sát và báo giá: **Ryzen 9 9950X 16 nhân / 64 GB RAM /
RTX PRO 2000 16 GB — 117.280.000 đ**, trả một lần, không có phí thuê hằng tháng.

**Đang thiếu.** Quyết định mua, chỗ đặt, và người phụ trách nhìn máy hằng tuần.

**Chỗ đang ổn.** Ba phần mềm cần cho toàn hệ thống chạy chung trên đúng một máy này — không
phải mua ba máy:

```
                    ┌─── Máy chủ đặt tại trường, chạy 24/7 ───────────────┐
                    │                                                     │
  Trình duyệt ──────┼──▶ nginx (cửa duy nhất, cổng 443)                   │
  của người dùng    │        │                                            │
                    │        ├──▶ Supabase / PostgreSQL   (dữ liệu, đăng nhập)
                    │        ├──▶ eduportal-server (Node) (cấp vé camera, phiên âm)
                    │        └──▶ MediaMTX                (đổi hình camera sang WebRTC)
                    │                    ▲                                │
                    └────────────────────┼────────────────────────────────┘
                                         │ chỉ trong mạng LAN
                                    Camera IP
```

| Phần mềm | Làm gì | Nếu tắt thì |
|---|---|---|
| **PostgreSQL** (trong Supabase) | Giữ toàn bộ dữ liệu: điểm, điểm danh, học phí, hồ sơ | Cả hệ thống dừng |
| **eduportal-server** (Node.js) | Cấp vé xem camera, nhận sự kiện nhận diện, phiên âm và tóm tắt cuộc họp | Camera và phiên âm dừng; sổ điểm vẫn chạy |
| **MediaMTX** | Đổi luồng RTSP của camera sang định dạng trình duyệt xem được | Chỉ tường camera dừng |
| **nginx** | Cửa duy nhất ra Internet, phân luồng theo tên miền **và theo đường dẫn** | Không ai vào được từ ngoài; trong trường vẫn dùng được |

**Chỗ chưa ổn.** Ba phần mềm trên một máy nghĩa là **một máy hỏng là cả ba dừng**. Đây là
đánh đổi có ý thức: một máy tại trường đơn giản và rẻ hơn nhiều so với ba máy hoặc thuê
đám mây, nhưng nó biến "sao lưu" và "kế hoạch khi máy hỏng" từ việc nên làm thành việc
buộc phải làm. Xem Mục 20 và Mục 21.

**Vì sao không thuê đám mây cho gọn.** Ba lý do kỹ thuật, chưa nói tới chi phí:

1. Luồng camera phải nằm trong mạng trường. Đẩy 8 camera lên đám mây rồi kéo về là tốn
   băng thông Internet 24/7 và phụ thuộc hoàn toàn vào đường truyền của trường.
2. Nền tảng đám mây kiểu "không cần máy chủ" không giữ được kết nối dài — chính vì vậy
   không chạy được phần chuyển luồng camera.
3. Dữ liệu học sinh khi đó nằm trên máy của bên khác. Đặt tại trường thì dữ liệu không rời
   khuôn viên, và nhà trường không phải giải trình với ai về việc đó.

---

## 16. Cấu hình máy: từng thành phần dùng để làm gì

Đây là phần để nhà trường biết mình đang trả tiền cho cái gì, và biết chỗ nào cắt được nếu
cần cắt.

| Thành phần | Cấu hình | Dùng cho | Cắt được không |
|---|---|---|---|
| **CPU** | Ryzen 9 9950X, 16 nhân | Cơ sở dữ liệu (nặng nhất khi cả trường nộp bài thi thử cùng lúc), 3 dịch vụ chạy song song | Xuống 8 nhân được nếu bỏ thi thử trên hệ thống, nhưng dư tải là thứ không nên tiết kiệm |
| **RAM** | 64 GB | PostgreSQL giữ phần dữ liệu hay dùng trong bộ nhớ; MediaMTX; model phiên âm | 32 GB đủ cho trường nhỏ, nhưng chênh lệch giá không lớn |
| **Card đồ hoạ** | RTX PRO 2000 16 GB | **Hai việc**: nhận diện khuôn mặt/biển số ở cổng, và phiên âm–tóm tắt cuộc họp bằng model chạy nội bộ | Cắt được **nếu** bỏ cả hai việc trên. Nếu chỉ bỏ nhận diện mà vẫn muốn phiên âm thì vẫn cần card |
| **Ổ hệ thống** | SSD NVMe ≥ 1 TB | Hệ điều hành + PostgreSQL + ứng dụng | Không |
| **Ổ ghi hình** | HDD loại ghi liên tục, dung lượng theo Mục 25 | Đoạn ghi camera, nếu không dùng ổ trong đầu ghi | Được, nếu để đầu ghi tự lưu |
| **Ổ sao lưu rời** | 4 TB trở lên | Bản sao lưu mang ra khỏi trường hằng tuần | **Không** — đây là thứ rẻ nhất và quan trọng nhất trong bảng |

### Vì sao phải tách ổ đĩa

Camera ghi hình 24/7 làm ổ cứng bận liên tục. Để cơ sở dữ liệu chung ổ với chỗ ghi hình thì
Postgres phải chờ mỗi lần ổ đang bận ghi camera — biểu hiện ra ngoài là "phần mềm chậm vào
giờ cao điểm", và không ai nghĩ tới nguyên nhân là camera.

Vậy nên: **dữ liệu trên SSD, ghi hình trên ổ khác.** Đây là việc làm lúc dựng máy, tốn 0
đồng nếu tính trước; đổi về sau thì phải dừng hệ thống để chuyển dữ liệu.

### Về card đồ hoạ: mua rồi thì đừng mua giấy phép AI của hãng camera nữa

Nhiều hãng camera bán riêng giấy phép nhận diện khuôn mặt hoặc đọc biển số, giá vài triệu
một kênh. EduPortal chạy được **cả hai đường**: nhận kết quả từ đầu ghi (nếu trường đã có
giấy phép), hoặc tự nhận diện trên card đồ hoạ này.

| | Hướng | Chi phí thêm | Ưu | Nhược |
|---|---|---|---|---|
| **A** | Dùng giấy phép AI của hãng, nếu trường **đã có** | 0 | Rẻ nhất; đầu ghi làm hết | Phụ thuộc hãng; đổi camera là mất |
| **B** | Nhận diện trên máy chủ EduPortal | Đã nằm trong 117,28 triệu | Không phụ thuộc hãng; nâng cấp mô hình được | Cần card đồ hoạ |
| **C** | Mua giấy phép AI mới của hãng | Vài triệu mỗi kênh | Đơn giản | **Trùng với thứ đã trả tiền ở hướng B** |

**Đề xuất: kiểm tra trước xem trường đã có giấy phép chưa, rồi chọn A nếu đã có, B nếu
chưa. Không mua C khi đã đầu tư card đồ hoạ.**

---

## 17. Chỗ đặt máy, điện và chi phí vận hành

**Đang có.** Chưa có thông tin về chỗ đặt.

**Đang thiếu.** Một phòng khoá được, một ổ điện riêng, và một bộ lưu điện.

**Chỗ đang ổn.** Máy này không cần phòng máy chuyên dụng, không cần điều hoà công nghiệp.
Một phòng thiết bị bình thường, thoáng, khoá được là đủ.

**Chỗ chưa ổn.** Bốn rủi ro vật lý mà phần mềm không xử lý được:

1. **Mất điện đột ngột lúc đang ghi dữ liệu** là cách phổ biến nhất làm hỏng cơ sở dữ liệu.
   Không phải mất một dòng — có thể là không mở được cả tệp dữ liệu.
2. **Nóng.** Đặt trong tủ kín không thoáng khí thì ổ cứng và card đồ hoạ nóng, tuổi thọ
   giảm, và máy tự giảm tốc để hạ nhiệt.
3. **Ai cũng vào được.** Máy giữ điểm, học phí và hình camera của cả trường. Người rút được
   ổ cứng ra khỏi máy thì mọi lớp bảo vệ bằng phần mềm đều vô nghĩa.
4. **Nước.** Đặt dưới đường ống, cạnh cửa sổ hay trong phòng có bình nước là rủi ro không
   cần thiết.

**Yêu cầu chỗ đặt**

| Hạng mục | Yêu cầu | Vì sao |
|---|---|---|
| Phòng | Khoá được, chỉ 2–3 người có chìa | Bảo vệ vật lý |
| Thông thoáng | Không đặt trong tủ kín; nếu trong tủ thì phải có quạt | Nhiệt độ |
| Nhiệt độ | Dưới 30 °C là tốt; phòng có điều hoà thì bật khi trời nóng | Tuổi thọ ổ cứng |
| Điện | Ổ cắm riêng, không dùng chung với máy in hay ấm siêu tốc | Sụt điện khi thiết bị khác khởi động |
| Bộ lưu điện | Bắt buộc, xem dưới | Chống mất điện đột ngột |
| Mạng | Cắm **cáp**, không dùng wifi | Máy chủ không được rớt mạng |
| Vị trí | Không dưới đường ống nước, không sát cửa sổ mưa tạt | Nước |

### Bộ lưu điện: mục đích là tắt máy an toàn, không phải chạy tiếp

Đây là chỗ hay hiểu sai. Bộ lưu điện cho máy chủ này **không** nhằm giữ hệ thống chạy suốt
buổi mất điện — muốn thế thì tốn rất nhiều tiền. Nó nhằm giữ máy sống thêm vài phút để
**tự tắt đúng cách**, đóng cơ sở dữ liệu lại tử tế.

| Mức | Công suất | Cầm được | Đủ để |
|---|---|---|---|
| Tối thiểu | 1000 VA | 5–10 phút | Tự tắt an toàn |
| Nên có | 1500 VA | 15–25 phút | Chờ xem điện có về ngay không, rồi mới tắt |
| Không cần | 3000 VA trở lên | Trên 1 giờ | Chỉ cần nếu trường muốn camera và cổng thông tin chạy xuyên buổi mất điện |

> **Điểm quan trọng nhất về bộ lưu điện:** nó phải được **nối dây dữ liệu với máy chủ và
> cấu hình để máy tự tắt khi pin gần cạn**. Bộ lưu điện chỉ cắm điện mà không cấu hình thì
> khi hết pin, máy vẫn tắt đột ngột — chỉ là muộn hơn 15 phút. Việc cấu hình này thuộc
> Công ty, làm một lần lúc dựng máy.

### Chi phí điện hằng tháng

Máy này chạy 24/7. Mức tiêu thụ thực tế phụ thuộc việc có bật nhận diện liên tục hay không:

| Trạng thái | Công suất | Điện mỗi tháng |
|---|---|---|
| Nhàn rỗi (đêm, không ai dùng) | ~100–140 W | ~75–100 kWh |
| Ngày thường, không nhận diện | ~180–250 W | ~130–180 kWh |
| Có nhận diện chạy liên tục ở cổng | ~300–400 W | ~215–290 kWh |

Ước tính thực tế cho một trường bật nhận diện giờ đến/tan học: khoảng **150–200 kWh mỗi
tháng**. Quy ra tiền thì tuỳ đơn giá điện nhà trường đang áp — nhà trường tự nhân với đơn
giá trên hoá đơn sẽ ra con số đúng của mình.

---

## 18. Mạng trong trường

**Đang có.** Chưa có thông tin về sơ đồ mạng và loại đường truyền tới từng camera.

**Đang thiếu.** Ba thông tin: máy chủ nối vào switch nào, camera nối bằng cáp hay wifi, và
trường có chia mạng riêng cho camera được không.

**Chỗ đang ổn.** Máy chủ đặt tại trường nên **luồng camera không ra Internet** — chỉ chạy
trong mạng nội bộ. Với 8 camera, lượng dữ liệu trong mạng khoảng 16–32 Mbps, một switch
gigabit bình thường gánh nhẹ nhàng. Đây là lợi thế lớn về băng thông so với giải pháp đám
mây, nơi từng khung hình đều phải đi ra ngoài rồi quay lại.

**Chỗ chưa ổn.** Hai nút thắt, và một rủi ro bảo mật:

1. **Wifi là nút thắt.** Một camera độ phân giải cao chạy liên tục chiếm băng thông đáng
   kể. Wifi yếu làm mất khung hình, và nhận diện trên chuỗi hình mất khung sẽ nhận sai hoặc
   bỏ sót — nhưng biểu hiện ra ngoài lại giống hệt "phần mềm nhận diện kém", nên không ai
   nghĩ tới đường truyền.
2. **Máy chủ cắm wifi là sai.** Máy chủ phải cắm cáp. Một lần rớt wifi giữa giờ nhập điểm
   là cả trường mất kết nối.
3. **Camera chung mạng với máy chủ là rủi ro thật.** Camera IP là thiết bị nhúng, phần mềm
   bên trong hiếm khi được cập nhật. Camera bị chiếm mà chung mạng với máy chủ nghĩa là kẻ
   tấn công đứng ngay cạnh cơ sở dữ liệu.

**Hướng giải quyết**

| | Hướng | Chi phí | Mức bảo vệ |
|---|---|---|---|
| **A** | Camera ở **mạng riêng** (VLAN riêng), không có đường ra Internet; chỉ máy chủ gọi vào camera được, camera không gọi ngược ra | 0 nếu switch hiện có hỗ trợ chia VLAN | Cao |
| **B** | Camera chung mạng, nhưng đổi hết mật khẩu mặc định và chặn camera ra Internet | 0 | Trung bình |
| **C** | Giữ nguyên như hiện tại | 0 | Thấp |

**Đề xuất: A.** Và **đổi mật khẩu mặc định của từng camera** trong mọi trường hợp —
`admin/12345` vẫn là mật khẩu phổ biến nhất trên camera đang chạy thật ngoài đời.

> **Hai việc sẽ hỏng khi camera ở mạng không có Internet** — xử lý trước, đừng để người
> khác "sửa" bằng cách mở cửa ra Internet cho cả dải camera:
>
> - **Đồng hồ trên camera sẽ trôi.** Giờ hiện trên hình và giờ trong nhật ký lệch nhau, làm
>   mất giá trị đối chứng của chính cuốn nhật ký. Cách xử lý: cho camera đồng bộ giờ với
>   **máy chủ trong trường** thay vì với máy chủ giờ trên Internet.
> - **Không cập nhật được phần mềm camera.** Cách xử lý: tải tệp cập nhật về một máy khác
>   rồi nạp thủ công, hoặc mở tạm đúng lúc cập nhật rồi đóng lại.

**Về cáp cho camera cổng:** hai camera dùng để nhận diện nên **kéo cáp mạng**, không dùng
wifi. Chi phí vài trăm nghìn mỗi điểm, và nó loại bỏ hẳn nguyên nhân "nhận diện sai mà
không biết vì sao" ở điểm 1 phía trên.

---

## 19. Công bố ra Internet: chỉ mở hai cổng, và mở đúng đường dẫn

**Đang có.** Cách dựng đã được viết thành tài liệu kèm cấu hình mẫu: `server/FIREWALL.md`
và `server/SELF-HOST.md`.

**Đang thiếu.** Xác nhận từ nhà trường về hai điều: đường truyền của trường có gọi vào được
từ Internet không, và trường có IP tĩnh hay không.

**Chỗ đang ổn.** Nguyên tắc dựng đã rõ và không thoả hiệp: **ra Internet chỉ có hai cổng** —
một cho web, một cho hình camera. Mọi thứ còn lại chỉ nghe trong nội bộ máy, nên kể cả
tường lửa cấu hình sai thì cũng không lộ ra ngoài.

| Ra Internet | Không bao giờ ra Internet |
|---|---|
| Cổng web (443) — cửa duy nhất cho người dùng | Cơ sở dữ liệu PostgreSQL |
| Một cổng UDP cho hình camera | Trang quản trị cơ sở dữ liệu |
| | Luồng camera thô (RTSP) |
| | Camera IP |
| | Máy chủ ứng dụng (chỉ nghe nội bộ) |

**Chỗ chưa ổn.** Năm cái bẫy, mỗi cái đều **im lặng** — hệ thống vẫn chạy, không báo lỗi
gì, chỉ là đang mở cửa cho người ngoài. Công ty liệt kê ra đây vì nhà trường có quyền biết
những chỗ dễ sai nhất:

1. **Đường truyền của nhà mạng có thể không cho gọi vào.** "IP tĩnh" của các nhà mạng Việt
   Nam không đồng nghĩa với "gọi vào được từ Internet": gói phổ thông thường chặn chiều vào
   cổng 80/443, hoặc đặt đường truyền sau một tầng chia sẻ địa chỉ. **Phải kiểm tra điều
   này trước khi dựng bất cứ thứ gì** — kiểm 10 phút, và nếu không gọi vào được thì phải
   gọi nhà mạng, không phải cấu hình lại máy.
2. **Chuyển tiếp cả tên miền thay vì lọc từng đường dẫn = đưa trang quản trị cơ sở dữ liệu
   lên Internet.** Cấu hình đúng là chỉ mở đúng bốn đường dẫn ứng dụng cần, còn lại trả về
   "không tồn tại". Đây là phần quan trọng nhất của cả việc dựng máy.
3. **Cổng do Docker mở không bị tường lửa chặn.** Docker ghi luật riêng, được duyệt **trước**
   luật tường lửa. Nên có thể xảy ra chuyện: lệnh kiểm tra tường lửa hiện "đã chặn cổng cơ
   sở dữ liệu", trong khi cơ sở dữ liệu vẫn mở ra Internet. Không báo lỗi gì. Cách xử lý là
   buộc từng dịch vụ chỉ nghe nội bộ, rồi **kiểm tra lại bằng ba lệnh khác nhau**, không
   tin một lệnh.
4. **Phần đăng nhập mặc định cho bất kỳ ai trên Internet tự tạo tài khoản.** Phải tắt tính
   năng tự đăng ký. Tắt không ảnh hưởng đăng nhập một lần, vì cửa đó tạo tài khoản bằng
   đường riêng của máy chủ.
5. **Cách xin chứng chỉ bảo mật quyết định việc nó có tự gia hạn được không.** Có hai cách
   xin: một cách cần mở thêm một cổng nữa (cổng 80) — thứ nhà mạng Việt Nam hay chặn — và
   **cần cổng đó mở vĩnh viễn**, vì chứng chỉ tự gia hạn mỗi khoảng 60 ngày qua đúng đường
   đó. Mở tạm để xin rồi đóng lại thì hai tháng sau chứng chỉ hết hạn, cả cổng thông tin
   tắt, và không ai nối được sự cố với việc đã làm từ hai tháng trước. Cách còn lại xác thực
   qua bản ghi tên miền, không cần mở cổng nào — đây là cách Công ty dùng, và nó cần nhà
   đăng ký tên miền của trường cho phép sửa bản ghi tự động.

**Hướng giải quyết cho việc công bố ra Internet**

| | Hướng | Được | Mất |
|---|---|---|---|
| **A** | **Có IP tĩnh** — nginx + chứng chỉ Let's Encrypt, trỏ bản ghi DNS thẳng về IP đó | Tên miền con không mất phí, **không phải đổi nhà quản lý tên miền** nên website hiện có của trường không bị đụng tới | Máy phơi thẳng ra Internet — phải dựng tường lửa đúng ngay từ đầu |
| **B** | **Không có IP tĩnh** — đường hầm Cloudflare, máy tự mở kết nối ra, không mở cổng nào vào | Không cần IP tĩnh; không phơi máy chủ ra Internet | **Phải chuyển nhà quản lý tên miền của cả tên miền sang Cloudflare** — tức đụng tới website hiện có, cần nhà trường đồng ý |
| **C** | Chỉ dùng trong mạng trường, không ra Internet | An toàn nhất | Giáo viên không nhập điểm ở nhà được; phụ huynh không tra cứu được |

**Đề xuất: A nếu trường có IP tĩnh** (theo khảo sát ban đầu thì Trường THPT Phúc Thịnh đi
được đường này), **B nếu không có**. Việc đầu tiên phải làm trước cả hai hướng là **kiểm
tra xem đường truyền có gọi vào được từ Internet hay không** — đây là điều kiện, không phải
tuỳ chọn.

Và bất kể chọn hướng nào: đặt đúng **số tầng trung gian** (`TRUST_PROXY` = 1 với hướng A,
= 2 với hướng B). Sai giá trị này thì mọi truy cập trông như đến từ cùng một địa chỉ, nên
giới hạn chống dò mật khẩu gộp cả trường vào một rổ chung — kẻ tấn công thử sai vài lần là
khoá cửa đăng nhập của toàn bộ giáo viên. Hỏng im lặng, không có thông báo nào.

---

## 20. Sao lưu, thử khôi phục, và năm chuỗi bí mật

**Đang có.** Hai kịch bản đã viết sẵn: `server/scripts/backup-db.sh` (sao lưu) và
`restore-check.sh` (**thử khôi phục**). Lịch đề xuất: sao lưu hằng ngày lúc 1 giờ sáng, giữ
30 ngày; hằng tuần copy ra ổ cứng rời mang ra khỏi trường.

**Đang thiếu.** Một ổ cứng rời, một người được phân công mang nó về hằng tuần, và một chỗ
cất năm chuỗi bí mật.

**Chỗ đang ổn.** Kịch bản sao lưu **từ chối coi là thành công** trong bốn trường hợp, thay
vì âm thầm tạo một tệp rỗng:

| Kịch bản sao lưu báo lỗi khi | Vì sao quan trọng |
|---|---|
| Không tìm thấy công cụ trích xuất dữ liệu | Sao lưu chưa từng chạy mà tưởng là có |
| Công cụ trích xuất báo lỗi | Tệp tạo ra không đầy đủ |
| Tệp tạo ra nhỏ bất thường (dưới 50 KB) | Dấu hiệu nối nhầm cơ sở dữ liệu rỗng |
| Tệp tạo ra không đọc lại được | Tệp hỏng ngay từ lúc tạo |

Và nó **chỉ xoá bản cũ sau khi bản mới đã qua hết bốn kiểm tra trên**. Sao lưu hỏng mà im
lặng còn tệ hơn không sao lưu, vì nhà trường tưởng là mình có.

Kịch bản thử khôi phục thì nạp bản mới nhất vào một cơ sở dữ liệu tạm, **đếm số dòng bốn
bảng cốt lõi** (người dùng, điểm, điểm danh, kết quả thi thử), rồi xoá cơ sở dữ liệu tạm
đi. Đây là câu trả lời cho câu hỏi "bản sao lưu này có dùng được không" — mà cách duy nhất
để biết là thử.

**Chỗ chưa ổn.** Ba chỗ dễ mất dữ liệu mà không ai để ý:

1. **Bản sao lưu để cạnh máy chủ thì cháy phòng là mất cả hai.** Phải có một bản ra khỏi
   trường. Kịch bản sao lưu sẽ nhắc mỗi lần chạy cho tới khi có người xác nhận đã cấu hình
   bản ngoài trường — cố ý làm phiền, vì đây là thứ dễ bỏ qua nhất.
2. **Sao lưu có mà mật khẩu không có thì bản sao lưu vô dụng.** Năm chuỗi bí mật dưới đây
   chỉ nằm trong tệp cấu hình **trên đúng cái máy đó**. Máy hỏng mà không ai có chúng thì
   bản sao lưu cũng không mở ra được gì.
3. **Ổ sao lưu đầy thì sao lưu dừng, và không ai biết.** Ví dụ điển hình: ổ đầy từ tháng 10,
   tới tháng 3 cần khôi phục thì bản mới nhất là của tháng 9. Cách phòng: kịch bản thoát với
   mã lỗi để hệ thống gửi cảnh báo, và có người xem một màn hình tình trạng 2 phút mỗi tuần.

### Năm chuỗi bí mật và nơi cất

| # | Chuỗi | Dùng để | Mất thì |
|---|---|---|---|
| 1 | Mật khẩu cơ sở dữ liệu | Mở cơ sở dữ liệu và bản sao lưu | **Không khôi phục được dữ liệu** |
| 2 | Chuỗi ký phiên đăng nhập | Xác thực người dùng | Mọi người phải đăng nhập lại; sinh mới được |
| 3 | Khoá quản trị của máy chủ | Máy chủ ghi dữ liệu vượt qua mọi lớp phân quyền | Rất nghiêm trọng nếu **lọt ra ngoài** — chỉ được nằm trên máy chủ, không bao giờ nằm trong phần chạy trên trình duyệt |
| 4 | Chuỗi ký vé xem camera | Cấp vé xem camera | Không ai xem được camera; sinh mới được |
| 5 | Chuỗi bí mật đăng nhập một lần (Mục 5) | Nối với website trường | Đăng nhập một lần dừng; sinh mới được |

**Đề xuất:** in ra giấy, cho vào **phong bì niêm phong, cất tại phòng Hiệu trưởng**, và ghi
ngày. Không gửi qua Zalo, không gửi email, không lưu trong tệp Word trên máy văn phòng. Mỗi
lần đổi thì thay phong bì và ghi ngày mới.

**Hướng giải quyết cho sao lưu**

| | Hướng | Chi phí | Mức bảo vệ |
|---|---|---|---|
| **A** | Hằng ngày trên máy + ổ rời hằng tuần mang về + thử khôi phục mỗi học kỳ | Một ổ cứng rời | Cao |
| **B** | Chỉ sao lưu hằng ngày cùng máy | 0 | Thấp — ổ hỏng là mất hết |
| **C** | Như A, thêm một bản mã hoá đẩy lên đám mây | Phí lưu trữ nhỏ | Cao nhất — chống cả cháy nổ và mất ổ rời |

**Đề xuất: A, hướng tới C.** Trong buổi bàn giao, Công ty sẽ **chạy thử khôi phục trước mặt
cán bộ nhà trường**, để nhà trường tận mắt thấy nó hoạt động chứ không phải nghe cam kết.

---

## 21. Bảo trì định kỳ và kịch bản khi máy hỏng

**Đang có.** Danh sách việc định kỳ đã rõ, và phần vá lỗi bảo mật hệ điều hành **giao cho
máy tự làm** ngay hôm dựng — vì người thì bận và sẽ quên.

**Đang thiếu.** Phân công người phụ trách phía nhà trường (1 chính, 1 dự phòng).

**Chỗ đang ổn.** Việc hằng ngày của nhà trường **không cần biết lập trình**: tạo và khoá tài
khoản, cấp lại mật khẩu, xem một màn hình tình trạng hệ thống trong 2 phút, và báo Công ty
khi có sự cố. Ranh giới rõ: **cập nhật phần mềm, sao lưu, xử lý lỗi kỹ thuật là việc của
Công ty.** Nhà trường không phải tuyển người biết công nghệ thông tin.

**Chỗ chưa ổn.** Một hệ thống không có người trông sẽ hỏng dần mà không ai biết, cho tới
lúc cần dùng thì không dùng được. Và có một loại việc **chỉ nhà trường làm được vì nó gấp**:
khoá tài khoản một giáo viên vừa nghỉ trong mâu thuẫn, hoặc một tài khoản bị lộ mật khẩu.
Trường tự làm thì mất 1 phút; chờ Công ty thì mất tới hết giờ hành chính.

### Việc định kỳ

| Việc | Bao lâu một lần | Ai |
|---|---|---|
| Xem màn hình tình trạng hệ thống (còn bao nhiêu ổ trống, sao lưu tối qua có chạy không) | Hằng tuần, 2 phút | Nhà trường |
| Mang ổ sao lưu rời về, cắm ổ tuần sau vào | Hằng tuần | Nhà trường |
| Đọc nhật ký ai đã xem camera | Hằng tháng | Người phụ trách phía nhà trường |
| Kiểm chứng chỉ bảo mật còn hạn | Hằng tháng | Công ty (tự động cảnh báo) |
| Cập nhật các phần mềm nền | Hằng quý, đọc ghi chú phát hành trước | Công ty |
| Quét lại các cổng mở, từ ngoài **và từ trong mạng trường** | Sau mỗi lần sửa cấu hình | Công ty |
| **Khôi phục thử bản sao lưu** | Mỗi học kỳ | Công ty, có mặt cán bộ nhà trường |
| Vá lỗi bảo mật hệ điều hành | Tự động hằng ngày | Máy tự làm |

### Khi máy hỏng

Đây là câu hỏi nhà trường nên hỏi trước khi mua, không phải sau khi hỏng.

| Tình huống | Mất gì | Phục hồi thế nào | Bao lâu |
|---|---|---|---|
| Mất điện | Không mất gì nếu có bộ lưu điện cấu hình đúng (Mục 17) | Máy tự bật lại khi điện về | Vài phút |
| Một ổ cứng hỏng | Không mất gì nếu ổ dữ liệu chạy cặp gương | Thay ổ, hệ thống tự dựng lại | Nửa ngày, không phải dừng |
| Máy hỏng nặng (nguồn, bảng mạch chính) | Không mất dữ liệu nếu có sao lưu | Cắm ổ dữ liệu sang máy khác, hoặc dựng lại từ bản sao lưu | Nửa ngày – 1 ngày |
| Cháy phòng máy | Mất tất cả **trừ** bản sao lưu ngoài trường | Dựng máy mới, nạp bản sao lưu tuần gần nhất | 1–2 ngày, mất dữ liệu của phần tuần đó |
| Mất máy **và** không có bản sao lưu ngoài trường | **Mất toàn bộ, không có đường lùi** | — | — |

**Đề xuất:** ổ dữ liệu chạy **cặp gương** (hai ổ ghi giống nhau, một ổ hỏng vẫn chạy) — chi
phí là một ổ SSD nữa, và nó biến sự cố ổ cứng từ "dừng hệ thống một ngày" thành "thay ổ lúc
rảnh". Nhưng phải nói rõ: **cặp gương không thay được sao lưu.** Nó chống ổ hỏng, không
chống xoá nhầm, không chống cháy, không chống mã độc mã hoá dữ liệu.

**Về người vận hành phía nhà trường**

| | Hướng | Chi phí | Chủ động của trường |
|---|---|---|---|
| **A** | Văn thư kiêm nhiệm, Công ty hỗ trợ từ xa | Thấp | Cao — khoá tài khoản trong 1 phút |
| **B** | Một cán bộ chuyên trách | Lương một người | Cao nhất |
| **C** | Công ty vận hành trọn gói | Phí dịch vụ hằng tháng | Thấp — mọi việc chờ Công ty |
| **D** | Không bố trí ai | 0 | Không — hệ thống hỏng dần |

**Đề xuất: A, và bố trí 2 người** (một chính, một dự phòng). Một người kiêm nhiệm nghỉ đẻ
hoặc chuyển công tác mà không có người thứ hai là kịch bản gặp thường xuyên nhất. Công ty
đào tạo 2 buổi và bàn giao tài liệu có ảnh chụp từng bước.

---

# PHẦN IV — CAMERA VÀ LỚP NHẬN DIỆN

## 22. Đường đi của hình ảnh và ai được xem

**Đang có.** Phần chặn quyền xem camera đã viết xong và có kiểm thử tự động:
`server/src/lib/cameraRegistry.js` (danh sách camera), `cameraTickets.js` (vé xem),
`accessLog.js` (nhật ký), `server/src/routes/cameras.js` (đường dẫn API).

**Đang thiếu.** Danh sách camera thật của trường (Mục 23), và quyết định của nhà trường về
thời hạn lưu hình (Mục 25).

**Chỗ đang ổn.** Bốn điểm, và cả bốn đều nằm ở tầng máy chủ chứ không nằm ở giao diện:

1. **Chỉ tài khoản Ban Giám hiệu xem được.** Web chỉ ẩn nút; ai gọi thẳng vào hệ thống bỏ
   qua màn hình thì máy chủ vẫn hỏi lại cơ sở dữ liệu "người này vai gì?" và từ chối nếu
   không phải quản trị.
2. **Mỗi lượt xem cần một vé riêng, hạn 2 phút.** Vé ghi rõ camera nào, người nào, hết hạn
   lúc nào, và được đóng dấu bằng chữ ký số. Sao chép đường link để xem lại sau không dùng
   được.
3. **Máy chủ không hề chạm vào hình ảnh.** Nó chỉ quyết định ai được xem và ghi lại. Hình
   đi đường riêng, từ bộ chuyển luồng tới trình duyệt.
4. **Mỗi lượt xem có một mã riêng ghi vào nhật ký.** Nên một dòng nhật ký ghi "người này
   xem sân trường lúc 14:02" là chỉ đúng người đó, không phải bất kỳ ai sau này tìm thấy
   đường link trong lịch sử trình duyệt.

Đường đi, ba tiến trình:

```
   Camera IP (rtsp://…)
        │  chỉ trong mạng LAN của trường
        ▼
   MediaMTX  ── hỏi ──▶  eduportal-server  ── hỏi ──▶  cơ sở dữ liệu
   (đổi luồng)          ("vé này còn hạn      ("người này vai gì?")
        │                 không?")
        │ WebRTC
        ▼
   Trình duyệt của Ban Giám hiệu
```

**Chỗ chưa ổn.** Trình duyệt **không phát được luồng RTSP của camera**, nên bắt buộc phải có
bộ chuyển luồng đứng giữa. Đây chính là lý do cần một máy chạy 24/7 trong trường (Mục 15) —
không phải vì phần mềm thích như vậy.

**Một chi tiết tiết kiệm đáng kể:** bộ chuyển luồng được đặt ở chế độ **chỉ kéo hình khi có
người đang xem**. Không ai mở tường camera thì không tốn băng thông và không làm ổ cứng
quay vòng vô ích.

---

## 23. Điều kiện bắt buộc: camera phải hỗ trợ chuẩn mở

**Đang có.** EduPortal đọc hình qua hai chuẩn mở — **ONVIF** hoặc **RTSP** — mà hầu hết
camera IP đều hỗ trợ.

**Đang thiếu.** Danh sách camera thật: số lượng, hãng, model, vị trí, độ phân giải, và số
kênh còn trống trên đầu ghi.

**Chỗ đang ổn.** Chọn chuẩn mở thay vì tích hợp riêng với từng hãng là quyết định đúng:
nhà trường **không bị khoá vào một nhà cung cấp**, và sau này thay camera hãng khác vẫn
chạy, không phải viết lại gì.

**Chỗ chưa ổn.** Đây là **điều kiện bắt buộc, không có đường vòng**. Camera chỉ xem được
bằng ứng dụng riêng của hãng (thường là loại giá rẻ bán kèm ứng dụng điện thoại) thì phần
mềm bên ngoài không đọc được hình. Không phải khó — là không thể. Phải thay camera, và đó
là khoản chi cần biết **trước** khi hứa với nhà trường về tính năng nhận diện.

Và không có danh sách thì **không lập được dự toán**: số kênh còn trống trên đầu ghi quyết
định có phải mua thêm đầu ghi không — khoản vài triệu tới vài chục triệu, phát hiện muộn
thì phải xin bổ sung kinh phí giữa chừng.

**Hướng giải quyết**

| | Tình huống | Cách xử lý | Chi phí |
|---|---|---|---|
| **A** | Camera đã hỗ trợ ONVIF/RTSP | Tích hợp ngay | 0 |
| **B** | Đầu ghi hỗ trợ nhưng camera thì không | Đọc hình **qua đầu ghi** thay vì qua từng camera | 0 |
| **C** | Không hỗ trợ, nhưng chỉ cần nhận diện ở cổng | Chỉ thay 2 camera cổng, giữ nguyên phần còn lại | Thấp |
| **D** | Không hỗ trợ, muốn nhận diện nhiều điểm | Thay toàn bộ | Cao |

**Đề xuất: kiểm tra ngay tuần này**, và nếu rơi vào C thì chọn C. Nhận diện chỉ cần ở cổng —
camera hành lang không cần hỗ trợ chuẩn mở.

### Cách tự kiểm tra trong 5 phút, không cần Công ty

Cách nhanh nhất để biết một camera có hỗ trợ RTSP hay không: thử mở luồng bằng **VLC** —
phần mềm xem video miễn phí.

1. Tìm địa chỉ IP của camera trong ứng dụng quản lý camera hiện tại (hoặc trên đầu ghi).
2. Mở VLC → Media → Open Network Stream.
3. Dán đường dẫn theo hãng:

| Hãng | Đường dẫn thử |
|---|---|
| Hikvision | `rtsp://admin:matkhau@192.168.1.64:554/Streaming/Channels/101` |
| Dahua / KBVision | `rtsp://admin:matkhau@192.168.1.64:554/cam/realmonitor?channel=1&subtype=0` |
| Nhiều hãng khác | `rtsp://admin:matkhau@192.168.1.64:554/live` |

4. **Thấy hình = camera dùng được.** Báo Công ty đúng đường dẫn đã chạy được, không cần
   thêm gì. Không thấy hình với cả ba đường dẫn thì gửi Công ty hãng và model để tra.

### Thông tin cần thu cho từng camera

Mẫu bảng để nhà trường điền — mỗi camera một dòng:

| Cột | Ví dụ | Vì sao cần |
|---|---|---|
| Tên vị trí | `Cổng chính` | Đặt tên trên tường camera |
| Hãng, model | `Hikvision DS-2CD2043G2` | Tra chuẩn hỗ trợ và đường dẫn luồng |
| Địa chỉ IP | `192.168.1.64` | Để máy chủ gọi tới |
| Độ phân giải | `4 MP` | Tính dung lượng ổ (Mục 25) và khả năng nhận diện |
| Đường truyền | `Cáp` / `Wifi` | Nút thắt ở Mục 18 |
| Cao độ, hướng | `Treo 3 m, chếch xuống` | Quyết định có nhận diện được không (Mục 24) |
| Nối vào đầu ghi nào, kênh số | `NVR-1, kênh 4` | Đọc qua đầu ghi khi cần |
| Có ghi hình liên tục không | `Có, 24/7` | Tính dung lượng |

**Cách lấy nhanh nhất:** tìm hợp đồng hoặc biên bản nghiệm thu hệ thống camera — thường có
đủ hãng, model và vị trí. 15 phút tìm hồ sơ tiết kiệm một buổi khảo sát. Không tìm được thì
Công ty khảo sát tại chỗ, cần người mở phòng kỹ thuật.

---

## 24. Camera giám sát và camera nhận diện là hai loại thiết bị khác nhau

Đây là hiểu nhầm phổ biến nhất về camera nhận diện, và nó tốn tiền theo cả hai hướng — mua
thừa hoặc mua sai.

| | Camera giám sát hành lang | Camera nhận diện khuôn mặt | Camera đọc biển số |
|---|---|---|---|
| Vị trí | Treo cao, nhìn chếch xuống | **Ngang tầm mặt**, cách 2–4 m | Hướng thẳng làn xe |
| Góc so với hướng đi | Bất kỳ | Lệch không quá 15–30° | Gần như chính diện |
| Yêu cầu ánh sáng | Thấp | Đều, **không ngược sáng** | Chống loá đèn xe |
| Tốc độ màn trập | Thường | Thường | **Cao** (xe đang chạy) |
| Độ phân giải cần | 2 MP là đủ | 2–4 MP, nhưng quan trọng là khuôn mặt chiếm đủ khung | 2–4 MP + màn trập nhanh |
| Nếu dùng sai loại | — | **Thấy có người nhưng không biết là ai** | Biển số nhoè |

Camera treo cao nhìn chếch xuống thì khuôn mặt bị méo phối cảnh và thiếu sáng — thấy được
có người đi qua, nhưng không nhận ra là ai. Đây không phải vấn đề của phần mềm nhận diện;
đó là vấn đề của hình đưa vào.

**Ba yếu tố hay bị bỏ qua khi lắp camera nhận diện ở cổng:**

1. **Ngược sáng buổi chiều.** Camera hướng ra cổng, mặt trời chiều chiếu thẳng vào ống kính
   thì mọi khuôn mặt thành bóng đen. Cần camera có khả năng cân bằng vùng sáng–tối mạnh, và
   cần chọn hướng đặt tính tới đường đi của mặt trời.
2. **Đèn hồng ngoại ban đêm làm mất đặc trưng khuôn mặt.** Hình đêm bằng hồng ngoại là ảnh
   đen trắng, nhận diện kém hơn hẳn ban ngày. Nếu trường chỉ cần nhận diện giờ đến và tan
   học thì việc này không thành vấn đề — nhưng phải nói trước, đừng để kỳ vọng nhận diện
   chính xác lúc 20h.
3. **Cao độ.** Camera nhận diện nên đặt cao 1,5–2 m, tức thấp hơn nhiều so với camera giám
   sát. Điều này kéo theo một việc thực tế: **camera ở tầm đó thì với tay tới được**, nên
   cần hộp bảo vệ.

**Hướng giải quyết**

| | Hướng | Chi phí | Kết quả |
|---|---|---|---|
| **A** | Lắp thêm 2 camera chuyên dụng ở cổng (1 khuôn mặt, 1 biển số), kéo cáp mạng cho cả hai | Thấp | Nhận diện chạy đúng |
| **B** | Dùng camera hiện có, chấp nhận tỉ lệ nhận đúng thấp | 0 | Nhận sai nhiều, giáo viên sửa tay liên tục — mất nhiều thời gian hơn là không dùng |
| **C** | Nâng cấp toàn bộ camera lên loại có nhận diện | Cao | Thừa — hành lang không cần nhận diện |

**Đề xuất: A.** Nhận diện chỉ diễn ra ở cổng, nên chỉ cần đúng 2 camera đúng loại đặt đúng
chỗ, và đúng 2 điểm cần kéo cáp.

---

## 25. Dung lượng ổ cứng và thời hạn lưu hình thật

**Đang có.** Về phía EduPortal: thời hạn lưu của phần dữ liệu nó nắm giữ (nhật ký xem, sự
kiện nhận diện) đặt được theo cấu hình, không phải sửa mã nguồn.

**Đang thiếu.** Hai con số của nhà trường: muốn lưu hình bao nhiêu ngày, và đầu ghi hiện có
**thực sự** giữ được bao nhiêu ngày.

**Chỗ đang ổn.** Đây là quyết định đặt được bằng cấu hình, đổi được về sau, không khoá cứng.

**Chỗ chưa ổn.** Ba việc, và việc thứ nhất là chỗ mà chính sách của nhà trường dễ thành
chính sách trên giấy:

1. **Đầu ghi tự xoá theo vòng, thường 7–15 ngày với ổ mặc định.** Nếu nhà trường quyết
   "lưu 30 ngày" mà đầu ghi chỉ giữ được 10 ngày thì chính sách đó **không có thật** —
   không phải vì ai làm sai, mà vì ổ đầy thì nó ghi đè lên hình cũ nhất. Phải hoặc nâng ổ,
   hoặc hạ thời hạn cho khớp.
2. **Lưu càng lâu, càng nhiều người xem được thì trách nhiệm của nhà trường càng lớn.** Mỗi
   ngày lưu thêm là một ngày dữ liệu có thể rò rỉ; mỗi người được cấp quyền là một cửa nữa.
   Nhưng lưu quá ngắn thì sự việc xảy ra tuần trước đã không còn hình để tra. Không có đáp
   án tuyệt đối — đây là đánh đổi nhà trường phải chọn.
3. **Không giữ tài khoản quản trị đầu ghi thì nhà trường không đổi được gì.** Không đổi được
   thời hạn lưu, không cấp được quyền cho EduPortal đọc luồng, và không biết ai đang xem
   camera trường mình.

### Cách tính dung lượng — công thức và bảng tra

Công thức đủ dùng: **mỗi 1 Mbps ghi liên tục tốn khoảng 10,8 GB mỗi ngày.**

Một camera ghi ở chuẩn nén H.265 thường dùng 2 Mbps (2 MP) đến 4 Mbps (4 MP), tức **21,6
GB** đến **43,2 GB** mỗi ngày cho một camera.

| Số camera | Chất lượng | Mỗi ngày | 7 ngày | 30 ngày | 90 ngày |
|---|---|---|---|---|---|
| 4 | 2 Mbps | 86 GB | 0,6 TB | 2,6 TB | 7,8 TB |
| 8 | 2 Mbps | 173 GB | 1,2 TB | 5,2 TB | 15,6 TB |
| 8 | 4 Mbps | 346 GB | 2,4 TB | 10,4 TB | 31,1 TB |
| 16 | 2 Mbps | 346 GB | 2,4 TB | 10,4 TB | 31,1 TB |
| 16 | 4 Mbps | 691 GB | 4,8 TB | 20,7 TB | 62,2 TB |

**Hai cách giảm dung lượng mà không giảm nhiều giá trị sử dụng:**

- **Chỉ ghi khi có chuyển động** — giảm 40–70% với hành lang và phòng học ban đêm. Đổi lại:
  một số cảnh chuyển động nhẹ có thể bị bỏ, và một vài giây đầu mỗi lần ghi bị mất.
- **Ghi luồng phụ chất lượng thấp cho các camera ít quan trọng** — hầu hết camera IP phát
  song song hai luồng, luồng phụ nhẹ hơn nhiều. Camera cổng thì giữ luồng chính.

**Hướng giải quyết**

| | Thời hạn lưu | Ổ cần (8 camera 2 Mbps) | Tra được sự việc |
|---|---|---|---|
| **A** | 7 ngày | 2 TB | Chỉ trong tuần |
| **B** | **30 ngày** | 6 TB | Gần như mọi khiếu nại thực tế |
| **C** | 90 ngày | 16 TB | Cả học kỳ |
| **D** | 180 ngày trở lên | 32 TB trở lên | Hiếm khi cần tới |

**Đề xuất: B (30 ngày)**, kèm ba việc:

1. **Kiểm tra đầu ghi hiện có giữ được bao nhiêu ngày thật** — mở đầu ghi, xem đoạn ghi cũ
   nhất còn lại là ngày nào. Con số đó là sự thật, không phải con số trên cấu hình.
2. Nếu thiếu thì nâng ổ đầu ghi cho khớp, hoặc hạ thời hạn xuống mức đầu ghi làm được.
3. Ổ ghi hình dùng **loại ổ chuyên cho ghi liên tục**, không dùng ổ máy tính thường — ổ
   thường không thiết kế để ghi 24/7 và hỏng nhanh hơn nhiều.

---

## 26. Hai cái bẫy làm tường camera "khung đen, không báo lỗi"

Mục này ngắn nhưng đáng đọc, vì đây là hai lỗi Công ty đã gặp và đã ghi vào tài liệu kỹ
thuật để không lặp lại. Cả hai đều **không hiện thông báo lỗi nào** — chỉ là một khung đen,
nên rất khó đoán nguyên nhân.

**Bẫy 1 — địa chỉ luồng camera phải là địa chỉ trình duyệt gọi được.**
Máy chủ không tự lấy hình rồi chuyển tiếp; nó trả một địa chỉ cho **trình duyệt**, và trình
duyệt tự gọi tới đó. Nên nếu địa chỉ đó là địa chỉ nội bộ kiểu `192.168.1.10`, thì:

- Trong trường: chạy được.
- Hiệu trưởng mở từ nhà: **khung đen**, vì địa chỉ nội bộ không gọi được từ ngoài.
- Và nếu trang chạy HTTPS mà địa chỉ kia là HTTP thì trình duyệt chặn thẳng, cũng khung đen.

Cách đúng: đặt bộ chuyển luồng sau cửa chung (nginx) và dùng địa chỉ HTTPS công khai.

**Bẫy 2 — sau lớp chia sẻ địa chỉ, bộ chuyển luồng khai sai địa chỉ của chính nó.**
Bộ chuyển luồng chỉ biết địa chỉ nội bộ của mình và gửi đúng địa chỉ đó cho trình duyệt ở
ngoài Internet. Kết quả: hình **không bao giờ hiện**, và cũng không có lỗi nào. Cách xử lý
là khai thêm địa chỉ công khai của trường vào cấu hình — một dòng, nhưng phải biết mà làm.

> **Nghĩa là gì với nhà trường:** khi kiểm tra nghiệm thu tường camera, phải thử **từ hai
> nơi**: một máy trong trường, và một điện thoại dùng mạng 4G ngoài trường. Chạy được trong
> trường không có nghĩa là chạy được ở nhà.

Ngoài ra, bộ chuyển luồng bật sẵn vài giao thức không dùng tới. Công ty **tắt hẳn** chúng
lúc dựng, không chỉ chặn ở tường lửa — thứ bị tắt thì không thể cấu hình sai trở lại.

---

## 27. Bảo mật camera: bốn việc và một cuốn nhật ký

**Đang có.** Nhật ký xem camera ghi mỗi lượt một dòng, kèm thời điểm, người xem, camera
nào, địa chỉ gọi tới, và kết quả **cho vào** hay **từ chối** (có ghi lý do từ chối).

**Đang thiếu.** Người được phân công đọc cuốn nhật ký đó mỗi tháng.

**Chỗ đang ổn.** Việc ghi nhật ký ai xem camera nào lúc nào là thứ nhiều hệ thống camera
không có. Nó biến câu hỏi "có ai xem trộm không" từ phỏng đoán thành tra cứu. Với EduPortal,
câu "ai đã xem camera lớp con tôi" trả lời được bằng một bản in, không phải bằng trí nhớ.

**Chỗ chưa ổn.** Bốn việc phải làm mà phần mềm không làm thay được:

| # | Việc | Vì sao | Ai làm |
|---|---|---|---|
| 1 | **Lấy lại tài khoản quản trị hệ thống camera** từ đơn vị lắp đặt, rồi đổi mật khẩu; cấp cho đơn vị bảo trì một tài khoản chỉ xem | Nhà trường phải giữ quyền với hệ thống camera của chính mình | Nhà trường, bằng công văn đề nghị bàn giao |
| 2 | **Đổi mật khẩu mặc định từng camera** | `admin/12345` vẫn là mật khẩu phổ biến nhất trên camera đang chạy thật | Công ty hoặc đơn vị bảo trì |
| 3 | **Đặt camera ở mạng riêng, không ra Internet** (Mục 18) | Camera bị chiếm mà chung mạng là kẻ tấn công đứng cạnh cơ sở dữ liệu | Công ty + đơn vị mạng |
| 4 | **Không cấp quyền xoá nhật ký cho tài khoản dùng hằng ngày** | Cuốn nhật ký chỉ có giá trị nếu người bị ghi vào đó không xoá được nó | Công ty đặt lúc dựng |

Thêm hai điểm về tệp cấu hình: tệp khai danh sách camera **chứa mật khẩu từng camera ở dạng
đọc được**, nên nó được đặt quyền chỉ tài khoản dịch vụ mở được, và hai tiến trình camera
**không chạy bằng quyền cao nhất của máy**. Đây là mặc định lúc dựng, nhà trường không phải
làm gì — nêu ra để nhà trường biết mà hỏi lại nếu sau này có ai dựng lại máy.

### Cuốn nhật ký ghi những gì

| Ghi lại | Ví dụ |
|---|---|
| Cho vào xem | ai, camera nào, lúc nào, từ địa chỉ nào |
| Bị từ chối | ai, vì lý do gì — chưa đăng nhập, hay đăng nhập rồi nhưng **không phải Ban Giám hiệu** |
| Mã riêng của từng lượt xem | để một luồng đang phát truy được về đúng lượt yêu cầu đã mở nó |

Cuốn này ghi thêm mãi nên phải **tự cắt và nén định kỳ** — Công ty đặt lúc dựng. Bỏ bước
này thì có ngày nó ăn hết ổ, và ổ đầy thì **cơ sở dữ liệu cả trường dừng ghi**. Nó cũng
cần được sao lưu như mọi dữ liệu khác.

### Lớp nhận diện gắn vào thế nào

Phần nhận diện được thiết kế để gắn thêm mà **không sửa gì bên trong EduPortal**:

- Bên phân tích (model chạy trên card đồ hoạ của máy, hoặc hộp nhận diện của hãng) đọc
  luồng **từ bộ chuyển luồng**, không đọc thẳng từ camera. Nghĩa là camera chỉ phải phục vụ
  một nơi, và mật khẩu camera không phải chia cho thêm phần mềm nào.
- Thấy gì thì gửi một thông báo về máy chủ, kèm ba mức: **thông tin** / **cảnh báo** /
  **báo động** — quyết định màu hiển thị trên tường camera.
- Thông báo về camera **không có trong danh sách khai báo** bị từ chối, để một model cấu
  hình sai không bắn cảnh báo ma.
- Tường camera tự hỏi lại mỗi 15 giây, nên không cần sửa gì bên giao diện khi thêm nhận
  diện.

**Một quyết định có chủ ý cần nhà trường biết:** các thông báo nhận diện **chỉ giữ trong bộ
nhớ, 200 sự kiện gần nhất, và mất khi khởi động lại máy**. Đây là *thông báo*, không phải hồ
sơ. Thứ cần lưu lâu (đoạn ghi hình, biên bản) thuộc về đầu ghi và về hồ sơ giấy của nhà
trường. Lưu lại toàn bộ nhật ký hành vi của từng học sinh cả ngày là thứ nhà trường không
yêu cầu, và giữ nó là nhận thêm một trách nhiệm không cần thiết.

---

## 28. Ảnh chân dung học sinh: yêu cầu kỹ thuật

Phần này chỉ nói mặt kỹ thuật — chất lượng ảnh thế nào thì máy nhận đúng. Phần thủ tục xin
ý kiến gia đình thuộc tài liệu khác, và **Công ty chưa nhận bất kỳ tệp ảnh nào cho tới khi
phần đó xong.**

**Yêu cầu tối thiểu:** JPEG, từ 640×640 trở lên, khuôn mặt chiếm ≥ 60% khung, chụp thẳng,
không kính râm, không khẩu trang.

| Nguồn ảnh | Dùng được không | Vì sao |
|---|---|---|
| Ảnh làm thẻ học sinh (tệp gốc) | Được | Chụp thẳng, đủ sáng, đủ độ phân giải |
| Ảnh hồ sơ dạng tệp | Thường được | Cần kiểm tra kích thước |
| Ảnh dán trên hồ sơ giấy, scan lại | Thường không | Quá nhỏ, bị lem, mất chi tiết |
| Ảnh chụp lại bằng điện thoại từ hồ sơ giấy | Không | Méo, loá, nghiêng |

**Chỗ đang ổn.** Toàn bộ việc xử lý ảnh chạy trên máy chủ tại trường — ảnh không gửi đi
đâu, và **ảnh gốc được xoá sau khi tạo xong đặc trưng**. Kể cả máy chủ bị xâm nhập thì thứ
lấy được là dãy số, không phải kho ảnh chân dung học sinh.

**Hướng giải quyết**

| | Hướng | Công sức | Chất lượng |
|---|---|---|---|
| **A** | Dùng ảnh làm thẻ học sinh có sẵn (tệp gốc) | Thấp | Cao |
| **B** | Chụp lại tập trung theo lớp, 1 buổi | 1 buổi cho toàn trường | Cao nhất, đồng đều |
| **C** | Dùng ảnh scan từ hồ sơ giấy | Thấp | Thấp — nhận sai nhiều |
| **D** | Học sinh tự nộp ảnh qua ứng dụng | Rất thấp cho trường | Không đồng đều |

**Đề xuất: A nếu có tệp gốc, B nếu không.** Cách B tốn một buổi nhưng cho chất lượng đồng
đều nhất, và một buổi đó tiết kiệm hàng tháng sửa tay do nhận sai.

---

# PHẦN V — BỐN LỖI KỸ THUẬT TRÊN WEBSITE HIỆN TẠI

Không liên quan tới nội dung hợp tác, nhưng Công ty ghi nhận được trong quá trình tìm hiểu
và xin gửi nhà trường tham khảo. **Công ty sẵn sàng hướng dẫn cụ thể cho đơn vị quản trị
website, không tính phí.** Cả bốn mục dưới đây đã kiểm tra lại ngày 06/08/2026 và vẫn còn.

## 29. Lỗi 1 — Tệp sơ đồ trang trỏ sang website khác

**Đang có.** Website có tệp `sitemap.xml` — tệp báo cho công cụ tìm kiếm biết trang nào cần
lập chỉ mục.

**Đang thiếu.** Nội dung đúng. **Toàn bộ 42 đường dẫn** trong
`c3phucthinh.edu.vn/sitemap.xml` trỏ tới `annamaudio.com` — một trang bán thiết bị âm
thanh, không phải của nhà trường. Tệp được tạo bằng một công cụ sinh sơ đồ trang miễn phí
và chưa cập nhật từ tháng 11/2022.

**Chỗ chưa ổn.** Đây nghiêm trọng hơn một lỗi tối ưu tìm kiếm. Sơ đồ trang trỏ sang một
website thương mại là mẫu điển hình của website bị chèn nội dung trái phép: kẻ tấn công
chiếm được quyền ghi tệp trên hosting, cấy sơ đồ trỏ sang trang của họ để mượn uy tín tên
miền `.edu.vn` — vốn được công cụ tìm kiếm đánh giá cao. Ba hệ quả:

1. Công cụ tìm kiếm không lập được chỉ mục cho trang của trường → phụ huynh tìm "THPT Phúc
   Thịnh" không ra website chính thức.
2. Uy tín tên miền `.edu.vn` của trường đang bị dùng cho mục đích thương mại của người khác.
3. Nếu thực sự bị chiếm quyền ghi tệp, kẻ tấn công làm được nhiều hơn là sửa một tệp.

**Hướng giải quyết**

| | Hướng | Đủ chưa |
|---|---|---|
| **A** | Chỉ xoá và tạo lại tệp sơ đồ | Không — tuần sau nó lại xuất hiện |
| **B** | Đổi mật khẩu + rà tệp lạ + tạo lại sơ đồ + rà nhật ký truy cập | Đủ |
| **C** | Bỏ qua | Uy tín tên miền tiếp tục bị lợi dụng |

**Đề xuất: B, theo đúng thứ tự này** — thứ tự quan trọng hơn từng việc:

| # | Việc | Thời gian |
|---|---|---|
| 1 | Rà toàn bộ tệp lạ trong thư mục gốc website | ~nửa buổi |
| 2 | Đổi toàn bộ mật khẩu hosting, FTP, quản trị | ~30 phút |
| 3 | Xoá và tạo lại `sitemap.xml` đúng | ~15 phút |
| 4 | Gửi lại sơ đồ mới cho Google Search Console | ~10 phút |
| 5 | Rà nhật ký truy cập tìm dấu vết xâm nhập | ~1 buổi |

Bước 1 và 2 quan trọng hơn bước 3. Xoá tệp mà không đổi mật khẩu thì tuần sau nó lại xuất hiện.

## 30. Lỗi 2 — Một đoạn mã khuôn mẫu bị in thô ra trang

**Đang có.** Trang có các thẻ khai báo thông tin cho mạng xã hội.

**Đang thiếu.** Một thẻ trong số đó chưa được dịch. Trang chủ hiện có:

```html
<meta name="twitter:site" content="{{ url() - > current() }}" />
```

Nguyên nhân: dấu mũi tên `->` bị chèn hai dấu cách thành `- >`, nên Blade không nhận ra đó
là mã cần chạy và in thẳng ra ngoài.

**Chỗ chưa ổn.** Hai điều. Thứ nhất, thẻ này mất tác dụng — khi ai đó chia sẻ trang của
trường lên mạng xã hội, thông tin hiển thị bị thiếu. Thứ hai, và quan trọng hơn: nó cho
biết trang chủ hiện tại **chưa được kiểm tra lại sau lần sửa gần nhất**. Một lỗi in thô mã
ra ngoài là loại lỗi nhìn nguồn trang là thấy.

**Đề xuất:** sửa thành `{{ url()->current() }}`, hoặc bỏ hẳn thẻ đó nếu không dùng. Một
dòng, 2 phút.

## 31. Lỗi 3 — Khai báo sai ngôn ngữ trang

**Đang có.** Các trang có khai báo ngôn ngữ, và phần đầu phản hồi khai đúng là tiếng Việt.

**Đang thiếu.** Khai báo trong mã trang thì ngược lại: `<html lang="en">` — khai là tiếng
Anh trong khi nội dung là tiếng Việt.

**Chỗ chưa ổn.** Hai hệ quả, và cái thứ hai ít người nghĩ tới:

1. Công cụ tìm kiếm xếp nhầm trang vào kết quả tiếng Anh → giảm khả năng phụ huynh tìm thấy.
2. Phần mềm đọc màn hình cho người khiếm thị sẽ đọc tiếng Việt bằng giọng tiếng Anh — kết
   quả là không hiểu được gì. Một phụ huynh khiếm thị không đọc được website của trường con
   mình.

**Đề xuất:** đổi `lang="en"` thành `lang="vi"` trong tệp giao diện chính. Một dòng, 2 phút —
đây là sửa chữa rẻ nhất trong toàn bộ tài liệu này và có tác động thật với người dùng.

## 32. Lỗi 4 — Nền hệ thống đã hết hạn hỗ trợ

**Đang có.** Website chạy trên Apache 2.4.29 / Ubuntu — theo phần đầu phản hồi của máy chủ.

**Đang thiếu.** Bản cập nhật. Apache 2.4.29 là bản đi kèm Ubuntu 18.04, đã hết thời hạn hỗ
trợ miễn phí từ tháng 4/2023.

**Chỗ chưa ổn.** Không có nghĩa website sẽ sập, nhưng có nghĩa các bản vá bảo mật của hệ
điều hành không còn về tự động. Cộng với dấu hiệu ở Mục 29, đây là hai dữ kiện độc lập cùng
chỉ về một việc: **nền của website hiện tại cần được rà lại**, và trong lúc chưa rà thì
không nên đặt sổ điểm chung chỗ với nó.

**Hướng giải quyết**

| | Hướng | Công sức | Khi nào nên |
|---|---|---|---|
| **A** | Nâng hệ điều hành máy chủ website lên bản còn hỗ trợ | 1 ngày của đơn vị quản trị | Nên làm, không phụ thuộc EduPortal |
| **B** | Giữ nguyên, chỉ tách EduPortal ra máy riêng | 0 | Đây là điều tài liệu này đã đề xuất ở Mục 3 |
| **C** | Đưa website về chạy chung máy chủ EduPortal tại trường | Nửa ngày | Nếu nhà trường muốn gom một mối và đã lấy lại được mã nguồn |

**Đề xuất: B trước** (EduPortal không chờ việc này), **A khi đơn vị quản trị website có thể
xếp lịch**. Hướng C chỉ nên xét sau khi Mục 29 đã xử lý xong — đưa một website đang có dấu
hiệu bị chèn tệp về chung máy với cơ sở dữ liệu học sinh là đi ngược lại toàn bộ Mục 2.

---

# PHẦN VI — VIỆC CẦN NHÀ TRƯỜNG XÁC NHẬN

## 33. Mười câu cần câu trả lời để bắt đầu

| # | Câu hỏi | Ai trả lời | Chặn việc gì nếu chưa có |
|---|---|---|---|
| 1 | Chọn tên miền con `portal.c3phucthinh.edu.vn`? (Mục 3) | Ban Giám hiệu | Chặn toàn bộ: chưa có địa chỉ thì chưa cài được chứng chỉ bảo mật |
| 2 | Đơn vị nào đang quản trị website, hợp đồng đến bao giờ, nhà trường có giữ mã nguồn không? (Mục 1) | Ban Giám hiệu | Chặn đăng nhập một lần |
| 3 | Có làm đăng nhập một lần không, hay bắt đầu bằng phương án nhẹ? (Mục 4) | Ban Giám hiệu | Không chặn — có phương án dự phòng |
| 4 | Ai giữ chuỗi bí mật, và ai giữ phong bì năm chuỗi ở Mục 20? (Mục 5) | Ban Giám hiệu | Chặn bước bật đăng nhập một lần |
| 5 | vnEdu có nút xuất Excel danh sách học sinh không? (Mục 8) | Văn thư | Quyết định dự án mất một buổi hay ba tuần |
| 6 | **Đường truyền của trường có gọi vào được từ Internet không, và có IP tĩnh không?** (Mục 19) | Đơn vị quản lý mạng / nhà mạng | Chặn việc công bố ra Internet — phải biết trước khi dựng |
| 7 | Đặt máy chủ ở phòng nào, có ổ điện riêng và bộ lưu điện chưa? (Mục 17) | Ban Giám hiệu | Chặn ngày dựng máy |
| 8 | Camera hiện có hỗ trợ ONVIF/RTSP không, đầu ghi còn kênh trống không? (Mục 23) | Đơn vị lắp đặt / hồ sơ nghiệm thu | Chặn tính năng nhận diện, và ảnh hưởng dự toán |
| 9 | Muốn lưu hình camera bao nhiêu ngày, và đầu ghi hiện giữ được bao nhiêu ngày thật? (Mục 25) | Ban Giám hiệu + kiểm tra thực tế | Ảnh hưởng chi phí ổ cứng |
| 10 | Ai là người vận hành hằng ngày phía nhà trường (1 chính, 1 dự phòng)? (Mục 21) | Ban Giám hiệu | Không chặn khởi động, nhưng chặn việc bàn giao |

## 34. Dữ liệu và tài liệu nhà trường cần gửi

Xếp theo thứ tự cần trước:

- [ ] Xác nhận tên miền con muốn dùng (Mục 3)
- [ ] Tên đầy đủ của trường + bộ sách giáo khoa đang dùng (Sheet 1)
- [ ] Danh sách lớp năm học này + giáo viên chủ nhiệm mỗi lớp (Sheet 2)
- [ ] Danh sách giáo viên: mã, họ tên, email trường, vai (Sheet 3) — **mã giáo viên phải
      trùng với mã trong cơ sở dữ liệu website**
- [ ] Danh sách học sinh: mã, họ tên, ngày sinh, lớp (Sheet 4) — hoặc bản xuất từ vnEdu
- [ ] Phân công giảng dạy: giáo viên × lớp × môn (Sheet 5)
- [ ] Danh sách phụ huynh + số điện thoại, nếu bật tra cứu cho phụ huynh (Sheet 6)
- [ ] Danh mục khoản thu + số tiền + hạn nộp, nếu bật học phí (Sheet 7)
- [ ] **Bảng khảo sát camera** theo mẫu ở Mục 23: hãng, model, IP, độ phân giải, đường
      truyền, cao độ, đầu ghi và kênh
- [ ] Hợp đồng hoặc biên bản nghiệm thu hệ thống camera (nếu tìm được — tiết kiệm một buổi
      khảo sát)
- [ ] Thông tin đường truyền Internet: nhà mạng, gói, có IP tĩnh không (Mục 19)
- [ ] Bốn con số để chốt cấu hình: tổng học sinh, tổng giáo viên, tổng lớp, dự kiến sĩ số
      3 năm tới

## 35. Trình tự triển khai đề xuất

| Tuần | Việc | Bên nào |
|---|---|---|
| **1** | Chốt tên miền con, thêm 3 bản ghi DNS, cài chứng chỉ bảo mật | Nhà trường + Công ty |
| **1** | **Kiểm tra đường truyền có gọi vào được từ Internet** (Mục 19) — làm trước mọi việc khác | Công ty + đơn vị mạng |
| **1** | Kiểm tra vnEdu có nút xuất Excel; thử luồng camera bằng VLC (Mục 23) | Nhà trường |
| **2** | Dựng máy chủ: chỗ đặt, bộ lưu điện, cắm cáp, chia mạng riêng cho camera | Công ty + đơn vị mạng |
| **2** | Gửi tệp dữ liệu theo mẫu; Công ty chạy kiểm tra khô và trả báo cáo lỗi | Hai bên |
| **2** | Đơn vị quản trị website thêm đường dẫn sinh vé đăng nhập | Đơn vị quản trị website |
| **3** | Nạp dữ liệu thật, đối chiếu số lượng, ký biên bản | Hai bên |
| **3** | Gắn mã giáo viên cho các tài khoản tạo tay trước đây, rồi bật đăng nhập một lần | Công ty |
| **3** | Nối camera, **thử tường camera từ trong trường và từ mạng 4G ngoài trường** (Mục 26) | Công ty |
| **4** | Đào tạo 2 buổi cho người vận hành; giao phong bì năm chuỗi bí mật | Công ty |
| **4** | **Chạy thử khôi phục sao lưu trước mặt cán bộ nhà trường** | Công ty |
| **4** | Bắt đầu dùng thật với một nghiệp vụ trước — đề xuất điểm danh | Nhà trường |

---

*Tài liệu do Công ty soạn để trao đổi với Trường THPT Phúc Thịnh. Mọi hướng nêu trên là đề
xuất — nhà trường có toàn quyền chọn khác, và Công ty triển khai theo lựa chọn của nhà
trường. Các dữ kiện về website nhà trường ở Mục 1 và Phần V được kiểm tra ngày 06/08/2026
bằng cách truy cập công khai, không thử mật khẩu và không dò quyền. Các con số về máy chủ,
mạng và camera lấy từ tài liệu kỹ thuật của hệ thống: `server/SELF-HOST.md`,
`server/FIREWALL.md`, `server/CAMERA.md`.*
