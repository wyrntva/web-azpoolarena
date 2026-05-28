"use client";
import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import { FiCopy, FiCheck, FiDownload } from "react-icons/fi";
import { formatCurrency } from "@/lib/tournament-utils";
import { tournamentAPI } from "@/api/tournament.api";

interface RegisterTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: {
    id: string;
    title: string;
    registrationFeeAmount: number;
  };
  user: {
    id: number;
    fullName: string;
    phoneNumber: string;
    rank: string | null;
  } | null;
}

export const RegisterTournamentModal: React.FC<RegisterTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  user,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transferContent, setTransferContent] = useState<string>('');
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;
    setShowSuccess(false);
    setCodeLoading(true);
    tournamentAPI.createPaymentCode(tournament.id)
      .then((res) => setTransferContent(res.data.code))
      .catch((err) => {
        const status = err?.response?.status;
        const message: string = err?.response?.data?.message || '';
        if (status === 400 && message.toLowerCase().includes('already registered')) {
          setShowSuccess(true);
        }
      })
      .finally(() => setCodeLoading(false));
  }, [isOpen, tournament.id, user?.id]);

  if (!isOpen || !user) return null;

  const feeAmount = tournament.registrationFeeAmount || 150000;
  const bankAccountNo = "CASSPOOLARENA";
  const bankAccountName = "TRAN VIET ANH";
  const bankId = "ocb";

  // Generate VietQR URL (only when code is ready)
  const qrUrl = transferContent
    ? `https://img.vietqr.io/image/${bankId}-${bankAccountNo}-compact2.png?amount=${feeAmount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(bankAccountName)}`
    : '';

  const handleCopy = (text: string, field: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.position = "fixed";
      el.style.opacity = "0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VietQR_DKGD_${tournament.id}_USER_${user.id}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      window.open(qrUrl, "_blank");
    }
  };

  const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none" style={{ width: 60, height: 60, aspectRatio: '1/1', flexShrink: 0 }}>
      <path d="M30 6.25C33.1189 6.25 36.2074 6.86407 39.0889 8.05762C41.9703 9.25116 44.5886 11.0007 46.7939 13.2061C48.9993 15.4114 50.7488 18.0297 51.9424 20.9111C53.1359 23.7926 53.75 26.8811 53.75 30C53.75 34.6972 52.3567 39.2887 49.7471 43.1943C47.1374 47.1 43.4286 50.1448 39.0889 51.9424C34.7491 53.74 29.9733 54.2103 25.3662 53.2939C20.7593 52.3775 16.5275 50.1154 13.2061 46.7939C9.88464 43.4725 7.62249 39.2407 6.70605 34.6338C5.78966 30.0267 6.26004 25.2509 8.05762 20.9111C9.8552 16.5714 12.9 12.8626 16.8057 10.2529C20.7113 7.64331 25.3028 6.25 30 6.25ZM38.6748 19.668C38.0206 19.668 37.3921 19.9239 36.9248 20.3818L36.916 20.3916L25.9473 31.3594L23.0811 28.5127L23.0791 28.5137C22.8562 28.2847 22.5914 28.0997 22.2979 27.9727H22.2988C22.0684 27.8729 21.824 27.8097 21.5752 27.7842L21.3252 27.7715C20.9904 27.7715 20.6588 27.8396 20.3516 27.9727C20.121 28.0725 19.9077 28.2071 19.7188 28.3711L19.5664 28.5166L18.2412 29.8408C18.0085 30.0725 17.8236 30.3482 17.6973 30.6514C17.5705 30.9559 17.5049 31.2825 17.5049 31.6123C17.5049 31.9423 17.5703 32.2696 17.6973 32.5742C17.8242 32.8788 18.0108 33.1553 18.2451 33.3877L18.2471 33.3896L24.1963 39.2646L24.1973 39.2627C24.4199 39.491 24.6837 39.6749 24.9766 39.8018C25.2838 39.9348 25.6154 40.0039 25.9502 40.0039C26.2849 40.0039 26.6166 39.9348 26.9238 39.8018C27.2188 39.674 27.4835 39.4875 27.707 39.2568L27.709 39.2588L41.7695 25.1982L41.7793 25.1875C42.2224 24.7227 42.4706 24.1051 42.4707 23.4629C42.4707 22.8205 42.2225 22.2022 41.7793 21.7373L41.7695 21.7266L41.7588 21.7158L40.4336 20.3916V20.3906L40.4248 20.3818C39.9575 19.924 39.329 19.668 38.6748 19.668Z" fill="#00B814" stroke="#00B814" strokeWidth="2.5"/>
    </svg>
  );

  const CopyButton = ({ field, text }: { field: string; text: string }) => (
    <button
      onClick={() => handleCopy(text, field)}
      className="text-[#3793F6] hover:text-[#2563EB] text-[14px] font-medium leading-[20px] tracking-[0.28px] flex items-center gap-[6px] transition-colors cursor-pointer shrink-0"
      style={{ fontFamily: 'Montserrat, sans-serif' }}
      type="button"
    >
      {copiedField === field ? (
        <><FiCheck className="w-3.5 h-3.5 text-green-600" /><span className="max-md:hidden text-green-600">Đã chép</span></>
      ) : (
        <><FiCopy className="w-3.5 h-3.5" /><span className="max-md:hidden">Sao chép</span></>
      )}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn overflow-y-auto py-4">
      <div
        className="relative bg-white rounded-[12px] shadow-2xl border border-gray-100 animate-scaleIn font-sans flex flex-col p-[24px] gap-[24px] w-full mx-4"
        style={{ maxWidth: "896px", background: "#FFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-[24px] right-[24px] p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800 z-10 cursor-pointer"
          aria-label="Close modal"
          type="button"
        >
          <IoClose className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Header */}
        <h2
          className="text-[#37393E] text-[24px] font-bold italic leading-[32px]"
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          Đăng ký giải đấu
        </h2>

        {/* User Info */}
        <div className="w-full grid grid-cols-[160px_1fr] gap-y-[16px] border-b border-gray-100 pb-[24px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
          <span className="text-[#575E70] text-[16px] font-normal leading-[24px] flex items-center">Số điện thoại:</span>
          <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex items-center">{user.phoneNumber || "Chưa cập nhật"}</span>
          <span className="text-[#575E70] text-[16px] font-normal leading-[24px] flex items-center">Tài khoản đăng ký:</span>
          <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex items-center">{user.fullName}</span>
          <span className="text-[#575E70] text-[16px] font-normal leading-[24px] flex items-center">Hạng của bạn:</span>
          <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex items-center">Hạng {user.rank || "Chưa cập nhật"}</span>
        </div>

        {/* Payment section or success state */}
        {showSuccess ? (
          <div
            className="w-full flex flex-col justify-center items-center gap-[8px] py-[12px] px-[16px]"
            style={{ borderRadius: "12px", border: "1px solid #D9F8E1", background: "#FFF", boxShadow: "0 4px 6px 0 rgba(138, 138, 138, 0.10)" }}
          >
            <SuccessIcon />
            <span style={{ fontFamily: 'Montserrat, sans-serif', color: '#00B814', fontSize: '16px', fontWeight: 700, lineHeight: '24px' }}>
              THANH TOÁN THÀNH CÔNG
            </span>
            <span style={{ fontFamily: 'Montserrat, sans-serif', color: '#37393E', fontSize: '16px', fontWeight: 500, lineHeight: '24px', textAlign: 'center' }}>
              Bạn đã đăng ký thành công giải đấu {tournament.title}. Hệ thống sẽ tự động xếp lịch thi đấu cho bạn, vui lòng truy cập trang trận đấu để xem thông tin về trận đấu của mình (Thời gian, bàn thi đấu, đối thủ...)
            </span>
          </div>
        ) : (
          <>
            {/* Subheading */}
            <h3
              className="text-[#37393E] text-[18px] font-bold italic leading-[24px]"
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              Hướng dẫn thanh toán lệ phí
            </h3>

            {/* Two columns: stacked on mobile, side-by-side on desktop */}
            <div className="w-full flex flex-col md:flex-row gap-[24px] relative">

              {/* --- Cách 1: QR --- */}
              <div className="flex-1 flex flex-col gap-[12px] md:pr-[12px]">
                <h4
                  className="text-[#37393E] text-center text-[16px] font-semibold leading-[24px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Cách 1: Mở app ngân hàng và quét mã QR
                </h4>
                <div className="flex flex-col items-center gap-[12px] bg-gray-50/50 rounded-3xl p-[16px] border border-gray-100/50">
                  <div className="bg-white p-3 rounded-2xl shadow-sm inline-block border border-gray-100">
                    {codeLoading || !qrUrl ? (
                      <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400 text-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                        Đang tạo mã...
                      </div>
                    ) : (
                      <img
                        src={qrUrl}
                        alt="VietQR Payment Code"
                        className="w-[200px] h-[200px] object-contain"
                      />
                    )}
                  </div>
                  <button
                    onClick={handleDownloadQR}
                    className="flex items-center gap-[6px] text-[#3793F6] hover:text-[#2563EB] text-[14px] font-medium leading-[20px] tracking-[0.28px] transition-colors cursor-pointer"
                    style={{ fontFamily: 'Montserrat, sans-serif' }}
                    type="button"
                  >
                    <FiDownload className="w-4 h-4" />
                    <span>Tải ảnh QR</span>
                  </button>
                </div>
              </div>

              {/* Divider — desktop only */}
              <div className="max-md:hidden absolute left-1/2 top-0 bottom-0 w-[1px] bg-gray-200 -translate-x-1/2" />

              {/* --- Cách 2: Chuyển khoản --- */}
              <div className="flex-1 flex flex-col gap-[12px] md:pl-[12px]">
                <h4
                  className="text-[#37393E] text-center text-[16px] font-semibold leading-[24px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Cách 2: Chuyển khoản thủ công theo thông tin
                </h4>

                {/* Bank Logo */}
                <div className="flex flex-col items-center">
                  <span className="text-[#008848] font-black italic tracking-wide h-[40px] flex items-center text-[32px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>OCB</span>
                  <span style={{ fontFamily: 'Montserrat, sans-serif', color: '#37393E', textAlign: 'center', fontSize: '16px', fontWeight: 600, lineHeight: '24px' }}>
                    NGÂN HÀNG PHƯƠNG ĐÔNG
                  </span>
                </div>

                {/* Account Details */}
                <div className="flex flex-col gap-[8px]" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {/* Chủ tài khoản */}
                  <div className="flex items-center">
                    <span className="text-[#575E70] text-[16px] font-normal leading-[24px] w-[130px] shrink-0 whitespace-nowrap">Chủ tài khoản:</span>
                    <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex-1">{bankAccountName}</span>
                  </div>
                  {/* Số tài khoản */}
                  <div className="flex items-center">
                    <span className="text-[#575E70] text-[16px] font-normal leading-[24px] w-[130px] shrink-0 whitespace-nowrap">Số tài khoản:</span>
                    <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex-1">{bankAccountNo}</span>
                    <CopyButton field="acc" text={bankAccountNo} />
                  </div>
                  {/* Số tiền */}
                  <div className="flex items-center">
                    <span className="text-[#575E70] text-[16px] font-normal leading-[24px] w-[130px] shrink-0 whitespace-nowrap">Số tiền:</span>
                    <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex-1">{formatCurrency(feeAmount)}</span>
                    <CopyButton field="amount" text={String(feeAmount)} />
                  </div>
                  {/* Nội dung CK */}
                  <div className="flex items-start">
                    <span className="text-[#575E70] text-[16px] font-normal leading-[24px] w-[130px] shrink-0 whitespace-nowrap">Nội dung CK:</span>
                    <span className="font-semibold text-[#37393E] text-[16px] leading-[24px] flex-1 break-all">{transferContent}</span>
                    <CopyButton field="content" text={transferContent} />
                  </div>
                </div>

                {/* Note */}
                <p
                  className="text-[#37393E] text-[16px] font-normal italic leading-[24px]"
                  style={{ fontFamily: 'Montserrat, sans-serif' }}
                >
                  Lưu ý: Vui lòng giữ nguyên nội dung{" "}
                  <strong className="font-bold">{transferContent}</strong>{" "}
                  khi chuyển khoản để hệ thống tự xác nhận thanh toán.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
