# 🧑‍💻 Ngữ cảnh dự án: LAPSTORE – Website bán laptop (B2C)

> Dán file này vào đầu cuộc trò chuyện với AI, rồi điền yêu cầu ở mục 12.

## 1. Thông tin chung
- **Tên:** LAPSTORE – website bán laptop chính hãng, **một cửa hàng duy nhất** (admin) bán cho khách hàng. Không có người bán thứ ba, không có ví, escrow hay phí sàn.
- **Kiến trúc:** 2 ứng dụng tách riêng trong một repo (npm workspaces), giao tiếp qua REST API JSON.
- **Stack:**
  - Frontend (`client/`): **ReactJS 19** + **Vite** + **React Router 7** + TypeScript
  - Backend (`server/`): **NodeJS** + **Express 5** + TypeScript (chạy bằng `tsx`)
  - Database: **MySQL** (XAMPP, port 3306, DB `laptop_db`) + **Prisma ORM 6.2** (`server/prisma/`)
  - Auth: **JWT** (jsonwebtoken) trong cookie httpOnly `lapstore_token`; mật khẩu bcrypt
  - Styling: **Tailwind CSS v4** (`@tailwindcss/vite`) + **Framer Motion** + **Lucide React**. Màu theme: `primary` (xanh), `secondary` (đỏ) cùng các bản `-dark`, khai báo trong `client/src/index.css`
  - Email OTP: **Nodemailer** + Gmail App Password; tải ảnh: **Multer**
  - Test: **Vitest** + **Supertest** (`server/tests/`), Vitest (`client/src/**/*.test.ts`)
- **Thông tin cửa hàng** (tên, hotline, email, Zalo, showroom, menu chính sách/dịch vụ), nhãn trạng thái đơn và quy tắc tính hạng nằm ở `shared/site.ts` (dùng chung client + server).

---

## 2. Cấu trúc thư mục

