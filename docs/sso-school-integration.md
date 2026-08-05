# Đề xuất: đăng nhập một lần giữa website trường và EduPortal

> Tài liệu kỹ thuật gửi Trường THPT Phúc Thịnh. Mục đích: giáo viên bấm "Đăng nhập"
> trên website trường như hiện nay, và vào thẳng được EduPortal — không phải nhớ
> thêm một mật khẩu thứ hai.

## 1. Vì sao cần bàn với nhà trường

EduPortal là một ứng dụng riêng, có cơ sở dữ liệu riêng. Nếu triển khai tách rời,
mỗi giáo viên sẽ có hai tài khoản: một để đăng tin trên website trường, một để vào
EduPortal. Hai mật khẩu, hai lần quên, hai lần nhờ văn phòng cấp lại.

Website trường **đã có sẵn** hệ thống đăng nhập giáo viên (mã giáo viên hoặc email
+ mật khẩu). Danh sách giáo viên trong đó là danh sách đúng — do nhà trường quản lý,
cập nhật khi có người vào, người chuyển đi. Đề xuất này là: **lấy đó làm nguồn duy
nhất**, EduPortal tin theo, thay vì dựng một danh sách thứ hai rồi hai bên lệch nhau.

## 2. Điều nhà trường cần làm

Một route mới trong hệ thống hiện tại. **Không** đổi cấu trúc cơ sở dữ liệu, **không**
đổi mật khẩu của ai, **không** cần mở cổng cơ sở dữ liệu ra ngoài.

Cụ thể là ba việc:

| # | Việc | Khối lượng |
|---|---|---|
| 1 | Sinh một chuỗi bí mật (32 ký tự ngẫu nhiên), lưu trong `.env` của website | 1 phút |
| 2 | Thêm route `/teacher/sang-eduportal` — chỉ chạy khi giáo viên đã đăng nhập | ~30 dòng PHP |
| 3 | Thêm một mục vào menu sau khi đăng nhập: "Mở EduPortal" | 1 dòng HTML |

Mã nguồn mẫu cho việc số 2 nằm ở Mục 6. Nhà trường tự đọc, tự sửa, tự deploy —
phía EduPortal không cần và không xin quyền truy cập vào máy chủ của trường.

## 3. Luồng đăng nhập

```
  Giáo viên                Website trường              EduPortal
      │                          │                          │
      │  1. đăng nhập như cũ     │                          │
      ├─────────────────────────▶│                          │
      │                          │ (kiểm tra mật khẩu       │
      │                          │  bằng CSDL sẵn có)       │
      │                          │                          │
      │  2. bấm "Mở EduPortal"   │                          │
      ├─────────────────────────▶│                          │
      │                          │ 3. ký một phiếu điện tử  │
      │                          │    hạn 60 giây           │
      │  4. chuyển trang kèm phiếu                          │
      │◀─────────────────────────┤                          │
      ├────────────────────────────────────────────────────▶│
      │                                                     │ 5. kiểm tra chữ ký
      │                                                     │    trên phiếu
      │  6. vào thẳng EduPortal                             │
      │◀────────────────────────────────────────────────────┤
```

Điểm mấu chốt ở bước 3: website trường **không gửi mật khẩu** sang EduPortal. Nó gửi
một tờ phiếu ghi "người này là giáo viên Nguyễn Văn A, mã GV001", có đóng dấu bằng
chuỗi bí mật mà chỉ hai bên biết. EduPortal kiểm tra con dấu đó. Ai chặn được đường
truyền cũng không đọc ra mật khẩu, vì mật khẩu không đi qua đó.

Phiếu **hết hạn sau 60 giây** và **chỉ dùng được một lần**. Sao chép lại đường link
để dùng sau không vào được.

## 4. Dữ liệu nào được chuyển sang

Đúng bốn trường, không hơn:

| Trường | Ví dụ | Dùng để |
|---|---|---|
| Mã giáo viên | `GV001` | Định danh, nối hai hệ thống |
| Email | `a.nv@c3phucthinh.edu.vn` | Tài khoản trong EduPortal |
| Họ tên | `Nguyễn Văn A` | Hiển thị trên giao diện |
| Vai trò | `teacher` | Phân quyền lần đầu (xem Mục 4.1 và 4.2) |

**Không** chuyển: mật khẩu, mã băm mật khẩu, số điện thoại, số căn cước, lương,
hồ sơ nhân sự, hay bất cứ dữ liệu học sinh nào.

### 4.1. Mã giáo viên là thứ quyết định, không phải email

Lần đầu một giáo viên đi qua cửa này, EduPortal tạo tài khoản và **ghi mã giáo
viên vào tài khoản đó**, ở chỗ chính chủ tài khoản không sửa được (`app_metadata`
của Supabase — chỉ khoá quản trị viên ghi được, khoá này nằm trên máy chủ và
không bao giờ ra trình duyệt). Những lần sau, EduPortal đọc lại mã đó và **chỉ mở
phiên khi mã khớp**.

