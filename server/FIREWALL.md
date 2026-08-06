# Tường lửa cho máy đặt tại trường

Máy này giữ điểm, học phí, hồ sơ tư vấn tâm lý và hình camera của cả trường, trên một IP tĩnh công cộng. Sai một dòng ở đây nguy hiểm hơn mọi lỗi trong mã nguồn cộng lại.

Hai câu định hướng cả tài liệu:

- **Kẻ tấn công không gõ vào cổng 5432.** Nó gõ vào 443, nơi ta cố tình mở. Nên việc chính không phải đếm cổng mà là **kiểm soát những đường dẫn nằm sau cổng 443**.
- **Cái gì cũng phải buộc vào `127.0.0.1`.** Tường lửa là lớp thứ hai. Dịch vụ chỉ nghe trên loopback thì tường lửa hỏng cũng không lộ.

---

## 0. Trước tiên: đường vào có thật không

"IP tĩnh" của nhà mạng Việt Nam không đồng nghĩa với "gọi vào được từ Internet". Gói phổ thông của VNPT/Viettel/FPT thường **chặn chiều vào cổng 80/443** trừ khi mua thêm tuỳ chọn, hoặc đặt đường truyền sau **CGNAT** — địa chỉ cố định nhưng là địa chỉ dùng chung, không NAT vào được.

Kiểm trước khi dựng gì cả. Trên máy chủ:

```bash
sudo python3 -m http.server 443
```

Từ **mạng 4G của điện thoại, tắt wifi**:

```bash
curl -m 10 http://<IP tĩnh của trường>/
```

Không thấy danh sách thư mục thì dừng lại, gọi nhà mạng, đừng dựng tiếp. Kiểm thêm địa chỉ nhà mạng nhìn thấy có đúng là IP được cấp không:

```bash
curl -s https://ifconfig.me    # chạy trên máy chủ
```

Khác với IP tĩnh trên hợp đồng nghĩa là đang sau CGNAT.

## 1. Cái gì ra Internet, và đường dẫn nào

Ra Internet **chỉ có 443/tcp và 8189/udp**. Mọi thứ khác nghe trên `127.0.0.1`.

| Dịch vụ | Cổng | Ra Internet | Ghi chú |
|---|---|---|---|
| nginx | 443/tcp | **Có** | Cửa duy nhất, phân luồng theo tên miền **và theo đường dẫn** |
| MediaMTX — ICE | 8189/udp | **Có** | Hình camera đi bằng UDP, không lọt qua nginx được |
| Supabase Kong (HTTP) | 8000 | Không | nginx gọi qua loopback, **chỉ vài đường dẫn** |
| Supabase Kong (**HTTPS**) | **8443** | **Không bao giờ** | Cửa Kong thứ hai. Dễ sót nhất — xem mục 2 |
| Supabase Studio | qua Kong ở `/` | **Không bao giờ** | **Không phải cổng 3000.** Kong phục vụ Studio ngay tại `/`, chỉ có HTTP Basic che. Phải chặn ở nginx |
| postgres-meta | qua Kong ở `/pg/` | **Không bao giờ** | Chạy SQL tuỳ ý |
| PostgreSQL | 5432 | **Không bao giờ** | |
| Supavisor (pooler) | 6543 | **Không bao giờ** | Cũng là đường vào database |
| Analytics | 4000 | **Không bao giờ** | |
| `eduportal-server` | 8080 | Không | **Mặc định nghe mọi giao diện** — phải buộc loopback, xem mục 2 |
| MediaMTX — WHEP | 8889 | Không | Trình duyệt gọi qua nginx `/relay/`, xem dưới |
| MediaMTX — RTSP | 8554 | **Không bao giờ** | Luồng thô, không xác thực người xem |
| MediaMTX — RTMP / HLS / SRT | 1935 / 8888 / 8890 | **Tắt hẳn** | Bật sẵn mặc định. Xem mục 4 |
| Camera IP | 554 | **Không bao giờ** | VLAN riêng, xem mục 6 |

### nginx phải lọc đường dẫn, không được chuyển tiếp cả tên miền