```
shared/
├── site.ts                      # Hằng số cửa hàng, trạng thái đơn, hạng thành viên
├── format.ts                    # formatVND, discountPercent, shortOrderId
└── validate.ts                  # PHONE_PATTERN (0 + 9–10 số), isValidPhone, normalizePhone – dùng ở cả React và Express

server/                          # BACKEND – Express, cổng 4000
├── .env / .env.example
├── prisma/
│   ├── schema.prisma, migrations/
│   ├── data/laptops.ts          # 70 laptop mẫu: 7 hãng x 10 máy
│   └── seed.ts                  # admin, khách demo, 5 danh mục, 70 laptop (ảnh client/public/images/products/<sku>.jpg), 4 voucher
├── src/
│   ├── index.ts                 # listen(PORT)
│   ├── app.ts                   # createApp(): json, cookie-parser, loadUser, gắn router, phục vụ client/dist nếu có, xử lý lỗi
│   ├── middleware/auth.ts       # loadUser (req.user = {id, role}), requireAuth, requireAdmin
│   ├── routes/
│   │   ├── auth.ts              # register, login, logout, me, forgot-password (OTP Gmail), reset-password
│   │   ├── catalog.ts           # categories, products, products/suggestions, products/:id, collections/:slug
│   │   ├── shop.ts              # vouchers/active, vouchers/validate, checkout
│   │   ├── account.ts           # orders, reviews, favorites, notes, notifications, account/profile, addresses
│   │   ├── chat.ts              # chat/unread, chat/conversations, .../:id/messages
│   │   ├── service.ts           # service/order-lookup, service/warranty-lookup, feedback
│   │   ├── media.ts             # proxy-image (chặn mạng nội bộ), /uploads/products/:name
│   │   └── admin.ts             # dashboard, orders, products, upload, categories, users, reviews, feedback, vouchers
│   └── lib/
│       ├── prisma.ts, auth.ts (JWT, cookie, bcrypt), mail.ts, notify.ts (createNotification – nội bộ)
│       ├── orders.ts            # completeOrderTx, cancelOrderTx, adminUpdateOrderStatus, customerCancel/Confirm
│       ├── voucher-calc.ts      # computeVoucherDiscount – dùng cho validate & checkout
│       ├── uploads.ts           # thư mục server/uploads/products, kiểm tra chữ ký file ảnh
│       └── http.ts              # str/int/bool đọc body, isUniqueError, decimalReplacer (Decimal → number)
└── tests/                       # helpers.ts (Prisma giả, cookie đăng nhập), *.test.ts

client/                          # FRONTEND – React, cổng 3001 (proxy /api, /uploads → 4000)
├── index.html, vite.config.ts, eslint.config.js
├── public/images/products/      # Ảnh mẫu 70 máy
└── src/
    ├── main.tsx                 # BrowserRouter > AuthProvider > LanguageProvider > App
    ├── App.tsx                  # Bảng route; RequireAuth / RequireAdmin / GuestOnly; trang admin lazy-load
    ├── lib/
    │   ├── api.ts               # api() (fetch + credentials, ném ApiError), apiAction() (trả {success, error}), useApi() (GET + reload)
    │   ├── auth.tsx             # AuthProvider, useAuth() {user, login, logout, refresh}, RequireAuth, RequireAdmin, GuestOnly
    │   ├── types.ts             # Kiểu dữ liệu API trả về (Product, Order, Voucher…)
    │   ├── cart.ts              # useCart({ sync }) (localStorage "lapstore_cart", luôn đọc bản mới nhất – không giữ bản sao riêng từng component; sync: đồng bộ giá/tồn kho từ /api/products), maxQuantity() = min(tồn kho, MAX_QTY_PER_ITEM=10 trong shared/site.ts); Mua ngay: setBuyNowItem/readBuyNowItem (sessionStorage "lapstore_buy_now", trang /checkout?mode=buy-now)
    │   ├── catalog-filters.ts   # Nhóm bộ lọc (giá, CPU, RAM, SSD, màn hình, Hz, VGA, OS)
    │   ├── dictionaries.ts      # Từ điển vi/en
    │   ├── policies.ts          # Nội dung trang chính sách
    │   └── useTitle.ts, utils.ts (cn + re-export shared/format)
    ├── components/
    │   ├── layout/              # Navbar, MegaMenu, Footer, FloatingContact, NotificationBell, LogoutButton, ScrollToTop
    │   ├── products/            # ProductCard, ProductCatalog, ProductImage, RecentlyViewed, PrivateNoteBox
    │   ├── home/                # HomeBanner, DealSection, Promotions
    │   ├── profile/AddressManagement.tsx, admin/AdminSidebar.tsx
    │   └── providers/LanguageProvider.tsx
    └── pages/
        ├── HomePage, ProductsPage, CollectionPage, CartPage, NotificationsPage, InvoicePage, SupportPage, PolicyPage, NotFoundPage
        ├── product/             # ProductDetailPage, ProductTabs, PurchaseActions, InstallmentButton
        ├── checkout/            # CheckoutPage, CheckoutSuccessPage
        ├── auth/                # Login, Register, ForgotPassword, ResetPassword
        ├── buyer/               # OrdersPage (+OrderProgress, OrderActionButtons), FavoritesPage, SettingsPage (+ProfileForm)
        ├── chat/                # ChatPage, ChatClient (prop embedded cho admin)
        ├── service/             # OrderLookup, WarrantyLookup, Feedback, Showrooms
        └── admin/               # AdminLayout (Outlet) + các trang Admin*Page và form
```

---

## 3. Phân quyền
- **Server (quyết định thật):** `loadUser` đọc JWT từ cookie; `requireAuth` → 401 (kể cả khi tài khoản trong token đã bị xóa – xóa cookie; role lấy lại từ CSDL), `requireAdmin` → 401/403. Client nhận 401 thì `api.ts` phát sự kiện `lapstore:session-expired`, `AuthProvider` đặt `user = null`. Toàn bộ `/api/admin/**` qua `requireAdmin`. Không nhận `userId` từ client; tài nguyên của người khác trả 404.
- **Công khai:** sản phẩm, danh mục, collections, voucher đang hiệu lực + validate, tra cứu đơn/bảo hành, góp ý, `/api/auth/**`, `/api/chat/unread`, `/api/proxy-image`, `/uploads/**`.
- **Client (chỉ giao diện):** `RequireAuth` chuyển về `/login?callbackUrl=...`; `RequireAdmin` chỉ cho ADMIN; `GuestOnly` cho `/login`, `/register`.

---

## 4. Database (Prisma) – các model chính

