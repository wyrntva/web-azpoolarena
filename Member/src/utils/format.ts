export function formatDateTime(value: string) {
  return new Date(value).toLocaleString("vi-VN");
}

export function formatCurrency(value: number) {
  return `${value.toLocaleString("vi-VN")}d`;
}

export function formatPoints(value: number) {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toLocaleString("vi-VN")} pts`;
}
