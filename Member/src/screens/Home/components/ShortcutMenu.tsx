import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path, Rect, Circle, Text as SvgText } from "react-native-svg";
import { colors } from "../../../constants/colors";

type ShortcutItem = {
  key: string;
  label: string;
  badge?: string;
  onPress?: () => void;
};

type Props = {
  items: ShortcutItem[];
};

function ShortcutIcon({ itemKey }: { itemKey: string }) {
  if (itemKey === "delivery") {
    return (
      <Svg width="58" height="58" viewBox="0 0 58 58" fill="none">
        <Rect width="58" height="58" rx="14" fill="#D81E06" />
        <Path d="M12 28 C 18 16, 36 34, 46 18" stroke="#FFB300" strokeWidth="4" strokeLinecap="round" />
        <Path d="M14 32 C 20 22, 34 38, 44 22" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <SvgText x="29" y="48" fontSize="10" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="Montserrat_900Black">CK GO</SvgText>
      </Svg>
    );
  }

  if (itemKey === "store") {
    return (
      <Svg width="58" height="58" viewBox="0 0 58 58" fill="none">
        <Rect width="58" height="58" rx="14" fill="#E04F36" />
        <Path d="M29 11 C 21 11, 17 17, 17 25 C 17 33, 29 44, 29 44 C 29 44, 41 33, 41 25 C 41 17, 37 11, 29 11 Z" fill="#FFFFFF" />
        <Circle cx="29" cy="23" r="8" fill="#E04F36" />
        <SvgText x="29" y="27" fontSize="10" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="Montserrat_900Black">K</SvgText>
      </Svg>
    );
  }

  if (itemKey === "transaction") {
    return (
      <Svg width="58" height="58" viewBox="0 0 58 58" fill="none">
        <Rect width="58" height="58" rx="14" fill="#E63946" />
        <Rect x="19" y="15" width="20" height="28" rx="3" fill="#FFFFFF" />
        <Rect x="23" y="21" width="12" height="2" rx="1" fill="#E63946" />
        <Rect x="23" y="27" width="12" height="2" rx="1" fill="#E63946" />
        <Rect x="23" y="33" width="8" height="2" rx="1" fill="#E63946" />
        <Circle cx="37" cy="19" r="7" fill="#FFB300" />
        <SvgText x="37" y="22" fontSize="9" fontWeight="900" fill="#FFFFFF" textAnchor="middle" fontFamily="Montserrat_900Black">đ</SvgText>
      </Svg>
    );
  }

  if (itemKey === "gift") {
    return (
      <Svg width="58" height="58" viewBox="0 0 58 58" fill="none">
        <Rect width="58" height="58" rx="14" fill="#E03A3E" />
        <Rect x="18" y="24" width="22" height="18" rx="2" fill="#FFFFFF" />
        <Rect x="27" y="24" width="4" height="18" fill="#E03A3E" />
        <Rect x="18" y="31" width="22" height="4" fill="#E03A3E" />
        <Path d="M24 19 C 24 16, 28 16, 29 21 C 30 16, 34 16, 34 19 C 34 23, 29 23, 29 24 C 29 23, 24 23, 24 19 Z" fill="#FFFFFF" />
      </Svg>
    );
  }

  return <View style={styles.iconTile} />;
}

export function ShortcutMenu({ items }: Props) {
  return (
    <View style={styles.wrapper}>
      {items.map((item) => (
        <Pressable key={item.key} style={styles.item} onPress={item.onPress}>
          <View style={styles.iconTileContainer}>
            <ShortcutIcon itemKey={item.key} />
            {item.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.label}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: -84,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#A5AFBA",
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  item: {
    width: "24%",
    alignItems: "center",
  },
  iconTileContainer: {
    width: 58,
    height: 58,
  },
  iconTile: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: "#E03A3E",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FFB62A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
  },
  label: {
    marginTop: 12,
    color: colors.text,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    fontFamily: "Montserrat_500Medium",
  },
});
