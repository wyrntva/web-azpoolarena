import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors } from "../../../constants/colors";

type PromoItem = {
  id: string;
  tag: string;
  date: string;
  location: string;
  title: string;
  subtitle: string;
  caption: string;
};

type Props = {
  items: PromoItem[];
};

export function PromoCarousel({ items }: Props) {
  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {items.map((item, index) => (
          <View key={item.id} style={[styles.card, index === items.length - 1 ? styles.lastCard : null]}>
            <View style={styles.poster}>
              {/* Left Column: Text and main details */}
              <View style={styles.leftCol}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.tag}</Text>
                </View>
                <Text style={styles.dateText}>{item.date}</Text>
                <Text style={styles.title} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.subtitle} numberOfLines={2}>
                  {item.subtitle}
                </Text>
                <Text style={styles.caption}>{item.caption}</Text>
              </View>

              {/* Right Column: Location tag and graphics */}
              <View style={styles.rightCol}>
                <View style={styles.locationPill}>
                  <Text style={styles.locationText}>{item.location}</Text>
                </View>

                <View style={styles.graphicsContainer}>
                  {/* Cup graphics */}
                  <View style={styles.productColumn}>
                    <View style={styles.cupLarge} />
                    <View style={styles.cupRow}>
                      <View style={styles.cupSmall} />
                      <View style={styles.cupSmall} />
                    </View>
                  </View>

                  {/* Concert ticket graphic */}
                  <View style={styles.ticketShape}>
                    <Text style={styles.ticketText}>VÉ{"\n"}CONCERT</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.indicatorTrack}>
        <View style={styles.indicatorActive} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingLeft: 20,
    paddingRight: 8,
  },
  card: {
    width: 354,
    marginRight: 16,
  },
  lastCard: {
    marginRight: 20,
  },
  poster: {
    height: 185,
    borderRadius: 18,
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#EEC1D7",
    borderWidth: 1,
    borderColor: "#E0D0DD",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  leftCol: {
    width: "60%",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  rightCol: {
    width: "38%",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  tag: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Montserrat_800ExtraBold",
    textTransform: "uppercase",
  },
  locationPill: {
    backgroundColor: "#F53A34",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  locationText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Montserrat_700Bold",
    textTransform: "uppercase",
    textAlign: "center",
  },
  dateText: {
    color: "#D32F2F",
    backgroundColor: "#FFEBEE",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 9,
    fontFamily: "Montserrat_700Bold",
    marginTop: 4,
  },
  title: {
    color: colors.primary,
    fontSize: 14,
    lineHeight: 18,
    fontFamily: "Montserrat_800ExtraBold",
    textTransform: "uppercase",
    marginTop: 4,
  },
  subtitle: {
    color: "#5F3DBB",
    fontSize: 13,
    lineHeight: 16,
    fontFamily: "Montserrat_800ExtraBold",
    textTransform: "uppercase",
    marginTop: 2,
  },
  caption: {
    color: "#4A4A4A",
    fontSize: 9,
    fontFamily: "Montserrat_600SemiBold",
    marginTop: 2,
  },
  graphicsContainer: {
    flex: 1,
    width: "100%",
    position: "relative",
    marginTop: 8,
  },
  productColumn: {
    position: "absolute",
    right: 0,
    top: 4,
    alignItems: "center",
  },
  cupLarge: {
    width: 38,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#FFEAAE",
    borderWidth: 2,
    borderColor: "#F98B11",
  },
  cupRow: {
    flexDirection: "row",
    marginTop: 4,
  },
  cupSmall: {
    width: 28,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#FFEAAE",
    borderWidth: 1.5,
    borderColor: "#F98B11",
    marginHorizontal: 2,
  },
  ticketShape: {
    position: "absolute",
    left: 0,
    bottom: 0,
    width: 48,
    height: 54,
    borderRadius: 10,
    backgroundColor: "#8366D6",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-10deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ticketText: {
    color: "#FFFFFF",
    fontSize: 9,
    lineHeight: 11,
    fontFamily: "Montserrat_900Black",
    textAlign: "center",
  },
  indicatorTrack: {
    width: 142,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#D9DDE1",
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 30,
    overflow: "hidden",
  },
  indicatorActive: {
    width: 42,
    height: "100%",
    backgroundColor: colors.primary,
  },
});
