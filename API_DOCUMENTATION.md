# Tài liệu API – Website bán laptop LAPSTORE

Tài liệu mô tả REST API của **backend NodeJS + Express** (`server/`), mà **frontend ReactJS** (`client/`) gọi tới. Viết theo mã nguồn hiện tại.

---

## 1. Tổng quan

- **Địa chỉ**: server chạy tại `http://localhost:4000`. Khi dev, frontend ở `http://localhost:3001` gọi `/api/...` và Vite chuyển tiếp sang cổng 4000.
- **Định dạng**: request và response dạng `JSON` (riêng tải ảnh dùng `multipart/form-data`).
- **Mã lỗi**: lỗi trả về dạng `{ "error": "thông báo" }` (nhiều API thay đổi dữ liệu trả thêm `"success": false`). Lỗi hệ thống trả `500 { "error": "Đã có lỗi xảy ra, vui lòng thử lại sau" }`; bản ghi không tồn tại khi sửa/xóa trả `404 { "error": "Không tìm thấy dữ liệu" }`.
- **Tiền tệ**: VNĐ, lưu `DECIMAL(15,2)` trong MySQL, trả về dạng `number` (server tự đổi kiểu Decimal của Prisma sang số).
- **Số điện thoại** (đặt hàng, sổ địa chỉ, hồ sơ, góp ý, tra cứu): phải bắt đầu bằng số 0 và gồm 10–11 chữ số (khoảng trắng, dấu chấm được tự bỏ; lưu dạng gọn, VD `0987654321`), sai → `400 Số điện thoại phải bắt đầu bằng số 0 và gồm 10–11 chữ số`. Kiểm tra bằng `shared/validate.ts`, dùng chung cho React và Express.
- **Không có số âm**: server từ chối số âm ở mọi ô số (giá, tồn kho, bảo hành, voucher…), tiền giảm của voucher luôn ≥ 0; database có thêm ràng buộc `CHECK` (migration `20261025000000_non_negative_checks`) nên tồn kho, số lượng, giá, điểm, lượt dùng voucher không thể âm kể cả khi sửa trực tiếp trong phpMyAdmin. Hết hàng thì tồn kho dừng ở 0.
- **Mã nguồn**: `server/src/routes/*.ts` (mỗi file một nhóm API), gắn vào ứng dụng trong `server/src/app.ts`.

### 1.1 Xác thực và phân quyền

- Đăng nhập thành công, server ghi **JWT** vào cookie `lapstore_token` (`httpOnly`, `SameSite=Lax`, hạn 30 ngày, `Secure` khi chạy production). Token chứa `id` và `role`, ký bằng `AUTH_SECRET`.
- Trình duyệt tự gửi cookie ở mọi request (client gọi `fetch` với `credentials: "include"`).
- Middleware (`server/src/middleware/auth.ts`):
  - `loadUser`: đọc cookie, token hợp lệ thì gắn `req.user = { id, role }`; token sai/hết hạn thì bỏ qua.
  - `requireAuth`: chưa đăng nhập → `401 { "error": "Vui lòng đăng nhập để tiếp tục" }`. Có token nhưng **tài khoản không còn trong CSDL** (VD: database vừa được đặt lại) → xóa cookie, `401 { "error": "Phiên đăng nhập không còn hợp lệ, vui lòng đăng nhập lại" }`. Vai trò (`role`) luôn lấy mới từ CSDL chứ không tin vai trò ghi trong token.
  - `requireAdmin`: như `requireAuth`, thêm điều kiện không phải `ADMIN` → `403 { "error": "Không có quyền thực hiện" }`.
  - Frontend nhận `401` ở API cần đăng nhập thì tự chuyển về trạng thái chưa đăng nhập và đưa người dùng tới trang đăng nhập.
- Server **không bao giờ nhận `userId` từ client**: mọi truy vấn đơn hàng, địa chỉ, ghi chú… đều lọc theo `req.user.id`.

| Nhóm | Quyền |
| :--- | :--- |
| Sản phẩm, danh mục, voucher đang hiệu lực, tra cứu, góp ý, ảnh | Công khai |
| Đặt hàng, đơn hàng, đánh giá, yêu thích, ghi chú, thông báo, hồ sơ, địa chỉ, chat | Cần đăng nhập |
| `/api/admin/**` | Chỉ `ADMIN` |

---

## 2. Tài khoản – `routes/auth.ts`

