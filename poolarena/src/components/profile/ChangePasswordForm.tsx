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
                description: error?.response?.data?.message || error?.response?.data?.detail || "Không thể đổi mật khẩu, vui lòng thử lại.",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl lg:rounded-3xl overflow-hidden pb-4 lg:pb-0 mb-0 shadow-sm lg:w-[1360px] lg:h-[380px] lg:mx-auto">
            {contextHolder}
            <div className="flex justify-center w-full md:mb-4">
                <div className="bg-[#172339] text-white text-base sm:text-xl font-bold py-3 text-center uppercase tracking-wider w-full rounded-none md:w-[648px] md:h-[56px] md:rounded-t-none md:rounded-b-[32px] md:py-3 md:px-6 md:gap-[10px] md:text-[24px] md:leading-[32px] md:font-bold md:flex md:items-center md:justify-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    ĐỔI MẬT KHẨU
                </div>
            </div>

            <Form
                form={form}
                layout="vertical"
                className="!px-6 !pt-4 !pb-0 lg:!px-6 lg:!pt-0 lg:!pb-4"
                onFinish={handleSubmit}
                requiredMark={false}
            >
                {/* Mật khẩu cũ */}
                <div className="!mb-4">
                    <div className="text-gray-800 text-sm font-semibold pb-1 select-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Mật khẩu cũ <span className="text-[#C6010B] ml-0.5">*</span>
                    </div>
                    <Form.Item
                        name="oldPassword"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ' }]}
                        className="!mb-0"
                    >
                        <Input.Password placeholder="Nhập mật khẩu cũ" className="h-11 rounded-lg" />
                    </Form.Item>
                </div>

                {/* Mật khẩu mới */}
                <div className="!mb-4">
                    <div className="text-gray-800 text-sm font-semibold pb-1 select-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Mật khẩu mới <span className="text-[#C6010B] ml-0.5">*</span>
                    </div>
                    <Form.Item
                        name="newPassword"
                        rules={[
                            { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                            { min: 6, message: 'Tối thiểu 6 ký tự' },
                        ]}
                        className="!mb-0"
                    >
                        <Input.Password placeholder="Nhập mật khẩu tối thiểu 6 ký tự" className="h-11 rounded-lg" />
                    </Form.Item>
                </div>

                {/* Nhập lại mật khẩu */}
                <div className="!mb-4">
                    <div className="text-gray-800 text-sm font-semibold pb-1 select-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Nhập lại mật khẩu <span className="text-[#C6010B] ml-0.5">*</span>
                    </div>
                    <Form.Item
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
                        className="!mb-0"
                    >
                        <Input.Password placeholder="Nhập lại mật khẩu" className="h-11 rounded-lg" />
                    </Form.Item>
                </div>

                {/* Submit button */}
                <Form.Item className="!mb-0">
                    <div className="flex justify-end">
                        <Button 
                            htmlType="submit" 
                            type="primary" 
                            loading={loading} 
                            className="!w-auto !px-8 h-12 !rounded-full font-bold text-sm uppercase tracking-wider !bg-[#C6010B] border-none hover:opacity-90 active:scale-95 transition-all shadow-md"
                            style={{ fontFamily: 'Montserrat, sans-serif' }}
                        >
                            ĐỔI MẬT KHẨU
                        </Button>
                    </div>
                </Form.Item>
            </Form>
        </div>
    );
}