```prisma
model User        { id, role(ADMIN|USER), name, email @unique, passwordHash, phoneNumber?, address?,
                    points, rank(BRONZE|SILVER|GOLD|PLATINUM), resetToken?, resetTokenExpiry? }
model Category    { id, name @unique, slug @unique }        // gaming, van-phong, do-hoa, mong-nhe, doanh-nhan
model Product     { id, sku @unique, name, brand, price Decimal, originalPrice Decimal?, stockQuantity,
                    categoryId?, cpu, ram, ramGb Int, storage, storageGb Int, gpu, display,
                    battery?, weight?, os?, ports?, connectivity?, color?, warrantyMonths,
                    isFeatured, viewCount, description? (Text; dòng "## " là tiêu đề mục), imageUrl? }
model PriceHistory{ productId, price, createdAt }
model Order       { id, userId, subTotal, discountAmount, shippingFee, totalPayment,
                    paymentMethod(COD|VNPAY|MOMO), paymentStatus(PENDING|PAID|FAILED|REFUNDED),
                    status(PENDING|CONFIRMED|PACKED|SHIPPING|DELIVERED|COMPLETED|CANCELLED),
                    voucherId?, shippingName/Phone/Address, note?, trackingCode? }
model OrderItem   { orderId, productId, quantity, priceAtPurchase }   // lưu cứng giá lúc mua
model Review      { orderId, productId, userId, rating 1-5, comment?; @@unique([orderId, productId]) }
model ReviewReply { reviewId, userId (admin), content }
model Voucher     { code @unique, discountType(PERCENTAGE|FIXED_AMOUNT), discountValue, minOrderAmount,
                    maxDiscount?, expiryDate?, usageLimit, usedCount, isActive, minRank,
                    products Product[] }   // rỗng = áp dụng cả đơn
model Conversation{ userId (khách), productId?, lastMessage?, lastMsgAt }
model Message     { conversationId, senderId, content, isRead }
model Notification{ userId, title, message, type(INFO|ORDER|PRICE_DROP|SYSTEM), isRead, link? }
model Favorite / PrivateNote  { userId, productId; @@unique([userId, productId]) }
model UserAddress { userId, title?, name, phone, address, isDefault }
model Feedback    { userId?, name, phone, email?, orderCode?, type(SUGGESTION|COMPLAINT|WARRANTY),
                    content, status(NEW|PROCESSING|RESOLVED), adminNote? }
```

---

## 5. REST API (server/src/routes)

| Route | Method | Quyền | Mục đích |
|-------|--------|-------|----------|
| `/api/auth/register`, `/login`, `/logout` | POST | Công khai | Đăng ký, đăng nhập (đặt cookie), đăng xuất |
| `/api/auth/me` | GET | – | Người dùng hiện tại hoặc `null` |
| `/api/auth/forgot-password`, `/reset-password` | POST | Công khai | OTP qua Gmail (gửi lại → mã cũ mất hiệu lực); đặt lại mật khẩu bằng `{ email, token, password }`, kiểm tra mã theo email, báo lỗi cụ thể |
| `/api/categories`, `/api/products`, `/api/products/:id` | GET | Công khai | Danh mục, sản phẩm, chi tiết (+ related, isFavorite, note) |
| `/api/products/suggestions?q=` | GET | Công khai | Gợi ý tìm kiếm (tối đa 6) |
| `/api/collections/:slug` | GET | Công khai | Slug → `{ query }` để lọc |
| `/api/vouchers/active` | GET | Công khai | Voucher đang hiệu lực |
| `/api/vouchers/validate` | POST | Công khai | Kiểm tra voucher cho giỏ hàng |
| `/api/checkout` | POST | Đăng nhập | Tạo đơn hàng |
| `/api/orders`, `/api/orders/:id` | GET | Chủ đơn (/:id cả admin) | Đơn của tôi, chi tiết đơn |
| `/api/orders/:id/cancel`, `/confirm` | POST | Chủ đơn | Hủy đơn, xác nhận đã nhận |
| `/api/reviews` | POST | Chủ đơn COMPLETED | Đánh giá |
| `/api/favorites`, `/api/favorites/:productId/toggle` | GET, POST | Đăng nhập | Yêu thích |
| `/api/notes/:productId` | PUT | Đăng nhập | Ghi chú riêng |
| `/api/notifications`, `/unread-count`, `/read-all`, `/:id/read` | GET, POST | Đăng nhập | Thông báo |
| `/api/account/profile` | GET, PUT | Đăng nhập | Hồ sơ |
| `/api/addresses`, `/:id`, `/:id/default` | GET, POST, PUT, DELETE | Đăng nhập | Sổ địa chỉ |
| `/api/chat/unread` | GET | – | Số tin chưa đọc |
| `/api/chat/conversations`, `/:id/messages` | GET, POST | Đăng nhập | Chat |
| `/api/service/order-lookup`, `/warranty-lookup` | POST | Công khai (khớp SĐT) | Tra cứu |
| `/api/feedback` | POST | Công khai | Góp ý, khiếu nại |
| `/api/proxy-image?url=`, `/uploads/products/:name` | GET | Công khai | Ảnh |
| `/api/admin/dashboard` | GET | ADMIN | Thống kê |
| `/api/admin/orders`, `/:id/status` | GET, PATCH | ADMIN | Đơn hàng |
| `/api/admin/products`, `/:id` | GET, POST, PUT, DELETE | ADMIN | Sản phẩm |
| `/api/admin/upload` | POST | ADMIN | Tải ảnh (multipart, trường `file`) → `{ url }` |
| `/api/admin/categories`, `/:id`, `/seed` | GET, POST, PUT, DELETE | ADMIN | Danh mục |
| `/api/admin/users` | GET | ADMIN | Khách hàng |
| `/api/admin/reviews`, `/:id`, `/:id/reply` | GET, DELETE, POST | ADMIN | Đánh giá |
| `/api/admin/feedback`, `/:id` | GET, PATCH | ADMIN | Góp ý |
| `/api/admin/vouchers`, `/:id` | GET, POST, PATCH, DELETE | ADMIN | Mã giảm giá |

