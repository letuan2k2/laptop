# KẾ HOẠCH SẢN PHẨM: WEBSITE BÁN LAPTOP CHÍNH HÃNG (B2C)

## 1. Tổng quan dự án

| Mục | Nội dung |
|-----|----------|
| Tên sản phẩm | **LAPSTORE** – Website thương mại điện tử bán laptop chính hãng (tên có thể đổi trong `shared/site.ts`) |
| Mô hình | **B2C**: một cửa hàng duy nhất (admin) bán trực tiếp cho khách hàng, tương tự các chuỗi bán lẻ máy tính |
| Lĩnh vực | Thương mại điện tử, bán lẻ thiết bị công nghệ |
| Sản phẩm kinh doanh | Laptop của 7 thương hiệu: Apple, Dell, ASUS, Lenovo, HP, Acer, MSI |

## 2. Bài toán & giải pháp

**Vấn đề**
- Laptop là sản phẩm giá trị cao, nhiều thông số kỹ thuật. Khách hàng khó so sánh và khó chọn máy phù hợp nhu cầu (gaming, văn phòng, đồ họa…).
- Khách cần tin tưởng về hàng chính hãng, bảo hành, chính sách đổi trả và cần được tư vấn trước khi mua.
- Cửa hàng cần một công cụ quản lý tập trung: sản phẩm, tồn kho, đơn hàng, khuyến mãi, chăm sóc khách hàng.

**Giải pháp**
- Danh mục sản phẩm có **thông số lưu thành từng trường riêng** (CPU, RAM, ổ cứng, card đồ họa, màn hình, pin, trọng lượng…), giúp **lọc nhiều tiêu chí** và hiển thị bảng thông số rõ ràng.
- Quy trình đặt hàng đơn giản, nhiều phương thức thanh toán, theo dõi trạng thái đơn theo từng bước.
- Kênh chat tư vấn trực tiếp giữa khách và cửa hàng.
- Chương trình khách hàng thân thiết (tích điểm, xếp hạng) và mã giảm giá theo hạng.

**Nguồn doanh thu**: lợi nhuận bán lẻ (chênh lệch giữa giá nhập và giá bán). Không có người bán thứ ba, không thu phí sàn.

## 3. Công nghệ sử dụng

| Thành phần | Công nghệ |
|-----------|-----------|
| Frontend | **ReactJS 19** + Vite, React Router 7, TypeScript (thư mục `client/`) |
| Giao diện | Tailwind CSS v4, Framer Motion, Lucide React |
| Backend | **NodeJS** + **Express 5**, REST API trả JSON (thư mục `server/`) |
| Cơ sở dữ liệu | MySQL / MariaDB (XAMPP) |
| ORM | Prisma 6.2 (migration + Prisma Studio) |
| Xác thực | JWT lưu trong cookie httpOnly (jsonwebtoken), mật khẩu băm bằng bcrypt |
| Email | Nodemailer + Gmail SMTP (gửi OTP quên mật khẩu) |
| Tải ảnh | Multer (nhận file), kiểm tra chữ ký file JPG/PNG/WEBP |
| Kiểm thử | Vitest + Supertest (test API Express) |

**Kiến trúc**: frontend và backend là hai ứng dụng tách riêng. Trình duyệt tải giao diện React; React gọi REST API của Express (`/api/...`); Express truy vấn MySQL qua Prisma. Khi phát triển, Vite (cổng 3001) chuyển tiếp `/api` sang Express (cổng 4000); khi chạy thật, Express có thể phục vụ luôn bản build của React trên cùng một cổng.

## 4. Vai trò người dùng & chức năng

### 4.1 Khách vãng lai (chưa đăng nhập)
- Xem trang chủ, danh sách và chi tiết laptop, mã giảm giá đang áp dụng.
- Tìm kiếm có gợi ý; lọc theo hãng, nhu cầu, mức giá, dòng CPU, RAM, ổ cứng, card đồ họa, kích thước và tần số màn hình, hệ điều hành, còn hàng; sắp xếp.
- Thêm vào giỏ hàng (lưu trên trình duyệt). Phải đăng nhập mới được đặt hàng.