Vì sao phải vậy: đăng ký tài khoản EduPortal đang mở, và khoá ẩn danh nằm sẵn
trong mã nguồn trang web. Nếu chỉ so email, một người lạ đăng ký trước bằng địa
chỉ của hiệu trưởng — không cần vào được hòm thư đó — rồi ngồi đợi. Đến khi hiệu
trưởng thật bấm "Mở EduPortal", phiên đăng nhập và vai trò của hiệu trưởng sẽ rơi
vào tài khoản người lạ đã chiếm chỗ. Ràng buộc theo mã giáo viên đóng đúng cửa đó.

Ba trường hợp bị từ chối, kèm câu thông báo giáo viên nhìn thấy:

| Tình huống | EduPortal làm gì |
|---|---|
| Email đã có tài khoản nhưng **chưa gắn mã nào** (tài khoản tạo tay trước đây, hoặc người lạ chiếm chỗ) | Từ chối. Quản trị viên gắn mã vào tài khoản đó rồi giáo viên đăng nhập lại |
| Email đã gắn **mã khác** | Từ chối. Hai hệ thống đang mâu thuẫn, cần người xem lại |
| Email **ngoài tên miền** `c3phucthinh.edu.vn` | Từ chối. Phiếu ký hợp lệ vẫn không mở được tài khoản ngoài trường |

Tài khoản EduPortal tạo tay từ trước ngày bật SSO sẽ rơi vào dòng đầu bảng. Đây
là cố ý: thà bắt gắn mã một lần còn hơn nhận nhầm người. Quản trị viên gắn mã
trong Supabase (`app_metadata.teacher_code`), mỗi tài khoản một lần.

### 4.2. Vai trò: phiếu chỉ xin được `teacher`, và chỉ xin được một lần

Hai giới hạn, cùng một lý do — trong EduPortal, **ghi vai trò vào bảng `profiles`
chính là cấp quyền**: hàm `auth_role()` mà toàn bộ phân quyền cơ sở dữ liệu dựa
vào chỉ là một câu đọc đúng cột đó.

1. **Trần vai trò.** Mặc định phiếu chỉ được xin `teacher`
   (`SCHOOL_SSO_ALLOWED_ROLES`). Phiếu xin `admin` bị từ chối. Vai trò `admin`
   mở luồng camera lớp học — hình ảnh trực tiếp của học sinh — nên câu hỏi "ai
   được làm admin?" không thể có đáp án "bất cứ ai ký được phiếu". Website
   trường bị chỉnh sửa, hay chuỗi bí mật lọt ra ngoài, cũng không tự tạo được
   admin.
2. **Vai trò chỉ đặt lúc tạo tài khoản.** Lần đăng nhập thứ hai trở đi không ghi
   lại vai trò nữa. Nhà trường hạ quyền một tài khoản trong EduPortal thì lần
   đăng nhập kế tiếp **không** phục hồi quyền cũ. Họ tên và trường vẫn cập nhật
   theo hồ sơ bên website, vì đó là hiển thị, không phải quyền.

Nâng một giáo viên lên `admin` là việc làm trong EduPortal, do người thật bấm,
một lần — không phải hệ quả của một lần đăng nhập.

### Về bảo vệ dữ liệu cá nhân

Dữ liệu giáo viên và học sinh là dữ liệu cá nhân, thuộc phạm vi điều chỉnh của
Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân. Ba nguyên tắc đề xuất này tuân thủ:

- **Tối thiểu hoá** — chỉ chuyển bốn trường ở trên, đủ để đăng nhập và không hơn.
- **Đúng mục đích** — dữ liệu chỉ dùng để xác định người dùng trong EduPortal.
- **Có thể rút lại** — nhà trường đổi chuỗi bí mật là toàn bộ liên kết ngừng hoạt động
  ngay lập tức, không cần EduPortal hợp tác.

Trước khi vận hành chính thức, hai bên nên ký một thoả thuận xử lý dữ liệu ghi rõ
phạm vi, thời hạn lưu trữ và trách nhiệm mỗi bên. Nội dung thoả thuận nên có ý kiến
của bộ phận pháp chế nhà trường — tài liệu này chỉ mô tả mặt kỹ thuật.

## 5. Nếu nhà trường chưa muốn làm SSO

Hai phương án nhẹ hơn, vẫn dùng được:

**Phương án B — đồng bộ định kỳ.** Nhà trường xuất danh sách giáo viên (mã, email,
họ tên) định kỳ, EduPortal nhập vào. Giáo viên đặt mật khẩu EduPortal riêng ở lần
đầu. Ưu điểm: không cần sửa website. Nhược điểm: hai mật khẩu, và danh sách lệch
nhau giữa hai lần đồng bộ.

