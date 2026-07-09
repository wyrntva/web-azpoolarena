import React, { useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Button } from "../../components/Button";
import { Card } from "../../components/Card";
import { colors } from "../../constants/colors";

type TableType = "all" | "pool" | "carom" | "snooker";

const filters: Array<{ key: TableType; label: string }> = [
  { key: "all", label: "Tất cả" },
  { key: "pool", label: "Pool" },
  { key: "carom", label: "Carom" },
  { key: "snooker", label: "Snooker" },
];

const tables = [
  { id: 1, name: "Bàn Pool 01", type: "pool", price: "80.000đ/giờ", available: true, color: "#1E5E3A" },
  { id: 2, name: "Bàn Pool 02", type: "pool", price: "80.000đ/giờ", available: false, color: "#1E5E3A" },
  { id: 3, name: "Bàn Carom 03", type: "carom", price: "100.000đ/giờ", available: true, color: "#2B4B7C" },
  { id: 4, name: "Bàn Snooker 04", type: "snooker", price: "120.000đ/giờ", available: true, color: "#6A222B" },
];

const dateOptions = [
  { key: "today", label: "Hôm nay", sub: "07/07" },
  { key: "tomorrow", label: "Ngày mai", sub: "08/07" },
  { key: "dayAfter", label: "Ngày kia", sub: "09/07" },
];

const timeSlots = [
  "08:00 - 10:00",
  "10:00 - 12:00",
  "12:00 - 14:00",
  "14:00 - 16:00",
  "16:00 - 18:00",
  "18:00 - 20:00",
  "20:00 - 22:00",
  "22:00 - 24:00",
];