### 4.2 Khách hàng (role `USER`)
- Đăng ký, đăng nhập, quên mật khẩu (OTP 6 số qua email, hết hạn sau 1 giờ, dùng 1 lần; gửi lại thì mã cũ mất hiệu lực). Khi đặt lại mật khẩu, server kiểm tra mã theo đúng email và báo rõ sai mã / hết hạn / đã dùng.
- Đặt hàng: chọn sản phẩm trong giỏ, sổ địa chỉ nhận hàng, ghi chú, áp mã giảm giá, chọn COD / VNPAY / MoMo.
- Theo dõi đơn hàng; tự hủy đơn khi cửa hàng chưa đóng gói; xác nhận đã nhận hàng.
- Đánh giá từng sản phẩm (1–5 sao) sau khi đơn hoàn tất.
- Danh sách yêu thích; nhận **thông báo khi sản phẩm yêu thích giảm giá**.
- Ghi chú cá nhân trên từng sản phẩm (chỉ mình thấy).
- Chat tư vấn với cửa hàng (chung hoặc gắn với một sản phẩm).
- Tra cứu đơn hàng và tra cứu bảo hành bằng **mã đơn + số điện thoại** (không cần đăng nhập).
- In hóa đơn bán hàng (in giấy hoặc lưu PDF) từ trang Đặt hàng thành công, Đơn hàng của tôi hoặc trang quản lý đơn của admin; chỉ chủ đơn hoặc admin xem được.
- Gửi góp ý, khiếu nại; xem hệ thống showroom, các trang chính sách / hướng dẫn; tính thử trả góp 0%.
- Tích điểm, xem hạng thành viên, cập nhật hồ sơ.

### 4.3 Quản trị viên / Cửa hàng (role `ADMIN`)
- **Tổng quan**: doanh thu đơn hoàn tất (tổng và tháng này), doanh số đặt hàng 7 ngày, top sản phẩm bán chạy, cảnh báo sắp hết hàng.
- **Sản phẩm**: thêm/sửa/xóa laptop với đầy đủ thông số, giá bán, giá niêm yết, tồn kho, bảo hành, đánh dấu nổi bật; tải ảnh từ máy lên (JPG/PNG/WEBP ≤ 5MB) và xem trước ngay trong form. Hệ thống ghi lịch sử giá.
- **Đơn hàng**: lọc theo trạng thái, tìm theo mã đơn/tên/SĐT/email, chuyển trạng thái từng bước, nhập mã vận đơn, hủy đơn.
- **Danh mục**, **mã giảm giá**, **khách hàng** (hạng, điểm, tổng chi tiêu), **đánh giá** (xóa / phản hồi), **tin nhắn khách hàng**.
- **Góp ý, khiếu nại**: lọc theo trạng thái (Mới / Đang xử lý / Đã giải quyết), ghi chú xử lý nội bộ.

## 5. Quy trình nghiệp vụ

### 5.1 Vòng đời đơn hàng

```
PENDING (Chờ xác nhận)
   └─► CONFIRMED (Đã xác nhận)
          └─► PACKED (Đã đóng gói)
                 └─► SHIPPING (Đang giao – bắt buộc nhập mã vận đơn)
                        └─► DELIVERED (Đã giao)
                               └─► COMPLETED (Hoàn tất)

CANCELLED (Đã hủy): trên trang admin, nút Hủy hiện khi đơn ở PENDING / CONFIRMED / PACKED;
                    khách tự hủy được khi đơn đang PENDING hoặc CONFIRMED.
```

- Admin chỉ được chuyển đơn sang **trạng thái kế tiếp**, không được nhảy bước.
- Khách bấm **"Đã nhận được hàng"** khi đơn đang SHIPPING hoặc DELIVERED thì đơn chuyển thẳng sang COMPLETED.
- Mỗi lần admin đổi trạng thái, khách nhận một thông báo.

### 5.2 Thanh toán

| Phương thức | Khi đặt hàng | Khi nào thành "Đã thanh toán" |
|------------|--------------|--------------------------------|
| COD | `PENDING` | Khi đơn chuyển sang DELIVERED hoặc COMPLETED |
| VNPAY / MoMo | `PAID` | Ngay khi đặt (**cổng thanh toán đang ở chế độ mô phỏng**) |

Đơn đã thanh toán khi bị hủy sẽ chuyển `paymentStatus = REFUNDED`. Việc hoàn tiền thực tế do cửa hàng thực hiện bên ngoài hệ thống.

