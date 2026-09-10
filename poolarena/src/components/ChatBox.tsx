"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FaRegTrashAlt } from "react-icons/fa";
import { IoClose, IoSend } from "react-icons/io5";
import { aiAPI } from "@/api/ai.api";

export interface Message {
  id: string;
  sender: "bot" | "user";
  text: string;
  timestamp: Date;
  isInitial?: boolean;
}

interface ChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: "initial-greeting",
  sender: "bot",
  text: "Xin chào! Tôi là trợ lý ảo của **POOLARENA.VN** 🎱. Tôi có thể hỗ trợ gì cho bạn về các giải đấu, bảng xếp hạng, đặt bàn hoặc luật thi đấu?",
  timestamp: new Date(),
  isInitial: true,
};

const SUGGESTIONS = [
  "🏆 Giải đấu sắp diễn ra",
  "📊 Bảng xếp hạng cơ thủ",
  "📍 Thông tin CLB & Liên hệ",
  "📝 Cách đăng ký tham gia",
];

// Trả lời dự phòng thông minh khi backend AI chưa có API key
function getFallbackReply(question: string): string {
  const q = question.toLowerCase();
  if (q.includes("giải") || q.includes("đấu") || q.includes("tour") || q.includes("lịch")) {
    return "Bạn có thể theo dõi danh sách các giải đấu đang diễn ra và sắp diễn ra trực tiếp tại mục [GIẢI ĐẤU](/tournaments). Tại đây bạn có thể xem chi tiết thể thức, điều lệ và đăng ký tham gia nhanh chóng!";
  }
  if (q.includes("hạng") || q.includes("bảng") || q.includes("rank") || q.includes("điểm")) {
    return "Bảng xếp hạng cơ thủ và điểm tích lũy của toàn hệ thống được cập nhật liên tục tại mục [BẢNG XẾP HẠNG](/rankings).";
  }
  if (q.includes("đăng ký") || q.includes("tham gia") || q.includes("luật") || q.includes("lệ phí")) {
    return "Để đăng ký tham gia giải đấu:\n1. Đăng nhập tài khoản của bạn trên website.\n2. Chọn giải đấu sắp diễn ra trong mục [Giải đấu](/tournaments).\n3. Bấm **'Đăng ký ngay'** và làm theo hướng dẫn.\nNếu cần hỗ trợ gấp, bạn có thể gọi Hotline: **0364.756.638**.";
  }
  if (q.includes("địa chỉ") || q.includes("ở đâu") || q.includes("liên hệ") || q.includes("sđt") || q.includes("hotline") || q.includes("clb")) {
    return "🏛️ **Hệ thống CLB Bida AZ POOL ARENA**\n📞 Hotline hỗ trợ: **0364.756.638**\n🌐 Website: [poolarena.vn](https://poolarena.vn)\n💬 Bạn cũng có thể liên hệ qua Zalo hoặc Fanpage Messenger ở các nút bên cạnh!";
  }
  return "Cảm ơn câu hỏi của bạn! Hiện tại bạn có thể khám phá mục [Giải đấu](/tournaments), [Bảng xếp hạng](/rankings) hoặc liên hệ Hotline **0364.756.638** / [Zalo](https://zalo.me/0364756638) để được đội ngũ PoolArena hỗ trợ ngay lập tức nhé!";
}

