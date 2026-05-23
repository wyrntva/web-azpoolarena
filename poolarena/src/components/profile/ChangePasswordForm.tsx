"use client";

import React from "react";
import { Button, Form, Input, notification } from 'antd';
import { authAPI } from "@/api/auth.api";

export default function ChangePasswordForm() {
    const [form] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const [api, contextHolder] = notification.useNotification();

    const handleSubmit = async (values: any) => {
        try {
            setLoading(true);
            await authAPI.changePassword({
                currentPassword: values.oldPassword,
                newPassword: values.newPassword,
            });

            api.success({ message: "Đổi mật khẩu thành công!" });
            form.resetFields();
        } catch (error: any) {
            api.error({
                message: "Lỗi",
                description: error?.response?.data?.detail || "Không thể đổi mật khẩu, vui lòng thử lại.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl px-6 pb-3 mb-8">
            {contextHolder}
            <div className="bg-[#172339] w-1/2 text-white text-2xl font-bold px-8 py-3 text-center rounded-bl-[32px] rounded-br-[32px] mx-auto">
                ĐỔI MẬT KHẨU
            </div>

            <Form
                form={form}
                layout="vertical"
                className="pt-6"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label={<div className="text-gray-800 text-base font-semibold">
                        Mật khẩu cũ
                        <span className="text-red-500 ml-1">*</span>
                    </div>}
                    name="oldPassword"
                    rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
                >
                    <Input.Password placeholder="Nhập mật khẩu cũ" className="h-11" />
                </Form.Item>

                <Form.Item
                    label={<div className="text-gray-800 text-base font-semibold">
                        Mật khẩu mới
                        <span className="text-red-500 ml-1">*</span>
                    </div>}
                    name="newPassword"
                    rules={[
                        { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                        { min: 6, message: 'Tối thiểu 6 ký tự' },
                    ]}
                >
                    <Input.Password placeholder="Nhập mật khẩu tối thiểu 6 ký tự" className="h-11" />
                </Form.Item>

                <Form.Item
                    label={<div className="text-gray-800 text-base font-semibold">
                        Nhập lại mật khẩu
                        <span className="text-red-500 ml-1">*</span>
                    </div>}
                    name="confirmPassword"
                    dependencies={["newPassword"]}
                    rules={[
                        { required: true, message: 'Vui lòng nhập lại mật khẩu' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('newPassword') === value) {
                                    return Promise.resolve();
                                }
                                return Promise.reject(new Error('Mật khẩu nhập lại không khớp'));
                            },
                        }),
                    ]}
                >
                    <Input.Password placeholder="Nhập lại mật khẩu" className="h-11" />
                </Form.Item>

                <Form.Item className="mb-0">
                    <div className="flex justify-end pt-2">
                        <Button htmlType="submit" type="primary" loading={loading} className="!px-6 h-11 !rounded-full font-medium !bg-[#C6010B]">
                            ĐỔI MẬT KHẨU
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </div>
    );
}