### 5.3 Đặt hàng & tồn kho
1. Client chỉ gửi `id` và `quantity` của sản phẩm. **Giá luôn lấy từ CSDL**, mỗi sản phẩm được mua tối đa 10 máy trong một đơn.
2. Kiểm tra tồn kho và mã giảm giá.
3. Trong một transaction: trừ kho **có điều kiện** (`stockQuantity >= quantity`) để không bán vượt tồn khi nhiều người mua cùng lúc; tăng lượt dùng voucher (chỉ khi còn lượt); tạo đơn cùng các dòng hàng (lưu cứng `priceAtPurchase`); gửi thông báo.
4. Khi hủy đơn: hoàn lại tồn kho và trả lại một lượt dùng voucher.
5. **Giỏ hàng** lưu trên trình duyệt (localStorage), thanh toán các sản phẩm đang được tick chọn, tối đa 10 máy mỗi loại (giống giới hạn của server). Khi mở giỏ hàng / trang thanh toán, giỏ được đồng bộ lại giá, tồn kho, tên, ảnh từ server: máy đã ngừng bán bị bỏ khỏi giỏ, số lượng vượt tồn kho được giảm xuống, máy hết hàng hiện "Hết hàng" và tự bỏ chọn. **Mua ngay** chỉ thanh toán riêng sản phẩm đang xem (lưu tạm trong tab), không thêm vào giỏ và không gộp với sản phẩm khác trong giỏ.
6. Khách chưa có địa chỉ nào trong sổ: đặt hàng thành công thì địa chỉ vừa nhập được lưu làm địa chỉ mặc định.
7. Đăng nhập xong: quay lại trang khách đang xem dở (`callbackUrl`, chỉ chấp nhận đường dẫn nội bộ); tài khoản admin vào thẳng trang quản trị.

### 5.4 Mã giảm giá
- Loại: giảm theo **phần trăm** (có thể giới hạn `maxDiscount`) hoặc **số tiền cố định**.
- Điều kiện: đang kích hoạt, chưa hết hạn, còn lượt, đơn đạt giá trị tối thiểu, khách đạt hạng tối thiểu.
- Phạm vi: voucher **không gắn sản phẩm nào thì áp dụng cho cả đơn**; nếu có gắn thì chỉ giảm trên các sản phẩm đó.
- Số tiền giảm không bao giờ vượt quá giá trị phần hàng được giảm.

### 5.5 Tích điểm & hạng thành viên
- Mỗi **10.000đ** trên đơn hoàn tất được **1 điểm** (tính theo tổng thanh toán sau giảm giá).

| Hạng | Điểm tối thiểu | Tương đương chi tiêu |
|------|---------------|----------------------|
| BRONZE | 0 | – |
| SILVER | 2.000 | ~20 triệu |
| GOLD | 5.000 | ~50 triệu |
| PLATINUM | 10.000 | ~100 triệu |

### 5.6 Thông báo giảm giá
Khi admin hạ giá bán của một sản phẩm, hệ thống ghi lịch sử giá và gửi thông báo `PRICE_DROP` tới mọi khách đã thêm sản phẩm đó vào yêu thích.

## 6. Thiết kế cơ sở dữ liệu (tóm tắt)

| Bảng | Vai trò |
|------|---------|
| `user` | Tài khoản (role ADMIN/USER), điểm, hạng, token đặt lại mật khẩu |
| `useraddress` | Sổ địa chỉ nhận hàng, có địa chỉ mặc định |
| `category` | Danh mục theo nhu cầu (gaming, văn phòng, đồ họa, mỏng nhẹ, doanh nhân) |
| `product` | Laptop: SKU, hãng, giá bán, giá niêm yết, tồn kho, **thông số kỹ thuật dạng cột riêng**, lượt xem, mô tả, ảnh |
| `pricehistory` | Lịch sử giá theo thời gian |
| `order` | Đơn hàng: tiền hàng, giảm giá, tổng thanh toán, phương thức/trạng thái thanh toán, trạng thái đơn, thông tin giao hàng, mã vận đơn, ghi chú |
| `orderitem` | Dòng hàng trong đơn, lưu cứng giá lúc mua |
| `review`, `reviewreply` | Đánh giá theo (đơn hàng, sản phẩm) và phản hồi của cửa hàng |
| `voucher` (+ bảng nối `_ProductVouchers`) | Mã giảm giá và sản phẩm áp dụng |
| `favorite`, `privatenote` | Yêu thích, ghi chú cá nhân |
| `conversation`, `message` | Chat giữa khách và cửa hàng |
| `notification` | Thông báo (INFO, ORDER, PRICE_DROP, SYSTEM) |
| `feedback` | Góp ý / khiếu nại / yêu cầu bảo hành gửi từ trang `/gop-y` |

Chi tiết từng trường xem tại `server/prisma/schema.prisma`.

