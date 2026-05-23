"use client";

import React from "react";
import { Form, Input, Button, Card, Typography, Result } from "antd";
import { PhoneOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogoSection } from "@/components/LogoSection";
import { Footer } from "@/components/Footer";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { forgotPasswordThunk } from "@/stores/auth.slice";

const { Title, Text, Link } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [isSuccess, setIsSuccess] = useState(false);

  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const handleForgotPassword = async (values: { phoneNumber: string }) => {
    const resultAction = await dispatch(forgotPasswordThunk({ phoneNumber: values.phoneNumber }));
    if (forgotPasswordThunk.fulfilled.match(resultAction)) {
      setIsSuccess(true);
    } else {
      console.error("Forgot password failed:", (resultAction as any).payload);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
          <div className="absolute inset-0 bg-blue-900/70"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl">
            <Result
              status="success"
              title="Yêu cầu đã được gửi!"
              subTitle="Chúng tôi đã gửi mã xác thực đến số điện thoại của bạn. Vui lòng kiểm tra tin nhắn và làm theo hướng dẫn."
              extra={[
                <Button
                  type="primary"
                  key="back-to-login"
                  className="bg-blue-600 hover:bg-blue-700 border-none"
                  onClick={() => router.push("/login")}
                >
                  Quay lại đăng nhập
                </Button>,
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Main Content */}
      <div className="relative z-10 flex flex-col min-h-screen bg-[url('/images/auth_img.png')] bg-cover bg-center">
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

            {/* Forgot Password Form */}
            <Card className="shadow-2xl border-0 rounded-2xl">
              <div className="text-gray-800 text-lg italic font-bold mb-4">
                Quên mật khẩu?
              </div>

              <Form
                form={form}
                name="forgot-password"
                onFinish={handleForgotPassword}
                layout="vertical"
                requiredMark={false}
                size="large"
              >
                <Form.Item
                  name="phoneNumber"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Số điện thoại
                    </div>
                  }
                  rules={[
                    { required: true, message: "Vui lòng nhập số điện thoại!" },
                    {
                      pattern: /^\+84[0-9]{9,10}$/,
                      message: "Số điện thoại không hợp lệ!",
                    },
                  ]}
                >
                  <Input
                    prefix={<PhoneOutlined />}
                    placeholder="Nhập số điện thoại (ví dụ: +84901234567)"
                    className="rounded-lg"
                  />
                </Form.Item>
              </Form>

              {/* Back to Login */}
              <div className="flex justify-between text-center mt-6">
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  htmlType="submit"
                  className="w-1/2 h-12 !bg-[#37393E] border-none font-medium !rounded-full"
                  loading={authState.loading}
                >
                  Khôi phục mật khẩu
                </Button>
                <Link
                  href="/login"
                  className="!text-[#37393E] !hover:text-[#37393E]/80"
                >
                  Trở lại đăng nhập
                </Link>
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