export function BookingScreen() {
  const [selectedFilter, setSelectedFilter] = useState<TableType>("all");
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("today");
  const [selectedSlot, setSelectedSlot] = useState("");

  const filteredTables = useMemo(
    () => tables.filter((table) => selectedFilter === "all" || table.type === selectedFilter),
    [selectedFilter]
  );

  const selectedTable = tables.find((table) => table.id === selectedTableId) ?? null;

  function confirmBooking() {
    if (!selectedTable) {
      Alert.alert("Chưa chọn bàn", "Vui lòng chọn bàn bida muốn đặt.");
      return;
    }
    if (!selectedSlot) {
      Alert.alert("Chưa chọn giờ", "Vui lòng chọn khung giờ muốn đặt bàn.");
      return;
    }

    const dateLabel = dateOptions.find((d) => d.key === selectedDate)?.label ?? "Hôm nay";
    const dateSub = dateOptions.find((d) => d.key === selectedDate)?.sub ?? "";

    Alert.alert(
      "Đặt bàn thành công 🎉",
      `Chi nhánh: Wavy Club Quận 1\nBàn: ${selectedTable.name}\nNgày: ${dateLabel} (${dateSub})\nKhung giờ: ${selectedSlot}\n\n* Lưu ý: CLB giữ bàn tối đa 15 phút so với giờ hẹn.`,
      [
        {
          text: "Đồng ý",
          onPress: () => {
            setSelectedTableId(null);
            setSelectedSlot("");
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Phân Loại Loại Bàn */}
      <View style={styles.filterRow}>
        {filters.map((filter) => {
          const active = selectedFilter === filter.key;
          return (
            <Pressable
              key={filter.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => {
                setSelectedFilter(filter.key);
                setSelectedTableId(null);
              }}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* Grid Danh Sách Bàn */}
      <View style={styles.grid}>
        {filteredTables.map((table) => {
          const selected = selectedTableId === table.id;
          return (
            <Pressable
              key={table.id}
              disabled={!table.available}
              onPress={() => setSelectedTableId(table.id)}
              style={[
                styles.tableItem,
                selected && styles.tableItemSelected,
                !table.available && styles.tableItemDisabled,
              ]}
            >
              <Text style={styles.tableName}>{table.name}</Text>
              
              {/* Mô phỏng mặt bàn bida */}
              <View style={[styles.tableVisual, { backgroundColor: table.color }]}>
                <View style={styles.pocketTopLeft} />
                <View style={styles.pocketTopRight} />
                <View style={styles.pocketBottomLeft} />
                <View style={styles.pocketBottomRight} />
                {selected && <View style={styles.cueBall} />}
              </View>

              <Text style={styles.tablePrice}>{table.price}</Text>
              <Text style={[styles.tableStatus, { color: table.available ? colors.success : colors.danger }]}>
                {table.available ? "Còn trống" : "Đang chơi"}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Lựa Chọn Ngày & Khung Giờ */}
      {selectedTable ? (
        <Card>
          <Text style={styles.bookingTitle}>Đặt lịch cho: {selectedTable.name}</Text>
          
          {/* Bộ chọn ngày */}
          <Text style={styles.subHeading}>1. Chọn ngày chơi</Text>
          <View style={styles.dateSelectorRow}>
            {dateOptions.map((date) => {
              const active = selectedDate === date.key;
              return (
                <Pressable
                  key={date.key}
                  style={[styles.dateChip, active && styles.dateChipActive]}
                  onPress={() => setSelectedDate(date.key)}
                >
                  <Text style={[styles.dateText, active && styles.dateTextActive]}>{date.label}</Text>
                  <Text style={[styles.dateSubText, active && styles.dateSubTextActive]}>{date.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Bộ chọn khung giờ */}
          <Text style={styles.subHeading}>2. Chọn khung giờ (2 tiếng/suất)</Text>
          <View style={styles.slotGrid}>
            {timeSlots.map((slot) => {
              const active = selectedSlot === slot;
              return (
                <Pressable
                  key={slot}
                  style={[styles.slotChip, active && styles.slotChipActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Text style={[styles.slotText, active && styles.slotTextActive]}>{slot}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.actionContainer}>
            <Button title="Xác Nhận Đặt Bàn" onPress={confirmBooking} />
          </View>
        </Card>
      ) : (
        <View style={styles.placeholderCard}>
          <Text style={styles.placeholderText}>Vui lòng chọn bàn ở danh sách phía trên để đặt lịch.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterChip: { 
    borderRadius: 12, 
    backgroundColor: colors.surface, 
    paddingHorizontal: 16, 
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#FFFFFF" },
  
  // Table Grid
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },
  tableItem: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  tableItemSelected: { borderColor: colors.secondary },
  tableItemDisabled: { opacity: 0.4 },
  tableName: { color: colors.text, fontSize: 13, fontWeight: "700", textAlign: "center" },
  
  // Bàn bida giả lập
  tableVisual: { 
    width: 90, 
    height: 50, 
    borderRadius: 8, 
    position: "relative",
    borderWidth: 2,
    borderColor: "#4A3B32", // Viền gỗ
    overflow: "hidden",
  },
  pocketTopLeft: { position: "absolute", top: -2, left: -2, width: 8, height: 8, borderRadius: 999, backgroundColor: "#000" },
  pocketTopRight: { position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 999, backgroundColor: "#000" },
  pocketBottomLeft: { position: "absolute", bottom: -2, left: -2, width: 8, height: 8, borderRadius: 999, backgroundColor: "#000" },
  pocketBottomRight: { position: "absolute", bottom: -2, right: -2, width: 8, height: 8, borderRadius: 999, backgroundColor: "#000" },
  cueBall: { position: "absolute", top: 22, left: 30, width: 6, height: 6, borderRadius: 999, backgroundColor: "#FFF" },

  tablePrice: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  tableStatus: { fontSize: 11, fontWeight: "700" },
  
  // Details Booking
  bookingTitle: { color: colors.secondary, fontSize: 14, fontWeight: "800", marginBottom: 12 },
  subHeading: { color: colors.text, fontSize: 12, fontWeight: "700", marginTop: 8, marginBottom: 10 },
  
  // Date Selector
  dateSelectorRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  dateChip: { 
    flex: 1, 
    borderRadius: 12, 
    backgroundColor: "#0B0F19", 
    padding: 10, 
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  dateChipActive: { backgroundColor: "rgba(251,191,36,0.1)", borderColor: colors.secondary },
  dateText: { color: colors.textMuted, fontSize: 12, fontWeight: "700" },
  dateTextActive: { color: colors.secondary },
  dateSubText: { color: colors.textSoft, fontSize: 10, marginTop: 2 },
  dateSubTextActive: { color: colors.secondary },
  
  // Time Slots
  slotGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 },
  slotChip: { 
    width: "48%", 
    borderRadius: 10, 
    backgroundColor: "#0B0F19", 
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  slotChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  slotText: { color: colors.textMuted, fontSize: 11, fontWeight: "600" },
  slotTextActive: { color: "#FFFFFF", fontWeight: "700" },

  actionContainer: { marginTop: 6 },

  placeholderCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    marginTop: 8,
  },
  placeholderText: { color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 20 },
});
