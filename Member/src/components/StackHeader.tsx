import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../constants/colors";

type Props = {
  title: string;
  canGoBack?: boolean;
  onBack?: () => void;
};

export function StackHeader({ title, canGoBack = false, onBack }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 10, height: insets.top + 60 }]}>
      <View style={styles.row}>
        <View style={styles.left}>
          {canGoBack ? (
            <Pressable hitSlop={10} onPress={onBack} style={styles.backButton}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
          ) : null}
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    marginRight: 6,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    fontFamily: "Montserrat_700Bold",
  },
});
