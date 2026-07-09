import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../constants/colors";

type Props = {
  memberName: string;
  rankLabel: string;
  points: number;
  notificationCount: number;
  onPressProfile: () => void;
  onPressNotification: () => void;
};

export function HomeHeader({
  memberName,
  rankLabel,
  points,
  notificationCount,
  onPressProfile,
  onPressNotification,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <View style={styles.content}>
        {/* Top row: Greeting and Member Name on left, Icons on right */}
        <View style={styles.topRow}>
          <View style={styles.nameBlock}>
            <Text style={styles.greeting}>Ngày mới tốt lành nha!</Text>
            <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit>
              {memberName}
            </Text>
          </View>
          <View style={styles.iconGroup}>
            <Pressable style={styles.iconButton} onPress={onPressProfile}>
              <Ionicons name="person-circle-outline" size={32} color="#FFFFFF" />
            </Pressable>
            <Pressable style={styles.iconButton} onPress={onPressNotification}>
              <Ionicons name="notifications-outline" size={30} color="#FFFFFF" />
              {notificationCount > 0 ? <View style={styles.dot} /> : null}
            </Pressable>
          </View>
        </View>

        {/* Bottom row: Member pills */}
        <View style={styles.metaRow}>
          <View style={styles.rankPill}>
            <Text style={styles.rankText}>{rankLabel}</Text>
          </View>
          <View style={styles.pointPill}>
            <Text style={styles.pointValue}>{points.toLocaleString("vi-VN")}</Text>
            <View style={styles.pointCoin}>
              <Text style={styles.pointCoinText}>P</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary,
    minHeight: 270,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    justifyContent: "flex-end",
    paddingBottom: 94, // Float the shortcut menu on top
  },
  content: {
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nameBlock: {
    flex: 1,
    paddingRight: 16,
  },
  greeting: {
    color: "#FFEFEF",
    fontSize: 16,
    fontFamily: "Montserrat_500Medium",
  },
  name: {
    marginTop: 4,
    color: "#FFFFFF",
    fontSize: 28,
    fontFamily: "Montserrat_700Bold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
  },
  rankPill: {
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 10,
  },
  rankText: {
    color: colors.text,
    fontSize: 13,
    fontFamily: "Montserrat_700Bold",
  },
  pointPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#FFD362",
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
  },
  pointValue: {
    color: "#5B4300",
    fontSize: 14,
    fontFamily: "Montserrat_800ExtraBold",
    marginRight: 6,
  },
  pointCoin: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F2B11D",
    alignItems: "center",
    justifyContent: "center",
  },
  pointCoinText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Montserrat_900Black",
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  dot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFD362",
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
});
