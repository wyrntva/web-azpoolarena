import { request } from './httpClient';

export const tournamentService = {
    getRanks: async () => {
        return request('/api/tournament-settings/ranks');
    }
};
