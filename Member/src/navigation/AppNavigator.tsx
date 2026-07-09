import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StackHeader } from "../components/StackHeader";
import { colors } from "../constants/colors";
import { BookingScreen } from "../screens/Booking/BookingScreen";
import { HomeScreen } from "../screens/Home/HomeScreen";
import { CardScreen } from "../screens/Member/CardScreen";
import { HistoryScreen } from "../screens/Member/HistoryScreen";
import { NotificationScreen } from "../screens/Notification/NotificationScreen";
import { DeleteAccountScreen } from "../screens/Profile/DeleteAccountScreen";
import { ProfileScreen } from "../screens/Profile/ProfileScreen";
import { TournamentScreen } from "../screens/Tournament/TournamentScreen";
import type { AppStackParamList } from "./types";

const Stack = createNativeStackNavigator<AppStackParamList>();

function withSafeHeader(title: string) {
  return ({ navigation }: { navigation: { goBack: () => void } }) => ({
    header: ({ back }: { back?: unknown }) => (
      <StackHeader
        title={title}
        canGoBack={Boolean(back)}
        onBack={() => navigation.goBack()}
      />
    ),
  });
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: "Montserrat_700Bold" },
        statusBarTranslucent: false,
        statusBarStyle: "dark",
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen
        name="Notification"
        component={NotificationScreen}
        options={withSafeHeader("Thông báo")}
      />
      <Stack.Screen
        name="MemberCard"
        component={CardScreen}
        options={withSafeHeader("Thẻ thành viên")}
      />
      <Stack.Screen
        name="MemberHistory"
        component={HistoryScreen}
        options={withSafeHeader("Lịch sử tích điểm")}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={withSafeHeader("Đặt bàn Billiards")}
      />
      <Stack.Screen
        name="Tournament"
        component={TournamentScreen}
        options={withSafeHeader("Giải đấu CLB")}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={withSafeHeader("Thông tin thành viên")}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={withSafeHeader("Xóa tài khoản")}
      />
    </Stack.Navigator>
  );
}
