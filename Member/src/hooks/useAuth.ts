import { useCallback } from "react";
import { fetchMemberHistory, fetchMemberProfile, fetchNotifications } from "../api/member";
import { loginApi, registerApi } from "../api/auth";
import { useMemberStore } from "../store/memberSlice";
import type { AuthPayload, RegisterPayload } from "../types/api";
import { clearSessionStorage, readSessionStorage, saveSessionStorage } from "../utils/storage";

export function useAuth() {
  const {
    booting,
    isAuthenticated,
    member,
    tokens,
    notifications,
    history,
    hydrate,
    setBooting,
    setSession,
    clearSession,
    setProfileData,
    updateMemberProfile,
  } = useMemberStore();

  const bootstrap = useCallback(async () => {
    setBooting(true);

    try {
      const session = await readSessionStorage();

      if (!session.tokens) {
        clearSession();
        return;
      }

      const [profileResponse, historyResponse, notificationsResponse] = await Promise.all([
        fetchMemberProfile(),
        fetchMemberHistory(),
        fetchNotifications(),
      ]);

      hydrate({
        member: session.member ?? profileResponse.data,
        tokens: session.tokens,
        history: historyResponse.data,
        notifications: notificationsResponse.data,
      });
    } catch (error) {
      console.error("Failed to bootstrap member session", error);
      await clearSessionStorage();
      clearSession();
    } finally {
      setBooting(false);
    }
  }, [clearSession, hydrate, setBooting]);

  const login = useCallback(
    async (payload: AuthPayload) => {
      const response = await loginApi(payload);
      const [historyResponse, notificationsResponse] = await Promise.all([
        fetchMemberHistory(),
        fetchNotifications(),
      ]);

      setSession(response.data.member, response.data, historyResponse.data, notificationsResponse.data);
      await saveSessionStorage(response.data.member, response.data);
      return response.data.member;
    },
    [setSession]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await registerApi(payload);
      const [historyResponse, notificationsResponse] = await Promise.all([
        fetchMemberHistory(),
        fetchNotifications(),
      ]);

      setSession(response.data.member, response.data, historyResponse.data, notificationsResponse.data);
      await saveSessionStorage(response.data.member, response.data);
      return response.data.member;
    },
    [setSession]
  );

  const logout = useCallback(async () => {
    await clearSessionStorage();
    clearSession();
  }, [clearSession]);

  const refreshProfile = useCallback(async () => {
    const [profileResponse, historyResponse, notificationsResponse] = await Promise.all([
      fetchMemberProfile(),
      fetchMemberHistory(),
      fetchNotifications(),
    ]);

    setProfileData(profileResponse.data, historyResponse.data, notificationsResponse.data);
  }, [setProfileData]);

  const updateProfile = useCallback(async (name: string, phone: string) => {
    if (!member) return;
    const updatedMember = { ...member, name, phone };
    updateMemberProfile(name, phone);
    if (tokens) {
      await saveSessionStorage(updatedMember, tokens);
    }
  }, [member, tokens, updateMemberProfile]);

  return {
    booting,
    isAuthenticated,
    member,
    notifications,
    history,
    bootstrap,
    login,
    register,
    logout,
    refreshProfile,
    updateProfile,
  };
}
