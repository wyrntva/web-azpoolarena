import axiosClient from './axiosClient';

export const expenseReportAPI = {
  getMonthlyExpenseReport: (month) => {
    return axiosClient.get(`/api/expense-report/monthly`, {
      params: { month }
    });
  }
};
