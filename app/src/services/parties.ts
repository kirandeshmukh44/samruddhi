// app/src/services/parties.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockParties } from './mockData';
import { Party } from '../types';
import safeStorage from '../lib/storage';

const PARTIES_STORAGE_KEY = 'bilu_parties_data_v2';
let parties = [...mockParties];

// Auto-load persisted parties on startup
const loadStoredParties = async () => {
  try {
    const data = await safeStorage.getItem(PARTIES_STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        parties = parsed;
        mockParties.splice(0, mockParties.length, ...parsed);
      }
    }
  } catch (e) {
    console.warn('Error loading stored parties:', e);
  }
};
loadStoredParties();

const persistParties = () => {
  safeStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(parties)).catch(() => {});
  mockParties.splice(0, mockParties.length, ...parties);
};

export async function listParties(businessId: string): Promise<Party[]> {
  if (USE_MOCK) return parties.filter((p) => p.business_id === businessId);
  try {
    const res = await axios.get(`${API_BASE_URL}/businesses/${businessId}/parties`);
    if (res.data?.parties) return res.data.parties;
    return res.data;
  } catch (e) {
    return parties.filter((p) => p.business_id === businessId);
  }
}

export async function createParty(party: Omit<Party, 'id'>): Promise<Party> {
  const created = { ...party, id: `p-${Date.now()}` };
  parties.unshift(created);
  persistParties();

  if (!USE_MOCK) {
    try {
      await axios.post(`${API_BASE_URL}/businesses/${party.business_id}/parties`, party);
    } catch (e) {
      console.warn('API sync failed, saved in BiLU ERP local storage:', e);
    }
  }
  return created;
}

export async function updateParty(id: string, data: Partial<Party>): Promise<Party> {
  const idx = parties.findIndex((p) => p.id === id);
  if (idx >= 0) {
    parties[idx] = { ...parties[idx], ...data };
    persistParties();
  }

  if (!USE_MOCK) {
    try {
      await axios.put(`${API_BASE_URL}/parties/${id}`, data);
    } catch (e) {}
  }
  return parties[idx];
}

export async function deleteParty(id: string): Promise<void> {
  parties = parties.filter((p) => p.id !== id);
  persistParties();

  if (!USE_MOCK) {
    try {
      await axios.delete(`${API_BASE_URL}/parties/${id}`);
    } catch (e) {}
  }
}
