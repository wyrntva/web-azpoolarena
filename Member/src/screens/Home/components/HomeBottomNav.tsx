import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";

type NavItem = {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  badge?: string;
};

type Props = {
  items: NavItem[];
  onPress: (key: string) => void;
};

export function HomeBottomNav({ items, onPress }: Props) {
  return (
    <View style={styles.wrapper}>
      {items.map((item) => (
        <Pressable
          key={item.key}
          style={item.key === "scan" ? styles.scanSlot : styles.item}
          onPress={() => onPress(item.key)}
        >
          {item.key === "scan" ? (
            <View style={styles.scanButton}>
              <Ionicons name={item.icon} size={30} color="#FFFFFF" />
            </View>
          ) : (
            <>
              <View style={styles.iconWrap}>
                <Ionicons
                  name={item.icon}
                  size={22}
                  color={item.active ? colors.primary : colors.textSoft}
                />
                {item.badge ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, item.active ? styles.labelActive : null]}>{item.title}</Text>
            </>
          )}
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: "center",
  },
  iconWrap: {
    position: "relative",
    marginBottom: 5,
  },
  badge: {
    position: "absolute",
    top: -8,
    right: -12,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF4949",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
  },
  label: {
    color: colors.textSoft,
    fontSize: 12,
    fontFamily: "Montserrat_500Medium",
  },
  labelActive: {
    color: colors.primary,
    fontFamily: "Montserrat_700Bold",
  },
  scanSlot: {
    width: 84,
    alignItems: "center",
  },
  scanButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#E9362F",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    borderWidth: 5,
    borderColor: "#F6C1C1",
  },
});
