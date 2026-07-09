import { create } from "zustand";
import type { AuthSession, SessionTokens } from "../types/api";
import type { Member, MemberHistoryItem, NotificationItem } from "../types/member";

type MemberState = {
  booting: boolean;
  isAuthenticated: boolean;
  member: Member | null;
  tokens: SessionTokens | null;
  history: MemberHistoryItem[];
  notifications: NotificationItem[];
  setBooting: (value: boolean) => void;
  hydrate: (session: AuthSession) => void;
  setSession: (
    member: Member,
    tokens: SessionTokens,
    history: MemberHistoryItem[],
    notifications: NotificationItem[]
  ) => void;
  setProfileData: (
    member: Member,
    history: MemberHistoryItem[],
    notifications: NotificationItem[]
  ) => void;
  updateMemberProfile: (name: string, phone: string) => void;
  clearSession: () => void;
};

export const useMemberStore = create<MemberState>((set) => ({
  booting: true,
  isAuthenticated: false,
  member: null,
  tokens: null,
  history: [],
  notifications: [],
  setBooting: (value) => set({ booting: value }),
  hydrate: (session) =>
    set({
      booting: false,
      isAuthenticated: true,
      member: session.member,
      tokens: session.tokens,
      history: session.history,
      notifications: session.notifications,
    }),
  setSession: (member, tokens, history, notifications) =>
    set({
      booting: false,
      isAuthenticated: true,
      member,
      tokens,
      history,
      notifications,
    }),
  setProfileData: (member, history, notifications) =>
    set({
      member,
      history,
      notifications,
    }),
  updateMemberProfile: (name, phone) =>
    set((state) => ({
      member: state.member ? { ...state.member, name, phone } : null,
    })),
  clearSession: () =>
    set({
      booting: false,
      isAuthenticated: false,
      member: null,
      tokens: null,
      history: [],
      notifications: [],
    }),
}));