### 2.1 Đăng ký
- **Endpoint**: `POST /api/auth/register` · Công khai
- **Body**: `{ "email", "password", "name" }`
- **Xử lý**: kiểm tra đủ trường, email hợp lệ, mật khẩu ≥ 6 ký tự, email chưa dùng → băm bcrypt → tạo user role `USER` (email lưu chữ thường; client không tự đặt được role).
- **Phản hồi**: `201 { "message": "Đăng ký thành công", "userId": "..." }` · `400` `Vui lòng nhập đầy đủ thông tin` | `Email không hợp lệ` | `Mật khẩu phải có ít nhất 6 ký tự` | `Email này đã được sử dụng`

### 2.2 Đăng nhập
- **Endpoint**: `POST /api/auth/login` · Công khai
- **Body**: `{ "email", "password" }`
- **Phản hồi**:
  - `200` + header `Set-Cookie: lapstore_token=...; HttpOnly` và body
    ```json
    { "user": { "id": "...", "name": "Admin", "email": "admin@gmail.com", "role": "ADMIN", "points": 0, "rank": "BRONZE" } }
    ```
  - `400` `Vui lòng nhập email và mật khẩu` · `401` `Email hoặc mật khẩu không đúng`

### 2.3 Đăng xuất
- **Endpoint**: `POST /api/auth/logout` → xóa cookie, `200 { "success": true }`

### 2.4 Người dùng hiện tại
- **Endpoint**: `GET /api/auth/me` · Không bắt buộc đăng nhập
- **Phản hồi**: `200 { "user": { id, name, email, role, points, rank } }` hoặc `{ "user": null }`. Điểm và hạng luôn lấy mới từ CSDL. Token trỏ tới tài khoản đã bị xóa thì trả `{ "user": null }` và xóa cookie.

### 2.5 Quên mật khẩu (OTP qua Gmail)
- **Endpoint**: `POST /api/auth/forgot-password` · Body `{ "email" }`
- **Xử lý**: tạo mã OTP 6 chữ số (sinh bằng `crypto.randomInt`), hạn 1 giờ, lưu vào `user.resetToken` / `resetTokenExpiry`, gửi email qua Gmail (Nodemailer, `server/src/lib/mail.ts`, tài khoản gửi lấy từ `GMAIL_USER` + `GMAIL_APP_PASSWORD` trong `server/.env`).
- **Mỗi lần gọi lại sẽ tạo mã mới và mã cũ mất hiệu lực ngay**: chỉ mã trong email mới nhất dùng được. Gmail gộp các thư cùng tiêu đề thành một hội thoại, thư mới nhất nằm cuối.
- **Phản hồi**: `200 { "message": "Mã OTP đã được gửi đến email ..." }` · `400` thiếu email · `404` `Email không tồn tại trong hệ thống` · `500` `Không gửi được email. Vui lòng kiểm tra cấu hình Gmail của cửa hàng.` (App Password sai/bị thu hồi, hoặc server chưa khởi động lại sau khi sửa `.env`)

### 2.6 Đặt lại mật khẩu
- **Endpoint**: `POST /api/auth/reset-password` · Body `{ "email": "a@b.com", "token": "123456", "password": "matkhaumoi" }`
- `email`: trang `/reset-password?email=...` luôn gửi kèm. Có email thì server kiểm tra mã của **đúng tài khoản đó** (không chỉ tìm theo mã) và báo lỗi cụ thể. Bỏ trống thì tìm tài khoản theo mã như cũ.
- `token`: khoảng trắng được tự bỏ (VD dán `" 123 456 "` vẫn nhận).
- **Thành công**: `200 { "message": "Mật khẩu đã được cập nhật thành công" }`. Mật khẩu mới được băm bcrypt, mã OTP bị xóa nên không dùng lại được.
- **Lỗi `400`**:

| Trường hợp | Thông báo |
|---|---|
| Thiếu mã hoặc mật khẩu < 6 ký tự | `Mã OTP hoặc mật khẩu mới không hợp lệ (tối thiểu 6 ký tự)` |
| Chưa yêu cầu mã / mã đã dùng để đổi mật khẩu | `Tài khoản chưa yêu cầu mã OTP hoặc mã đã được sử dụng. Vui lòng bấm gửi lại mã.` |
| Quá 1 giờ | `Mã OTP đã hết hạn (quá 1 giờ). Vui lòng bấm gửi lại mã.` |
| Sai mã, thường do dùng mã của email cũ | `Mã OTP không đúng. Mỗi lần gửi lại, mã cũ sẽ mất hiệu lực – hãy dùng mã trong email mới nhất.` |

