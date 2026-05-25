import { Modal } from "antd";
import React from "react";

interface ConfirmModalProps {
  title: string;
  description: string;
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmModal = ({
  title,
  description,
  visible,
  onClose,
  onConfirm,
}: ConfirmModalProps) => {
  return (
    <Modal
      title={<div className="text-gray-800 text-lg font-bold italic m-0">{title}</div>}
      open={visible}
      className="p-6"
      onCancel={onClose}
      footer={[
        <div className="flex justify-end space-x-3">
          <div
            className="text-[#C6010B] text-center w-30 border border-[#C6010B] py-2 px-6 rounded-3xl hover:cursor-pointer"
            onClick={onClose}
          >
            Huỷ
          </div>
          <div
            className="text-white text-center py-2 px-6 bg-[#C6010B] rounded-3xl hover:cursor-pointer"
            onClick={onConfirm}
          >
            Xác nhận
          </div>
        </div>,
      ]}
      width={450}
      centered
    >
      <div className="text-gray-800 text-lg m-0">{description}</div>
    </Modal>
  );
};
