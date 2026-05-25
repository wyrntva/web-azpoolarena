import { UserGender, UserRank, UsersResponse } from "./user.types";
export interface RegisterFormData {
  fullName: string;
  gender?: UserGender;
  address?: string;
  rank?: UserRank;
  phoneNumber: string;
  email: string;
  password: string;
  confirmPassword?: string;
}
export interface LoginResponse {
    access_token: string;
    users: UsersResponse;
  }
  
  
  