---

## 3. Sản phẩm & danh mục – `routes/catalog.ts` (công khai)

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/categories` | Danh mục `[{ id, name, slug }]`, sắp theo tên |
| `GET /api/products` | Toàn bộ laptop kèm `reviews: [{ rating }]`, sản phẩm nổi bật lên đầu. Lọc/sắp xếp thực hiện ở trình duyệt |
| `GET /api/products/suggestions?q=` | Gợi ý khi gõ tìm kiếm: theo tên, hãng, CPU, SKU; tối đa 6 kết quả `{ id, name, brand, price, imageUrl }`. Không có `q` → `[]` |
| `GET /api/products/:id` | Chi tiết sản phẩm (xem bên dưới); không tồn tại → `404` |
| `GET /api/collections/:slug` | Đường dẫn ngắn: slug danh mục → `{ "query": "category=gaming" }`, slug hãng → `{ "query": "brand=dell" }`, không khớp → `404` |

**`GET /api/products/:id`** – tăng lượt xem và trả về:
```json
{
  "product": {
    "id": "...", "sku": "ASU-001", "name": "ASUS Vivobook 15 ...", "brand": "ASUS",
    "price": 15990000, "originalPrice": 17990000, "stockQuantity": 12,
    "cpu": "...", "ram": "...", "ramGb": 16, "storage": "...", "storageGb": 512, "gpu": "...", "display": "...",
    "battery": "...", "weight": "...", "os": "...", "ports": "...", "connectivity": "...", "color": "...",
    "warrantyMonths": 24, "viewCount": 120, "description": "...", "imageUrl": "/images/products/asu-001.jpg",
    "category": { "id": "...", "name": "Laptop Văn phòng - Học tập", "slug": "van-phong" },
    "reviews": [{ "id": "...", "rating": 5, "comment": "...", "user": { "name": "..." }, "replies": [{ "content": "...", "user": { "name": "...", "role": "ADMIN" } }] }]
  },
  "related": [ /* tối đa 5 máy cùng danh mục hoặc cùng hãng */ ],
  "isFavorite": false,
  "note": ""
}
```
`isFavorite` và `note` (ghi chú riêng) chỉ có giá trị khi khách đã đăng nhập.

---

## 4. Mua hàng – `routes/shop.ts`

### 4.1 Mã giảm giá
- `GET /api/vouchers/active` · Công khai – voucher đang bật và chưa hết hạn, kèm `products: [{ id }]` (rỗng = áp dụng cả đơn).
- `POST /api/vouchers/validate` · Công khai – Body `{ "code": "LAPTOP500K", "items": [{ "id", "quantity" }] }`
  - Giá lấy từ CSDL; hạng thành viên lấy theo người đang đăng nhập (chưa đăng nhập = BRONZE).
  - Hợp lệ: `{ "success": true, "voucherId", "code", "discountAmount": 500000, "description" }`
  - Không hợp lệ (vẫn HTTP 200): `{ "success": false, "error": "<mã lỗi>", "params"? }` với mã lỗi `voucher.notFound`, `voucher.inactive`, `voucher.expired`, `voucher.usageLimitExceeded`, `voucher.rankRequired` (`params.rank`), `voucher.minOrderAmountRequired` (`params.amount`), `voucher.notApplicable`. Frontend dịch mã lỗi sang tiếng Việt/Anh.

### 4.2 Đặt hàng
- **Endpoint**: `POST /api/checkout` · Cần đăng nhập
- **Body**:

  | Trường | Kiểu | Bắt buộc | Mô tả |
  | :--- | :--- | :--- | :--- |
  | `items` | Array | Có | `[{ "id": "<productId>", "quantity": 1 }]`, số lượng nguyên 1–10. Giá, tên… client gửi lên đều bị bỏ qua |
  | `paymentMethod` | String | Không | `COD` (mặc định), `VNPAY`, `MOMO` |
  | `voucherCode` | String | Không | Không phân biệt hoa thường |
  | `shippingInfo` | Object | Có | `{ "name", "phone", "address" }` |
  | `note` | String | Không | Tối đa 500 ký tự |

- **Xử lý**:
  1. Kiểm tra giỏ hàng, thông tin nhận hàng, số lượng; gộp dòng trùng sản phẩm.
  2. Lấy giá và tồn kho từ CSDL; tính voucher (`server/src/lib/voucher-calc.ts`).
  3. Trong **một transaction**: trừ kho có điều kiện `stockQuantity >= quantity` (chống bán vượt tồn kho khi nhiều người mua cùng lúc); tăng lượt dùng voucher nếu còn; tạo `Order` + `OrderItem` (lưu `priceAtPurchase`); tạo thông báo "Đặt hàng thành công". `paymentStatus` = `PENDING` với COD, `PAID` với VNPAY/MoMo (cổng thanh toán đang mô phỏng).
- **Phản hồi**: `200 { "message": "Đặt hàng thành công", "orderId": "..." }` · `401` · `400` `Giỏ hàng trống` | `Vui lòng nhập đầy đủ thông tin nhận hàng` | `Số lượng mỗi sản phẩm phải từ 1 đến 10 máy` | `Có sản phẩm không còn tồn tại...` | `"<tên máy>" chỉ còn <n> sản phẩm` | `Mã giảm giá không tồn tại` | `Mã giảm giá không áp dụng được cho đơn hàng này` | `"<tên máy>" vừa hết hàng, vui lòng thử lại` | `Mã giảm giá đã hết lượt sử dụng`

---

## 5. Tài khoản khách hàng – `routes/account.ts` (cần đăng nhập)

### 5.1 Đơn hàng & đánh giá

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/orders` | Đơn của tôi, mới nhất trước, kèm `items[].product { id, name, brand, imageUrl }` và `reviews[].productId` (sản phẩm đã đánh giá) |
| `GET /api/orders/:id` | Chi tiết một đơn (trang đặt hàng thành công, hóa đơn): kèm `user`, `items[].product { name, sku, warrantyMonths }`, `voucher.code`. Chỉ chủ đơn hoặc admin; người khác nhận `404` |
| `POST /api/orders/:id/cancel` | Khách hủy đơn khi còn `PENDING`/`CONFIRMED`: hoàn kho, trả lượt voucher, đơn đã thanh toán chuyển `REFUNDED`. Lỗi: `Chỉ có thể hủy đơn hàng khi cửa hàng chưa đóng gói` |
| `POST /api/orders/:id/confirm` | Khách xác nhận đã nhận hàng (đơn `SHIPPING`/`DELIVERED`) → `COMPLETED`, `PAID`, cộng điểm `floor(tổng tiền / 10.000)` và cập nhật hạng |
| `POST /api/reviews` | Body `{ orderId, productId, rating (1–5), comment? }`. Chỉ đơn `COMPLETED` của chính mình, sản phẩm thuộc đơn, mỗi sản phẩm/đơn đánh giá một lần |