Đây là phần quan trọng nhất tài liệu. Chuyển tiếp nguyên tên miền sang Kong là **đưa trang quản trị CSDL lên Internet**; chuyển tiếp nguyên tên miền sang `eduportal-server` là mở ba đường dẫn không có xác thực.

```nginx
# Quét thẳng vào IP, không kèm tên miền -> ngắt, không lộ có gì ở đây.
server {
    listen 443 ssl default_server;
    ssl_certificate     /etc/letsencrypt/.../fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/.../privkey.pem;
    return 444;
}

server {
    listen 443 ssl;
    server_name db.c3phucthinh.edu.vn;

    # Đúng bốn API ứng dụng gọi. Không hơn.
    location ~ ^/(auth|rest|realtime|storage)/v1/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /pg/ { return 404; }   # postgres-meta: chạy SQL tuỳ ý
    location /    { return 404; }   # Studio: vào bằng SSH tunnel, mục 7
}

server {
    listen 443 ssl;
    server_name api.c3phucthinh.edu.vn;

    # MediaMTX gọi hook này qua loopback. Ngoài Internet không ai cần.
    location = /api/cameras/authorize { deny all; }

    # Phiên âm và tóm tắt chạy trên model nội bộ, KHÔNG có xác thực,
    # và nhận body 25MB. Mở ra là biếu không GPU của trường cho người lạ.
    location = /api/transcribe { deny all; }
    location = /api/summarize  { deny all; }

    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host              $host;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WHEP: TRÌNH DUYỆT mở kết nối này, không phải nginx.
    # routes/cameras.js trả URL dựng từ CAMERA_RELAY_URL cho client tự gọi.
    location /relay/ {
        proxy_pass http://127.0.0.1:8889/;
        proxy_set_header Host $host;
    }
}
```

Rồi trong `server/.env`:

```bash
CAMERA_RELAY_URL=https://api.c3phucthinh.edu.vn/relay
```

**Không** để `http://192.168.1.10:8889` như ví dụ trong [CAMERA.md](CAMERA.md): địa chỉ đó chỉ gọi được trong trường, và trang HTTPS gọi sang HTTP thì trình duyệt chặn thẳng. Hiệu trưởng mở tường camera từ nhà sẽ thấy **khung đen, không có thông báo lỗi nào**.

### Tài khoản: tắt tự đăng ký

GoTrue mặc định cho **bất kỳ ai trên Internet** tạo tài khoản, và không cần xác nhận email. Trong `/opt/supabase/docker/.env`:

```bash
DISABLE_SIGNUP=true
```

Không làm hỏng SSO: [routes/sso.js](src/routes/sso.js) tạo tài khoản qua `/auth/v1/admin/users` bằng service key, đường đó không đi qua cửa đăng ký công khai.

## 2. Buộc mọi thứ vào loopback

### 2.1 — Cái bẫy Docker

**`ufw deny 5432` KHÔNG chặn được cổng do Docker mở.** Docker ghi luật iptables vào chuỗi riêng, được duyệt **trước** luật UFW. Nên `docker compose` publish `5432:5432` là PostgreSQL ra thẳng Internet, trong khi `ufw status` vẫn hiện "deny 5432" và người dựng đọc xong yên tâm đi về.

Không báo lỗi gì. Mọi thứ chạy đúng, chỉ là database mở cho cả thế giới.

**Đừng sửa `docker-compose.yml` của Supabase** — nó là tệp trong git của họ, `git pull` lúc cập nhật sẽ xung đột hoặc nuốt mất sửa đổi. Tạo tệp riêng `/opt/supabase/docker/docker-compose.override.yml`:

```yaml
services:
  db:        { ports: !override ["127.0.0.1:5432:5432"] }
  kong:      { ports: !override ["127.0.0.1:8000:8000", "127.0.0.1:8443:8443"] }
  supavisor: { ports: !override ["127.0.0.1:5432:5432", "127.0.0.1:6543:6543"] }
  analytics: { ports: !override ["127.0.0.1:4000:4000"] }
  studio:    { ports: !override ["127.0.0.1:3000:3000"] }
```

**Đừng tin danh sách trên là đủ.** Mỗi bản Supabase một khác. Tự đọc từ tệp đang có:

```bash
cd /opt/supabase/docker && grep -n -A4 '^\s*ports:' docker-compose.yml
```

Mọi cổng hiện ra phải có mặt trong tệp override với tiền tố `127.0.0.1:`.

### 2.2 — Hai tiến trình không nằm trong Docker

Mục trên chỉ chạm tới Supabase. `eduportal-server` và MediaMTX chạy thẳng trên máy và **mặc định nghe trên mọi giao diện** — [`src/index.js`](src/index.js) gọi `server.listen(PORT)` không truyền địa chỉ. Nghĩa là 8080 trả lời cả wifi học sinh, không riêng Internet. UFW chặn phía ngoài; nó không chặn phía trong trường.

```bash
# server/.env
HOST=127.0.0.1
```

```yaml
# mediamtx.yml
webrtcAddress: 127.0.0.1:8889     # nginx gọi qua loopback
rtspAddress: 192.168.1.10:8554    # chỉ LAN, cho lớp AI đọc luồng
```

## 3. Luật tường lửa

> **Cài khoá SSH và thử ở một cửa sổ khác TRƯỚC khi bật ufw.** Bật tường lửa qua chính phiên SSH đang dùng là cách mất máy phổ biến nhất — mà máy này khoá trong phòng ở trường.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 443/tcp comment 'nginx'
sudo ufw allow 8189/udp comment 'WebRTC camera ICE'
sudo ufw limit 22/tcp comment 'SSH, chan do mat khau'
sudo ufw enable
```

Đây là lớp thứ hai. Lớp thứ nhất là router của trường: **chỉ NAT 443/tcp và 8189/udp**, không mở dải cổng.

**Chứng chỉ: dùng DNS-01, đừng dùng HTTP-01.** HTTP-01 cần cổng 80 chiều vào — thứ nhà mạng Việt Nam hay chặn — và nó **không phải việc làm một lần**: certbot gia hạn mỗi ~60 ngày qua đúng cổng đó. Mở 80 để xin chứng chỉ rồi đóng lại là chứng chỉ hết hạn giữa học kỳ, cả cổng thông tin tắt, không ai nối được lý do với việc đã làm hai tháng trước. Nhà đăng ký tên miền không có API cho DNS-01 thì phải để 80 mở vĩnh viễn và chuyển hướng hết sang 443 — chọn đi, đừng để lửng lơ.

## 4. MediaMTX

Tắt hẳn giao thức không dùng, đừng chỉ chặn ở tường lửa:

```yaml
rtmp: no
hls: no
srt: no
api: no
metrics: no
pprof: no