**Phương án C — chỉ đặt đường dẫn.** Thêm một liên kết "EduPortal" trên website,
giáo viên đăng nhập lại bằng tài khoản EduPortal. Làm trong 5 phút. Nhược điểm:
hai tài khoản hoàn toàn tách biệt.

Có thể bắt đầu bằng C để giáo viên dùng thử, rồi nâng lên A khi nhà trường thấy
đáng làm. Chuyển đổi không mất dữ liệu.

## 6. Mã nguồn mẫu cho website trường

Đặt trong `routes/web.php`, chạy sau khi giáo viên đã đăng nhập:

```php
use Firebase\JWT\JWT;

Route::get('/teacher/sang-eduportal', function () {
    $teacher = auth()->guard('teacher')->user();
    if (!$teacher) {
        return redirect('/')->with('error', 'Vui lòng đăng nhập trước.');
    }

    $now = time();
    $payload = [
        'iss'   => 'c3phucthinh.edu.vn',
        'aud'   => 'eduportal',
        'sub'   => $teacher->ma_giao_vien,
        'email' => $teacher->email,
        'name'  => $teacher->ho_ten,
        // Luôn 'teacher'. Xem Mục 4.2: EduPortal từ chối phiếu xin 'admin',
        // và vai trò chỉ được đặt lúc tạo tài khoản. Quyền BGH cấp trong
        // EduPortal, một lần, không phải mỗi lần đăng nhập.
        'role'  => 'teacher',
        'iat'   => $now,
        'exp'   => $now + 60,
        'jti'   => bin2hex(random_bytes(16)),
    ];

    $token = JWT::encode($payload, config('services.eduportal.secret'), 'HS256');

    return redirect(config('services.eduportal.url') . '/sso?token=' . urlencode($token));
})->middleware('auth:teacher');
```

Thêm vào `config/services.php`:

```php
'eduportal' => [
    'secret' => env('EDUPORTAL_SSO_SECRET'),
    'url'    => env('EDUPORTAL_URL'),
],
```

Thư viện `firebase/php-jwt` cài bằng `composer require firebase/php-jwt`. Nếu nhà
trường không muốn thêm thư viện, phần ký HS256 viết tay bằng `hash_hmac('sha256', ...)`
khoảng 10 dòng — phía EduPortal chấp nhận cả hai vì đều là JWT chuẩn.

## 7. Phía EduPortal đã chuẩn bị sẵn

| Thành phần | Vị trí | Trạng thái |
|---|---|---|
| Kiểm tra phiếu (chữ ký, hạn, chống dùng lại) | `server/src/lib/schoolToken.js` | Xong |
| Đổi phiếu lấy phiên đăng nhập | `server/src/routes/sso.js` | Xong |
| Kiểm thử | `server/src/routes/sso.test.js` | Xong |

Khi nhà trường đồng ý, việc còn lại là hai bên trao đổi chuỗi bí mật qua kênh an toàn
(không gửi qua email hay chat) và bật cấu hình. Thời gian triển khai ước tính nửa ngày.

### 7.1. Cấu hình phía EduPortal

Đặt trong `server/.env` (mẫu đầy đủ ở `server/.env.example`):

| Biến | Ý nghĩa | Thiếu thì sao |
|---|---|---|
| `SCHOOL_SSO_SECRET` | Chuỗi bí mật, giống hệt bên website trường | 503 |
| `SCHOOL_SSO_ISSUER` | Phải khớp trường `iss` trong phiếu | 503 |
| `SCHOOL_DOMAIN` | Tên miền email của trường; vừa tra bảng `schools`, vừa chặn email ngoài trường | 503 |
| `SCHOOL_SSO_ALLOWED_ROLES` | Trần vai trò, mặc định `teacher` | Mặc định `teacher` |
| `SCHOOL_SSO_ACCESS_LOG` | Tệp nhật ký truy cập, xem Mục 7.2 | Chỉ in ra stdout, mất khi khởi động lại |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Kết nối tới cơ sở dữ liệu | 503 |
| `TRUST_PROXY` | Số proxy đứng trước máy chủ (Cloudflare Tunnel, nginx) | Xem cảnh báo dưới |

**Ba biến đầu bỏ trống là cửa đóng, không phải cửa mở thiếu chốt.** Trước đây bỏ
trống `SCHOOL_SSO_ISSUER` là lặng lẽ bỏ luôn bước kiểm tra "ai ký phiếu này",
trong khi endpoint vẫn báo đã cấu hình và vẫn phục vụ. Nay thiếu bất kỳ biến nào
trong số đó thì `/api/sso/school` trả 503.

