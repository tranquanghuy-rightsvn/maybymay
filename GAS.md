# GAS.md — Guideline CMS May By Mây (maybymay.vn)

Nguồn chân lý cho mọi quyết định nghiệp vụ của CMS (Google Apps Script). Đọc file này trước khi
sửa bất kỳ file nào trong `gas/`. Sửa code mà đổi quy tắc ở đây → cập nhật file này cùng lúc.

Playbook: skill `free-cms-static-site-pipeline`. Dự án gốc để copy: `tretrucvn` (cùng kiến trúc
build.py + Cloudflare, đã chạy thật), bỏ phần Smart content và Dự án, thêm tab Đơn hàng.

Chốt với Đại ca (03/10/2026):
- Quản lý: Blog (tin tức), Sản phẩm, Đơn hàng, Liên hệ, Người dùng.
- Sản phẩm chỉ thuộc **2 bộ sưu tập cố định**: Sản phẩm mùa hè (`mua-he`), Sản phẩm đồng bộ
  (`dong-bo`). "Sản phẩm mới" là **1 ô tick** trên từng sản phẩm, không phải bộ sưu tập thứ 3.
- Phân quyền 3 cấp: root / editor / viewer.
- Thông báo đơn hàng + liên hệ: Email + Telegram.
- Đơn hàng: xem + đổi trạng thái (không sửa nội dung đơn, không xoá).

## 0. Phạm vi

| Có trong CMS | Không có trong CMS (sửa tay ở `data/` rồi build) |
|---|---|
| Blog: bài viết (3 chuyên mục cố định) | Trang chính sách / hướng dẫn (`data/pages.json`) |
| Sản phẩm (2 bộ sưu tập cố định + tick "Sản phẩm mới") | Tên / mô tả bộ sưu tập, chuyên mục blog (hằng số trong `scripts/build.py` + `gas/Code.js`) |
| Đơn hàng (từ `/thanh-toan/`) | Banner trang chủ, hero, menu, footer |
| Liên hệ (từ `/contact/`) | Tỉnh / phường (`data/area/`) |
| Người dùng CMS | Tài khoản ngân hàng / QR (đầu file `html/js/pages/checkout.js`) |

## I. Đăng nhập và phân quyền

1. Đăng nhập bằng mã OTP 6 số gửi qua email (MailApp). Mã sống 10 phút, sai 5 lần thì huỷ mã,
   1 phút mới được xin mã mới. Phiên (token) sống 30 ngày, Đăng xuất thu hồi phiên trên máy chủ.
2. Chủ script (tài khoản Google deploy web app) **luôn là root**. Người khác lấy quyền từ bảng
   `Users` (cột `email`, `role`).
3. Quyền (máy chủ tự chặn bằng `requireRole_` — ẩn nút trên giao diện chỉ để gọn):

| Thao tác | viewer | editor | root |
|---|:-:|:-:|:-:|
| Xem Blog, Sản phẩm (danh sách + chi tiết) | ✓ | ✓ | ✓ |
| Thêm / sửa / xoá / sắp xếp Blog, Sản phẩm; tải ảnh | | ✓ | ✓ |
| Xem Đơn hàng, Liên hệ | ✓ | ✓ | ✓ |
| Đổi trạng thái + ghi chú nội bộ của Đơn hàng | | ✓ | ✓ |
| Đánh dấu Liên hệ đã xử lý | | ✓ | ✓ |
| Xoá Liên hệ (spam) | | | ✓ |
| Người dùng: thêm / đổi quyền / xoá (chỉ editor, viewer) | | | ✓ |

   Dòng `root` trong bảng Users chỉ sửa tay trong bảng, CMS không cấp / gỡ root.

## II. Sản phẩm

### II.1 Field có ô nhập

| Field | Ô nhập | Bắt buộc | Dùng ở site |
|---|---|:-:|---|
| `title` | Tên sản phẩm (không kèm mã) | ✓ | H1, thẻ sản phẩm: hiện "`title` \| `code`" |
| `code` | Mã sản phẩm, VIẾT HOA (vd MAYV1017) | ✓, không trùng | SKU = `code`-`size` (nhiều màu: `code`-`MÀU`-`size`) |
| `slug` | Tự sinh từ Tên + Mã, sửa được trước lần lưu đầu | ✓ | `/product/<slug>/` |
| `collection` | Chọn 1 trong 2: `mua-he`, `dong-bo` | ✓ | trang bộ sưu tập, "Cùng bộ sưu tập" |
| `is_new` | Tick "Sản phẩm mới" | | `/collection/san-pham-moi/` + khối trang chủ |
| `featured` | Tick "Nổi bật ở Blog" | | mục "Sản phẩm nổi bật" dưới mỗi bài blog |
| `available` | Tick "Còn hàng" (mặc định có) | | bỏ tick = nút "HẾT HÀNG", schema OutOfStock |
| `type` | Loại: Váy / Áo / Quần / Đồng bộ / Khác | ✓ | JSON-LD `category` |
| `price` | Giá bán (₫) | ✓ (>0) | mọi size, mọi màu cùng giá |
| `price_old` | Giá gốc (tuỳ chọn) | | > giá bán thì hiện giá gạch ngang ở trang chi tiết |
| `colors` | Danh sách màu: tên, mã màu (tuỳ chọn), ảnh của màu (tuỳ chọn) | ≥1 màu | vòng tròn màu; mã màu trống → build tự tra theo tên (`COLOR_CSS`) |
| `sizes` | Tick S / M / L / XL (+ ô size khác, cách nhau dấu phẩy) | ≥1 size | nút size, size nhanh trên thẻ |
| `images` | Gallery ảnh (ảnh đầu = ảnh đại diện), ← → đổi chỗ, Gỡ | ≥1 ảnh | gallery trang chi tiết, thẻ sản phẩm |
| `content` | "Thông tin sản phẩm" — TinyMCE, có nút **Chèn ảnh** | | popup "Thông tin sản phẩm" |
| `seo_title` | Tuỳ chọn | | trống = "`title` \| `code` – May By Mây" |
| `seo_description` | Tuỳ chọn | | trống = tự sinh (tên, giá, màu, size, hotline) |

