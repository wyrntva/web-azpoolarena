import { useEffect, useMemo, useState } from "react";
import CryptoJS from "crypto-js";
import type { Member } from "../types/member";

const SECRET_KEY = "wavy_secure_signature_key_2026";

export function useQRScanner(member: Member | null) {
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timestamp, setTimestamp] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!member) {
      return;
    }

    setTimestamp(Math.floor(Date.now() / 1000));
    setTimeRemaining(30);

    const interval = setInterval(() => {
      setTimeRemaining((current) => {
        if (current <= 1) {
          setTimestamp(Math.floor(Date.now() / 1000));
          return 30;
        }
        return current - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [member]);

  const qrValue = useMemo(() => {
    if (!member) {
      return "";
    }

    const timeWindow = Math.floor(timestamp / 30);
    const otpSeed = `${member.id}:${timeWindow}`;
    const otpHash = CryptoJS.SHA256(otpSeed).toString();
    const otpToken = (parseInt(otpHash.slice(0, 8), 16) % 1000000)
      .toString()
      .padStart(6, "0");
    const payload = `${member.id}:${member.rank}:${member.points}:${otpToken}:${timestamp}`;
    const signature = CryptoJS.HmacSHA256(payload, SECRET_KEY).toString();

    return JSON.stringify({
      id: member.id,
      name: member.name,
      rank: member.rank,
      points: member.points,
      otpToken,
      timestamp,
      signature,
    });
  }, [member, timestamp]);

  return {
    qrValue,
    timeRemaining,
  };
}
