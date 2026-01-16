import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '0 đ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return '';
  return dayjs(date).format(format);
};

export const formatDateTime = (datetime) => {
  if (!datetime) return '';
  return dayjs(datetime).format('DD/MM/YYYY HH:mm');
};

export const parseDate = (dateString) => {
  return dayjs(dateString);
};
