import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── Config ────────────────────────────────────────────────────────────────────
// Change this to your deployed backend URL or local dev IP
// For local dev: use your machine's LAN IP (not localhost) so the phone can reach it
// e.g. 'http://192.168.1.100:3000/api'
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Cache helpers ──────────────────────────────────────────────────────────────
async function getCached(key) {
  try {
    const raw = await AsyncStorage.getItem(`cache:${key}`);
    if (!raw) return null;
    const { data, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

async function setCached(key, data) {
  try {
    await AsyncStorage.setItem(`cache:${key}`, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {}
}

// ── API Methods ────────────────────────────────────────────────────────────────

export async function getRecentTransactions({ page = 1, limit = 20, code, from, to } = {}) {
  const params = { page, limit };
  if (code) params.code = code;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get('/transactions/recent', { params });
  return res.data;
}

export async function getTransactionsByTicker(ticker, { page = 1, limit = 20, code, from, to } = {}) {
  const cacheKey = `ticker:${ticker}:${page}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;

  const params = { page, limit };
  if (code) params.code = code;
  if (from) params.from = from;
  if (to) params.to = to;
  const res = await api.get(`/transactions/ticker/${encodeURIComponent(ticker)}`, { params });
  await setCached(cacheKey, res.data);
  return res.data;
}

export async function getTransactionsByInsider(name, { page = 1, limit = 20 } = {}) {
  const res = await api.get(`/transactions/insider/${encodeURIComponent(name)}`, {
    params: { page, limit },
  });
  return res.data;
}

export async function getTransactionById(id) {
  const res = await api.get(`/transactions/${id}`);
  return res.data;
}

export async function getTickerStats(ticker, days = 90) {
  const cacheKey = `stats:${ticker}:${days}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  const res = await api.get(`/transactions/stats/${encodeURIComponent(ticker)}`, {
    params: { days },
  });
  await setCached(cacheKey, res.data);
  return res.data;
}

export async function search(query, { type = 'all', page = 1, limit = 20 } = {}) {
  const res = await api.get('/search', { params: { q: query, type, page, limit } });
  return res.data;
}

export async function autocomplete(query) {
  if (!query || query.length < 1) return { data: [] };
  const cacheKey = `ac:${query}`;
  const cached = await getCached(cacheKey);
  if (cached) return cached;
  const res = await api.get('/search/autocomplete', { params: { q: query } });
  await setCached(cacheKey, res.data);
  return res.data;
}

// ── Recent Searches (local storage) ───────────────────────────────────────────
const MAX_RECENT = 10;
const RECENT_KEY = 'recent_searches';

export async function saveRecentSearch(item) {
  try {
    const existing = await getRecentSearches();
    const filtered = existing.filter(r => r.query !== item.query);
    const updated = [item, ...filtered].slice(0, MAX_RECENT);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {}
}

export async function getRecentSearches() {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function clearRecentSearches() {
  try {
    await AsyncStorage.removeItem(RECENT_KEY);
  } catch {}
}

export default api;
