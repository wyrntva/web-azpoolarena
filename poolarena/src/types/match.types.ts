import { Player } from "./player.types";

export interface Match {
  id: number;
  leftPlayer: Player;
  rightPlayer: Player;
  tableNumber: string;
  handicap: string;
  status: "pending" | "ongoing" | "completed";
}

export interface MatchHistory {
  timestamp: string;
  players: string;
  historyPoint: string;
}