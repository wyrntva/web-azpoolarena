import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "../../constants/colors";
import { HomeBottomNav } from "./components/HomeBottomNav";
import { HomeHeader } from "./components/HomeHeader";
import { PromoCarousel } from "./components/PromoCarousel";
import { SectionHeader } from "./components/SectionHeader";
import { ShortcutMenu } from "./components/ShortcutMenu";
import { VoucherCarousel } from "./components/VoucherCarousel";

const shortcuts = [
  { key: "delivery", label: "Giao hàng", icon: "bicycle-outline" as const },
  { key: "store", label: "Tìm cửa hàng", icon: "location-outline" as const },
  { key: "transaction", label: "Giao dịch", icon: "receipt-outline" as const, badge: "đ" },
  { key: "gift", label: "Quà của bạn", icon: "gift-outline" as const },
];

const promos = [
  {
    id: "promo-1",
    tag: "Tặng 1",
    date: "12.06.2026 - 11.07.2026",
    location: "12.07.2026 Công viên Yên Sở",
    title: "Hóa đơn 300K có 5 sản phẩm mì Modern = 1 tem",
    subtitle: "Tích 5 tem nhận 1 vé concert",
    caption: "Số lượng ưu đãi có hạn",
  },
  {
    id: "promo-2",
    tag: "Mới",
    date: "15.07.2026 - 30.07.2026",
    location: "Áp dụng toàn hệ thống",
    title: "Mua combo mới nhận thêm tem đổi quà",
    subtitle: "Thêm giao dịch, thêm quà hấp dẫn",
    caption: "Theo dõi ưu đãi mới mỗi tuần",
  },
];

const vouchers = [
  { id: "voucher-20", amount: "20.000", points: "4.000", label: "Phiếu mua hàng 20.000 VNĐ" },
  { id: "voucher-10", amount: "10.000", points: "2.000", label: "Phiếu mua hàng 10.000 VNĐ" },
  { id: "voucher-50", amount: "50.000", points: "9.000", label: "Phiếu mua hàng 50.000 VNĐ" },
];

const bottomItems = [
  { key: "home", title: "Trang chủ", icon: "home" as const, active: true },
  { key: "offers", title: "Khuyến mãi", icon: "pricetags-outline" as const, badge: "6" },
  { key: "scan", title: "", icon: "qr-code-outline" as const },
  { key: "stamp", title: "Đặt bàn", icon: "albums-outline" as const, badge: "21" },
  { key: "hot", title: "Giải đấu", icon: "game-controller-outline" as const },
];

export function HomePreview() {
  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          memberName="Việt Anh Trần"
          rankLabel="Thành viên Bạc"
          points={0}
          notificationCount={3}
          onPressProfile={() => {}}
          onPressNotification={() => {}}
        />

        <ShortcutMenu items={shortcuts} />

        <View style={styles.sectionBlock}>
          <SectionHeader icon="gift" title="Ưu đãi đỉnh cao" />
          <PromoCarousel items={promos} />
        </View>

        <View style={styles.sectionBlockTight}>
          <SectionHeader icon="sparkles" title="Đổi điểm nhận voucher" actionLabel="Xem tất cả" />
          <VoucherCarousel items={vouchers} />
        </View>
      </ScrollView>

      <HomeBottomNav items={bottomItems} onPress={() => {}} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingBottom: 128,
  },
  sectionBlock: {
    marginTop: 34,
  },
  sectionBlockTight: {
    marginTop: 6,
  },
});
