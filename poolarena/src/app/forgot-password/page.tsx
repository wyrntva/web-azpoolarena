"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, notification } from "antd";
import { MailOutlined, SafetyOutlined, LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogoSection } from "@/components/LogoSection";
import { Footer } from "@/components/Footer";
import { useAppDispatch } from "@/stores/hooks";
import { forgotPasswordThunk, verifyOtpThunk, resetPasswordThunk } from "@/stores/auth.slice";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [formStep1] = Form.useForm();
  const [formStep2] = Form.useForm();
  const [formStep3] = Form.useForm();

  // Bước 1: Gửi OTP về email
  const handleSendOtp = async (values: { email: string }) => {
    setLoading(true);
    const result = await dispatch(forgotPasswordThunk({ email: values.email }));
    setLoading(false);

    if (forgotPasswordThunk.fulfilled.match(result)) {
      setEmail(values.email);
      setStep(2);
      api.success({
        message: "Đã gửi mã OTP!",
        description: `Mã OTP gồm 6 chữ số đã được gửi đến ${values.email}. Có hiệu lực trong 10 phút.`,
        placement: "top",
        duration: 4,
      });
    } else {
      api.error({
        message: "Gửi OTP thất bại",
        description: String(result.payload || "Không thể gửi OTP, vui lòng thử lại"),
        placement: "top",
      });
    }
  };

  // Bước 2: Xác minh OTP
  const handleVerifyOtp = async (values: { otp: string }) => {
    setLoading(true);
    const result = await dispatch(verifyOtpThunk({ email, code: values.otp }));
    setLoading(false);

    if (verifyOtpThunk.fulfilled.match(result)) {
      setOtp(values.otp);
      setStep(3);
    } else {
      api.error({
        message: "OTP không hợp lệ",
        description: String(result.payload || "Mã OTP không đúng hoặc đã hết hạn"),
        placement: "top",
      });
    }
  };

  // Bước 3: Đặt mật khẩu mới
  const handleResetPassword = async (values: { newPassword: string }) => {
    setLoading(true);
    const result = await dispatch(
      resetPasswordThunk({ email, token: otp, password: values.newPassword })
    );
    setLoading(false);

    if (resetPasswordThunk.fulfilled.match(result)) {
      api.success({
        message: "Đặt lại mật khẩu thành công!",
        description: "Bạn sẽ được chuyển về trang đăng nhập.",
        placement: "top",
        duration: 2,
      });
      setTimeout(() => router.push("/login"), 2000);
    } else {
      api.error({
        message: "Đặt lại mật khẩu thất bại",
        description: String(result.payload || "Vui lòng thử lại"),
        placement: "top",
      });
    }
  };

  const stepTitles = {
    1: "Quên mật khẩu?",
    2: "Nhập mã OTP",
    3: "Đặt mật khẩu mới",
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {contextHolder}
      <div className="relative z-10 flex flex-col min-h-screen bg-[url('/images/auth_img.webp')] bg-cover bg-center">
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <LogoSection />
              <div className="text-white text-base mb-2">
                Chào mừng bạn đến với{" "}
                <span className="font-bold">Pool Arena</span>!
              </div>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <React.Fragment key={s}>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step === s
                        ? "bg-[#37393E] text-white"
                        : step > s
                        ? "bg-green-500 text-white"
                        : "bg-white/40 text-white"
                    }`}
                  >
                    {step > s ? "✓" : s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-0.5 w-10 transition-all ${
                        step > s ? "bg-green-500" : "bg-white/40"
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <Card className="shadow-2xl border-0 rounded-2xl" styles={{ body: { padding: 24 } }}>
              <div className="text-gray-800 text-lg italic font-bold mb-2">
                {stepTitles[step]}
              </div>

              {/* Bước 1: Nhập email */}
              {step === 1 && (
                <>
                  <p className="text-gray-500 text-sm mb-5">
                    Nhập email đã đăng ký để nhận mã OTP xác thực.
                  </p>
                  <Form
                    form={formStep1}
                    onFinish={handleSendOtp}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      label={<span className="text-gray-800 font-semibold">Email <span className="text-red-500">*</span></span>}
                      hasFeedback
                      rules={[
                        { required: true, message: "Email không được để trống" },
                        { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Email không hợp lệ" },
                      ]}
                    >
                      <Input
                        prefix={<MailOutlined className="text-gray-400" />}
                        placeholder="Nhập địa chỉ email của bạn"
                        className="rounded-lg"
                      />
                    </Form.Item>
                    <div className="flex items-center justify-between mt-6">
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="!bg-[#37393E] border-none font-medium !rounded-full"
                        style={{ paddingLeft: 32, paddingRight: 32, height: 44 }}
                        loading={loading}
                      >
                        Gửi mã OTP
                      </Button>
                      <Link href="/login" className="text-[#37393E] hover:text-[#37393E]/80 text-base flex items-center gap-1.5">
                        <ArrowLeftOutlined />
                        Trở lại đăng nhập
                      </Link>
                    </div>
                  </Form>
                </>
              )}

              {/* Bước 2: Nhập OTP */}
              {step === 2 && (
                <>
                  <p className="text-gray-500 text-sm mb-5">
                    Mã OTP 6 chữ số đã được gửi đến{" "}
                    <span className="font-semibold text-gray-700">{email}</span>.
                  </p>
                  <Form
                    form={formStep2}
                    onFinish={handleVerifyOtp}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                  >
                    <Form.Item
                      name="otp"
                      label={<span className="text-gray-800 font-semibold">Mã OTP <span className="text-red-500">*</span></span>}
                      hasFeedback
                      rules={[
                        { required: true, message: "Vui lòng nhập mã OTP" },
                        { pattern: /^[0-9]{6}$/, message: "Mã OTP gồm 6 chữ số" },
                      ]}
                    >
                      <Input
                        prefix={<SafetyOutlined className="text-gray-400" />}
                        placeholder="Nhập mã OTP 6 chữ số"
                        className="rounded-lg"
                        maxLength={6}
                      />
                    </Form.Item>
                    <div className="flex items-center justify-between mt-6">
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="!bg-[#37393E] border-none font-medium !rounded-full"
                        style={{ paddingLeft: 32, paddingRight: 32, height: 44 }}
                        loading={loading}
                      >
                        Xác nhận OTP
                      </Button>
                      <Button
                        type="link"
                        onClick={() => setStep(1)}
                        className="!text-[#37393E] !p-0"
                      >
                        <ArrowLeftOutlined className="mr-1" />
                        Quay lại
                      </Button>
                    </div>
                  </Form>
                </>
              )}

              {/* Bước 3: Nhập mật khẩu mới */}
              {step === 3 && (
                <>
                  <p className="text-gray-500 text-sm mb-5">
                    OTP hợp lệ. Hãy đặt mật khẩu mới cho tài khoản của bạn.
                  </p>
                  <Form
                    form={formStep3}
                    onFinish={handleResetPassword}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                  >
                    <Form.Item
                      name="newPassword"
                      label={<span className="text-gray-800 font-semibold">Mật khẩu mới <span className="text-red-500">*</span></span>}
                      hasFeedback
                      rules={[
                        { required: true, message: "Mật khẩu không được để trống" },
                        { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-400" />}
                        placeholder="Nhập mật khẩu mới"
                        className="rounded-lg"
                      />
                    </Form.Item>
                    <Form.Item
                      name="confirmPassword"
                      label={<span className="text-gray-800 font-semibold">Xác nhận mật khẩu <span className="text-red-500">*</span></span>}
                      hasFeedback
                      dependencies={["newPassword"]}
                      rules={[
                        { required: true, message: "Vui lòng xác nhận mật khẩu" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("newPassword") === value) return Promise.resolve();
                            return Promise.reject(new Error("Mật khẩu xác nhận không khớp"));
                          },
                        }),
                      ]}
                      style={{ marginBottom: 0 }}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-gray-400" />}
                        placeholder="Nhập lại mật khẩu mới"
                        className="rounded-lg"
                      />
                    </Form.Item>
                    <div className="flex items-center justify-between mt-6">
                      <Button
                        type="primary"
                        htmlType="submit"
                        className="!bg-[#37393E] border-none font-medium !rounded-full"
                        style={{ paddingLeft: 32, paddingRight: 32, height: 44 }}
                        loading={loading}
                      >
                        Xác nhận
                      </Button>
                      <Button
                        type="link"
                        onClick={() => setStep(2)}
                        className="!text-[#37393E] !p-0"
                      >
                        <ArrowLeftOutlined className="mr-1" />
                        Quay lại
                      </Button>
                    </div>
                  </Form>
                </>
              )}
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </div>
  );
}