### II.2 Biến thể (variant)

Không nhập tay. `build.py` sinh = màu × size, giá = `price`, `compare` = `price_old`, còn hàng =
`available`. `id` = số cố định băm từ `slug|màu|size` (giỏ hàng lưu theo id, đổi thứ tự không làm
lệch). Ảnh của biến thể = ảnh của màu (nếu chọn) hoặc ảnh đầu.

### II.3 Bộ sưu tập (build tự suy ra, không lưu file riêng)

`all` (mọi sản phẩm) · `san-pham-moi` (tick Sản phẩm mới) · `mua-he` · `dong-bo`. Thứ tự trong
mọi danh sách = thứ tự sản phẩm trong CMS (nút Sắp xếp).

### II.4 Ảnh

`html/images/products/<slug>/NN.jpg` (giữ đúng thư mục ảnh sản phẩm hiện có). Tên số tăng dần,
không đánh số lại. Gỡ ảnh khỏi gallery không xoá file (bài blog có thể đang dùng). Xoá sản phẩm
xoá cả thư mục ảnh, TRỪ KHI còn bài blog dùng ảnh trong thư mục đó (ảnh đại diện hoặc trong nội
dung) — khi đó giữ lại ảnh để bài blog không vỡ.

## III. Blog

| Field | Ô nhập | Bắt buộc | Dùng ở site |
|---|---|:-:|---|
| `title` | Tiêu đề | ✓ | H1, thẻ bài |
| `slug` | Tự sinh từ tiêu đề | ✓ | `/blog/<slug>/` |
| `category` | 1 trong 3: `meo-phoi-do`, `tin-tuc-thoi-trang`, `cham-soc-trang-phuc` | ✓ | tab chuyên mục |
| `date` | Ngày đăng (mặc định hôm nay) | ✓ | sắp xếp mới → cũ, hiện trên thẻ bài |
| `description` | Mô tả ngắn (sapo) | ✓ | dòng dẫn dưới H1, thẻ bài, mô tả Google |
| `cover` | Ảnh đại diện | ✓ | thẻ bài, ảnh đầu bài, ảnh chia sẻ |
| `content` | TinyMCE, có nút **Chèn ảnh** (ảnh + chú thích) | | thân bài |
| `seo_title`, `seo_description` | Tuỳ chọn | | trống = "Tiêu đề – Blog May By Mây" / `description` |

Ảnh: `html/images/blog/<slug>/cover-<thời điểm>.jpg` và `NN.jpg`. Trong nội dung lưu dạng
`../../images/...` (trang bài luôn ở 2 cấp thư mục); bài cũ dùng `/images/...` vẫn đúng.

Bài blog sắp xếp theo `date`, không có nút Sắp xếp.

## IV. Sửa và xoá (chung Blog + Sản phẩm)

- `slug` khoá sau lần lưu đầu hoặc sau khi đã tải ảnh (ảnh nằm theo thư mục slug).
- Lưu mà không đụng ô nội dung → gửi lại đúng nội dung gốc (không để TinyMCE chuẩn hoá lại).
- Xoá: hỏi xác nhận bằng pop-up giữa màn hình → xoá detail + thư mục ảnh riêng → gỡ khỏi index.
  Trang `.html` cũ do CI xoá (build dựng lại thư mục `product/`, `blog/`).

## V. Đơn hàng

1. Nhận từ `html/js/pages/checkout.js` (POST text/plain JSON, KHÔNG đổi payload):
   `{form:"order", code, name, phone, email, province, ward, address, note, paymentMethod,
   items:[{handle,title,color,size,qty,price}], total, hp}`.
2. Máy chủ **tính lại** giá từng dòng và tổng từ danh sách sản phẩm đang bán (không tin giá do
   trình duyệt gửi). Sản phẩm không còn trên website → báo lỗi, không nhận đơn.
3. Mã đơn: giữ mã khách đã thấy (`MBM` + yymmdd + 4 số) nếu đúng định dạng và chưa trùng, nếu
   không máy chủ cấp mã mới và trả về.
