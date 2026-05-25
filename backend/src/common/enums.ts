/** Shared enums — values MUST match existing DB enum values exactly */

export enum AccountType {
  CASH = 'cash',
  BANK = 'bank',
}

export enum SalaryType {
  HOURLY = 'hourly',
  FIXED = 'fixed',
}

export enum InventoryStatus {
  IN_STOCK = 'in_stock',
  OUT_OF_STOCK = 'out_of_stock',
  LOW_STOCK = 'low_stock',
}

export enum TransactionType {
  IN = 'in',
  OUT = 'out',
}

export enum AttendanceStatus {
  PRESENT = 'present',
  LATE = 'late',
  ABSENT = 'absent',
  EARLY_CHECKOUT = 'early_checkout',
}

export enum QRTokenType {
  CHECK_IN = 'check_in',
  CHECK_OUT = 'check_out',
  ATTENDANCE = 'attendance',
}

export enum PoolArenaUserGender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum ScoringRuleType {
  WIN = 'win',
  LOSE = 'lose',
  DRAW = 'draw',
  BONUS = 'bonus',
  PENALTY = 'penalty',
}

export enum TournamentMatchStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

export enum TournamentMatchBracket {
  WINNERS = 'winners',
  LOSERS = 'losers',
  KNOCKOUT = 'knockout',
}

export enum OrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  DINE_IN = 'dine-in',
}

export enum OrderType {
  DINE_IN = 'dine-in',
  TAKEAWAY = 'takeaway',
}
