import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import type { AuthStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState("0987654321");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!phone.trim() || !password.trim()) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập đầy đủ số điện thoại và mật khẩu.");
      return;
    }

    setLoading(true);
    await login({ phone: phone.trim(), password: password.trim() });
    setLoading(false);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.logoRow}>
        <Text style={styles.logo}>WAVY</Text>
        <View style={styles.dot} />
      </View>
      <Text style={styles.subtitle}>Đăng nhập tài khoản thành viên CLB Bida</Text>

      <View style={styles.card}>
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
        <Button title="Đăng Nhập" onPress={() => void handleLogin()} loading={loading} />
        <Text style={styles.switchText} onPress={() => navigation.navigate("Register")}>
          Chưa có tài khoản? Đăng ký ngay
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
    gap: 16,
  },
  logoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  logo: {
    fontSize: 32,
    fontFamily: "Montserrat_900Black",
    color: "#FFFFFF",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: colors.primary,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSoft,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
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
    fontFamily: "Montserrat_700Bold",
  },
});
