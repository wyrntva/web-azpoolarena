import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View, Pressable, ActivityIndicator } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { Input } from "../../components/Input";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import type { AppStackParamList } from "../../navigation/types";
import { Ionicons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<AppStackParamList, "Profile">;

export function ProfileScreen({ navigation }: Props) {
  const { member, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(member?.name ?? "");
  const [phone, setPhone] = useState(member?.phone ?? "");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setPhone(member.phone);
    }
  }, [member]);

  async function handleSave() {
    if (!name.trim() || !phone.trim()) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ Họ tên và Số điện thoại.");
      return;
    }

    setSaving(true);
    // Giả lập lưu API trong 800ms
    await new Promise((resolve) => setTimeout(resolve, 800));
    await updateProfile(name.trim(), phone.trim());
    setSaving(false);
    setIsEditing(false);
    Alert.alert("Thành công", "Đã cập nhật thông tin cá nhân thành công.");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Thẻ Thông Tin Tổng Quan */}
      <Card>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {member?.name ? member.name.split(" ").pop()?.charAt(0).toUpperCase() : "W"}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.memberNameText}>{member?.name}</Text>
            <Text style={styles.memberIdText}>Mã số: {member?.memberCode}</Text>
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>Hạng {member?.rankLabel}</Text>
            </View>
          </View>
        </View>
      </Card>

      {/* Thẻ Chi Tiết / Chỉnh Sửa Thông Tin */}
      <Card>
        <View style={styles.cardHeader}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          {!isEditing ? (
            <Pressable style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="create-outline" size={16} color={colors.secondary} />
              <Text style={styles.editBtnText}>Sửa</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.editBtn} onPress={() => setIsEditing(false)}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </Pressable>
          )}
        </View>

        {!isEditing ? (
          <View style={styles.menuGap}>
            <MenuText label="Họ và tên" value={member?.name ?? ""} />
            <MenuText label="Số điện thoại liên hệ" value={member?.phone ?? ""} />
            <MenuText label="Điểm tích lũy thành viên" value={`${member?.points.toLocaleString("vi-VN")} pts`} />
            <MenuText label="Cấp bậc hiện tại" value={member?.rankLabel ?? ""} />
          </View>
        ) : (
          <View style={styles.editForm}>
            <Input 
              label="Họ và tên"
              value={name}
              onChangeText={setName}
              placeholder="Nhập họ và tên"
              autoCapitalize="words"
            />
            <Input 
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="Nhập số điện thoại"
            />
            <View style={styles.saveBtnRow}>
              <Button title="Lưu Thay Đổi" onPress={() => void handleSave()} loading={saving} />
            </View>
          </View>
        )}
      </Card>

      {/* Thẻ Các Lệnh Điều Khiển */}
      <Card>
        <View style={styles.buttonGap}>
          <Button 
            title="Lịch Sử Tích Điểm" 
            onPress={() => navigation.navigate("MemberHistory")} 
            variant="secondary" 
          />
          <Button 
            title="Yêu Cầu Xóa Tài Khoản" 
            onPress={() => navigation.navigate("DeleteAccount")} 
            variant="danger" 
          />
          <Button 
            title="Đăng Xuất Tài Khoản" 
            onPress={() => void logout()} 
            variant="primary" 
          />
        </View>
      </Card>

      <Text style={styles.footer} onPress={() => Alert.alert("Hỗ trợ khách hàng", "Hotline: 1900-8888\nEmail: support@wavy.vn\nGiờ làm việc: 8:00 - 23:00")}>
        Liên hệ hỗ trợ & Gửi phản hồi
      </Text>
    </ScrollView>
  );
}

function MenuText({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.menuRow}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  
  // Avatar Section
  avatarRow: { flexDirection: "row", gap: 16, alignItems: "center", paddingVertical: 4 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.secondary,
  },
  avatarText: { color: "#FFFFFF", fontSize: 24, fontWeight: "800" },
  memberNameText: { color: colors.text, fontSize: 18, fontWeight: "700" },
  memberIdText: { color: colors.textMuted, fontSize: 12 },
  rankBadge: {
    alignSelf: "flex-start",
    marginTop: 4,
    borderRadius: 8,
    backgroundColor: "rgba(251,191,36,0.12)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 0.5,
    borderColor: colors.secondary,
  },
  rankText: { color: colors.secondary, fontSize: 10, fontWeight: "800" },
  
  // Edit & Info Card
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: "700" },
  editBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  editBtnText: { color: colors.secondary, fontSize: 12, fontWeight: "700" },
  cancelBtnText: { color: colors.textSoft, fontSize: 12, fontWeight: "700" },
  menuGap: { gap: 12 },
  menuRow: { 
    borderBottomWidth: 1, 
    borderBottomColor: colors.border, 
    paddingBottom: 8,
    gap: 4,
  },
  menuLabel: { color: colors.textSoft, fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },
  menuValue: { color: colors.text, fontSize: 13, fontWeight: "600" },
  
  editForm: { gap: 12, marginTop: 4 },
  saveBtnRow: { marginTop: 6 },
  
  buttonGap: { gap: 10 },
  footer: { textAlign: "center", color: colors.secondary, fontSize: 12, fontWeight: "800", marginTop: 8, textDecorationLine: "underline" },
});
