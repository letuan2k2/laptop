# 💻 LAPSTORE – Website bán laptop chính hãng

Website thương mại điện tử bán laptop theo mô hình **B2C**: một cửa hàng duy nhất (admin) bán cho khách hàng, tương tự các chuỗi bán lẻ máy tính.

| Phần | Công nghệ | Thư mục |
|------|-----------|---------|
| **Frontend** | **ReactJS 19** + Vite, React Router 7, Tailwind CSS 4 | [`client/`](client/) |
| **Backend** | **NodeJS** + **Express 5** (REST API), JWT trong cookie httpOnly, Nodemailer | [`server/`](server/) |
| **Database** | **MySQL** (XAMPP) qua **Prisma ORM** | [`server/prisma/`](server/prisma/) |
| Dùng chung | Thông tin cửa hàng, trạng thái đơn, định dạng giá | [`shared/`](shared/) |

Frontend và backend là **2 ứng dụng tách riêng**, giao tiếp với nhau qua REST API (`/api/...`, dữ liệu JSON).

> Tên cửa hàng, hotline, email, địa chỉ… khai báo tập trung tại [`shared/site.ts`](shared/site.ts) – sửa một chỗ là đổi trên toàn website.

---

## 🧰 Yêu cầu hệ thống

| Công cụ | Phiên bản tối thiểu |
|---------|-------------------|
| **Node.js** | v20.19 trở lên |
| **npm** | v10 trở lên |
| **XAMPP** (MySQL/MariaDB) | 3.3.0 trở lên |

---

## 🚀 Cài đặt và chạy dự án

### Bước 1 – Cài thư viện (cả client lẫn server)

```bash
npm install
```

> Dự án dùng **npm workspaces**: một lệnh ở thư mục gốc cài cho cả `client/` và `server/`.

### Bước 2 – Bật MySQL

Mở **XAMPP Control Panel** → **Start** dòng **MySQL**.
Không cần tạo database bằng tay – lệnh migrate ở bước 4 sẽ tự tạo `laptop_db`.

### Bước 3 – Tạo file `server/.env`

