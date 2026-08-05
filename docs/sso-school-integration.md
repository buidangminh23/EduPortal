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
| Vai trò | `teacher` / `admin` | Phân quyền (BGH thấy nhiều hơn giáo viên) |

**Không** chuyển: mật khẩu, mã băm mật khẩu, số điện thoại, số căn cước, lương,
hồ sơ nhân sự, hay bất cứ dữ liệu học sinh nào.

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
        'role'  => $teacher->la_bgh ? 'admin' : 'teacher',
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

## 8. Câu hỏi gửi nhà trường

1. **Học sinh và phụ huynh lấy tài khoản từ đâu?** Cơ sở dữ liệu hiện tại có danh
   sách học sinh không, hay chỉ có giáo viên? Ba hướng: (a) đồng bộ luôn từ CSDL
   trường nếu có, (b) BGH tạo tài khoản trong EduPortal, (c) học sinh đăng nhập bằng
   tài khoản Google của trường — EduPortal đã hỗ trợ sẵn cách này.

2. **Ai được quyền "admin"?** Đề xuất: Ban Giám hiệu. Nhà trường xác nhận cách nhận
   biết một tài khoản là BGH trong CSDL hiện tại (cột nào, giá trị nào).

3. **Ai giữ chuỗi bí mật phía nhà trường?** Nên là người quản trị website, và nên
   đổi định kỳ 6 tháng một lần.

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
