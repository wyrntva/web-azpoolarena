import React, { useState } from "react";
import { Modal, Typography, Select, Avatar, Button, DatePicker, Form } from "antd";
import { UserOutlined, CloseOutlined } from "@ant-design/icons";
import MatchRow from "./MatchRow";
import dayjs from "dayjs";

const { Title, Text } = Typography;
const { Option } = Select;

interface Player {
  id: number;
  name: string;
  avatar: string | null;
}

interface Match {
  id: number;
  leftPlayer: Player;
  rightPlayer: Player;
  leftScore?: number;
  rightScore?: number;
  status: "pending" | "ongoing" | "completed";
  tableNumber: string;
  startTime?: string;
  leftPlayerStatus?: "confirmed" | "pending";
  rightPlayerStatus?: "confirmed" | "pending";
}

interface MatchManagementModalProps {
  visible: boolean;
  match: Match | null;
  onClose: () => void;
  onSave: (matchData: Partial<Match>) => void;
}

export const MatchManagementModal: React.FC<MatchManagementModalProps> = ({
  visible,
  match,
  onClose,
  onSave,
}) => {
  const [form] = Form.useForm();
  const [leftScore, setLeftScore] = useState<number>(match?.leftScore || 0);
  const [rightScore, setRightScore] = useState<number>(match?.rightScore || 0);

  // Update form values when match changes
  React.useEffect(() => {
    if (match) {
      form.setFieldsValue({
        status: match.status,
        tableNumber: match.tableNumber,
        startTime: match.startTime ? dayjs(match.startTime) : null,
        leftPlayerStatus: match.leftPlayerStatus || "confirmed",
        rightPlayerStatus: match.rightPlayerStatus || "pending",
      });
      setLeftScore(match.leftScore || 0);
      setRightScore(match.rightScore || 0);
    }
  }, [match, form]);

  const handleSave = (values: any) => {
    if (match) {
      onSave({
        id: match.id,
        status: values.status as "pending" | "ongoing" | "completed",
        tableNumber: values.tableNumber,
        leftScore,
        rightScore,
        startTime: values.startTime?.format("YYYY-MM-DD HH:mm:ss"),
        leftPlayerStatus: values.leftPlayerStatus as "confirmed" | "pending",
        rightPlayerStatus: values.rightPlayerStatus as "confirmed" | "pending",
      });
    }
    onClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ongoing":
        return "text-[#00B814]";
      case "completed":
        return "text-gray-400";
      case "incoming":
        return "text-[#F0A400]";
      default:
        return "text-[#C6010B]";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "ongoing":
        return "Đang diễn ra";
      case "completed":
        return "Đã kết thúc";
      case "incoming":
        return "Sắp diễn ra";
      default:
        return "Chưa bắt đầu";
    }
  };

  const getPlayerStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "text-[#00B814]";
      case "pending":
        return "text-[#F0A400]";
      default:
        return "text-gray-400";
    }
  };

  const getPlayerStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Xác nhận tham gia";
      case "pending":
        return "Chưa xác nhận tham gia";
      default:
        return "Chưa xác nhận";
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={500}
      centered
      closeIcon={<CloseOutlined className="text-gray-600" />}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <Title level={3} className="text-gray-800 font-bold m-0">
            QUẢN LÝ TRẬN ĐẤU
          </Title>
        </div>

        {/* Match Information Form */}
        <Form
          id="match-management-form"
          form={form}
          onFinish={handleSave}
        >
          <div className="">
            {/* Status */}
            <div className="flex items-start justify-between">
              <div className="text-[#575E70]">Trạng thái</div>
              <div className="w-3/5">
                <Form.Item name="status" className="mb-0">
                  <Select
                    className="w-full"
                    suffixIcon={<span className="text-gray-400">▼</span>}
                  >
                    <Option value="incoming">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-yellow-600">Sắp diễn ra</span>
                      </div>
                    </Option>
                    <Option value="ongoing">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-green-600">Đang diễn ra</span>
                      </div>
                    </Option>
                    <Option value="completed">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-gray-600">Đã kết thúc</span>
                      </div>
                    </Option>
                    <Option value="pending">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-red-600">Chưa bắt đầu</span>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Table Number */}
            <div className="flex items-start justify-between">
              <div className="text-[#575E70]">Bàn thi đấu</div>
              <div className="w-3/5">
                <Form.Item name="tableNumber" className="mb-0">
                  <Select
                    placeholder="Chọn bàn"
                    suffixIcon={<span className="text-gray-400">▼</span>}
                  >
                    <Option value="Bàn 1">Bàn 1</Option>
                    <Option value="Bàn 2">Bàn 2</Option>
                    <Option value="Bàn 3">Bàn 3</Option>
                    <Option value="Bàn 4">Bàn 4</Option>
                    <Option value="Bàn 5">Bàn 5</Option>
                    <Option value="Bàn 6">Bàn 6</Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Start Time */}
            <div className="flex items-start justify-between">
              <div className="text-[#575E70]">Thời gian bắt đầu</div>
              <div className="w-3/5">
                <Form.Item name="startTime" className="mb-0">
                  <DatePicker
                    showTime
                    format="HH:mm, DD/MM/YYYY"
                    placeholder="Chọn thời gian"
                    className="w-full"
                    suffixIcon={<span className="text-gray-400">▼</span>}
                  />
                </Form.Item>
              </div>
            </div>

            {/* Player 1 - Quốc Huy */}
            <div className="flex items-start justify-between">
              <div className="text-[#575E70]">Quốc Huy</div>
              <div className="w-3/5">
                <Form.Item name="leftPlayerStatus" className="mb-0">
                  <Select
                    suffixIcon={<span className="text-gray-400">▼</span>}
                  >
                    <Option value="confirmed">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-green-600">Xác nhận tham gia</span>
                      </div>
                    </Option>
                    <Option value="pending">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-yellow-600">Chưa xác nhận tham gia</span>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </div>
            </div>

            {/* Player 2 - Thái Anh */}
            <div className="flex items-start justify-between">
              <div className="text-[#575E70]">Thái Anh</div>
              <div className="w-3/5">
                <Form.Item name="rightPlayerStatus" className="mb-0">
                  <Select
                    suffixIcon={<span className="text-gray-400">▼</span>}
                  >
                    <Option value="confirmed">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-green-600">Xác nhận tham gia</span>
                      </div>
                    </Option>
                    <Option value="pending">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span className="text-yellow-600">Chưa xác nhận tham gia</span>
                      </div>
                    </Option>
                  </Select>
                </Form.Item>
              </div>
            </div>
          </div>
        </Form>

        <MatchRow
          tableNumber={match?.tableNumber ?? "-"}
          tableNumberColor="default"
          player1={{
            name: match?.leftPlayer.name ?? "Quốc Huy",
            avatar: match?.leftPlayer.avatar ?? undefined,
            isWinner: leftScore > rightScore
          }}
          player2={{
            name: match?.rightPlayer.name ?? "Thái Anh",
            avatar: match?.rightPlayer.avatar ?? undefined,
            isWinner: rightScore > leftScore
          }}
          score={`${leftScore} vs ${rightScore}`}
          meta={{
            matchNo: match?.id,
            race: "chạm 7",
            time: match?.startTime ? dayjs(match.startTime).format("HH:mm") : undefined,
            date: match?.startTime ? dayjs(match.startTime).format("DD/MM") : undefined
          }}
        />

        {/* Action Button */}
        <div
          className="items-center text-white text-center w-36 h-10 justify-center py-2 px-6 bg-[#C6010B] rounded-3xl hover:cursor-pointer"
          onClick={handleSave}
        >
          Lưu
        </div>
      </div>
    </Modal>
  );
};
