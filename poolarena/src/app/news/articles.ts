export interface Article {
  id: string;
  title: string;
  category: string;
  date: string;
  author: string;
  image: string;
  excerpt: string;
  content: string[];
  featured?: boolean;
}

export const articles: Article[] = [
  {
    id: "1",
    title: "Khởi tranh Giải vô địch Pool Arena Championship 2026",
    category: "Giải đấu",
    date: "22/06/2026",
    author: "Ban Tổ Chức",
    image: "/images/news_tournament.webp",
    featured: true,
    excerpt: "Giải đấu bida lỗ chuyên nghiệp lớn nhất trong năm chính thức khởi động tại Pool Arena Club với tổng trị giá giải thưởng lên tới 100.000.000 VNĐ.",
    content: [
      "Giải đấu Pool Arena Championship 2026 là sự kiện bida lỗ lớn nhất trong năm, quy tụ hơn 128 cơ thủ xuất sắc từ khắp cả nước về tranh tài. Trải qua nhiều tháng chuẩn bị, ban tổ chức chính thức công bố thể thức thi đấu và cơ cấu giải thưởng cực kỳ hấp dẫn.",
      "Theo ban tổ chức, giải đấu năm nay sẽ thi đấu theo thể thức 9 bi (9-ball) và 10 bi (10-ball) quốc tế, loại trực tiếp sau hai lần thua (double elimination). Điều này đảm bảo tính công bằng và tạo cơ hội cho các cơ thủ thể hiện bản lĩnh thi đấu kiên cường.",
      "Tổng giá trị giải thưởng năm nay lên đến 100.000.000 VNĐ, trong đó nhà vô địch sẽ nhận được cúp lưu niệm, chứng nhận và 50.000.000 VNĐ tiền mặt cùng các phần quà độc quyền từ nhà tài trợ. Vòng loại sẽ diễn ra từ ngày 25/06 đến 28/06, tiếp theo là vòng chung kết kịch tính được truyền hình trực tiếp trên các kênh truyền thông chính thức của Pool Arena.",
      "Người hâm mộ có thể đến xem trực tiếp tại câu lạc bộ Pool Arena Center hoặc theo dõi bảng điểm cập nhật trực tiếp (Live Score) ngay trên ứng dụng website của chúng tôi. Hãy cùng chờ đón những đường cơ xuất sắc và những trận đấu nghẹt thở!"
    ]
  },
  {
    id: "2",
    title: "Hệ thống xếp hạng Ranking trực tuyến chính thức ra mắt",
    category: "Thông báo",
    date: "20/06/2026",
    author: "Đội ngũ Kỹ thuật",
    image: "/images/news_trophy.webp",
    excerpt: "Pool Arena chính thức cập nhật tính năng bảng xếp hạng Ranking thời gian thực, đồng bộ hóa trực tiếp điểm số của cơ thủ sau mỗi trận đấu.",
    content: [
      "Hôm nay, chúng tôi vô cùng hào hứng công bố sự ra mắt của Hệ thống xếp hạng Ranking trực tuyến thời gian thực (Real-time Ranking System). Đây là bước tiến lớn giúp số hóa và minh bạch hóa thành tích thi đấu của toàn bộ thành viên tại hệ thống Pool Arena.",
      "Từ nay, mỗi trận đấu tập hay đấu giải chính thức của bạn tại Pool Arena sẽ được ghi nhận vào hệ thống. Điểm số (points) và cấp bậc (rank) của bạn sẽ được tự động tính toán dựa trên thuật toán Elo tùy chỉnh và cập nhật trực tiếp trên trang Bảng xếp hạng.",
      "Hệ thống phân chia thứ hạng từ Cơ thủ Tập sự đến Huyền thoại, mở ra cơ hội nhận các phần quà đặc quyền hàng tháng cho Top 10 cơ thủ có điểm số cao nhất. Hãy đăng nhập tài khoản của bạn, tham gia thi đấu và bắt đầu hành trình chinh phục đỉnh cao ngay hôm nay!"
    ]
  },
  {
    id: "3",
    title: "Khai phá kỹ thuật ngắm và kiểm soát bi chủ (Cue Ball Control)",
    category: "Hướng dẫn & Mẹo",
    date: "18/06/2026",
    author: "HLV Minh Pool",
    image: "/images/news_cue_ball.webp",
    excerpt: "Làm chủ bi chủ là chìa khóa để dọn bàn dễ dàng. Hãy cùng khám phá các nguyên lý cơ bản về ép phê (spin) và kỹ thuật ngắm chuẩn xác.",
    content: [
      "Trong bida lỗ, việc đưa bi mục tiêu vào lưới chỉ là một nửa chặng đường. Nửa quan trọng còn lại quyết định bạn có phải là một cơ thủ giỏi hay không chính là khả năng điều khiển vị trí dừng của bi chủ (Cue Ball Control) để chuẩn bị cho cú đánh tiếp theo.",
      "Một lỗi phổ biến của người mới chơi là luôn đánh lực quá mạnh hoặc không để ý đến hướng di chuyển của bi chủ sau khi chạm bi mục tiêu. Bằng cách áp dụng các kỹ thuật ép phê (spin) như trô (draw), cule (follow) hay áp phê nghịch/thuận (sidespin), bạn có thể dễ dàng điều khiển quỹ đạo chạy của bi chủ theo ý muốn.",
      "Bài viết này sẽ hướng dẫn bạn cách thực hành 3 bài tập cơ bản hàng ngày để nâng cao cảm giác lực và hiểu rõ góc ra của bi chủ sau va chạm. Luyện tập đều đặn 15 phút mỗi ngày trước trận đấu sẽ giúp tỷ lệ dọn bàn của bạn tăng lên đáng kể."
    ]
  },
  {
    id: "4",
    title: "Sự kiện Pool Arena Community Cup - Sân chơi cho mọi cơ thủ",
    category: "Tin tức",
    date: "15/06/2026",
    author: "Ban Truyền Thông",
    image: "/images/banner.webp",
    excerpt: "Giải đấu giao hữu thường niên dành riêng cho cộng đồng cơ thủ phong trào tại Pool Arena với nhiều phần quà và hoạt động bên lề hấp dẫn.",
    content: [
      "Nhằm tạo sân chơi giao lưu, học hỏi kinh nghiệm giữa các thành viên, Pool Arena tổ chức ngày hội Community Cup vào cuối tuần này. Đây là sự kiện phi lợi nhuận dành riêng cho các cơ thủ phong trào và không giới hạn trình độ.",
      "Bên cạnh giải đấu giao hữu kịch tính, sự kiện còn có các mini-game thú vị như 'Thử thách dọn bàn nhanh', 'Cú đánh nghệ thuật' với các phần quà hấp dẫn từ ban tổ chức như gậy bida cao cấp, phụ kiện bao da và thẻ giờ chơi miễn phí.",
      "Sự kiện sẽ diễn ra vào Chủ Nhật tuần này bắt đầu từ 8:00 sáng. Đăng ký tham gia trực tiếp tại quầy lễ tân hoặc qua biểu mẫu đăng ký online trên fanpage Pool Arena. Rất nhiều đồ uống và teabreak miễn phí đang chờ đón bạn!"
    ]
  },
  {
    id: "5",
    title: "Ưu đãi hè rực rỡ: Giảm 30% giờ chơi tại toàn bộ hệ thống CLB",
    category: "Khuyến mãi",
    date: "10/06/2026",
    author: "Phòng Kinh Doanh",
    image: "/images/info_banner.webp",
    excerpt: "Chương trình khuyến mãi lớn nhất mùa hè dành riêng cho học sinh, sinh viên và thành viên đăng ký thẻ hội viên Pool Arena.",
    content: [
      "Để giải nhiệt mùa hè và mang đến không gian giải trí tuyệt vời cho các cơ thủ, Pool Arena trân trọng gửi tới quý khách hàng chương trình khuyến mãi 'Hè Rực Rỡ cùng Pool Arena'.",
      "Chi tiết ưu đãi: Giảm ngay 30% tổng hóa đơn giờ chơi từ thứ Hai đến thứ Sáu hàng tuần trong khung giờ từ 8:00 đến 16:00. Đặc biệt, đối với học sinh, sinh viên khi xuất trình thẻ học sinh/sinh viên sẽ được giảm thêm 10%.",
      "Chương trình áp dụng tại tất cả các chi nhánh của Pool Arena từ ngày 15/06 đến hết ngày 15/07. Đừng bỏ lỡ cơ hội luyện tập và giao lưu cùng bạn bè trong không gian mát mẻ, bàn chơi tiêu chuẩn quốc tế với mức giá cực kỳ ưu đãi này nhé!"
    ]
  }
];
