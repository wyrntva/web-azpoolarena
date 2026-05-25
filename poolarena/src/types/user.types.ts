export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum UserRank {
  K = 'K',
  I = 'I',
  H = 'H',
  G = 'G',
  F = 'F',
  D = 'D',
  E = 'E',
}
export interface User {
  _id: string;
  fullName: string;
  gender?: UserGender;
  rank?: UserRank;
  phoneNumber?: string;
  email?: string;
  address?: string;
  role?: string;
  isActive?: boolean;
  avatar_url?: string;
  points?: number;
  totalGames?: number;
  wins?: number;
  losses?: number;
  winRate?: number; // 0-100
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

export type UsersResponse = User[];

