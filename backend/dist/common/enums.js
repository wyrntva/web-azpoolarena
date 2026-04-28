"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderType = exports.OrderStatus = exports.TournamentMatchBracket = exports.TournamentMatchStatus = exports.ScoringRuleType = exports.PoolArenaUserGender = exports.QRTokenType = exports.AttendanceStatus = exports.TransactionType = exports.InventoryStatus = exports.SalaryType = exports.AccountType = void 0;
var AccountType;
(function (AccountType) {
    AccountType["CASH"] = "cash";
    AccountType["BANK"] = "bank";
})(AccountType || (exports.AccountType = AccountType = {}));
var SalaryType;
(function (SalaryType) {
    SalaryType["HOURLY"] = "hourly";
    SalaryType["FIXED"] = "fixed";
})(SalaryType || (exports.SalaryType = SalaryType = {}));
var InventoryStatus;
(function (InventoryStatus) {
    InventoryStatus["IN_STOCK"] = "in_stock";
    InventoryStatus["OUT_OF_STOCK"] = "out_of_stock";
    InventoryStatus["LOW_STOCK"] = "low_stock";
})(InventoryStatus || (exports.InventoryStatus = InventoryStatus = {}));
var TransactionType;
(function (TransactionType) {
    TransactionType["IN"] = "in";
    TransactionType["OUT"] = "out";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["LATE"] = "late";
    AttendanceStatus["ABSENT"] = "absent";
    AttendanceStatus["EARLY_CHECKOUT"] = "early_checkout";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var QRTokenType;
(function (QRTokenType) {
    QRTokenType["CHECK_IN"] = "check_in";
    QRTokenType["CHECK_OUT"] = "check_out";
    QRTokenType["ATTENDANCE"] = "attendance";
})(QRTokenType || (exports.QRTokenType = QRTokenType = {}));
var PoolArenaUserGender;
(function (PoolArenaUserGender) {
    PoolArenaUserGender["MALE"] = "male";
    PoolArenaUserGender["FEMALE"] = "female";
    PoolArenaUserGender["OTHER"] = "other";
})(PoolArenaUserGender || (exports.PoolArenaUserGender = PoolArenaUserGender = {}));
var ScoringRuleType;
(function (ScoringRuleType) {
    ScoringRuleType["WIN"] = "win";
    ScoringRuleType["LOSE"] = "lose";
    ScoringRuleType["DRAW"] = "draw";
    ScoringRuleType["BONUS"] = "bonus";
    ScoringRuleType["PENALTY"] = "penalty";
})(ScoringRuleType || (exports.ScoringRuleType = ScoringRuleType = {}));
var TournamentMatchStatus;
(function (TournamentMatchStatus) {
    TournamentMatchStatus["UPCOMING"] = "upcoming";
    TournamentMatchStatus["ONGOING"] = "ongoing";
    TournamentMatchStatus["COMPLETED"] = "completed";
})(TournamentMatchStatus || (exports.TournamentMatchStatus = TournamentMatchStatus = {}));
var TournamentMatchBracket;
(function (TournamentMatchBracket) {
    TournamentMatchBracket["WINNERS"] = "winners";
    TournamentMatchBracket["LOSERS"] = "losers";
    TournamentMatchBracket["KNOCKOUT"] = "knockout";
})(TournamentMatchBracket || (exports.TournamentMatchBracket = TournamentMatchBracket = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["COMPLETED"] = "completed";
    OrderStatus["CANCELLED"] = "cancelled";
    OrderStatus["DINE_IN"] = "dine-in";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var OrderType;
(function (OrderType) {
    OrderType["DINE_IN"] = "dine-in";
    OrderType["TAKEAWAY"] = "takeaway";
})(OrderType || (exports.OrderType = OrderType = {}));
//# sourceMappingURL=enums.js.map