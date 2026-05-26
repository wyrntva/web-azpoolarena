export enum UserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum UserRank {
  S = 'S',
  A = 'A',
  B = 'B',
  C = 'C',
  D = 'D',
  E = 'E',
  F = 'F',
  G = 'G',
  H = 'H',
  I = 'I',
  K = 'K',
}

export interface User {
  id: number;
  full_name: string;
  gender?: UserGender;
  rank?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  role?: string;
  is_active?: boolean;
  avatar_url?: string;
  points?: number;
  total_games?: number;
  wins?: number;
  losses?: number;
  win_rate?: number;
  is_phone_verified?: boolean;
  is_email_verified?: boolean;
  tiktok_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export type UsersResponse = User[];

