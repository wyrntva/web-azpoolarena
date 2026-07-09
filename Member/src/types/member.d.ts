export interface Member {
  id: string;
  name: string;
  phone: string;
  points: number;
  rank: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";
  rankLabel: string;
  memberCode: string;
}

export interface MemberHistoryItem {
  id: string;
  title: string;
  description: string;
  pointsDelta: number;
  createdAt: string;
  type: "earn" | "redeem" | "booking";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  type: "promotion" | "event" | "system";
}
