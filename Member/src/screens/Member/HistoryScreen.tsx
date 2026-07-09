import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card } from "../../components/Card";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime, formatPoints } from "../../utils/format";
import { Ionicons } from "@expo/vector-icons";

export function HistoryScreen() {
  const { history, member } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Thẻ Tổng Quan Điểm */}
      <Card>
        <Text style={styles.heading}>TỔNG ĐIỂM HIỆN TẠI</Text>
        <Text style={styles.points}>{member?.points.toLocaleString("vi-VN")} pts</Text>
        <Text style={styles.description}>
          Theo dõi chi tiết lịch sử tích lũy điểm thưởng từ các lượt chơi, đặt bàn hoặc đổi ưu đãi tại câu lạc bộ.
        </Text>
      </Card>

      {/* Danh Sách Lịch Sử */}
      <Text style={styles.listTitle}>Lịch sử giao dịch</Text>
      
      {history.map((item) => {
        const isEarn = item.pointsDelta >= 0;
        const iconName = 
          item.type === "earn" 
            ? "add-circle-outline" 
            : item.type === "redeem" 
              ? "gift-outline" 
              : "calendar-outline";

        const iconColor = 
          item.type === "earn" 
            ? colors.success 
            : item.type === "redeem" 
              ? colors.danger 
              : colors.secondary;

        const iconBg = 
          item.type === "earn" 
            ? "rgba(16,185,129,0.08)" 
            : item.type === "redeem" 
              ? "rgba(239,68,68,0.08)" 
              : "rgba(251,191,36,0.08)";

        return (
          <Card key={item.id}>
            <View style={styles.row}>
              {/* Icon Type Indicator */}
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>

              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.description}</Text>
                <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
              </View>

              <Text style={[styles.delta, { color: isEarn ? colors.success : colors.danger }]}>
                {formatPoints(item.pointsDelta)}
              </Text>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  heading: { color: colors.textSoft, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  points: { marginTop: 4, color: colors.secondary, fontSize: 32, fontWeight: "900" },
  description: { marginTop: 8, color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  listTitle: { color: colors.text, fontSize: 14, fontWeight: "700", marginTop: 8, marginBottom: 4 },
  row: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 13, fontWeight: "700" },
  subtitle: { color: colors.textMuted, fontSize: 11, fontWeight: "500" },
  date: { color: colors.textSoft, fontSize: 10 },
  delta: { fontSize: 13, fontWeight: "800" },
});
