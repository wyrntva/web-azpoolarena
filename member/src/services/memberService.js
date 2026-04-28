import { request } from './httpClient.js';

export function fetchMemberProfile() {
  return request('/api/member/profile');
}
