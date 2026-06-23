"use client";

import React from "react";
import { Form, Input, Button, Card, Typography, Select, notification } from "antd";
import { useRouter } from "next/navigation";
import { LogoSection } from "@/components/LogoSection";
import { Footer } from "@/components/Footer";
import { useAppDispatch, useAppSelector } from "@/stores/hooks";
import { registerThunk, loginThunk } from "@/stores/auth.slice";
import { tournamentSettingsAPI } from "@/api/tournamentSettings.api";
import { UserGender } from "@/types/user.types";
import { RegisterFormData } from "@/types/auth.types";
import { formatLevel, formatFullLevel } from "@/lib/tournament-utils";

const { Link } = Typography;



export default function RegisterPage() {
  const router = useRouter();
  const [form] = Form.useForm();
  const [api, contextHolder] = notification.useNotification();
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const [ranks, setRanks] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchRanks = async () => {
      try {
        const response = await tournamentSettingsAPI.getRanks();
        setRanks(response.data);
      } catch (error) {
        console.error("Failed to fetch ranks:", error);
      }
    };
    fetchRanks();
  }, []);

  const handleRegister = async (values: RegisterFormData) => {

    const { confirmPassword, ...registerData } = values;

    const resultAction = await dispatch(registerThunk(registerData as any));
    if (registerThunk.fulfilled.match(resultAction)) {
      // Auto login after successful registration
      const loginResult = await dispatch(loginThunk({
        emailOrPhone: registerData.phoneNumber,
        password: registerData.password
      }));

      if (loginThunk.fulfilled.match(loginResult)) {
        router.push("/");
      } else {
        router.push("/login");
      }
    } else {
      api.error({
        message: "Đăng ký không thành công!",
        placement: "top"
      });
      
      const errorMsg = String(resultAction.payload || '').toLowerCase();
      if (
        errorMsg.includes('số điện thoại') ||
        errorMsg.includes('phone') ||
        errorMsg.includes('đăng ký') ||
        errorMsg.includes('registered') ||
        errorMsg.includes('exist') ||
        errorMsg.includes('tồn tại')
      ) {
        form.setFields([
          {
            name: "phoneNumber",
            errors: ["Số điện thoại đã tồn tại"],
          },
        ]);
      }
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {contextHolder}
      <div className="relative z-10 flex flex-col min-h-screen bg-[url('/images/auth_img.webp')] bg-cover bg-center">
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

            {/* Register Form */}
            <Card
              className="shadow-2xl border-0 rounded-2xl"
              styles={{ body: { padding: 24 } }}
            >
              <div className="text-gray-800 text-lg italic font-bold" style={{ marginBottom: 16 }}>
                Đăng ký
              </div>

              <Form
                form={form}
                name="register"
                onFinish={handleRegister}
                onFinishFailed={() => api.error({ message: "Đăng ký không thành công!", placement: "top" })}
                layout="vertical"
                size="large"
                requiredMark={false}
              >
                <Form.Item
                  name="fullName"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Họ và tên
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  }
                  hasFeedback
                  rules={[
                    { required: true, message: "Họ và tên không được để trống" },
                    { min: 2, message: "Họ và tên phải có ít nhất 2 ký tự!" },
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <Input placeholder="Nhập họ và tên" className="rounded-lg" />
                </Form.Item>

                <Form.Item
                  name="gender"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Giới tính
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  }
                  hasFeedback
                  rules={[
                    { required: true, message: "Giới tính không được để trống" },
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <Select placeholder="Chọn giới tính">
                    <Select.Option value="male">Nam</Select.Option>
                    <Select.Option value="female">Nữ</Select.Option>
                    <Select.Option value="other">Khác</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name="address"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Địa chỉ
                    </div>
                  }
                  hasFeedback
                  style={{ marginBottom: 16 }}
                >
                  <Input placeholder="Nhập địa chỉ" className="rounded-lg" />
                </Form.Item>

                <Form.Item
                   name="rank"
                   className="w-full-label"
                   label={
                     <div className="flex justify-between items-center w-full">
                       <div className="text-gray-800 text-base font-semibold">
                         Level
                         <span className="text-red-500 ml-1">*</span>
                       </div>
                       <a 
                         href="/info" 
                         target="_blank" 
                         rel="noopener noreferrer" 
                         className="text-sm font-bold text-blue-600 hover:text-blue-700 hover:underline"
                       >
                         Thông tin Level
                       </a>
                     </div>
                   }
                   hasFeedback
                   rules={[{ required: true, message: "Level không được để trống" }]}
                   style={{ marginBottom: 16 }}
                 >
                   <Select placeholder="Level của bạn">
                     {ranks.map((rank) => (
                       <Select.Option key={rank.id} value={rank.name}>
                         {formatFullLevel(rank.name)}
                       </Select.Option>
                     ))}
                   </Select>
                 </Form.Item>

                 <Form.Item
                  name="phoneNumber"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Số điện thoại
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  }
                  hasFeedback
                  rules={[
                    { required: true, message: "Số điện thoại không được để trống" },
                    {
                      pattern: /^(0|\+84)[0-9]{9,10}$/,
                      message: "Số điện thoại không hợp lệ",
                    },
                  ]}
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    placeholder="Nhập số điện thoại"
                    className="rounded-lg"
                  />
                </Form.Item>

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
                  style={{ marginBottom: 16 }}
                >
                  <Input
                    placeholder="Nhập địa chỉ email"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="password"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Mật khẩu
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
                    placeholder="Nhập mật khẩu tối thiểu 6 ký tự"
                    className="rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  name="confirmPassword"
                  label={
                    <div className="text-gray-800 text-base font-semibold">
                      Nhập lại mật khẩu
                      <span className="text-red-500 ml-1">*</span>
                    </div>
                  }
                  hasFeedback
                  dependencies={["password"]}
                  rules={[
                    { required: true, message: "Nhập lại mật khẩu không được để trống" },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue("password") === value) {
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
                    placeholder="Nhập lại mật khẩu"
                    className="rounded-lg"
                  />
                </Form.Item>
              </Form>

              {/* Bottom row */}
              <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  onClick={() => form.submit()}
                  className="!bg-[#37393E] border-none font-medium !rounded-full"
                  style={{ paddingLeft: 32, paddingRight: 32, height: 44 }}
                  loading={authState.loading}
                >
                  Đăng ký
                </Button>
                <Link
                  href="/login"
                  className="!text-[#37393E] hover:!text-[#37393E]/80 text-base"
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
