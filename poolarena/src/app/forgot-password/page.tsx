"use client";

import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, notification } from "antd";
import { MailOutlined, KeyOutlined, LockOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { LogoSection } from "@/components/LogoSection";
import { Footer } from "@/components/Footer";
import { useAppDispatch } from "@/stores/hooks";
import { forgotPasswordThunk, resetPasswordThunk } from "@/stores/auth.slice";

const { Link } = Typography;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [api, contextHolder] = notification.useNotification();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const [formStep1] = Form.useForm();
  const [formStep2] = Form.useForm();

  // Step 1: Send verification code to email
  const handleSendCode = async (values: { email: string }) => {
    setLoading(true);
    const resultAction = await dispatch(forgotPasswordThunk({ email: values.email }));
    setLoading(false);

    if (forgotPasswordThunk.fulfilled.match(resultAction)) {
      setEmail(values.email);
      setStep(2);
      api.success({
        message: "Mã xác thực đã được gửi!",
        description: `Chúng tôi đã gửi mã xác thực gồm 6 chữ số đến địa chỉ email ${values.email}. Vui lòng kiểm tra hộp thư của bạn.`,
        placement: "top",
        duration: 5,
      });
    } else {
      const errorMsg = String(resultAction.payload || "Không thể gửi mã xác thực");
      api.error({
        message: "Khôi phục mật khẩu thất bại",
        description: errorMsg,
        placement: "top",
      });
    }
  };

  // Step 2: Verify code and update new password
  const handleResetPassword = async (values: { code: string; newPassword: string }) => {
    setLoading(true);
    const resultAction = await dispatch(
      resetPasswordThunk({ email, token: values.code, password: values.newPassword })
    );
    setLoading(false);

    if (resetPasswordThunk.fulfilled.match(resultAction)) {
      api.success({
        message: "Cập nhật mật khẩu thành công!",
        description: "Mật khẩu của bạn đã được đặt lại thành công. Bạn đang được chuyển hướng về trang Đăng nhập.",
        placement: "top",
        duration: 3,
      });
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } else {
      const errorMsg = String(resultAction.payload || "Đặt lại mật khẩu thất bại");
      api.error({
        message: "Đặt lại mật khẩu thất bại",
        description: errorMsg,
        placement: "top",
      });
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {contextHolder}
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

            {/* Forgot Password Card */}
            <Card className="shadow-2xl border-0 rounded-2xl" styles={{ body: { padding: 24 } }}>
              {step === 1 ? (
                <>
                  <div className="text-gray-800 text-lg italic font-bold mb-4">
                    Quên mật khẩu?
                  </div>

                  <Form
                    form={formStep1}
                    name="forgot-password-step1"
                    onFinish={handleSendCode}
                    onFinishFailed={() => api.error({ message: "Khôi phục mật khẩu thất bại", placement: "top" })}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                  >
                    <Form.Item
                      name="email"
                      label={
                        <div className="text-gray-800 text-base font-semibold">
                          Email
                          <span className="text-red-500 ml-1">*</span>
                        </div>
                      }
                      hasFeedback
                      rules={[
                        { required: true, message: "Email không được để trống" },
                        {
                          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: "Email không hợp lệ",
                        },
                      ]}
                      style={{ marginBottom: 20 }}
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
                        Khôi phục mật khẩu
                      </Button>
                      <Link
                        href="/login"
                        className="!text-[#37393E] hover:!text-[#37393E]/80 text-base flex items-center"
                      >
                        <ArrowLeftOutlined className="mr-1.5" />
                        Trở lại đăng nhập
                      </Link>
                    </div>
                  </Form>
                </>
              ) : (
                <>
                  <div className="text-gray-800 text-lg italic font-bold mb-4">
                    Đặt lại mật khẩu mới
                  </div>

                  <Form
                    form={formStep2}
                    name="forgot-password-step2"
                    onFinish={handleResetPassword}
                    onFinishFailed={() => api.error({ message: "Đặt lại mật khẩu thất bại", placement: "top" })}
                    layout="vertical"
                    requiredMark={false}
                    size="large"
                  >
                    {/* Verification Code */}
                    <Form.Item
                      name="code"
                      label={
                        <div className="text-gray-800 text-base font-semibold">
                          Mã xác thực
                          <span className="text-red-500 ml-1">*</span>
                        </div>
                      }
                      hasFeedback
                      rules={[
                        { required: true, message: "Mã xác thực không được để trống" },
                        {
                          pattern: /^[0-9]{6}$/,
                          message: "Mã xác thực phải gồm 6 chữ số",
                        },
                      ]}
                      style={{ marginBottom: 16 }}
                    >
                      <Input
                        prefix={<KeyOutlined className="text-gray-400" />}
                        placeholder="Nhập mã xác thực 6 chữ số"
                        className="rounded-lg"
                      />
                    </Form.Item>

                    {/* New Password */}
                    <Form.Item
                      name="newPassword"
                      label={
                        <div className="text-gray-800 text-base font-semibold">
                          Mật khẩu mới
                          <span className="text-red-500 ml-1">*</span>
                        </div>
                      }
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

                    {/* Confirm Password */}
                    <Form.Item
                      name="confirmPassword"
                      label={
                        <div className="text-gray-800 text-base font-semibold">
                          Nhập lại mật khẩu mới
                          <span className="text-red-500 ml-1">*</span>
                        </div>
                      }
                      hasFeedback
                      dependencies={["newPassword"]}
                      rules={[
                        { required: true, message: "Nhập lại mật khẩu không được để trống" },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || getFieldValue("newPassword") === value) {
                              return Promise.resolve();
                            }
                            return Promise.reject(
                              new Error("Xác nhận mật khẩu không trùng khớp với mật khẩu")
                            );
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
                        Cập nhật mật khẩu
                      </Button>
                      <Button
                        type="default"
                        onClick={() => setStep(1)}
                        className="!rounded-full !border-[#37393E] hover:!border-[#37393E]/80"
                        style={{ paddingLeft: 24, paddingRight: 24, height: 40 }}
                      >
                        Quay lại
                      </Button>
                    </div>
                  </Form>
                </>
              )}
            </Card>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
