import api from '@/config/axios';

export const tournamentAPI = {
  getTournaments: (params?: { category?: string; skip?: number; limit?: number }) =>
    api.get('/api/tournaments/public', { params }),
  getTournament: (slug: string) => api.get(`/api/tournaments/slug/${slug}`),
  getTournamentById: (id: string) => api.get(`/api/tournaments/${id}`),
  getTournamentRegistrations: (tournamentId: number) => api.get(`/api/tournaments/${tournamentId}/registrations`),
  getTournamentRegistrationsBySlug: (slug: string) => api.get(`/api/tournaments/slug/${slug}/registrations`),
  getTournamentMatchesBySlug: (slug: string) => api.get(`/api/tournaments/slug/${slug}/matches`),
  joinTournament: (id: string) => api.post(`/api/tournaments/${id}/join`),
  createPaymentCode: (id: string) => api.post(`/api/tournaments/${id}/payment-code`),
};
