import type { ApiResponse } from "../types/api";
import type { Member, MemberHistoryItem, NotificationItem } from "../types/member";

export async function fetchMemberProfile(): Promise<ApiResponse<Member>> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    success: true,
    data: {
      id: "user_999888777",
      name: "Nguyễn Văn A",
      phone: "0987654321",
      points: 12500,
      rank: "PLATINUM",
      rankLabel: "Bạch Kim",
      memberCode: "WV-999888777",
    },
  };
}

export async function fetchMemberHistory(): Promise<ApiResponse<MemberHistoryItem[]>> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    success: true,
    data: [
      {
        id: "his-1",
        title: "Tích điểm giờ chơi billiards",
        description: "Bàn Pool 01 • Wavy Quận 1",
        pointsDelta: 350,
        createdAt: "2026-07-05T19:00:00.000Z",
        type: "earn",
      },
      {
        id: "his-2",
        title: "Đổi voucher nước uống",
        description: "Sử dụng ưu đãi thành viên",
        pointsDelta: -200,
        createdAt: "2026-07-03T11:30:00.000Z",
        type: "redeem",
      },
      {
        id: "his-3",
        title: "Đặt bàn Carom 03",
        description: "Lịch đặt bàn: 15/07/2026 19:00",
        pointsDelta: 120,
        createdAt: "2026-07-01T08:15:00.000Z",
        type: "booking",
      },
    ],
  };
}

export async function fetchNotifications(): Promise<ApiResponse<NotificationItem[]>> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    success: true,
    data: [
      {
        id: "noti-1",
        title: "Giảm 20% giờ chơi khung giờ sáng",
        body: "Áp dụng cho tất cả thành viên khi đặt bàn từ 8:00 - 12:00 từ Thứ 2 đến Thứ 6.",
        createdAt: "2026-07-06T09:00:00.000Z",
        type: "promotion",
      },
      {
        id: "noti-2",
        title: "Wavy Summer Pool Open 2026",
        body: "Giải đấu đang diễn ra sôi nổi. Bạn có thể xem bảng điểm và lịch thi đấu mới nhất.",
        createdAt: "2026-07-05T15:30:00.000Z",
        type: "event",
      },
      {
        id: "noti-3",
        title: "Hệ thống đã cập nhật mã QR động",
        body: "Mã thành viên của bạn sẽ tự động làm mới sau mỗi 30 giây để tăng tính bảo mật bảo vệ tài khoản.",
        createdAt: "2026-07-04T08:00:00.000Z",
        type: "system",
      },
    ],
  };
}
