"use client";

import React, { Suspense } from "react";
import { Form, Input, Button, Card, Typography, notification } from "antd";
import { useRouter, useSearchParams } from "next/navigation";
import { Footer } from "@/components/Footer";
import { LogoSection } from "@/components/LogoSection";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { loginThunk } from "@/stores/auth.slice";

const { Title, Text, Link } = Typography;

interface LoginFormData {
  phone: string;
  password: string;
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const handleLogin = async (values: LoginFormData) => {
    const resultAction = await dispatch(loginThunk({ emailOrPhone: values.phone, password: values.password }));
    // Check if fulfilled or rejected
    if (loginThunk.fulfilled.match(resultAction)) {
      // Redirect to the page user wanted to visit or home
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } else {
      api.error({
        message: "Đăng nhập thất bại!",
        placement: "top"
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {contextHolder}
      <div className="relative z-10 flex flex-col min-h-screen bg-[url('/images/auth_img.png')] bg-cover bg-center">
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

            {/* Login Form */}
            <Card
              className="shadow-2xl border-0 rounded-2xl"
              styles={{ body: { padding: 24 } }}
            >
              {/* Title */}
              <div className="text-gray-800 text-lg italic font-bold" style={{ marginBottom: 16 }}>
                Đăng nhập
              </div>

              <Form
                form={form}
                name="login"
                onFinish={handleLogin}
                layout="vertical"
                size="large"
                requiredMark={false}
              >
                {/* Phone */}
                <Form.Item
                  name="phone"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Số điện thoại
                    </div>
                  }
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại!" },
                    {
                      pattern: /^(0|\+84)[0-9]{9,10}$/,
                      message: "Số điện thoại không hợp lệ! (VD: 0999888777 hoặc +84999888777)",
                    },
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    className="rounded-lg"
                  />
                </Form.Item>

                {/* Password */}
                <Form.Item
                  name="password"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Mật khẩu
                    </div>
                  }
                  rules={[
                    { required: true, message: "Vui lòng nhập mật khẩu!" },
                    { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự!" },
                  ]}
                  style={{ marginBottom: 4 }}
                >
                  <Input.Password
                    placeholder="Nhập mật khẩu"
                    className="rounded-lg"
                  />
                </Form.Item>

                {/* Forgot password */}
                <div className="text-right" style={{ marginBottom: 16 }}>
                  <Link
                    href="/forgot-password"
                    className="!text-[#1B03DC] hover:!text-[#1B03DC]/80"
                  >
                    Quên mật khẩu
                  </Link>
                </div>

                {/* Login button */}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    className="!bg-[#37393E] border-none font-medium !rounded-full"
                    style={{ paddingLeft: 32, paddingRight: 32, height: 44 }}
                    loading={authState.loading}
                  >
                    Đăng nhập
                  </Button>
                </Form.Item>
              </Form>

              {/* Register Section */}
              <div className="text-start" style={{ marginTop: 16 }}>
                <div className="text-gray-800 text-lg font-bold italic" style={{ marginBottom: 16 }}>
                  Bạn chưa có tài khoản?
                </div>
                <Button
                  type="default"
                  className="!rounded-full !border-[#37393E] hover:!border-[#37393E]/80"
                  style={{ paddingLeft: 32, paddingRight: 32, height: 40, fontSize: 16 }}
                  onClick={() => router.push("/register")}
                >
                  Đăng ký ngay
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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen relative overflow-hidden bg-[url('/images/auth_img.png')] bg-cover bg-center flex items-center justify-center">
        <div className="text-white text-lg font-medium">Đang tải...</div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