### 5.2 Yêu thích, ghi chú, thông báo

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/favorites` | Danh sách sản phẩm yêu thích (kèm `reviews[].rating`) |
| `POST /api/favorites/:productId/toggle` | Thêm/bỏ yêu thích → `{ "success": true, "isFavorite": true }` |
| `PUT /api/notes/:productId` | Body `{ "content" }` – lưu ghi chú riêng, để trống = xóa |
| `GET /api/notifications` | Thông báo của tôi (`ORDER`, `PRICE_DROP`, `INFO`, `SYSTEM`) |
| `GET /api/notifications/unread-count` | `{ "count": 3 }` |
| `POST /api/notifications/read-all` | Đánh dấu tất cả đã đọc |
| `POST /api/notifications/:id/read` | Đánh dấu một thông báo đã đọc (chỉ của chính mình) |

### 5.3 Hồ sơ & sổ địa chỉ

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/account/profile` | `{ name, email, phoneNumber, address, points, rank }` |
| `PUT /api/account/profile` | Body `{ name, phoneNumber?, address? }`; tên bắt buộc; số điện thoại được bỏ trống, nếu nhập phải bắt đầu bằng 0 |
| `GET /api/addresses` | Sổ địa chỉ nhận hàng |
| `POST /api/addresses` | Body `{ title?, name, phone, address, isDefault? }`, `phone` bắt đầu bằng 0. Địa chỉ đầu tiên tự là mặc định |
| `PUT /api/addresses/:id` | Sửa địa chỉ của chính mình (người khác → `404`) |
| `DELETE /api/addresses/:id` | Xóa; xóa địa chỉ mặc định thì địa chỉ khác được chọn làm mặc định |
| `POST /api/addresses/:id/default` | Đặt làm mặc định |

