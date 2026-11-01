import type { Account, AccountType, AuditLog, Transaction, User } from '../types';

const BASE: string = import.meta.env.VITE_API_URL ?? '/api';
export const TOKEN_KEY = 'bankos_token';
export const USER_KEY = 'bankos_user';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status = status; }
}

async function request<T>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      method: opts.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError('Unable to reach the server. Check your connection.', 0);
  }
  let json: any = null;
  try { json = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    if (res.status === 401 && token) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      window.dispatchEvent(new Event('bankos:unauthorized'));
    }
    throw new ApiError(json?.message || json?.error || `Request failed (${res.status})`, res.status);
  }
  return (json && json.success === true && 'data' in json ? json.data : json) as T;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');

export interface LoginResponse extends User { token: string }

export const api = {
  login: (username: string, password: string) =>
    request<LoginResponse>('/auth/login', { method: 'POST', body: { username, password } }),
  register: (username: string, email: string, password: string) =>
    request<unknown>('/auth/register', { method: 'POST', body: { username, email, password } }),
  accounts: () => request<Account[]>('/accounts'),
  createAccount: (b: { accountHolderName: string; accountType: AccountType; initialBalance: number }) =>
    request<Account>('/accounts', { method: 'POST', body: b }),
  transactions: () => request<Transaction[]>('/transactions'),
  deposit: (accountId: number, amount: number) =>
    request<Transaction>('/transactions/deposit', { method: 'POST', body: { accountId, amount } }),
  withdraw: (accountId: number, amount: number) =>
    request<Transaction>('/transactions/withdraw', { method: 'POST', body: { accountId, amount } }),
  transfer: (b: { fromAccountId: number; toAccountId: number; amount: number; description: string }) =>
    request<unknown>('/transfers', { method: 'POST', body: b }),
  audit: () => request<AuditLog[]>('/audit'),
};
