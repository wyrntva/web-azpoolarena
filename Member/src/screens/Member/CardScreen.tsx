import React from "react";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { useQRScanner } from "../../hooks/useQRScanner";

export function CardScreen() {
  const { member } = useAuth();
  const { qrValue, timeRemaining } = useQRScanner(member);

  return (
    <View style={styles.screen}>
      {/* Thẻ VIP Thành Viên Giả Lập Kính Mờ (Glassmorphism) */}
      <View style={styles.memberCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.brand}>WAVY BILLIARDS</Text>
          <Ionicons name="hardware-chip-outline" size={24} color={colors.secondary} />
        </View>
        
        <Text style={styles.memberName}>{member?.name ?? "THÀNH VIÊN WAVY"}</Text>
        <Text style={styles.memberCode}>{member?.memberCode ?? "WV-999 888 777"}</Text>

        <View style={styles.row}>
          <View>
            <Text style={styles.label}>HẠNG THÀNH VIÊN</Text>
            <Text style={styles.value}>{member?.rankLabel ?? "Bạch Kim"}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.label}>ĐIỂM TÍCH LŨY</Text>
            <Text style={[styles.value, { color: colors.secondary }]}>
              {member?.points.toLocaleString("vi-VN")} pts
            </Text>
          </View>
        </View>
      </View>

      {/* Mã QR Quét Tích Điểm */}
      <Card>
        <View style={styles.center}>
          <Text style={styles.qrTitle}>MÃ QR DÙNG ĐỂ TÍCH ĐIỂM / THANH TOÁN</Text>
          <View style={styles.qrBox}>
            {qrValue ? (
              <QRCode 
                value={qrValue} 
                size={180} 
                backgroundColor="#F8FAFC"
                color="#0F172A"
              />
            ) : null}
          </View>
          <View style={styles.timerRow}>
            <Ionicons name="sync" size={16} color={colors.secondary} style={styles.spinIcon} />
            <Text style={styles.timerText}>Mã QR tự động làm mới sau {timeRemaining} giây</Text>
          </View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, padding: 20, gap: 20 },
  
  // Luxury VIP Card
  memberCard: { 
    backgroundColor: "#161F30", 
    borderRadius: 24, 
    padding: 24, 
    gap: 16,
    borderWidth: 1.5,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: "#94A3B8", fontSize: 13, fontWeight: "800", letterSpacing: 1.5 },
  memberName: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginTop: 8 },
  memberCode: { color: "#E2E8F0", fontSize: 14, fontFamily: "monospace", letterSpacing: 1.5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 4 },
  label: { color: colors.textSoft, fontSize: 8, fontWeight: "600", letterSpacing: 0.5 },
  value: { color: "#FFFFFF", fontSize: 15, fontWeight: "700", marginTop: 2 },
  
  // QR Area
  center: { alignItems: "center", gap: 18, paddingVertical: 8 },
  qrTitle: { color: colors.text, fontSize: 11, fontWeight: "700", textAlign: "center", letterSpacing: 0.5 },
  qrBox: { 
    padding: 16, 
    borderRadius: 20, 
    backgroundColor: "#F8FAFC",
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  timerRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 },
  spinIcon: { marginTop: 1 },
  timerText: { color: colors.textMuted, fontSize: 12, fontWeight: "500" },
});