export default function ChatBox({ isOpen, onClose }: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Khởi tạo hoặc lấy sessionId từ sessionStorage
  useEffect(() => {
    let sid = sessionStorage.getItem("poolarena_ai_session_id");
    if (!sid) {
      sid = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      sessionStorage.setItem("poolarena_ai_session_id", sid);
    }
    setSessionId(sid);
  }, []);

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, messages, scrollToBottom]);

  // Xóa lịch sử chat
  const handleClearHistory = () => {
    if (messages.length <= 1) return;
    if (window.confirm("Bạn có muốn làm mới cuộc trò chuyện không?")) {
      if (sessionId) {
        aiAPI.clearHistory(sessionId).catch(() => {});
      }
      setMessages([INITIAL_MESSAGE]);
      const newSid = "session_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      sessionStorage.setItem("poolarena_ai_session_id", newSid);
      setSessionId(newSid);
    }
  };

  // Gửi câu hỏi
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: Message = {
      id: "user_" + Date.now(),
      sender: "user",
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await aiAPI.askCustomer(query, sessionId);
      const reply = res.data?.reply;

      if (reply) {
        const botMsg: Message = {
          id: "bot_" + Date.now(),
          sender: "bot",
          text: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        throw new Error("No reply from AI");
      }
    } catch {
      // Fallback thông minh nếu AI server chưa có key hoặc lỗi mạng
      const fallbackText = getFallbackReply(query);
      const botMsg: Message = {
        id: "bot_" + Date.now(),
        sender: "bot",
        text: fallbackText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render markdown đơn giản (bold, links, breaks)
  const renderMessageContent = (text: string) => {
    // Tách dòng
    const lines = text.split("\n");
    return lines.map((line, lIdx) => {
      // Parse markdown link [text](url) and bold **text**
      const parts: React.ReactNode[] = [];
      const regex = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
      let lastIndex = 0;
      let match;

      while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.substring(lastIndex, match.index));
        }
        if (match[1] && match[2]) {
          // Link
          const isInternal = match[2].startsWith("/");
          parts.push(
            isInternal ? (
              <Link
                key={match.index}
                href={match[2]}
                className="text-[#D22E39] hover:underline font-semibold"
                onClick={onClose}
              >
                {match[1]}
              </Link>
            ) : (
              <a
                key={match.index}
                href={match[2]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3793F6] hover:underline font-semibold"
              >
                {match[1]}
              </a>
            )
          );
        } else if (match[3]) {
          // Bold
          parts.push(
            <strong key={match.index} className="font-bold text-[#172339]">
              {match[3]}
            </strong>
          );
        }
        lastIndex = regex.lastIndex;
      }

      if (lastIndex < line.length) {
        parts.push(line.substring(lastIndex));
      }

      return (
        <span key={lIdx} className="block leading-relaxed">
          {parts.length > 0 ? parts : line || "\u00A0"}
        </span>
      );
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.92 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed bottom-[24px] right-[16px] xl:right-[24px] z-[60] w-[calc(100vw-32px)] sm:w-[390px] h-[540px] sm:h-[570px] max-h-[calc(100vh-48px)] bg-white rounded-2xl shadow-[0_12px_40px_rgba(23,35,57,0.25)] border border-[#E2E8F0] flex flex-col overflow-hidden font-sans"
        >
          {/* Header - Phối màu Navy thương hiệu PoolArena */}
          <div className="bg-gradient-to-r from-[#172339] to-[#253554] px-4 py-3.5 flex items-center justify-between text-white shadow-sm flex-shrink-0 relative select-none">
            <div className="flex items-center gap-3">
              {/* Avatar Logo tròn */}
              <div className="relative w-10 h-10 rounded-full bg-white p-0.5 shadow-md flex items-center justify-center flex-shrink-0">
                <Image
                  src="/images/chat-logo.png"
                  alt="PoolArena AI Logo"
                  width={36}
                  height={36}
                  className="object-contain rounded-full"
                />
                {/* Dot Online */}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#60DB80] border-2 border-[#172339]" />
              </div>

              {/* Title & Status */}
              <div>
                <h3 className="font-bold text-[15px] leading-tight text-white tracking-wide flex items-center gap-1.5">
                  Trợ lý POOLARENA
                </h3>
                <p className="text-[11px] text-white/80 font-normal flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#60DB80] animate-pulse" />
                  Luôn sẵn sàng hỗ trợ
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleClearHistory}
                className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Làm mới cuộc trò chuyện"
                aria-label="Clear chat"
              >
                <FaRegTrashAlt size={14} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-white/75 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                title="Đóng chatbox"
                aria-label="Close chat"
              >
                <IoClose size={20} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F8FAFC] custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`flex gap-2 max-w-[88%] ${
                    msg.sender === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {/* Bot mini avatar */}
                  {msg.sender === "bot" && (
                    <div className="w-6 h-6 rounded-full bg-white border border-[#E2E8F0] p-0.5 flex-shrink-0 flex items-center justify-center self-end mb-1">
                      <Image
                        src="/images/chat-logo.png"
                        alt="Bot"
                        width={20}
                        height={20}
                        className="object-contain"
                      />
                    </div>
                  )}

                  {/* Message bubble */}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13px] sm:text-[13.5px] ${
                      msg.sender === "user"
                        ? "bg-[#172339] text-white rounded-tr-sm shadow-sm"
                        : "bg-white text-[#1E293B] rounded-tl-sm border border-[#E2E8F0] shadow-sm"
                    }`}
                  >
                    {renderMessageContent(msg.text)}

                    {/* Disclaimer note in initial bot message */}
                    {msg.isInitial && (
                      <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
                        Bằng việc bắt đầu trò chuyện, bạn đồng ý với{" "}
                        <Link
                          href="/cookie-policy"
                          className="text-[#D22E39] font-medium hover:underline"
                          onClick={onClose}
                        >
                          Chính sách bảo mật
                        </Link>{" "}
                        của chúng tôi. Lịch sử chat có thể được lưu lại để nâng cao chất lượng dịch vụ.
                      </div>
                    )}
                  </div>
                </div>

                <span className="text-[10px] text-gray-400 mt-1 px-1">
                  {msg.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}

            {/* Quick Suggestions Chips (only if 1 message) */}
            {messages.length === 1 && (
              <div className="pt-1 flex flex-wrap gap-1.5 pl-8">
                {SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(item.replace(/^[^\s]+\s/, ""))}
                    className="text-[12px] bg-white text-[#172339] hover:text-[#D22E39] hover:border-[#D22E39]/40 border border-[#E2E8F0] rounded-full px-3 py-1.5 shadow-sm transition-all text-left font-medium cursor-pointer active:scale-95"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}

            {/* Bot Thinking / Typing Animation */}
            {isLoading && (
              <div className="flex items-start gap-2 max-w-[85%]">
                <div className="w-6 h-6 rounded-full bg-white border border-[#E2E8F0] p-0.5 flex-shrink-0 flex items-center justify-center self-end mb-1">
                  <Image
                    src="/images/chat-logo.png"
                    alt="Bot"
                    width={20}
                    height={20}
                    className="object-contain"
                  />
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#172339]/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#172339]/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#172339]/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Bar */}
          <div className="p-3 bg-white border-t border-[#E2E8F0] flex items-center gap-2 flex-shrink-0">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập câu hỏi..."
              disabled={isLoading}
              className="flex-1 bg-[#F0F2F4] hover:bg-[#EAEFF4] focus:bg-white text-[#172339] text-[13.5px] rounded-full px-4 py-2.5 outline-none border border-transparent focus:border-[#172339]/30 transition-all placeholder:text-gray-400"
            />
            {/* Send Button - Màu vàng hổ phách thương hiệu giống Ảnh 2 */}
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
                inputText.trim() && !isLoading
                  ? "bg-[#FAC600] text-[#172339] hover:bg-[#E5B500] hover:scale-105 active:scale-95 shadow-md cursor-pointer"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
              }`}
              aria-label="Gửi câu hỏi"
            >
              <IoSend size={16} className="translate-x-0.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