4. Bảng `Orders`: `id, customer_name, phone, email, province, ward, address_detail, note,
   payment_method, items_json, total, status, admin_note, created_at, updated_at, updated_by`.
5. Trạng thái: `moi` Mới · `da_xac_nhan` Đã xác nhận · `dang_giao` Đang giao · `hoan_thanh`
   Hoàn thành · `huy` Đã huỷ. Đổi trạng thái được tự do giữa các bước (sửa nhầm được).
6. Tab Đơn hàng: lọc theo trạng thái, tìm theo mã / tên / số điện thoại, bấm 1 đơn để xem chi
   tiết (địa chỉ, sản phẩm, ghi chú khách, phương thức thanh toán), đổi trạng thái + ghi chú nội
   bộ. Không sửa sản phẩm / địa chỉ, không xoá đơn (cần thì sửa tay trong bảng).
7. Chống spam: honeypot `hp`, 1 số điện thoại 1 đơn / 20 giây, tối đa 50 dòng, số lượng 1–99.

## VI. Liên hệ

1. Nhận từ `html/js/pages/contact.js`: `{form:"contact", name, email, phone, order_code, topic,
   message, hp}`. Bắt buộc: tên, email hợp lệ, lời nhắn. SĐT nếu có phải hợp lệ.
2. Bảng `Contacts`: `id, name, email, phone, order_code, topic, message, status, created_at`.
   `status`: `moi` / `da_xu_ly`.
3. Chống spam: honeypot, 1 email 1 lần / 20 giây.

## VII. Thông báo

- Telegram (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`): đơn mới (mã, khách, SĐT, tổng, thanh
  toán) và liên hệ mới.
- Email: đơn mới → `ORDER_NOTIFY_EMAIL`; liên hệ mới → `CONTACT_NOTIFY_EMAIL`. Nhiều người: cách
  nhau dấu phẩy. Trống = không gửi. Chung quota 100 mail/ngày với mã OTP.
- Thông báo lỗi không bao giờ làm hỏng việc lưu đơn / liên hệ.

## VIII. UX chung (giữ nguyên như tretrucvn)

- Pop-up thông báo / xác nhận giữa màn hình, phải bấm Đóng. Mọi thao tác làm đổi website nhắc
  "Website sẽ được cập nhật sau 1-2 phút!".
- Mọi nút gọi máy chủ: disable + spinner.
- Mở app: hiện ngay từ cache (localStorage, khoá theo `CLIENT_BUILD` = băm app.html + js.html),
  làm mới ngầm; sau mọi Lưu / Xoá / Sắp xếp ghi lại cache ngay.
- Khung báo lỗi đỏ cố định (lỗi JS, TinyMCE không khởi tạo) để chụp màn hình gửi kỹ thuật.
- **Chuỗi lỗi hiện cho người dùng không nhắc tên hạ tầng** (kho mã nguồn, bảng tính, Drive...).
- TinyMCE 6.8.5 tự host ở `https://maybymay.vn/vendor/tinymce/` (không CDN). Website phải có
  `/vendor/tinymce/` TRƯỚC khi cập nhật CMS.
- Trang `/admin/` nhúng web app bằng iframe (cắt thanh cảnh báo 25px của Google), quá 12 giây
  hiện nút "Mở ở tab riêng" trỏ thẳng URL `/exec`.

## IX. Kiến trúc lưu trữ

```
data/products.json                   index sản phẩm (commit CHỐT — CI theo dõi)
data/products/<slug>/detail.json     đầy đủ 1 sản phẩm
data/blog.json                       index blog (commit CHỐT — CI theo dõi)
data/blog/<slug>/detail.json         đầy đủ 1 bài
html/images/products/<slug>/*        ảnh sản phẩm
html/images/blog/<slug>/*            ảnh bài blog
Google Sheet "MayByMay CMS"          Users, Orders, Contacts (dữ liệu khách KHÔNG lên repo)
```

Mỗi thao tác Lưu ghi detail trước, index **sau cùng** (index là file kích hoạt CI). CI
(`.github/workflows/build.yml`) chạy `python3 scripts/build.py`, commit `html/`, Cloudflare tự
triển khai từ commit đó.

Thư mục `gas/` gitignore, deploy bằng clasp (`gas/README.md`). Mỗi lần cập nhật: Deploy →
Manage deployments → sửa deployment cũ → **New version** (giữ nguyên URL `/exec`), KHÔNG tạo
deployment mới.

## X. Script Properties (tên cố định)

| Tên | Giá trị |
|---|---|
| `GITHUB_TOKEN` | Fine-grained token, chỉ repo site, quyền Contents: Read and write |
| `GITHUB_REPO` | `tranquanghuy-rightsvn/maybymay` |
| `GITHUB_BRANCH` | `master` |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | tuỳ chọn |
| `ORDER_NOTIFY_EMAIL`, `CONTACT_NOTIFY_EMAIL` | tuỳ chọn |
| `SPREADSHEET_ID` | tự tạo ở lần chạy đầu, không điền tay |
| `token:<uuid>` | phiên đăng nhập, tự quản lý |
