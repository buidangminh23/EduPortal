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
| Giao diện | **Blade** (bộ khuôn mẫu của Laravel) | Một thẻ `<meta>` trong trang chủ còn in thô mã khuôn mẫu chưa dịch — xem Mục 20 |
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
mật của hệ điều hành không còn về tự động nữa. Cộng với dấu hiệu ở Mục 20 (tệp sơ đồ trang
bị thay nội dung), Công ty đánh giá **không nên đặt sổ điểm và học phí chung một máy chủ
với website hiện tại**. Đây là lý do kỹ thuật quan trọng nhất dẫn tới Mục 2 và Mục 3.

**Cách nhà trường tự xác nhận lại các con số trên.** Không cần biết lập trình:

1. Mở website, bấm chuột phải chọn "Xem nguồn trang" (View Page Source).
2. Nhấn `Ctrl+F`, tìm chữ `lang=` — sẽ thấy `lang="en"` (Mục 21).
3. Tìm chữ `url()` — sẽ thấy đoạn mã khuôn mẫu in thô ra ngoài (Mục 20).
4. Mở `c3phucthinh.edu.vn/sitemap.xml` — sẽ thấy các địa chỉ không thuộc nhà trường (Mục 19).

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
sổ điểm cũng không vào được. Website bị chèn nội dung trái phép (Mục 19 cho thấy khả năng
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
Internet rồi quay lại, thay vì chỉ chạy trong mạng nhà trường.

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

**Việc cụ thể nếu chọn A** — tổng khoảng 30 phút, do bên quản trị tên miền làm:

| # | Việc | Ai làm | Thời gian |
|---|---|---|---|
| 1 | Thêm 1 bản ghi DNS: `portal` → địa chỉ máy chủ EduPortal (hoặc trỏ qua đường hầm Cloudflare, xem Mục 15) | Đơn vị giữ tên miền | 5 phút |
| 2 | Chờ bản ghi lan ra Internet | — | 5 phút – 2 giờ |
| 3 | Cài chứng chỉ bảo mật (HTTPS) tự động, tự gia hạn | Công ty | 10 phút |
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
| 11 | **Ảnh chân dung học sinh** | Nhận diện ở cổng (nếu triển khai) | Xem Mục 18 |

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

## 14. Sao lưu và giữ được dữ liệu

**Đang có.** Hai kịch bản đã viết sẵn: `server/scripts/backup-db.sh` (sao lưu) và
`restore-check.sh` (**thử khôi phục**). Lịch đề xuất: sao lưu hằng ngày 23:00 giữ 30 ngày;
hằng tuần ra ổ cứng rời giữ 12 tháng.

**Đang thiếu.** Một ổ cứng rời, và một người được phân công cắm nó vào mỗi tuần.

**Chỗ đang ổn.** Việc có sẵn kịch bản **thử khôi phục** — không chỉ kịch bản sao lưu — là
điểm quan trọng. Nhiều hệ thống chỉ có nửa đầu.

**Chỗ chưa ổn.** Một bản sao lưu chưa từng được khôi phục thử thì mới chỉ là một tệp tin,
chưa chắc dùng được lúc cần. Ba trường hợp thường gặp: tệp sao lưu hỏng từ tháng thứ ba mà
không ai biết; sao lưu chạy nhưng bỏ sót một bảng; sao lưu nằm cùng ổ cứng với dữ liệu gốc
nên ổ hỏng là mất cả hai.

**Hướng giải quyết**

| | Hướng | Chi phí | Mức bảo vệ |
|---|---|---|---|
| **A** | Hằng ngày trên máy + ổ rời hằng tuần + thử khôi phục hằng tháng | Một ổ cứng rời | Cao |
| **B** | Chỉ sao lưu hằng ngày cùng máy | 0 | Thấp — ổ hỏng là mất hết |
| **C** | Thêm một bản ở toà nhà khác | Một ổ nữa | Cao nhất — chống cả cháy nổ |

**Đề xuất: A, hướng tới C.** Trong buổi bàn giao, Công ty sẽ **chạy thử khôi phục trước
mặt cán bộ nhà trường**, để nhà trường tận mắt thấy nó hoạt động chứ không phải nghe cam kết.

---

# PHẦN III — MÁY CHỦ, MẠNG VÀ CAMERA

## 15. Máy chủ đặt ở đâu và công bố ra Internet bằng cách nào

**Đang có.** Cấu hình máy chủ đã khảo sát: Ryzen 9 9950X 16 nhân / 64 GB RAM /
RTX PRO 2000 16 GB — 117.280.000 đ, trả một lần, không có phí thuê hằng tháng. Một máy này
chạy đồng thời cả ba phần: cơ sở dữ liệu, máy chủ ứng dụng, và bộ chuyển luồng camera.

**Đang thiếu.** Chỗ đặt máy, đường điện, và cách công bố ra Internet.

**Chỗ đang ổn.** Đặt máy tại trường loại bỏ toàn bộ nhóm rủi ro dữ liệu học sinh đi ra
ngoài, và luồng camera chỉ chạy trong mạng nội bộ — không tốn băng thông Internet. Cấu hình
16 nhân / 64 GB là dư cho một trường: cơ sở dữ liệu ghi 1000 bài thi nộp cùng lúc trong
dưới một giây.

**Chỗ chưa ổn.** Ba việc vật lý mà phần mềm không giải quyết được:

1. **Điện.** Mất điện đột ngột trong lúc cơ sở dữ liệu đang ghi là cách phổ biến nhất làm
   hỏng dữ liệu. Cần một bộ lưu điện đủ để máy tự tắt an toàn.
2. **Chỗ đặt.** Máy chạy 24/7 cần thoáng và tương đối mát. Đặt trong tủ kín không quạt là
   cách rút ngắn tuổi thọ ổ cứng.
3. **Đường ra Internet.** Nhà trường thường có IP động và không nên mở cổng trực tiếp ra
   Internet.

**Hướng giải quyết cho việc công bố ra Internet**

| | Hướng | Được | Mất |
|---|---|---|---|
| **A** | Đường hầm Cloudflare — máy chủ tự mở kết nối ra, **không mở cổng nào vào** | Không cần IP tĩnh; không phơi máy chủ ra Internet; có chứng chỉ HTTPS sẵn | Phụ thuộc một dịch vụ bên ngoài để đi vào từ xa |
| **B** | IP tĩnh + mở cổng trên bộ định tuyến | Không phụ thuộc bên thứ ba | Phải thuê IP tĩnh; máy chủ bị dò quét liên tục từ Internet |
| **C** | Chỉ dùng trong mạng trường, không ra Internet | An toàn nhất | Giáo viên không nhập điểm ở nhà được; phụ huynh không tra cứu được |

**Đề xuất: A.** Và bất kể chọn hướng nào, phải đặt đúng số tầng trung gian
(`TRUST_PROXY=1`) — thiếu bước này thì mọi truy cập trông như đến từ cùng một địa chỉ, giới
hạn chống dò mật khẩu biến thành một rổ chung cho cả trường, và nhật ký ghi địa chỉ máy
trung gian thay vì người thật.

---

## 16. Camera: điều kiện bắt buộc phải kiểm tra trước

**Đang có.** EduPortal đọc hình qua hai chuẩn mở — ONVIF hoặc RTSP — mà hầu hết camera IP
đều hỗ trợ. Khung quản lý danh sách camera, cấp vé xem có thời hạn và ghi nhật ký lượt xem
đã có sẵn (`server/src/lib/cameraRegistry.js`, `cameraTickets.js`, `accessLog.js`).

**Đang thiếu.** Danh sách camera thật của trường: số lượng, hãng, model, vị trí, độ phân
giải, và số kênh còn trống trên đầu ghi.

**Chỗ đang ổn.** Phần mềm không kén hãng — làm việc theo chuẩn chung chứ không theo giao
thức riêng của từng hãng. Trường dùng hãng nào cũng được, và sau này thay camera hãng khác
vẫn chạy. Việc chặn quyền xem nằm ở máy chủ, không nằm ở giao diện: chỉ tài khoản Ban Giám
hiệu xem được, và ai gọi thẳng vào hệ thống bỏ qua màn hình thì vẫn bị hỏi lại quyền.

**Chỗ chưa ổn.** Đây là chỗ có **điều kiện bắt buộc, không có đường vòng**: camera chỉ xem
được bằng ứng dụng riêng của hãng (thường là loại giá rẻ bán kèm ứng dụng điện thoại) thì
phần mềm bên ngoài không đọc được hình. Không phải khó — là không thể. Phải thay camera, và
đó là khoản chi cần biết **trước** khi hứa với nhà trường về tính năng nhận diện.

**Hướng giải quyết**

| | Tình huống | Cách xử lý | Chi phí |
|---|---|---|---|
| **A** | Camera đã hỗ trợ ONVIF/RTSP | Tích hợp ngay | 0 |
| **B** | Đầu ghi hỗ trợ nhưng camera thì không | Đọc hình qua đầu ghi | 0 |
| **C** | Không hỗ trợ, nhưng chỉ cần nhận diện ở cổng | Chỉ thay 2 camera cổng, giữ nguyên phần còn lại | Thấp |
| **D** | Không hỗ trợ, muốn nhận diện nhiều điểm | Thay toàn bộ | Cao |

**Đề xuất: kiểm tra ngay tuần này**, và nếu rơi vào C thì chọn C. Nhận diện chỉ cần ở cổng —
camera hành lang không cần hỗ trợ chuẩn mở.

**Cách kiểm tra, 15 phút:** tìm hợp đồng hoặc biên bản nghiệm thu hệ thống camera, chụp lại
trang ghi hãng và model gửi Công ty. Không tìm được hồ sơ thì Công ty khảo sát tại chỗ nửa
buổi, cần người mở phòng kỹ thuật.

---

## 17. Camera giám sát và camera nhận diện là hai loại thiết bị khác nhau

Đây là hiểu nhầm phổ biến nhất, và nó tốn tiền theo cả hai hướng — mua thừa hoặc mua sai.

| | Camera giám sát hành lang | Camera nhận diện khuôn mặt | Camera đọc biển số |
|---|---|---|---|
| Vị trí | Treo cao, nhìn chếch xuống | Ngang tầm mặt, cách 2–4 m | Hướng thẳng làn xe |
| Yêu cầu ánh sáng | Thấp | Đều, không ngược sáng | Chống loá đèn xe |
| Tốc độ màn trập | Thường | Thường | Cao (xe đang chạy) |
| Nếu dùng sai loại | — | Thấy có người nhưng không biết là ai | Biển số nhoè |

Camera treo cao nhìn chếch xuống thì khuôn mặt bị méo phối cảnh và thiếu sáng — thấy được
có người đi qua, nhưng không nhận ra là ai.

**Hướng giải quyết**

| | Hướng | Chi phí | Kết quả |
|---|---|---|---|
| **A** | Lắp thêm 2 camera chuyên dụng ở cổng (1 khuôn mặt, 1 biển số) | Thấp | Nhận diện chạy đúng |
| **B** | Dùng camera hiện có, chấp nhận nhận đúng thấp | 0 | Nhận sai nhiều, giáo viên sửa tay liên tục |
| **C** | Nâng cấp toàn bộ camera lên loại có nhận diện | Cao | Thừa — hành lang không cần nhận diện |

**Đề xuất: A.** Kèm hai lưu ý kỹ thuật thường bị bỏ qua:

- **Kéo cáp mạng cho hai camera cổng**, đừng dùng wifi. Wifi yếu làm mất khung hình, và
  nhận diện trên chuỗi hình mất khung sẽ nhận sai — nhưng biểu hiện ra ngoài lại giống hệt
  "phần mềm nhận diện kém", nên không ai nghĩ tới đường truyền. Chi phí vài trăm nghìn một
  điểm.
- **Thời hạn lưu hình phụ thuộc dung lượng ổ của đầu ghi.** Đầu ghi tự xoá theo vòng,
  thường 7–15 ngày với ổ mặc định. Nếu nhà trường chốt lưu 30 ngày mà đầu ghi chỉ giữ được
  10 ngày thì chính sách đó không có thật — phải nâng ổ, hoặc hạ thời hạn cho khớp.

---

## 18. Ảnh chân dung học sinh: yêu cầu kỹ thuật

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
đâu, và ảnh gốc được xoá sau khi tạo xong đặc trưng. Kể cả máy chủ bị xâm nhập thì thứ lấy
được là dãy số, không phải kho ảnh chân dung học sinh.

**Đề xuất:** dùng ảnh làm thẻ học sinh nếu có tệp gốc; nếu không, chụp lại tập trung theo
lớp trong một buổi — cách này cho chất lượng cao và đồng đều nhất.

---

# PHẦN IV — BỐN LỖI KỸ THUẬT TRÊN WEBSITE HIỆN TẠI

Không liên quan tới nội dung hợp tác, nhưng Công ty ghi nhận được trong quá trình tìm hiểu
và xin gửi nhà trường tham khảo. **Công ty sẵn sàng hướng dẫn cụ thể cho đơn vị quản trị
website, không tính phí.** Cả bốn mục dưới đây đã kiểm tra lại ngày 06/08/2026 và vẫn còn.

## 19. Lỗi 1 — Tệp sơ đồ trang trỏ sang website khác

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

## 20. Lỗi 2 — Một đoạn mã khuôn mẫu bị in thô ra trang

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

## 21. Lỗi 3 — Khai báo sai ngôn ngữ trang

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

## 22. Lỗi 4 — Nền hệ thống đã hết hạn hỗ trợ

**Đang có.** Website chạy trên Apache 2.4.29 / Ubuntu — theo phần đầu phản hồi của máy chủ.

**Đang thiếu.** Bản cập nhật. Apache 2.4.29 là bản đi kèm Ubuntu 18.04, đã hết thời hạn hỗ
trợ miễn phí từ tháng 4/2023.

**Chỗ chưa ổn.** Không có nghĩa website sẽ sập, nhưng có nghĩa các bản vá bảo mật của hệ
điều hành không còn về tự động. Cộng với dấu hiệu ở Mục 19, đây là hai dữ kiện độc lập cùng
chỉ về một việc: **nền của website hiện tại cần được rà lại**, và trong lúc chưa rà thì
không nên đặt sổ điểm chung chỗ với nó.

**Hướng giải quyết**

| | Hướng | Công sức | Khi nào nên |
|---|---|---|---|
| **A** | Nâng hệ điều hành máy chủ website lên bản còn hỗ trợ | 1 ngày của đơn vị quản trị | Nên làm, không phụ thuộc EduPortal |
| **B** | Giữ nguyên, chỉ tách EduPortal ra máy riêng | 0 | Đây là điều tài liệu này đã đề xuất ở Mục 3 |
| **C** | Đưa website về chạy chung máy chủ EduPortal tại trường | Nửa ngày | Nếu nhà trường muốn gom một mối và đã lấy lại được mã nguồn |

**Đề xuất: B trước** (EduPortal không chờ việc này), **A khi đơn vị quản trị website có thể
xếp lịch**. Hướng C chỉ nên xét sau khi Mục 19 đã xử lý xong — đưa một website đang có dấu
hiệu bị chèn tệp về chung máy với cơ sở dữ liệu học sinh là đi ngược lại toàn bộ Mục 2.

---

# PHẦN V — VIỆC CẦN NHÀ TRƯỜNG XÁC NHẬN

## 23. Bảy câu cần câu trả lời để bắt đầu

| # | Câu hỏi | Ai trả lời | Chặn việc gì nếu chưa có |
|---|---|---|---|
| 1 | Chọn tên miền con `portal.c3phucthinh.edu.vn`? (Mục 3) | Ban Giám hiệu | Chặn toàn bộ: chưa có địa chỉ thì chưa cài được chứng chỉ bảo mật |
| 2 | Đơn vị nào đang quản trị website, hợp đồng đến bao giờ, nhà trường có giữ mã nguồn không? (Mục 1) | Ban Giám hiệu | Chặn đăng nhập một lần |
| 3 | Có làm đăng nhập một lần không, hay bắt đầu bằng phương án nhẹ? (Mục 4) | Ban Giám hiệu | Không chặn — có phương án dự phòng |
| 4 | Ai giữ chuỗi bí mật? (Mục 5) | Ban Giám hiệu | Chặn bước bật đăng nhập một lần |
| 5 | vnEdu có nút xuất Excel danh sách học sinh không? (Mục 8) | Văn thư | Quyết định dự án mất một buổi hay ba tuần |
| 6 | Camera hiện có hỗ trợ ONVIF/RTSP không? (Mục 16) | Đơn vị lắp đặt / hồ sơ nghiệm thu | Chặn tính năng nhận diện, và ảnh hưởng dự toán |
| 7 | Ai là người vận hành hằng ngày phía nhà trường (1 chính, 1 dự phòng)? | Ban Giám hiệu | Không chặn khởi động, nhưng chặn việc bàn giao |

## 24. Dữ liệu và tài liệu nhà trường cần gửi

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
- [ ] Danh sách camera hiện có: hãng, model, vị trí, độ phân giải (Mục 16)
- [ ] Bốn con số để chốt cấu hình: tổng học sinh, tổng giáo viên, tổng lớp, dự kiến sĩ số
      3 năm tới

## 25. Trình tự triển khai đề xuất

| Tuần | Việc | Bên nào |
|---|---|---|
| **1** | Chốt tên miền con, thêm bản ghi DNS, cài chứng chỉ bảo mật | Nhà trường + Công ty |
| **1** | Kiểm tra vnEdu có nút xuất Excel; kiểm tra camera có hỗ trợ chuẩn mở | Nhà trường |
| **2** | Gửi tệp dữ liệu theo mẫu; Công ty chạy kiểm tra khô và trả báo cáo lỗi | Hai bên |
| **2** | Đơn vị quản trị website thêm đường dẫn sinh vé đăng nhập | Đơn vị quản trị website |
| **3** | Nạp dữ liệu thật, đối chiếu số lượng, ký biên bản | Hai bên |
| **3** | Gắn mã giáo viên cho các tài khoản tạo tay trước đây, rồi bật đăng nhập một lần | Công ty |
| **4** | Đào tạo 2 buổi cho người vận hành; chạy thử khôi phục sao lưu trước mặt nhà trường | Công ty |
| **4** | Bắt đầu dùng thật với một nghiệp vụ trước — đề xuất điểm danh | Nhà trường |

---

*Tài liệu do Công ty soạn để trao đổi với Trường THPT Phúc Thịnh. Mọi hướng nêu trên là đề
xuất — nhà trường có toàn quyền chọn khác, và Công ty triển khai theo lựa chọn của nhà
trường. Các dữ kiện về website nhà trường ở Mục 1 và Phần IV được kiểm tra ngày 06/08/2026
bằng cách truy cập công khai, không thử mật khẩu và không dò quyền.*
