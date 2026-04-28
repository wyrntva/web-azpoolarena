import { request } from './httpClient';

export const storeSettingsService = {
    getPublicSettings: () => request('/api/store-settings/public'),
};