Sao chép [`server/.env.example`](server/.env.example) thành `server/.env` rồi điền:

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/laptop_db"   # XAMPP mặc định: user root, không mật khẩu
AUTH_SECRET="chuoi-ngau-nhien-dai"                       # dùng để ký JWT đăng nhập
GMAIL_USER="your-email@gmail.com"                        # gửi mã OTP quên mật khẩu
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"                 # App Password, không phải mật khẩu Gmail
```

**Lấy App Password Gmail** (để gửi mã OTP quên mật khẩu):
1. Đăng nhập đúng Gmail sẽ ghi vào `GMAIL_USER`, bật **Xác minh 2 bước** tại https://myaccount.google.com/signinoptions/twosv
2. Vào https://myaccount.google.com/apppasswords → đặt tên (VD `LapStore`) → **Tạo**.
3. Copy chuỗi **16 chữ cái** Google hiện ra (dạng `abcd efgh ijkl mnop`) dán vào `GMAIL_APP_PASSWORD`. Mật khẩu đăng nhập Gmail thường **không dùng được**.

> ⚠️ Server chỉ đọc `server/.env` lúc khởi động – sửa file này xong phải **Ctrl + C rồi chạy lại `npm run dev`**. Không đưa mật khẩu thật vào `.env.example` (file đó được commit lên git).

### Bước 4 – Tạo bảng và dữ liệu mẫu

```bash
npm run db:migrate   # tạo database laptop_db và toàn bộ bảng
npm run db:seed      # tài khoản mẫu, 5 danh mục, 70 laptop có ảnh, 4 voucher
```

Tài khoản sau khi seed:

| Vai trò | Email | Mật khẩu |
|---------|-------|----------|
| Admin (cửa hàng) | `admin@gmail.com` | `12345678` |
| Khách hàng demo | `khachhang@gmail.com` | `12345678` |

### Bước 5 – Chạy ứng dụng

```bash
npm run dev
```

Lệnh này chạy cùng lúc:
- **Backend Express** tại `http://localhost:4000` (API)
- **Frontend React** tại **[http://localhost:3001](http://localhost:3001)** ← mở trang này

Khi dev, Vite chuyển tiếp mọi request `/api/*` và `/uploads/*` từ cổng 3001 sang server 4000, nên cookie đăng nhập hoạt động mà không cần cấu hình CORS.

> **Vì sao mở cả 3001 lẫn 4000 đều thấy giao diện?** Cổng **3001** (Vite) dựng giao diện từ code mới nhất trong `client/src`, sửa code là tự cập nhật. Cổng **4000** (Express) trả lời API và phục vụ **bản build lần cuối** trong `client/dist` (tạo bởi `npm run build`), nên không tự cập nhật theo code. Khi phát triển dùng **3001**; khi demo/triển khai chạy `npm run build` → `npm start` rồi dùng **4000** (chỉ một cổng cho cả giao diện và API).

---

## 🏗️ Kiến trúc

```
 Trình duyệt ──► client/ (ReactJS)  ──fetch /api/...──►  server/ (NodeJS + Express)  ──Prisma──►  MySQL
                 React Router                             routes/ → middleware → lib/
                 lib/api.ts, lib/auth.tsx                 JWT trong cookie httpOnly
```

- **Đăng nhập**: `POST /api/auth/login` kiểm tra mật khẩu (bcrypt), server ghi JWT vào cookie `httpOnly` (JavaScript không đọc được → chống đánh cắp token). Client gọi `GET /api/auth/me` để biết ai đang đăng nhập.
- **Phân quyền**: middleware `requireAuth` / `requireAdmin` ở server; mọi truy vấn lọc theo người dùng trong token, không nhận `userId` từ client. Phía React chỉ ẩn/hiện trang (`RequireAuth`, `RequireAdmin`), quyền thật do server quyết định.
- **Đặt hàng**: giá và tồn kho luôn lấy từ database; trừ kho có điều kiện trong transaction để không bán vượt số lượng.

Chi tiết từng API: xem [API_DOCUMENTATION.md](API_DOCUMENTATION.md).

---

## ✨ Tính năng

**Khách hàng**
- 🔍 Tìm kiếm có gợi ý; lọc theo **hãng, nhu cầu, mức giá, CPU, RAM, ổ cứng, card đồ họa, màn hình**, còn hàng; sắp xếp theo giá
- 📋 Trang sản phẩm: giá niêm yết / giá khuyến mãi, bảng **thông số kỹ thuật**, mô tả chi tiết, đánh giá, sản phẩm tương tự
- 🛒 Giỏ hàng (lưu trên trình duyệt), thanh toán **COD / VNPAY / MoMo** (VNPAY, MoMo đang ở chế độ mô phỏng), sổ địa chỉ, ghi chú đơn
- ⚡ **Mua ngay**: thanh toán riêng máy đang xem, **không thêm vào giỏ hàng** (thoát ra không đặt thì giỏ hàng vẫn như cũ)
- 📍 Lần đầu đặt hàng, địa chỉ nhận hàng được **tự lưu vào sổ địa chỉ** để lần sau không phải nhập lại
- 🎫 Mã giảm giá: theo số tiền / phần trăm, đơn tối thiểu, giới hạn lượt dùng, hạng thành viên, áp dụng cho toàn đơn hoặc một số sản phẩm
- 📦 Theo dõi đơn hàng theo từng bước, tự hủy đơn khi chưa đóng gói, xác nhận đã nhận hàng
- ⭐ Đánh giá từng sản phẩm sau khi đơn hoàn tất
- 👑 Tích điểm (10.000đ = 1 điểm) và hạng **Bronze → Silver → Gold → Platinum**
- ❤️ Yêu thích + **thông báo khi giảm giá**, ghi chú cá nhân trên từng sản phẩm
- 💬 Chat tư vấn trực tiếp với cửa hàng, 🔔 thông báo trạng thái đơn hàng
- ☎️ Số điện thoại ở mọi form phải **bắt đầu bằng số 0** (10–11 chữ số), báo lỗi ngay khi nhập sai
- 🔢 Không có số âm: tồn kho hết hàng dừng ở 0, giá/số lượng/voucher không nhận số âm (chặn ở giao diện, server và database)
- 🔑 Quên mật khẩu: nhận **mã OTP 6 số qua Gmail**, hiệu lực 1 giờ, dùng 1 lần; gửi lại mã thì mã cũ mất hiệu lực. Nhập sai sẽ báo rõ lý do (sai mã / hết hạn / đã dùng), có link "Gửi lại mã"
- 🌐 Giao diện Tiếng Việt / English
- 🧾 Tra cứu đơn hàng và tra cứu bảo hành bằng mã đơn + số điện thoại (không cần đăng nhập)
- 🖨️ In hóa đơn (hoặc lưu PDF): nút ở trang Đặt hàng thành công, trang Đơn hàng của tôi và trang quản lý đơn của admin
- 📝 Gửi góp ý / khiếu nại, xem hệ thống showroom, các trang chính sách & hướng dẫn
- 💳 Bảng tính trả góp 0%, khối "Giá sốc hôm nay" có đếm ngược, sản phẩm đã xem, nút liên hệ nổi (Zalo / hotline / chat)

**Quản trị (admin)**
- 📊 Tổng quan: doanh thu, doanh số 7 ngày, sản phẩm bán chạy, cảnh báo sắp hết hàng
- 💻 Quản lý sản phẩm: thêm/sửa đầy đủ thông số, giá, tồn kho; tải ảnh lên và xem trước; lịch sử giá
- 🚚 Xử lý đơn: Chờ xác nhận → Đã xác nhận → Đã đóng gói → Đang giao (nhập mã vận đơn) → Đã giao → Hoàn tất, hoặc hủy (tự hoàn kho)
- 🏷️ Danh mục, mã giảm giá, khách hàng, đánh giá (xóa / phản hồi), trả lời tin nhắn khách
- 📮 Quản lý góp ý, khiếu nại (đổi trạng thái, ghi chú xử lý)

---

## 📁 Cấu trúc thư mục

```
├── client/                        # FRONTEND – ReactJS
│   ├── index.html
│   ├── vite.config.ts             # Cổng 3001, proxy /api sang server
│   ├── public/images/products/    # Ảnh mẫu của 70 laptop (<sku>.jpg)
│   └── src/
│       ├── main.tsx               # Điểm khởi động React
│       ├── App.tsx                # Bảng định tuyến (React Router)
│       ├── pages/                 # Các trang: sản phẩm, giỏ hàng, thanh toán, tài khoản, admin...
│       ├── components/            # Component dùng chung: Navbar, ProductCard, bộ lọc...
│       └── lib/                   # api.ts (gọi API), auth.tsx (đăng nhập), giỏ hàng, từ điển vi/en
├── server/                        # BACKEND – NodeJS + Express
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma          # Cấu trúc database
│   │   ├── migrations/            # Migration tạo bảng
│   │   ├── data/laptops.ts        # 70 laptop mẫu (7 hãng x 10 máy)
│   │   └── seed.ts                # Script seed dữ liệu
│   ├── src/
│   │   ├── index.ts               # Khởi động server (cổng 4000)
│   │   ├── app.ts                 # Cấu hình Express, gắn các router
│   │   ├── routes/                # auth, catalog, shop (voucher, đặt hàng), account, chat, service, admin, media
│   │   ├── middleware/auth.ts     # Đọc JWT, requireAuth, requireAdmin
│   │   └── lib/                   # Prisma, JWT, gửi mail, xử lý đơn hàng, tính voucher, ảnh tải lên
│   ├── tests/                     # Test API (Vitest + Supertest)
│   └── uploads/products/          # Ảnh admin tải lên (tự tạo, không commit)
└── shared/                        # Dùng chung client + server: site.ts, format.ts, validate.ts (kiểm tra số điện thoại)
```

---

## 🧪 Kiểm thử

- **Test tự động** (`npm test`): 111 test API của server (Vitest + Supertest, gồm đăng nhập/OTP, phân quyền, đặt hàng, voucher, chat, tải ảnh…) và 5 test tiện ích của client.
- **Kiểm thử đầu-cuối trên trình duyệt** (25/10/2026): điều khiển Chrome bấm qua giao diện thật với MySQL XAMPP – 76 bước, gồm 46 bước luồng chính từ khách vãng lai → đăng ký → mua hàng (giỏ hàng, voucher, COD/MoMo, hủy đơn) → chat, thông báo, tra cứu, góp ý → admin xử lý đơn đến khi hoàn tất, cộng điểm, đánh giá & phản hồi, thêm sản phẩm kèm ảnh, giảm giá báo khách, danh mục, voucher; cộng 16 bước bổ sung (sản phẩm đã xem, trả góp, máy hết hàng, chọn một phần giỏ hàng, voucher chỉ áp cho máy gaming, không xem được hóa đơn người khác, đặt lại mật khẩu bằng OTP, giao diện tiếng Anh/tiếng Việt, bộ lọc admin, điện thoại) và 14 bước kiểm tra riêng (Mua ngay, giỏ hàng, tài khoản bị xóa). Kết quả: **đạt toàn bộ, không có lỗi JavaScript hay lỗi API**.
- Các lỗi tìm được trong đợt kiểm thử và đã sửa: giá tiền API trả về dạng chuỗi; admin đăng nhập bị đưa về trang chủ; form hồ sơ hiện lại giá trị cũ sau khi lưu; form góp ý mất nội dung khi gửi lỗi; địa chỉ lần đầu không được lưu; "Mua ngay" tự thêm vào giỏ và tính gộp sản phẩm khác trong giỏ; tài khoản đã bị xóa mà trình duyệt còn cookie thì lưu địa chỉ báo lỗi chung chung (nay báo đăng nhập lại và tự đăng xuất); giỏ hàng giữ giá/tồn kho cũ khi admin đổi giá (nay tự đồng bộ, máy hết hàng tự bỏ chọn); giỏ cho chọn quá 10 máy/loại trong khi server chỉ nhận tối đa 10; thêm 2 máy liên tiếp từ các thẻ sản phẩm ở trang chủ làm mất máy thêm trước; trên điện thoại ô tìm kiếm bị bóp mất và không có lối vào "Đơn hàng của tôi"; voucher nhập "giảm tối đa" âm làm tiền giảm âm (khách bị cộng thêm tiền); bảo hành / đơn tối thiểu nhận số âm; số điện thoại chưa bắt buộc bắt đầu bằng 0.

---

## 🛠️ Lệnh hữu ích (chạy ở thư mục gốc)

```bash
npm run dev          # Chạy cả backend (4000) và frontend (3001)
npm test             # Chạy toàn bộ test của server và client
npm run typecheck    # Kiểm tra kiểu TypeScript cả 2 phần
npm run lint         # ESLint cho frontend (bắt lỗi gọi React hook sai thứ tự)
npm run db:seed      # Seed lại dữ liệu mẫu (chạy lại được, không tạo trùng)
npm run build        # Build frontend React ra client/dist
npm start            # Chạy production: server Express phục vụ luôn client/dist trên cổng 4000
```

Chạy riêng từng phần: `npm run dev -w server` hoặc `npm run dev -w client`. Xem dữ liệu trực quan: `cd server && npx prisma studio`.

---

## 🌍 Triển khai (production)

- **Cách 1 – một máy chủ**: `npm run build` rồi `npm start`. Server Express phục vụ cả API lẫn giao diện React ở cùng một cổng (mặc định 4000).
- **Cách 2 – tách riêng**: build `client/` với biến `VITE_API_URL=https://api.ten-mien-cua-ban` và đưa thư mục `client/dist` lên hosting tĩnh; chạy `server/` ở máy chủ khác và đặt `CLIENT_ORIGIN=https://ten-mien-frontend` trong `server/.env` để bật CORS. Cookie đăng nhập khi đó cần hai tên miền cùng site (VD `lapstore.vn` và `api.lapstore.vn`).

---

## 🖼️ Ảnh sản phẩm

- **Ảnh mẫu**: 70 máy đều có ảnh riêng ở `client/public/images/products/<sku>.jpg` (VD `asu-001.jpg`), 800×800 nền trắng.
  Mỗi máy một ảnh khác nhau; các máy cùng thân vỏ dùng màu hoặc góc chụp khác nhau để dễ phân biệt.
  Lệnh `npm run db:seed` tự gán ảnh theo SKU, và **không ghi đè** ảnh admin đã đổi.
- **Tải ảnh lên**: vào **Admin → Sản phẩm → Thêm/Sửa**, bấm **"Tải ảnh từ máy"** (JPG/PNG/WEBP, tối đa 5MB),
  xem trước rồi bấm Lưu. Ảnh được lưu ở `server/uploads/products/` và hiển thị qua đường dẫn `/uploads/products/<tên-file>`.
  Khi chuyển máy chủ nhớ sao chép cả thư mục `server/uploads/`.
- Vẫn có thể dán link ảnh `https://...`; để trống thì website tự vẽ ảnh minh họa theo màu thương hiệu.
- ⚠️ Ảnh mẫu là ảnh render của hãng lấy từ các shop trong nước, chỉ dùng cho mục đích học tập/demo.
  Khi kinh doanh thật cần dùng ảnh tự chụp hoặc ảnh được hãng/nhà phân phối cấp quyền.

---

## ❓ Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách xử lý |
|-----|-------------|------------|
| `Can't reach database server` | MySQL chưa chạy | Mở XAMPP → Start MySQL |
| `Thiếu biến AUTH_SECRET` | Chưa tạo `server/.env` | Làm theo Bước 3 |
| "Phiên đăng nhập không còn hợp lệ, vui lòng đăng nhập lại" | Tài khoản đang đăng nhập đã bị xóa (VD: vừa chạy lại `npm run db:seed` sau khi xóa database) | Đăng nhập lại hoặc đăng ký lại tài khoản |
| Giỏ hàng "tự có" sản phẩm / mỗi cổng một giỏ khác nhau | Giỏ hàng lưu trong trình duyệt (localStorage) theo từng địa chỉ, không theo tài khoản | `localhost:3001` và `localhost:4000` là 2 giỏ riêng; xóa sản phẩm bằng nút thùng rác |
| Sửa code mà mở `localhost:4000` không thấy thay đổi | Cổng 4000 phục vụ bản build cũ | Chạy `npm run build` rồi Ctrl + F5, hoặc dùng `localhost:3001` khi đang sửa code |
| Trang web báo lỗi kết nối, API 502/504 | Server Express chưa chạy | Chạy `npm run dev` ở thư mục gốc (chạy cả 2 phần) |
| `Không gửi được email` khi quên mật khẩu | App Password Gmail sai/bị thu hồi, dán nhầm mật khẩu Gmail thường, hoặc `GMAIL_USER` không phải tài khoản đã tạo App Password | Bật xác minh 2 bước → tạo App Password (đúng **16 chữ cái**) tại https://myaccount.google.com/apppasswords → dán vào `GMAIL_APP_PASSWORD` → lưu → **khởi động lại server** |
| Đã sửa `server/.env` mà vẫn lỗi như cũ | Server chỉ đọc `.env` lúc khởi động | Ctrl + C rồi chạy lại `npm run dev` |
| "Mã OTP không đúng…" khi đặt lại mật khẩu | Nhập mã của email cũ (mỗi lần bấm gửi lại thì mã cũ mất hiệu lực) | Bấm gửi mã **1 lần**, mở thư **mới nhất** (Gmail gộp thư cùng tiêu đề, thư mới nằm cuối). Mã đúng hiện tại xem được ở cột `resetToken` bảng `user` trong phpMyAdmin |
| Cổng 3001 / 4000 bị chiếm | Ứng dụng khác đang dùng | Đổi `port` trong `client/vite.config.ts` hoặc `PORT` trong `server/.env` (đổi PORT thì chạy client với `API_URL=http://localhost:<cổng>`) |