## 7. Nguyên tắc kỹ thuật
- Tiền lưu kiểu `DECIMAL(15,2)`, không dùng FLOAT/DOUBLE.
- Không có số âm: tồn kho chỉ trừ khi còn đủ hàng (hết hàng dừng ở 0); server từ chối số âm ở giá, tồn kho, bảo hành, voucher; tiền giảm của voucher luôn ≥ 0; database có ràng buộc `CHECK` là lớp chặn cuối.
- Số điện thoại phải bắt đầu bằng số 0, gồm 10–11 chữ số; kiểm tra ở cả giao diện (báo lỗi ngay khi nhập) và server.
- Mọi thao tác thay đổi tiền hoặc tồn kho chạy trong `prisma.$transaction` để đảm bảo tính toàn vẹn (ACID).
- Không tin dữ liệu giá/số lượng từ client. Mọi kiểm tra quyền thực hiện ở server Express (middleware `requireAuth` / `requireAdmin` và kiểm tra chủ sở hữu trong từng API), frontend chỉ ẩn/hiện giao diện.
- API `/api/admin/**` chỉ dành cho role ADMIN; trang `/admin` trên React được bọc `RequireAdmin`.

## 8. Hạn chế hiện tại & hướng phát triển
- VNPAY/MoMo mới **mô phỏng**. Khi tích hợp cổng thật cần xác thực callback (IPN), chống xử lý trùng (idempotency) và chỉ đánh dấu PAID sau khi cổng xác nhận.
- Chưa có tự động hoàn tất đơn sau N ngày kể từ khi giao, cũng chưa có giữ chỗ tồn kho trong lúc khách đang thanh toán online.
- Ảnh mẫu của 70 máy là ảnh render của hãng lấy từ các shop trong nước, chỉ dùng cho học tập/demo; kinh doanh thật cần ảnh tự chụp hoặc được cấp quyền.
- Ảnh admin tải lên lưu trên ổ đĩa máy chủ (`server/uploads/products/`); khi chạy nhiều máy chủ cần chuyển sang dịch vụ lưu trữ (S3, Cloudinary...).
- Giao diện điện thoại chưa có nút mở menu danh mục / thương hiệu (đã có trên máy tính); trên điện thoại vẫn tìm kiếm, lọc và chọn danh mục ở trang chủ được.
- Chưa có chức năng đổi mật khẩu khi đang đăng nhập và đổi thông tin tài khoản admin trên giao diện (tài khoản admin tạo bằng seed).
- Giỏ hàng lưu theo trình duyệt, chưa đồng bộ giữa các thiết bị của cùng một tài khoản.
- Form tạo voucher trên trang admin chưa có ô nhập "giảm tối đa", "hạng tối thiểu" và chưa chọn được sản phẩm áp dụng; các thuộc tính này hiện chỉ đặt qua dữ liệu seed.
- API `/api/proxy-image` đã chặn địa chỉ mạng nội bộ, nhưng vẫn tải được từ mọi tên miền công khai; khi triển khai thật nên giới hạn danh sách tên miền được phép.
- Website là ứng dụng một trang (SPA): nội dung do JavaScript dựng ở trình duyệt nên kém thân thiện SEO hơn render phía server; có thể bổ sung prerender hoặc SSR cho trang sản phẩm khi cần.
- Chưa giới hạn số lần đăng nhập sai / gửi OTP (rate limit).
- Showroom chưa có tồn kho riêng từng cửa hàng (chỉ một tồn kho chung); banner trang chủ đang dựng bằng CSS, chưa có ảnh thật.
- Hướng mở rộng: so sánh nhiều laptop cạnh nhau, đăng nhập Google/Facebook/Zalo, tồn kho theo showroom, tin tức công nghệ, thống kê doanh thu theo tháng/hãng.

## 9. Lộ trình thực hiện (gợi ý)

| Giai đoạn | Nội dung |
|----------|----------|
| 1. Khảo sát | Tìm hiểu các website bán lẻ máy tính: cách trình bày thông số, bộ lọc, quy trình đặt hàng, chính sách bảo hành |
| 2. Thiết kế | Use case, ERD, sơ đồ trạng thái đơn hàng, sơ đồ tuần tự luồng đặt hàng; thiết kế giao diện trang khách và trang quản trị |
| 3. Lập trình | Backend Express (API, xác thực JWT, phân quyền), frontend React (trang khách, trang quản trị), voucher, chat, thông báo |
| 4. Kiểm thử & hoàn thiện | Test API (đặt hàng, voucher, phân quyền, chat, tải ảnh…), kiểm thử chức năng theo kịch bản (hết hàng, hủy đơn, voucher hết lượt…), viết tài liệu, quay video demo |

## 10. Chạy demo trên máy cá nhân
Xem hướng dẫn đầy đủ trong `README.md`. Tóm tắt:

```bash
npm install
# Bật MySQL trong XAMPP, tạo file server/.env (DATABASE_URL trỏ tới laptop_db)
npm run db:migrate
npm run db:seed
npm run dev        # backend :4000 + frontend http://localhost:3001
```

Tài khoản mẫu: `admin@gmail.com` / `12345678` (quản trị), `khachhang@gmail.com` / `12345678` (khách hàng).
