// Nội dung các trang chính sách / hướng dẫn (/chinh-sach/[slug]).
// Đây là nội dung mẫu, hãy chỉnh lại cho đúng quy định thực tế của cửa hàng.

export interface PolicySection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface PolicyPage {
  slug: string;
  title: string;
  summary: string;
  sections: PolicySection[];
}

export const POLICIES: PolicyPage[] = [
  {
    slug: "bao-hanh",
    title: "Chính sách bảo hành",
    summary: "Toàn bộ laptop được bảo hành chính hãng theo tiêu chuẩn của nhà sản xuất, tiếp nhận tại tất cả showroom.",
    sections: [
      {
        heading: "1. Thời hạn bảo hành",
        paragraphs: [
          "Thời hạn bảo hành của từng sản phẩm được ghi rõ trên trang sản phẩm và hóa đơn (thường từ 12 đến 36 tháng). Pin và bộ sạc được bảo hành theo quy định riêng của từng hãng.",
          "Thời gian bảo hành được tính từ ngày đơn hàng hoàn tất. Bạn có thể kiểm tra hạn bảo hành tại trang Tra cứu bảo hành.",
        ],
      },
      {
        heading: "2. Điều kiện bảo hành",
        bullets: [
          "Sản phẩm còn trong thời hạn bảo hành, tem bảo hành và số serial còn nguyên vẹn.",
          "Lỗi phát sinh do nhà sản xuất (lỗi phần cứng, linh kiện) trong điều kiện sử dụng bình thường.",
          "Có hóa đơn mua hàng hoặc thông tin đơn hàng trên hệ thống.",
        ],
      },
      {
        heading: "3. Trường hợp không được bảo hành",
        bullets: [
          "Sản phẩm bị rơi vỡ, cong vênh, vào nước, cháy nổ, côn trùng xâm nhập.",
          "Tự ý tháo lắp, sửa chữa tại nơi không phải trung tâm bảo hành ủy quyền.",
          "Hư hỏng do sử dụng sai nguồn điện, thiên tai, hỏa hoạn.",
          "Lỗi phần mềm, virus hoặc mất dữ liệu (cửa hàng hỗ trợ cài đặt lại miễn phí).",
        ],
      },
      {
        heading: "4. Quy trình bảo hành",
        bullets: [
          "Mang máy tới showroom gần nhất hoặc gửi qua đơn vị vận chuyển (cửa hàng hỗ trợ phí gửi với đơn trong 15 ngày đầu).",
          "Nhân viên kỹ thuật kiểm tra và lập phiếu tiếp nhận.",
          "Thời gian xử lý từ 7 đến 15 ngày làm việc tùy hãng; cửa hàng cho mượn máy dùng tạm nếu thời gian bảo hành kéo dài.",
        ],
      },
    ],
  },
  {
    slug: "doi-tra",
    title: "Chính sách đổi trả",
    summary: "1 đổi 1 trong 15 ngày đầu nếu sản phẩm lỗi phần cứng do nhà sản xuất.",
    sections: [
      {
        heading: "1. Đổi mới trong 15 ngày",
        paragraphs: [
          "Trong 15 ngày kể từ ngày nhận hàng, nếu sản phẩm phát sinh lỗi phần cứng do nhà sản xuất, bạn được đổi sang sản phẩm mới cùng mẫu (hoặc mẫu tương đương nếu hết hàng).",
        ],
      },
      {
        heading: "2. Điều kiện đổi trả",
        bullets: [
          "Sản phẩm còn đầy đủ hộp, phụ kiện, quà tặng kèm theo.",
          "Không trầy xước, móp méo, không có dấu hiệu va đập hay vào nước.",
          "Tài khoản đăng nhập trên máy (Apple ID, Microsoft) đã được đăng xuất.",
        ],
      },
      {
        heading: "3. Nhập lại có tính phí",
        paragraphs: [
          "Trường hợp bạn muốn trả lại máy không do lỗi (đổi ý, không vừa nhu cầu), cửa hàng hỗ trợ nhập lại với mức phí từ 10% đến 20% giá trị hóa đơn tùy tình trạng máy và thời gian sử dụng.",
        ],
      },
    ],
  },
  {
    slug: "giao-hang",
    title: "Chính sách giao hàng",
    summary: "Miễn phí giao hàng toàn quốc, nội thành giao nhanh trong 2 giờ.",
    sections: [
      {
        heading: "1. Phí giao hàng",
        paragraphs: ["Miễn phí giao hàng toàn quốc cho tất cả đơn hàng laptop."],
      },
      {
        heading: "2. Thời gian giao hàng",
        bullets: [
          "Nội thành Hà Nội, TP. Hồ Chí Minh, Đà Nẵng: giao trong 2 - 4 giờ với đơn xác nhận trước 18:00.",
          "Các tỉnh thành khác: 1 - 3 ngày làm việc qua đơn vị vận chuyển.",
          "Mã vận đơn được cập nhật trong mục Đơn hàng của tôi và trang Tra cứu đơn hàng khi đơn bắt đầu giao.",
        ],
      },
      {
        heading: "3. Kiểm tra khi nhận hàng",
        paragraphs: [
          "Bạn được kiểm tra ngoại quan, số serial và bật máy trước khi thanh toán (với đơn COD). Nếu sản phẩm không đúng mô tả, bạn có quyền từ chối nhận hàng.",
        ],
      },
    ],
  },
  {
    slug: "hang-chinh-hang",
    title: "Chính sách hàng chính hãng",
    summary: "Cam kết 100% sản phẩm chính hãng, có hóa đơn VAT và được bảo hành tại hãng.",
    sections: [
      {
        heading: "Cam kết của cửa hàng",
        bullets: [
          "Sản phẩm được nhập từ nhà phân phối ủy quyền chính thức tại Việt Nam.",
          "Máy mới 100%, nguyên seal, đầy đủ phụ kiện theo tiêu chuẩn của hãng.",
          "Xuất hóa đơn VAT theo yêu cầu.",
          "Hoàn tiền 200% giá trị sản phẩm nếu phát hiện hàng không chính hãng.",
        ],
      },
    ],
  },
  {
    slug: "bao-mat",
    title: "Chính sách bảo mật thông tin",
    summary: "Thông tin cá nhân của bạn chỉ được dùng để xử lý đơn hàng và chăm sóc khách hàng.",
    sections: [
      {
        heading: "1. Thông tin thu thập",
        paragraphs: ["Họ tên, số điện thoại, email, địa chỉ nhận hàng và lịch sử mua hàng."],
      },
      {
        heading: "2. Mục đích sử dụng",
        bullets: [
          "Xác nhận và giao đơn hàng, tra cứu bảo hành.",
          "Gửi thông báo về trạng thái đơn, ưu đãi dành cho thành viên.",
          "Không chia sẻ cho bên thứ ba ngoài đơn vị vận chuyển phục vụ giao hàng.",
        ],
      },
      {
        heading: "3. Bảo mật tài khoản",
        paragraphs: ["Mật khẩu được mã hóa một chiều; cửa hàng không bao giờ hỏi mật khẩu hoặc mã OTP của bạn."],
      },
    ],
  },
  {
    slug: "huong-dan-mua-hang",
    title: "Hướng dẫn mua hàng trực tuyến",
    summary: "Đặt mua laptop chỉ với vài bước đơn giản.",
    sections: [
      {
        heading: "Các bước đặt hàng",
        bullets: [
          "Bước 1: Tìm sản phẩm bằng ô tìm kiếm hoặc bộ lọc theo hãng, nhu cầu, mức giá, cấu hình.",
          "Bước 2: Bấm \"Mua ngay\" hoặc \"Thêm vào giỏ\".",
          "Bước 3: Đăng nhập (hoặc đăng ký tài khoản mới), kiểm tra giỏ hàng.",
          "Bước 4: Nhập địa chỉ nhận hàng, mã giảm giá (nếu có), chọn phương thức thanh toán.",
          "Bước 5: Bấm \"Đặt hàng\". Nhân viên sẽ gọi điện xác nhận đơn trong thời gian sớm nhất.",
        ],
      },
      {
        heading: "Theo dõi đơn hàng",
        paragraphs: [
          "Vào mục Đơn hàng của tôi hoặc trang Tra cứu đơn hàng (nhập mã đơn và số điện thoại) để xem trạng thái và mã vận đơn.",
        ],
      },
    ],
  },
  {
    slug: "huong-dan-thanh-toan",
    title: "Hướng dẫn thanh toán",
    summary: "Hỗ trợ thanh toán khi nhận hàng, VNPAY và ví MoMo.",
    sections: [
      {
        heading: "Các phương thức thanh toán",
        bullets: [
          "Thanh toán khi nhận hàng (COD): trả tiền mặt hoặc chuyển khoản cho nhân viên giao hàng.",
          "VNPAY: thẻ ATM nội địa, thẻ Visa/Master/JCB, quét mã QR ngân hàng.",
          "Ví MoMo: thanh toán qua ứng dụng MoMo.",
        ],
      },
      {
        heading: "Lưu ý",
        paragraphs: [
          "Giá niêm yết trên website đã bao gồm VAT. Nếu cần xuất hóa đơn công ty, vui lòng ghi thông tin vào ô Ghi chú khi đặt hàng.",
        ],
      },
    ],
  },
  {
    slug: "tra-gop",
    title: "Hướng dẫn mua hàng trả góp",
    summary: "Trả góp 0% lãi suất qua thẻ tín dụng hoặc công ty tài chính.",
    sections: [
      {
        heading: "1. Trả góp qua thẻ tín dụng",
        bullets: [
          "Lãi suất 0%, kỳ hạn 6 - 12 tháng với thẻ của hơn 25 ngân hàng.",
          "Không cần chứng minh thu nhập, duyệt ngay khi thanh toán.",
        ],
      },
      {
        heading: "2. Trả góp qua công ty tài chính",
        bullets: [
          "Chỉ cần CCCD và bằng lái xe hoặc hộ khẩu.",
          "Trả trước từ 0% - 50% giá trị sản phẩm, duyệt hồ sơ trong 15 phút.",
        ],
      },
      {
        heading: "3. Tính thử khoản trả góp",
        paragraphs: [
          "Tại trang sản phẩm, bấm \"Trả góp 0%\" để chọn số tiền trả trước, kỳ hạn và xem số tiền phải trả mỗi tháng. Kết quả chỉ mang tính tham khảo, khoản vay thực tế phụ thuộc vào ngân hàng/công ty tài chính.",
        ],
      },
    ],
  },
];

export function getPolicy(slug: string) {
  return POLICIES.find((p) => p.slug === slug);
}