---

## 6. Chat với cửa hàng – `routes/chat.ts`

| Endpoint | Quyền | Mô tả |
| :--- | :--- | :--- |
| `GET /api/chat/unread` | Không bắt buộc | `{ "count" }`: khách đếm tin cửa hàng gửi chưa đọc, admin đếm tin khách gửi chưa đọc; chưa đăng nhập = 0 |
| `GET /api/chat/conversations` | Đăng nhập | Khách: hội thoại của mình; admin: tất cả. Kèm `user`, `product`, `unreadCount`, sắp theo tin mới nhất |
| `POST /api/chat/conversations` | Khách | Body `{ productId? }` – mở lại hoặc tạo hội thoại (theo sản phẩm hoặc chung). Admin gọi → `400` |
| `GET /api/chat/conversations/:id/messages` | Chủ hội thoại / admin | Danh sách tin, đồng thời đánh dấu đã đọc tin của phía bên kia. Không có quyền → `404` |
| `POST /api/chat/conversations/:id/messages` | Chủ hội thoại / admin | Body `{ content }` (tối đa 2000 ký tự, không rỗng); cập nhật tin cuối của hội thoại |

Giao diện tự làm mới tin nhắn mỗi 5 giây và số tin chưa đọc mỗi 15 giây.

---

## 7. Dịch vụ khách hàng – `routes/service.ts` (công khai)

| Endpoint | Body | Mô tả |
| :--- | :--- | :--- |
| `POST /api/service/order-lookup` | `{ code, phone }` | Tra cứu đơn bằng mã đơn (8 ký tự đầu, có/không `#`) **và** số điện thoại nhận hàng (phải bắt đầu bằng 0; bỏ qua khoảng trắng/dấu chấm khi so khớp). Số không đúng định dạng hoặc không khớp → `{ success: false, error }` |
| `POST /api/service/warranty-lookup` | `{ code, phone }` | Hạn bảo hành từng máy: tính từ ngày đơn hoàn tất; trạng thái `ACTIVE`, `EXPIRED` hoặc `NOT_ACTIVATED` (đơn chưa hoàn tất) |
| `POST /api/feedback` | `{ name, phone, email?, orderCode?, type, content }` | Góp ý/khiếu nại; `type` = `SUGGESTION`/`COMPLAINT`/`WARRANTY` (sai → `SUGGESTION`); nội dung ≥ 10 ký tự. Trả `201` |

---

## 8. Ảnh – `routes/media.ts`

- `GET /api/proxy-image?url=` · Công khai – tải ảnh từ link ngoài qua server (tránh bị chặn hotlink), cache 1 năm. **Chặn** link tới máy nội bộ (`localhost`, `127.x`, `10.x`, `192.168.x`, `172.16–31.x`…) và giao thức khác http/https → `400`; nội dung không phải ảnh (hoặc SVG) → `415`; ảnh > 10MB → `413`; không tải được → `502`.
- `GET /uploads/products/:name` · Công khai – ảnh admin đã tải lên. Tên file phải khớp `^[a-z0-9-]+\.(jpg|png|webp)$` (chặn `../`), sai → `404`. Trả `Content-Type` đúng định dạng, cache 1 năm.
- Ảnh mẫu `/images/products/<sku>.jpg` là file tĩnh của frontend (`client/public`).

---

## 9. Quản trị – `routes/admin.ts` (chỉ `ADMIN`)

