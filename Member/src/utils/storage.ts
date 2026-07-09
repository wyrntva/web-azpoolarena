import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SessionTokens } from "../types/api";
import type { Member } from "../types/member";

const MEMBER_KEY = "member_profile";
const TOKENS_KEY = "member_tokens";

export async function saveSessionStorage(member: Member, tokens: SessionTokens) {
  await Promise.all([
    AsyncStorage.setItem(MEMBER_KEY, JSON.stringify(member)),
    AsyncStorage.setItem(TOKENS_KEY, JSON.stringify(tokens)),
  ]);
}

export async function readSessionStorage() {
  const [memberRaw, tokensRaw] = await Promise.all([
    AsyncStorage.getItem(MEMBER_KEY),
    AsyncStorage.getItem(TOKENS_KEY),
  ]);

  return {
    member: memberRaw ? (JSON.parse(memberRaw) as Member) : null,
    tokens: tokensRaw ? (JSON.parse(tokensRaw) as SessionTokens) : null,
  };
}

export async function clearSessionStorage() {
  await Promise.all([
    AsyncStorage.removeItem(MEMBER_KEY),
    AsyncStorage.removeItem(TOKENS_KEY),
  ]);
}
