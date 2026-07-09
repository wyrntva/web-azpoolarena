import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Card } from "../../components/Card";
import { colors } from "../../constants/colors";
import { useAuth } from "../../hooks/useAuth";
import { formatDateTime } from "../../utils/format";

export function NotificationScreen() {
  const { notifications } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {notifications.map((item) => {
        let iconName: keyof typeof Ionicons.glyphMap = "notifications-outline";
        let iconColor = colors.primary;
        let iconBg = "rgba(198,1,11,0.08)";

        if (item.type === "promotion") {
          iconName = "sparkles-outline";
          iconColor = colors.secondary;
          iconBg = "rgba(251,191,36,0.08)";
        } else if (item.type === "event") {
          iconName = "trophy-outline";
          iconColor = "#3B82F6";
          iconBg = "rgba(59,130,246,0.08)";
        } else if (item.type === "system") {
          iconName = "settings-outline";
          iconColor = "#10B981";
          iconBg = "rgba(16,185,129,0.08)";
        }

        return (
          <Card key={item.id}>
            <View style={styles.row}>
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.body}</Text>
                <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
              </View>
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 12 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 13, fontWeight: "700" },
  body: { color: colors.textMuted, fontSize: 12, lineHeight: 18, fontWeight: "500" },
  date: { color: colors.textSoft, fontSize: 10, marginTop: 2 },
});