Chi tiết tham số và phản hồi: xem `API_DOCUMENTATION.md`.

---

## 6. Cách frontend gọi API
- Đọc dữ liệu: `const { data, error, loading, reload } = useApi<Kieu>("/api/...")` (truyền `null` để chưa gọi).
- Thay đổi dữ liệu: `const res = await apiAction("POST", "/api/...", body)` → `res.success` / `res.error` (không ném lỗi), sau đó gọi `reload()` hoặc callback `onChanged` / `onSaved` của component cha.
- Cần ném lỗi (try/catch): `await api<T>(path, { method, body })` → `ApiError { message, status }`.
- Người dùng: `const { user, login, logout, refresh } = useAuth()`; sau khi đổi hồ sơ gọi `refresh()`.
- Chuyển trang sau đăng nhập chỉ do `GuestOnly` + `afterLoginPath()` (lib/auth.tsx) quyết định – trang đăng nhập không tự `navigate` để tránh 2 lệnh chuyển trang tranh nhau.
- Form gửi dữ liệu dùng `onSubmit` + `e.preventDefault()`, **không** dùng `<form action={fn}>` (React 19 tự xóa form về giá trị ban đầu sau khi action chạy).
- Server tự đổi `Decimal` → number bằng `Prisma.Decimal.isDecimal` (không dò theo tên lớp – tên lớp bị thu gọn khi đóng gói).

---

## 7. Business logic

### Đặt hàng (`POST /api/checkout` – `server/src/routes/shop.ts`)
```
Client gửi: items [{id, quantity}], paymentMethod, voucherCode?, shippingInfo {name, phone, address}, note?
→ quantity là số nguyên 1..10; giá lấy từ DB (không tin client)
→ kiểm tra tồn kho, tính voucher bằng computeVoucherDiscount()
→ $transaction:
    product.updateMany(where stockQuantity >= qty, decrement)   // count=0 → lỗi hết hàng
    voucher.updateMany(where usedCount < usageLimit, increment)
    order.create(... items, paymentStatus = COD ? PENDING : PAID)   // VNPAY/MoMo đang mô phỏng
    notification "Đặt hàng thành công"
```

### Trạng thái đơn (`server/src/lib/orders.ts`)
```
PENDING → CONFIRMED → PACKED → SHIPPING (bắt buộc trackingCode) → DELIVERED → COMPLETED
Admin chỉ chuyển sang bước kế tiếp (NEXT_ORDER_STATUS trong shared/site.ts) hoặc CANCELLED.
DELIVERED + COD → paymentStatus = PAID
COMPLETED → paymentStatus = PAID, cộng điểm floor(totalPayment / 10.000), cập nhật rank
CANCELLED → hoàn kho, trả 1 lượt voucher, PAID → REFUNDED
Mỗi thay đổi do admin → gửi Notification type ORDER cho khách
```

