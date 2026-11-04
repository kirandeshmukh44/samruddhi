// app/src/services/auth.ts
import axios from 'axios';
import { USE_MOCK, API_BASE_URL } from '../config';
import { mockUser } from './mockData';
import { User } from '../types';

export async function login(email: string, password: string): Promise<{ user: User; token: string }> {
  if (USE_MOCK) {
    // Mock: accept any credentials.
    return { user: mockUser, token: 'mock-token' };
  }
  const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  return res.data;
}

export async function getMe(token: string): Promise<User> {
  if (USE_MOCK) return mockUser;
  const res = await axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
