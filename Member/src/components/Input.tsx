import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../constants/colors";

type Props = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  dark?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  dark = false,
  autoCapitalize = "none",
}: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, dark && styles.darkLabel]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={dark ? "#94A3B8" : colors.textMuted}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        style={[styles.input, dark ? styles.darkInput : styles.lightInput]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontFamily: "Montserrat_700Bold",
    color: colors.text,
  },
  darkLabel: {
    color: "#FFFFFF",
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    fontFamily: "Montserrat_500Medium",
  },
  lightInput: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  darkInput: {
    borderColor: colors.borderSoft,
    backgroundColor: "#0B0F19",
    color: "#FFFFFF",
  },
});
