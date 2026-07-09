import React from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { colors } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";

const tournaments = [
  {
    id: "tour-1",
    status: "Đang diễn ra",
    tone: "green" as const,
    title: "Wavy Summer Pool Open 2026",
    details: [
      { icon: "calendar-outline", text: "Hạn đăng ký: Đã đóng" },
      { icon: "location-outline", text: "Chi nhánh: Wavy Quận 1, TPHCM" },
      { icon: "gift-outline", text: "Giải thưởng: 15.000.000 VND" },
    ],
    action: "Xem Bảng Điểm Thi Đấu",
  },
  {
    id: "tour-2",
    status: "Sắp mở đăng ký",
    tone: "amber" as const,
    title: "Carom 3-Băng Amateur Cup 2026",
    details: [
      { icon: "calendar-outline", text: "Khởi tranh: 15/07/2026" },
      { icon: "location-outline", text: "Chi nhánh: Toàn hệ thống Wavy" },
      { icon: "card-outline", text: "Lệ phí: 200.000đ/thành viên" },
    ],
    action: "Đăng Ký Tham Gia Ngay",
  },
];

export function TournamentScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {tournaments.map((item) => (
        <Card key={item.id}>
          {/* Status Badge */}
          <View
            style={[
              styles.badge,
              { backgroundColor: item.tone === "green" ? colors.successBg : colors.warningBg },
            ]}
          >
            <Text style={[styles.badgeText, { color: item.tone === "green" ? colors.success : colors.warning }]}>
              {item.status}
            </Text>
          </View>
          
          <Text style={styles.title}>{item.title}</Text>
          
          {/* Details list with icons */}
          <View style={styles.detailsContainer}>
            {item.details.map((detail, idx) => (
              <View key={idx} style={styles.detailRow}>
                <Ionicons name={detail.icon as any} size={15} color={colors.textSoft} />
                <Text style={styles.detailText}>{detail.text}</Text>
              </View>
            ))}
          </View>

          <Button
            title={item.action}
            variant={item.tone === "green" ? "secondary" : "primary"}
            onPress={() =>
              Alert.alert(
                "Giải đấu",
                item.tone === "green"
                  ? "Đang tải bảng điểm và lịch thi đấu mới nhất..."
                  : "Đăng ký thành công! Chi tiết lịch thi đấu và số thứ tự sẽ được gửi qua SMS của bạn."
              )
            }
          />
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14 },
  badge: { 
    alignSelf: "flex-start", 
    borderRadius: 8, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.05)",
  },
  badgeText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  title: { color: colors.text, fontSize: 16, fontWeight: "700", marginBottom: 12 },
  detailsContainer: { gap: 8, marginBottom: 16 },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  detailText: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
});
