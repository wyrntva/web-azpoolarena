import { authAPI } from "@/api/auth.api";

export const authService = {
  login: authAPI.login,
  register: authAPI.register,
  forgotPassword: authAPI.forgotPassword,
  resetPassword: authAPI.resetPassword,
  profile: authAPI.profile,
};