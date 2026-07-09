import type { AuthPayload, AuthResponse, RegisterPayload } from "../types/api";
import type { Member } from "../types/member";

function buildMember(name: string, phone: string, isNewUser: boolean): Member {
  return {
    id: "user_999888777",
    name,
    phone,
    points: isNewUser ? 1000 : 12500,
    rank: isNewUser ? "BRONZE" : "PLATINUM",
    rankLabel: isNewUser ? "Đồng" : "Bạch Kim",
    memberCode: "WV-999888777",
  };
}

export async function loginApi(payload: AuthPayload): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return {
    success: true,
    data: {
      accessToken: "mock_jwt_access_token_12345",
      refreshToken: "mock_jwt_refresh_token_67890",
      member: buildMember("Nguyễn Văn A", payload.phone, false),
    },
  };
}

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  return {
    success: true,
    data: {
      accessToken: "mock_jwt_access_token_12345",
      refreshToken: "mock_jwt_refresh_token_67890",
      member: buildMember(payload.name, payload.phone, true),
    },
  };
}