### 9.1 Tổng quan & đơn hàng

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/admin/dashboard` | `{ revenueAll, revenueMonth, userCount, productCount, orderCount, pendingCount, lowStock[], recentOrders[], days[{ label, total }] (doanh số 7 ngày, không tính đơn hủy), topProducts[{ id, name, quantity }] }` |
| `GET /api/admin/orders?status=&q=` | `{ orders, counts: { PENDING: 3, ... } }`. `q` tìm theo mã đơn, tên/SĐT người nhận, email khách |
| `PATCH /api/admin/orders/:id/status` | Body `{ status, trackingCode? }` – xem quy tắc bên dưới |

**Quy tắc chuyển trạng thái đơn** (`server/src/lib/orders.ts`):
- Chỉ đi đúng thứ tự `PENDING → CONFIRMED → PACKED → SHIPPING → DELIVERED → COMPLETED`, không nhảy cóc; có thể `CANCELLED` khi đơn chưa kết thúc.
- Chuyển sang `SHIPPING` bắt buộc có `trackingCode`.
- COD chuyển `DELIVERED` → tự đánh dấu `PAID`. `COMPLETED` → cộng điểm, cập nhật hạng. `CANCELLED` → hoàn kho, trả lượt voucher, đã thanh toán thì `REFUNDED`.
- Đơn `COMPLETED`/`CANCELLED` không đổi được nữa. Mỗi lần đổi trạng thái gửi thông báo cho khách.
- Lỗi (`400`): `Trạng thái không hợp lệ`, `Đơn hàng không tồn tại`, `Đơn hàng đã kết thúc, không thể thay đổi`, `Không thể chuyển từ "..." sang "..."`, `Vui lòng nhập mã vận đơn trước khi giao hàng`.

### 9.2 Sản phẩm & ảnh

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/admin/products?q=&brand=&stock=low\|out` | `{ products, categories, brands, stats: { total, low, out, inventoryValue } }` |
| `POST /api/admin/products` | Thêm sản phẩm (body như bảng dưới) → `201 { success, id }`, ghi lịch sử giá |
| `PUT /api/admin/products/:id` | Sửa; đổi giá thì ghi `PriceHistory`, **giảm giá** thì gửi thông báo `PRICE_DROP` cho khách đã yêu thích |
| `DELETE /api/admin/products/:id` | Không xóa được sản phẩm đã có trong đơn hàng (`400`: `... Hãy đặt tồn kho về 0 để ngừng bán.`) |
| `POST /api/admin/upload` | `multipart/form-data`, trường `file` (JPG/PNG/WEBP ≤ 5MB) → `{ "url": "/uploads/products/1729750000000-3f9a1c2b.jpg" }`. Định dạng nhận diện theo **chữ ký đầu file**, không tin đuôi file hay MIME; tên file do server tự sinh. Lỗi `400`: `Chưa chọn ảnh` / `Ảnh phải nhỏ hơn 5MB` / `Chỉ nhận ảnh JPG, PNG hoặc WEBP` |

**Body sản phẩm**:

| Trường | Kiểu | Bắt buộc | Mô tả / Ví dụ |
| :--- | :--- | :--- | :--- |
| `name` | String | Có | `ASUS Vivobook 15 X1504VA i5-1335U/16GB/512GB` |
| `sku` | String | Có | Duy nhất, tự viết hoa. VD `ASU-011` (trùng → `Mã SKU đã tồn tại`) |
| `brand` | String | Có | Apple, Dell, ASUS, Lenovo, HP, Acer, MSI hoặc hãng khác |
| `categoryId` | String | Không | Để trống = chưa phân loại |
| `price` | Number | Có | > 0 |
| `originalPrice` | Number | Không | ≥ giá bán; dùng hiển thị % giảm |
| `stockQuantity` | Number | Có | ≥ 0 |
| `warrantyMonths` | Number | Không | 0–120 tháng, bỏ trống = 12 |
| `color` | String | Không | `Bạc` |
| `imageUrl` | String | Không | Đường dẫn do API tải ảnh trả về (`/uploads/products/...`), ảnh mẫu `/images/products/...` hoặc link `http(s)://` (khác → `Link ảnh không hợp lệ`) |
| `isFeatured` | Boolean | Không | Hiện ở mục nổi bật trang chủ |
| `cpu` | String | Có | `Intel Core i5-1335U (10 nhân 12 luồng, tối đa 4.6GHz)` |
| `ram` / `ramGb` | String / Number | Có | `16GB DDR5 4800MHz` / `16` |
| `storage` / `storageGb` | String / Number | Có | `512GB SSD M.2 PCIe NVMe` / `512` (1TB = `1024`) |
| `gpu`, `display` | String | Có | Card đồ họa, màn hình |
| `battery`, `weight`, `os`, `connectivity`, `ports` | String | Không | |
| `description` | String | Không | Đoạn cách nhau bởi dòng trống; dòng bắt đầu `## ` là tiêu đề mục |

### 9.3 Danh mục, khách hàng, đánh giá, góp ý, voucher