webrtcLocalUDPAddress: :8189
webrtcAdditionalHosts: [<IP tĩnh của trường>]
```

`webrtcAdditionalHosts` là bắt buộc. Sau NAT, MediaMTX chỉ biết địa chỉ nội bộ `192.168.x.x` và gửi đúng địa chỉ đó cho trình duyệt ngoài Internet — hình không bao giờ hiện, mà **chẳng có lỗi nào**, chỉ là khung đen.

Bản MediaMTX mới đã dồn ICE về một cổng UDP; bản cũ bốc ngẫu nhiên. Khai rõ để không phụ thuộc phiên bản. Hai khoá này phải nằm trong chính `mediamtx.yml` ở [CAMERA.md mục 2](CAMERA.md).

## 5. Đếm số chặng proxy — `TRUST_PROXY`

Sai giá trị này là hỏng phần chống dò mật khẩu, và hỏng im lặng: mọi yêu cầu trông như đến từ một địa chỉ, nên giới hạn số lần thử gộp cả trường vào **một rổ chung** — kẻ tấn công thử sai vài lần là khoá cửa đăng nhập của toàn bộ giáo viên.

`TRUST_PROXY` là **số chặng proxy giữa người dùng và tiến trình**, đếm ngược từ tiến trình ra:

| Cách dựng | Giá trị |
|---|---|
| Trình duyệt → nginx → server (tài liệu này) | `1` |
| Trình duyệt → Cloudflare Tunnel → nginx → server | `2` |
| Không có proxy | để trống |

`TRUST_PROXY=true` bị từ chối ngay lúc khởi động — xem [.env.example](.env.example). Kiểm sau khi dựng: gọi thử một lần đăng nhập sai từ mạng ngoài, rồi xem `data/sso-access.log` có ghi đúng địa chỉ thật không, hay ghi `127.0.0.1`.

### 5b. Giới hạn đăng nhập của GoTrue

`/api/sso/school` không phải cửa đăng nhập chính. Cửa chính là `/auth/v1/token` trên Kong — và nó cũng đếm theo IP, cũng gộp chung một rổ nếu không được chỉ chỗ đọc IP thật. Trong `/opt/supabase/docker/.env`:

```bash
GOTRUE_RATE_LIMIT_HEADER=X-Forwarded-For
```

## 6. Camera nằm ở mạng riêng

Camera IP là thiết bị nhúng, firmware hiếm khi được vá. Chung mạng với máy chủ nghĩa là một camera bị chiếm là kẻ tấn công đứng ngay cạnh database.

- Camera ở **VLAN riêng**, ví dụ `192.168.50.0/24`, **không có đường ra Internet**.
- Chỉ một chiều: máy chủ gọi vào camera được, camera không gọi ngược ra.
- **Đổi mật khẩu mặc định từng camera.** `admin/12345` vẫn là mật khẩu phổ biến nhất trên camera đang chạy thật.

VLAN không có Internet sẽ làm hỏng hai thứ — xử lý trước khi có người "sửa" bằng cách mở default route:

- **Đồng hồ camera trôi.** Giờ khắc trên hình và giờ trong `camera-access.log` lệch nhau, làm mất giá trị đối chứng của chính cuốn nhật ký này. Cho phép đúng NTP tới một máy trong LAN: `192.168.50.0/24 → 192.168.1.10 udp/123` (máy chủ chạy `chrony` là đủ).
- **Không cập nhật được firmware.** Tải tệp về máy khác rồi nạp thủ công, hoặc mở tạm đúng lúc cập nhật rồi đóng lại.

## 7. SSH và quyền tệp

### SSH — cửa một chiều, làm đúng thứ tự

```bash
# 1. Từ máy của mình
ssh-copy-id user@c3phucthinh.edu.vn

# 2. MỞ CỬA SỔ TERMINAL MỚI, GIỮ NGUYÊN PHIÊN CŨ, thử đăng nhập bằng khoá
ssh user@c3phucthinh.edu.vn

# 3. Vào được rồi mới sửa cấu hình
sudo nano /etc/ssh/sshd_config     # PasswordAuthentication no / PermitRootLogin no
sudo sshd -t                       # kiểm cú pháp TRƯỚC khi khởi động lại
sudo systemctl reload ssh

# 4. Thử lại ở cửa sổ thứ ba. Vào được thì mới đóng phiên cũ.
```

Thêm `fail2ban` cho SSH và cho nginx. Đổi cổng SSH thì sửa cả luật `ufw limit`.

Vào Supabase Studio bằng SSH tunnel, không mở cổng:

```bash
ssh -L 3000:127.0.0.1:8000 user@c3phucthinh.edu.vn
```

Rồi mở `http://localhost:3000` trên máy mình.

### Quyền tệp

`data/cameras.json` chứa **mật khẩu từng camera dạng chữ thường**, và `camera-access.log` chứa dữ liệu cá nhân của trẻ vị thành niên.

```bash
sudo chown -R eduportal:eduportal /opt/eduportal/server/data
sudo chmod 700 /opt/eduportal/server/data
sudo chmod 600 /opt/eduportal/server/data/cameras.json
```

`eduportal-server` và MediaMTX **không chạy bằng root**.

## 8. Kiểm tra — từ ngoài và từ trong

Quét từ một mạng khác (4G, tắt wifi trường). Nhớ rằng quét vào IP tĩnh là quét **router**, không phải máy — nên phải quét cả hai phía.

