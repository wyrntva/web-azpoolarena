import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !phone.trim() || password.trim().length < 6) {
      Alert.alert("Thông tin chưa hợp lệ", "Họ tên và số điện thoại là bắt buộc. Mật khẩu tối thiểu 6 ký tự.");
      return;
    }

    setLoading(true);
    await register({
      name: name.trim(),
      phone: phone.trim(),
      password: password.trim(),
    });
    setLoading(false);
    Alert.alert("Đăng ký thành công", "Wavy Billiards tặng bạn 1.000 điểm thưởng.");
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Đăng ký thành viên mới</Text>
      <View style={styles.card}>
        <Input
          label="Họ và tên"
          value={name}
          onChangeText={setName}
          placeholder="Nhập họ và tên của bạn"
          dark
          autoCapitalize="words"
        />
        <Input
          label="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          placeholder="Nhập số điện thoại đăng ký"
          dark
        />
        <Input
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          placeholder="Nhập mật khẩu"
          secureTextEntry
          dark
        />
        <Button title="Đăng Ký Thành Viên" onPress={() => void handleRegister()} loading={loading} />
        <Text style={styles.switchText} onPress={() => navigation.navigate("Login")}>
          Đã có tài khoản? Đăng nhập
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.dark,
    justifyContent: "center",
    padding: 24,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.darkCard,
    borderRadius: 24,
    padding: 24,
    gap: 16,
  },
  switchText: {
    textAlign: "center",
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
