"use client";

import React, { Suspense, useState, useEffect } from "react";
import { Form, Button, Card, Typography, DatePicker, notification } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import dayjs from "dayjs";
import { Footer } from "@/components/Footer";
import { LogoSection } from "@/components/LogoSection";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { setUser, logout } from "@/stores/auth.slice";
import { authAPI } from "@/api/auth.api";

const { Link } = Typography;

function UpdateBirthdayContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [loading, setLoading] = useState(false);

  const redirectTo = searchParams.get("redirect") || "/";

  // Check auth state
  useEffect(() => {
    // If not logged in, redirect to login
    if (typeof window !== "undefined") {
      const storedToken = localStorage.getItem("token");
      if (!token && !storedToken) {
        router.push(`/login?redirect=${encodeURIComponent(redirectTo)}`);
        return;
      }
    }

    // If user already has birthday, redirect
    if (user?.birthday && String(user.birthday).trim() !== "") {
      router.push(redirectTo);
    }
  }, [user, token, router, redirectTo]);

  const handleSubmit = async (values: { birthday: any }) => {
    if (!values.birthday) return;

    setLoading(true);
    try {
      const formattedBirthday =
        typeof values.birthday.format === "function"
          ? values.birthday.format("YYYY-MM-DD")
          : String(values.birthday);

      const updatedUser = await authAPI.updateProfile({
        birthday: formattedBirthday,
      });

      dispatch(setUser(updatedUser));
      api.success({
        message: "Cập nhật ngày sinh thành công!",
        placement: "top",
      });

      router.push(redirectTo);
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        "Cập nhật không thành công. Vui lòng thử lại.";
      api.error({
        message: "Lỗi",
        description: errorMsg,
        placement: "top",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    router.push("/login");
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {contextHolder}
      <div className="relative z-10 flex flex-col min-h-screen bg-[url('/images/auth_img.webp')] bg-cover bg-center">
        {/* Header */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            {/* Logo and Welcome Text */}
            <div className="text-center mb-8">
              <LogoSection />
              <div className="text-white text-base mb-2">
                Chào mừng bạn đến với{" "}
                <span className="font-bold">Pool Arena</span>!
              </div>
            </div>

            {/* Birthday Card */}
            <Card
              className="shadow-2xl border-0 rounded-2xl"
              styles={{ body: { padding: 24 } }}
            >
              {/* Title */}
              <div
                className="text-gray-800 text-lg italic font-bold"
                style={{ marginBottom: 8 }}
              >
                Bổ sung thông tin
              </div>
              <div className="text-gray-500 text-sm mb-6 leading-relaxed">
                Tài khoản của bạn chưa có ngày sinh. Vui lòng nhập ngày tháng năm sinh để hoàn tất đăng nhập. Thông tin này giúp Pool Arena áp dụng các chương trình ưu đãi độc quyền trong tháng sinh nhật của bạn, đồng thời đảm bảo bạn đủ điều kiện tham gia các giải đấu phân hạng theo độ tuổi.
              </div>

              <Form
                form={form}
                name="updateBirthday"
                onFinish={handleSubmit}
                onFinishFailed={() =>
                  api.error({
                    message: "Vui lòng chọn ngày tháng năm sinh hợp lệ",
                    placement: "top",
                  })
                }
                layout="vertical"
                size="large"
                requiredMark={false}
              >
                <Form.Item
                  name="birthday"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Ngày tháng năm sinh
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  }
                  hasFeedback
                  rules={[
                    {
                      required: true,
                      message: "Ngày tháng năm sinh không được để trống",
                    },
                  ]}
                  style={{ marginBottom: 24 }}
                >
                  <DatePicker
                    placeholder="Chọn ngày tháng năm sinh"
                    format="DD/MM/YYYY"
                    className="w-full rounded-lg"
                    style={{ height: 44 }}
                    disabledDate={(current) =>
                      current && current > dayjs().endOf("day")
                    }
                  />
                </Form.Item>

                <Form.Item style={{ marginBottom: 16 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="!bg-[#37393E] border-none font-medium !rounded-full w-full"
                    style={{ height: 44 }}
                    loading={loading}
                  >
                    Hoàn tất đăng nhập
                  </Button>
                </Form.Item>
              </Form>

              <div className="text-center pt-2">
                <Button
                  type="link"
                  onClick={handleLogout}
                  className="!text-gray-500 hover:!text-gray-700 text-sm"
                >
                  Đăng xuất tài khoản khác
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

export default function UpdateBirthdayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen relative overflow-hidden bg-[url('/images/auth_img.webp')] bg-cover bg-center flex items-center justify-center">
          <div className="text-white text-lg font-medium">Đang tải...</div>
        </div>
      }
    >
      <UpdateBirthdayContent />
    </Suspense>
  );
}