```bash
# a) Từ Internet — kiểm router
nmap -Pn -p- <IP tĩnh của trường>                              # chỉ được 443 (+SSH)
sudo nmap -Pn -sU -p 8189,5432,6543,554,161,123 <IP tĩnh>      # chỉ 8189 mở
nmap -6 -Pn -p- <IPv6 của máy, nếu nhà mạng có cấp>            # IPv6 không có NAT

# b) Từ một máy khác TRONG LAN — kiểm tường lửa của chính máy chủ
nmap -Pn -p- 192.168.1.10
# Chỉ được: 443, SSH, 8189/udp. Thấy 5432, 6543, 8000, 8443, 8080, 8554,
# 8888 hay 1935 là còn nghe trên mọi giao diện — quay lại mục 2.
```

Trên máy chủ, **ba lệnh chứ không phải một** — `ss` một mình cho đèn xanh giả:

```bash
sudo ss -tulnp | grep -vE '127\.0\.0\.1|\[::1\]'    # -u bắt buộc, thiếu là không thấy UDP

# ss có thể KHÔNG thấy cổng Docker publish (khi userland-proxy tắt,
# chuyển tiếp hoàn toàn bằng DNAT, không tạo socket nào trên host).
docker ps --format '{{.Names}}\t{{.Ports}}' | grep -v '127.0.0.1'
sudo iptables -t nat -S DOCKER | grep -v '127\.0\.0\.1'
```

Thử vào database từ ngoài. **Đọc đúng thông báo** — `ufw default deny` là DROP chứ không REJECT, nên kết quả đạt là *hết giờ chờ*, không phải "connection refused":

```bash
psql "postgresql://postgres@<IP tĩnh>:5432/postgres?connect_timeout=5" -c 'select 1'
psql "postgresql://postgres@<IP tĩnh>:6543/postgres?connect_timeout=5" -c 'select 1'
curl -k --max-time 5 https://<IP tĩnh>:8443/rest/v1/
```

| Kết quả | Nghĩa |
|---|---|
| `timeout expired` | **Đạt** — gói bị nuốt |
| `Connection refused` | Gói **lọt qua** tường lửa tới cổng đóng. Điều tra |
| Hỏi mật khẩu, hoặc trả JSON | **Cổng đang mở. Dừng ngay, đừng đưa dữ liệu thật lên** |

Đừng nhét mật khẩu vào lệnh — nó vào `history` và vào `ps` của máy đang gõ.

## 9. Việc định kỳ, và việc giao cho máy

Bảng dưới là việc người làm. Người thì bận và sẽ quên — nên **vá lỗi bảo mật giao cho máy ngay hôm dựng**:

```bash
sudo apt install unattended-upgrades apt-listchanges
sudo dpkg-reconfigure -plow unattended-upgrades
```

```
/etc/logrotate.d/eduportal:
    /opt/eduportal/server/data/*.log {
        weekly
        rotate 52
        compress
        copytruncate
        notifempty
    }
```

Cần logrotate vì hai cuốn nhật ký ghi thêm mãi không giới hạn, và `camera-access.log` thì **người ngoài quyết định tốc độ nó phình** — `/api/cameras/authorize` không có xác thực. Đầy phân vùng là Postgres cả trường dừng ghi.

| Việc | Bao lâu một lần |
|---|---|
| `docker compose pull && docker compose up -d` | Hằng quý, đọc changelog trước |
| Quét cổng lại từ ngoài **và từ trong LAN** | Sau mỗi lần sửa cấu hình |
| Kiểm chứng chỉ còn hạn | Hằng tháng |
| Khôi phục thử bản sao lưu | Mỗi học kỳ — [SELF-HOST.md](SELF-HOST.md) mục 4 |
| Đọc `data/camera-access.log` | Hằng tháng, xem ai đã xem camera |

---

> Tường lửa không thay được phân quyền. Người đăng nhập hợp lệ vẫn đi qua cổng 443 — thứ chặn học sinh xem điểm bạn khác là các policy RLS trong `supabase/migrations/`, không phải `ufw`. Chạy `supabase/tests/rls_check.sql` sau mỗi lần nạp migration.
>
> Một ngoại lệ phải nhớ: `SUPABASE_SERVICE_ROLE_KEY` **đi xuyên qua mọi policy RLS**. Nó chỉ được nằm trong `server/.env` trên máy này, không bao giờ trong `Web/.env`, không bao giờ trong git.
