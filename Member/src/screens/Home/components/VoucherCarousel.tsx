import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../constants/colors";

type VoucherItem = {
  id: string;
  amount: string;
  points: string;
  label: string;
};

type Props = {
  items: VoucherItem[];
};

export function VoucherCarousel({ items }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {items.map((item) => (
        <View key={item.id} style={styles.card}>
          <View style={styles.poster}>
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>PHIẾU MUA HÀNG</Text>
            </View>
            <Text style={styles.amount} numberOfLines={1} adjustsFontSizeToFit>
              {item.amount}
            </Text>
            <Text style={styles.currency}>VNĐ</Text>
            <View style={styles.cornerCurve} />
          </View>

          <View style={styles.info}>
            <View style={styles.pointPill}>
              <Text style={styles.pointText}>{item.points}</Text>
              <View style={styles.coin}>
                <Text style={styles.coinText}>P</Text>
              </View>
            </View>
            <Text style={styles.label} numberOfLines={2}>
              {item.label}
            </Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingLeft: 20,
    paddingRight: 8,
    paddingBottom: 8,
  },
  card: {
    width: 184,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#AAB4BF",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  poster: {
    height: 188,
    backgroundColor: "#D7191C",
    paddingTop: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  ribbon: {
    backgroundColor: "#FFD127",
    paddingHorizontal: 14,
    paddingVertical: 6,
    transform: [{ rotate: "-4deg" }],
    marginBottom: 12,
  },
  ribbonText: {
    color: "#1C1C1C",
    fontSize: 11,
    fontFamily: "Montserrat_800ExtraBold",
  },
  amount: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 38,
    fontFamily: "Montserrat_900Black",
    letterSpacing: 0.5,
    width: "100%",
    textAlign: "center",
  },
  currency: {
    marginTop: 2,
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "Montserrat_900Black",
  },
  cornerCurve: {
    position: "absolute",
    left: -20,
    bottom: -20,
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 6,
    borderColor: "#FFC518",
    opacity: 0.8,
  },
  info: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 18,
    height: 106,
    justifyContent: "space-between",
  },
  pointPill: {
    marginTop: -26,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    backgroundColor: "#FFD56B",
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 5,
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  pointText: {
    color: "#5B4300",
    fontSize: 13,
    fontFamily: "Montserrat_800ExtraBold",
    marginRight: 6,
  },
  coin: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F2B11D",
    alignItems: "center",
    justifyContent: "center",
  },
  coinText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "Montserrat_900Black",
  },
  label: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    fontFamily: "Montserrat_600SemiBold",
    flex: 1,
    marginTop: 4,
  },
});
