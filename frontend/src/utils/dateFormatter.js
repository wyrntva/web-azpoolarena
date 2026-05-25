/**
 * Capitalize first letter of a string
 * Used to format Vietnamese day names properly (e.g., "thứ hai" -> "Thứ hai")
 */
export const capitalizeFirstLetter = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format date with capitalized day name in Vietnamese
 * @param {dayjs.Dayjs} date - dayjs date object
 * @param {string} format - format string (default: "dddd, DD/MM/YYYY")
 * @returns {string} formatted date with capitalized first letter
 */
export const formatVietnameseDate = (date, format = "dddd, DD/MM/YYYY") => {
  if (!date) return "";
  const formatted = date.format(format);
  return capitalizeFirstLetter(formatted);
};
