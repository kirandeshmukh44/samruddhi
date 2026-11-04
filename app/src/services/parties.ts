// app/src/services/parties.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockParties } from './mockData';
import { Party } from '../types';
import safeStorage from '../lib/storage';

const PARTIES_STORAGE_KEY = 'samruddhi_parties_data';
let parties = [...mockParties];

// Auto-load persisted parties on startup
safeStorage.getItem(PARTIES_STORAGE_KEY).then((data) => {
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parties = parsed;
        mockParties.splice(0, mockParties.length, ...parsed);
      }
    } catch (e) {}
  }
});

const persistParties = () => {
  safeStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(parties)).catch(() => {});
  mockParties.splice(0, mockParties.length, ...parties);
};

export async function listParties(businessId: string): Promise<Party[]> {
  if (USE_MOCK) return parties.filter((p) => p.business_id === businessId);
  const res = await axios.get(`${API_BASE_URL}/parties`, { params: { business_id: businessId } });
  return res.data;
}

export async function createParty(party: Omit<Party, 'id'>): Promise<Party> {
  if (USE_MOCK) {
    const created = { ...party, id: `p-${Date.now()}` };
    parties.push(created);
    persistParties();
    return created;
  }
  const res = await axios.post(`${API_BASE_URL}/parties`, party);
  return res.data;
}

export async function updateParty(id: string, data: Partial<Party>): Promise<Party> {
  if (USE_MOCK) {
    const idx = parties.findIndex((p) => p.id === id);
    if (idx >= 0) parties[idx] = { ...parties[idx], ...data };
    persistParties();
    return parties[idx];
  }
  const res = await axios.put(`${API_BASE_URL}/parties/${id}`, data);
  return res.data;
}

export async function deleteParty(id: string): Promise<void> {
  if (USE_MOCK) {
    parties = parties.filter((p) => p.id !== id);
    persistParties();
    return;
  }
  await axios.delete(`${API_BASE_URL}/parties/${id}`);
}
