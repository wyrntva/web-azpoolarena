import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";

type Props = {
  icon?: string;
  title: string;
  actionLabel?: string;
  onPressAction?: () => void;
};

export function SectionHeader({ icon, title, actionLabel, onPressAction }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.titleRow}>
        {icon ? <Text style={styles.icon}>{icon}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {actionLabel ? (
        <Pressable onPress={onPressAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    fontSize: 20,
    marginRight: 8,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
  },
  action: {
    color: colors.primary,
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
  },
});