### Hạng thành viên (`rankForPoints` trong shared/site.ts)
| Rank | Điểm |
|------|------|
| BRONZE | 0 |
| SILVER | 2.000 |
| GOLD | 5.000 |
| PLATINUM | 10.000 |

### Giá & yêu thích
Admin sửa giá → thêm PriceHistory; nếu giá giảm → Notification PRICE_DROP cho người đã yêu thích.

### Chat
Khách chỉ thấy hội thoại của mình; admin thấy tất cả và trả lời. Tin chưa đọc: với khách là tin do cửa hàng gửi, với admin là tin do khách gửi.

---

## 8. Luật kỹ thuật bắt buộc
- ✅ Số điện thoại: client gắn `phoneInputProps` (`client/src/lib/inputs.ts`), server kiểm tra `isValidPhone` và lưu `normalizePhone`.
- ✅ Không số âm: ô số dùng `onKeyDown={blockNegativeKeys}` + `min`; server kiểm tra; DB có `CHECK` (migration `20261025000000_non_negative_checks`, viết tay vì Prisma không mô tả được CHECK).
- ✅ Tiền lưu `DECIMAL(15,2)`. Server tự đổi Decimal → number khi trả JSON (`decimalReplacer` trong `app.ts`); ngày trả dạng chuỗi ISO.
- ✅ Thao tác đụng tiền/tồn kho dùng `prisma.$transaction(async (tx) => {...})`.
- ✅ Mọi API thay đổi dữ liệu kiểm tra quyền ở server (middleware + kiểm tra chủ sở hữu), không dựa vào việc ẩn nút trên React.
- ✅ Lỗi nghiệp vụ trả `400 { error }` bằng tiếng Việt; lỗi hệ thống để rơi vào error handler (`500`, không lộ chi tiết).
- ✅ Express 5 tự bắt lỗi của handler `async`, không cần try/catch chỉ để gọi `next(err)`.
- ✅ Code dùng chung client + server đặt ở `shared/`, không import package riêng của một phía.
- ✅ Trang React: gọi hook trước mọi `return` sớm (ESLint `react-hooks/rules-of-hooks`).
- ✅ Chữ hiển thị đa ngôn ngữ thêm vào cả `vi` và `en` trong `client/src/lib/dictionaries.ts`.
- ✅ Thêm API mới thì thêm test Supertest trong `server/tests/`.

---

## 9. Biến môi trường (`server/.env`)

```env
DATABASE_URL="mysql://root:@127.0.0.1:3306/laptop_db"
AUTH_SECRET="your-random-secret"     # ký JWT
PORT=4000                            # tùy chọn
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"
# CLIENT_ORIGIN="https://..."        # chỉ khi frontend ở tên miền khác (bật CORS)
```
Frontend: `VITE_API_URL` (chỉ khi deploy React tách khỏi server).

---

## 10. Lệnh thường dùng (ở thư mục gốc)

```bash
npm install                 # Cài thư viện cho cả client và server
npm run dev                 # server :4000 + client :3001
npm run db:migrate          # Tạo DB + bảng từ migration
npm run db:seed             # Seed dữ liệu mẫu (chạy lại được, upsert theo SKU)
npm test                    # Test server + client
npm run typecheck           # tsc cả 2 phần
npm run build && npm start  # Build React, Express phục vụ luôn trên :4000
cd server && npx prisma migrate dev --name <ten>   # Migration mới sau khi sửa schema
cd server && npx prisma studio                     # GUI xem/sửa DB
npm run lint                # ESLint frontend
```

---

## 11. Tài khoản mẫu (sau `npm run db:seed`)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@gmail.com` | `12345678` |
| Khách hàng | `khachhang@gmail.com` | `12345678` |

Voucher mẫu: `LAPTOP500K`, `SINHVIEN5`, `GAMING1TR` (chỉ laptop gaming), `VIPGOLD10` (hạng GOLD trở lên).

---

## 12. Yêu cầu của tôi

> **[VIẾT YÊU CẦU CỦA BẠN VÀO ĐÂY]**

**File liên quan:** _(ví dụ: `server/src/routes/admin.ts`, `client/src/pages/admin/AdminOrdersPage.tsx`)_

**Lỗi gặp phải:** _(dán stack trace nếu có)_