**`TRUST_PROXY` cần đặt nếu máy chủ nằm sau tunnel** (đúng cách dựng trong
`server/SELF-HOST.md`). Không đặt thì mọi request trông như đến từ một địa chỉ
duy nhất: giới hạn 20 lần thử mỗi phút biến thành một rổ chung cho cả trường —
một người gõ sai liên tục là khoá cửa của mọi giáo viên — và nhật ký ghi địa chỉ
proxy thay vì người gọi. Đặt `TRUST_PROXY=1` khi có đúng một proxy. Không có giá
trị nào nghĩa là "tin mọi header": `TRUST_PROXY=true` bị từ chối ngay lúc khởi
động, vì khi đó người gọi tự khai địa chỉ của mình và cả hai thứ trên đều vô hiệu.

### 7.2. Nhật ký: ai đã đi qua cửa này

Nghị định 13/2023 hỏi "ai đã truy cập dữ liệu này?" cho toàn bộ dữ liệu cá nhân,
không riêng camera. Cửa SSO ghi vào một tệp chỉ-thêm (`SCHOOL_SSO_ACCESS_LOG`),
cùng cơ chế mà tường camera đang dùng, mỗi dòng một sự việc: **cho vào**, **từ
chối** (kèm lý do cụ thể), và **tạo tài khoản mới**. Mỗi dòng có thời điểm, mã
giáo viên, địa chỉ người gọi và id tài khoản khi đã biết.

```bash
tail -f server/data/sso-access.log
```

Tệp này nằm cạnh nhật ký camera và cần được sao lưu như mọi dữ liệu khác.

### 7.3. Điều chưa làm: thu hồi tài khoản khi giáo viên nghỉ

Nói thẳng, vì đây đúng là lý do ban đầu của đề xuất này. Hiện SSO **chỉ chặn
đường vào từ website trường**: giáo viên đã chuyển đi không đăng nhập qua cửa này
được nữa, vì website trường không còn ký phiếu cho họ. Nhưng **tài khoản EduPortal
của họ vẫn còn**, và nếu ai đó đặt mật khẩu cho tài khoản đó thì vẫn vào được.

Chưa làm được vì phần thiếu không nằm ở mã nguồn: EduPortal cần biết "người này
đã nghỉ" bằng cách nào — nhà trường bấm một nút, xuất danh sách định kỳ, hay
EduPortal hỏi ngược website trường. Đó là quy trình của nhà trường, cần bàn trước
rồi mới viết. Trong lúc chờ, quy trình tạm: **khi có giáo viên chuyển đi, quản
trị viên vô hiệu hoá tài khoản tương ứng trong EduPortal**, cùng lúc với các thủ
tục bàn giao khác.

## 8. Câu hỏi gửi nhà trường

1. **Học sinh và phụ huynh lấy tài khoản từ đâu?** Cơ sở dữ liệu hiện tại có danh
   sách học sinh không, hay chỉ có giáo viên? Ba hướng: (a) đồng bộ luôn từ CSDL
   trường nếu có, (b) BGH tạo tài khoản trong EduPortal, (c) học sinh đăng nhập bằng
   tài khoản Google của trường — EduPortal đã hỗ trợ sẵn cách này.

2. **Ai được quyền "admin"?** Đề xuất: Ban Giám hiệu, và **cấp trong EduPortal**
   chứ không qua phiếu đăng nhập (Mục 4.2). Nhà trường cho biết danh sách người
   cần quyền này để cấp một lần lúc bàn giao.

3. **Ai giữ chuỗi bí mật phía nhà trường?** Nên là người quản trị website, và nên
   đổi định kỳ 6 tháng một lần.

4. **Đã có tài khoản EduPortal nào tạo tay trước đây chưa?** Nếu có, cần gắn mã
   giáo viên cho từng tài khoản đó trước khi bật SSO (Mục 4.1) — nếu không, chính
   những người này sẽ bị từ chối ở lần đăng nhập đầu tiên.

---

## Phụ lục: hai lỗi kỹ thuật phát hiện trên website hiện tại

Không liên quan đến đề xuất này, nhưng nhà trường nên biết:

**1. `sitemap.xml` trỏ sang website khác.** Toàn bộ 42 đường dẫn trong
`https://c3phucthinh.edu.vn/sitemap.xml` trỏ tới `annamaudio.com` — một website bán
thiết bị âm thanh, không phải của trường. File được tạo tháng 11/2022 và chưa cập nhật.
Hệ quả: Google đọc sơ đồ site thấy toàn địa chỉ lạ, không lập chỉ mục được các trang
của trường. Nên xoá hoặc tạo lại file này.

**2. Khai báo sai ngôn ngữ.** Mọi trang đều có `<html lang="en">` trong khi nội dung
là tiếng Việt. Ảnh hưởng tới kết quả tìm kiếm và trình đọc màn hình cho người khiếm thị.
Sửa thành `<html lang="vi">`.