| Endpoint | Mô tả |
| :--- | :--- |
| `GET /api/admin/categories` | Danh mục kèm `_count.products` |
| `POST /api/admin/categories` | Body `{ name }`, slug tự tạo (bỏ dấu tiếng Việt) |
| `PUT /api/admin/categories/:id` | Đổi tên, **giữ nguyên slug** để không hỏng link đã chia sẻ |
| `DELETE /api/admin/categories/:id` | Sản phẩm thuộc danh mục chuyển về "Chưa phân loại" |
| `POST /api/admin/categories/seed` | Tạo 5 danh mục mặc định (gaming, văn phòng, đồ họa, mỏng nhẹ, doanh nhân) |
| `GET /api/admin/users` | `{ users: [{ ..., _count.orders, spent }], buyers }` – không trả mật khẩu |
| `GET /api/admin/reviews` | Đánh giá kèm sản phẩm, khách, số phản hồi |
| `DELETE /api/admin/reviews/:id` | Xóa đánh giá |
| `POST /api/admin/reviews/:id/reply` | Body `{ content }` – cửa hàng phản hồi đánh giá (nút "Phản hồi" trên trang sản phẩm) |
| `GET /api/admin/feedback?status=` | `{ feedbacks, counts }` |
| `PATCH /api/admin/feedback/:id` | Body `{ status: NEW\|PROCESSING\|RESOLVED, adminNote? }` |
| `GET /api/admin/vouchers` | Tất cả voucher kèm `_count.products` |
| `POST /api/admin/vouchers` | Body `{ code (A-Z, 0-9, -, _ 3–30 ký tự), description?, discountType: PERCENTAGE\|FIXED_AMOUNT, discountValue (> 0, % ≤ 100), minOrderAmount? (≥ 0, trống = 0), maxDiscount? (> 0, trống = không giới hạn), usageLimit? (số nguyên ≥ 1, trống = 100), expiryDate? (ngày hợp lệ), minRank? }`; sai → `400` kèm thông báo; trùng mã → `Mã giảm giá đã tồn tại` |
| `PATCH /api/admin/vouchers/:id` | Body `{ isActive }` – bật/tắt |
| `DELETE /api/admin/vouchers/:id` | Mã đã dùng trong đơn thì không xóa được, chỉ tắt |

---

## 10. Bảo mật – tóm tắt

- Mật khẩu băm bcrypt; JWT trong cookie `httpOnly` + `SameSite=Lax` (giảm nguy cơ XSS đánh cắp token và CSRF).
- Phân quyền bằng middleware ở server; frontend chỉ ẩn/hiện giao diện.
- Giá, tồn kho, tiền giảm luôn tính lại ở server khi đặt hàng; các thao tác tồn kho / voucher / trạng thái đơn chạy trong `prisma.$transaction`.
- Hàm nội bộ (`createNotification`, xử lý đơn hàng) nằm trong `server/src/lib/`, không mở thành API.
- Tải ảnh kiểm tra nội dung file thật, giới hạn 5MB, tên file do server sinh; phục vụ ảnh chặn `../`.
- Proxy ảnh chặn địa chỉ mạng nội bộ.

## 11. Kiểm thử

`npm test` ở thư mục gốc chạy:
- **server/tests** (Vitest + Supertest): gọi thật vào ứng dụng Express với Prisma giả lập – đăng ký/đăng nhập/OTP, phân quyền 401/403, đặt hàng (giá từ CSDL, tồn kho, voucher, tranh chấp mua cùng lúc), đơn hàng của khách, đánh giá, sổ địa chỉ, chat, tra cứu, góp ý, quản trị sản phẩm/đơn hàng, tải ảnh, proxy ảnh.
- **client** (Vitest): các hàm tiện ích định dạng giá, gộp class.
- **Kiểm thử đầu-cuối** (25/10/2026, Chrome + MySQL XAMPP thật): 76 bước (46 bước luồng chính khách → admin, 16 bước bổ sung: sản phẩm đã xem, trả góp, máy hết hàng, chọn một phần giỏ hàng, voucher theo sản phẩm, quyền xem hóa đơn, đặt lại mật khẩu bằng OTP, tiếng Anh/tiếng Việt, bộ lọc admin, giao diện điện thoại; 14 bước kiểm tra Mua ngay, giỏ hàng đồng bộ giá/tồn kho, tài khoản bị xóa), đạt toàn bộ, không phát sinh lỗi HTTP 5xx hay 4xx ngoài các trường hợp được kiểm tra chủ đích (đăng nhập sai, voucher không hợp lệ, khách gọi API admin…).
