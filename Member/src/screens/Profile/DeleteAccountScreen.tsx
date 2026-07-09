import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import type { AppStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AppStackParamList, "DeleteAccount">;

const targetPhrase = "XÓA TÀI KHOẢN";

export function DeleteAccountScreen({ navigation }: Props) {
  const { logout } = useAuth();
  const [confirmed, setConfirmed] = useState(false);
  const [verification, setVerification] = useState("");
  const [loading, setLoading] = useState(false);

  const canDelete = useMemo(() => confirmed && verification.trim() === targetPhrase, [confirmed, verification]);

  async function handleDelete() {
    if (!canDelete) {
      return;
    }

    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    Alert.alert(
      "Đã gửi yêu cầu xóa 🚫",
      "Tài khoản của bạn đã được đưa vào trạng thái chờ xóa vĩnh viễn. Quá trình xử lý sẽ hoàn tất trong vòng 7 ngày làm việc.",
      [
        {
          text: "Đồng ý",
          onPress: () => {
            void logout();
            navigation.popToTop();
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.warningBlock}>
        <View style={styles.warningIconContainer}>
          <Ionicons name="warning-outline" size={32} color={colors.danger} />
        </View>
        <Text style={styles.warningTitle}>Hành Động Cực Kỳ Nguy Hiểm</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.bodyText}>
          Quyết định này là không thể hoàn tác. Khi bạn đồng ý xóa tài khoản, tất cả thông tin dưới đây sẽ bị hủy bỏ vĩnh viễn:
        </Text>
        {[
          "Hủy toàn bộ điểm thành viên hiện có.",
          "Xóa thông tin cá nhân và lịch sử giao dịch.",
          "Xóa toàn bộ mã ưu đãi chưa sử dụng.",
          "Đăng xuất khỏi toàn bộ phiên làm việc trên các thiết bị.",
        ].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.checkboxRow} onPress={() => setConfirmed((value) => !value)}>
        <View style={[styles.checkbox, confirmed && styles.checkboxActive]}>
          {confirmed && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
        <Text style={styles.checkboxText}>Tôi hiểu các rủi ro trên và muốn tiếp tục yêu cầu xóa tài khoản.</Text>
      </Pressable>

      {confirmed ? (
        <View style={styles.inputBlock}>
          <Text style={styles.inputLabel}>Nhập cụm từ "{targetPhrase}" để xác minh:</Text>
          <TextInput
            value={verification}
            onChangeText={(value) => setVerification(value)}
            placeholder='Nhập đúng cụm từ "XÓA TÀI KHOẢN"'
            placeholderTextColor={colors.textSoft}
            style={[styles.input, verification.trim() === targetPhrase && { borderColor: colors.success }]}
            autoCapitalize="characters"
          />
        </View>
      ) : null}

      <Pressable
        onPress={() => void handleDelete()}
        disabled={!canDelete || loading}
        style={[styles.deleteButton, { opacity: !canDelete || loading ? 0.4 : 1 }]}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.deleteText}>Xác Nhận Xóa Tài Khoản</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 20 },
  warningBlock: { alignItems: "center", gap: 12, marginTop: 12 },
  warningIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  warningTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    padding: 20,
    gap: 12,
  },
  bodyText: { color: "#E2E8F0", fontSize: 13, lineHeight: 20, fontWeight: "500" },
  bulletRow: { flexDirection: "row", gap: 8 },
  bullet: { color: colors.danger, fontSize: 14, fontWeight: "700" },
  bulletText: { flex: 1, color: "#94A3B8", fontSize: 12, lineHeight: 18, fontWeight: "500" },
  checkboxRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", marginTop: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
  },
  checkboxActive: { borderColor: colors.danger, backgroundColor: colors.danger },
  checkboxText: { flex: 1, color: "#94A3B8", fontSize: 12, lineHeight: 18, fontWeight: "500" },
  inputBlock: { gap: 8 },
  inputLabel: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
  },
  deleteButton: {
    minHeight: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.danger,
    marginTop: 10,
    shadowColor: colors.danger,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  deleteText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
