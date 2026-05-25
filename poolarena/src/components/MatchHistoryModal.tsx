import React from "react";
import { Modal } from "antd";
import { MatchHistory } from "@/types/match.types";

interface MatchHistoryModalProps {
  matchHistory: MatchHistory[];
  visible: boolean;
  onClose: () => void;
}


export const MatchHistoryModal = ({
  matchHistory,
  visible,
  onClose,
}: MatchHistoryModalProps) => {
  return (
    <Modal
      title={
        <div className="text-gray-800 text-lg font-bold italic mb-6">
          LỊCH SỬ TRẬN ĐẤU
        </div>
      }
      open={visible}
      className="p-6"
      onCancel={onClose}
      footer={null}
      width={600}
      centered
    >
      <div className="flex flex-col space-y-4">
        {matchHistory.map((match) => (
        <div className="flex items-center">
          <div className="text-gray-800 text-base m-0">{match.timestamp}</div>
          <div className="flex justify-start items-center ml-15 space-x-2">
            <div className="text-gray-800 text-lg font-semibold m-0">
              {match.players}
            </div>
              <span className={`text-base font-semibold m-0 ${match.historyPoint === "+1" ? "text-[#1B03DC]" : "text-[#C6010B]"}`}>{match.historyPoint}</span>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
