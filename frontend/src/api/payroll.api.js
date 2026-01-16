import axiosClient from "./axiosClient";

export const payrollAPI = {
  // Advance Payments
  getAdvances: (params) => axiosClient.get("/api/payroll/advances", { params }),
  createAdvance: (data) => axiosClient.post("/api/payroll/advances", data),
  updateAdvance: (id, data) => axiosClient.put(`/api/payroll/advances/${id}`, data),
  deleteAdvance: (id) => axiosClient.delete(`/api/payroll/advances/${id}`),

  // Bonuses
  getBonuses: (params) => axiosClient.get("/api/payroll/bonuses", { params }),
  createBonus: (data) => axiosClient.post("/api/payroll/bonuses", data),
  updateBonus: (id, data) => axiosClient.put(`/api/payroll/bonuses/${id}`, data),
  deleteBonus: (id) => axiosClient.delete(`/api/payroll/bonuses/${id}`),

  // Penalties
  getPenalties: (params) => axiosClient.get("/api/payroll/penalties", { params }),
  createPenalty: (data) => axiosClient.post("/api/payroll/penalties", data),
  updatePenalty: (id, data) => axiosClient.put(`/api/payroll/penalties/${id}`, data),
  deletePenalty: (id) => axiosClient.delete(`/api/payroll/penalties/${id}`),

  // Summary
  getPayrollSummary: (month) => axiosClient.get("/api/payroll/summary", { params: { month } }),

  // Auto Generate Penalties
  autoGeneratePenalties: (startDate, endDate) =>
    axiosClient.post("/api/payroll/auto-generate-penalties", null, {
      params: { start_date: startDate, end_date: endDate }
    }),
};
