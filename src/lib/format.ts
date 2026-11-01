import type { Transaction } from '../types';

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const money = (n: number) => usd.format(n);
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
export const dateOnly = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
export const maskNumber = (n: string) => `•••• •••• ${n.slice(-4)}`;
export const groupNumber = (n: string) => n.replace(/(\d{4})(?=\d)/g, '$1 ');
export const isCredit = (t: Transaction) => (t.direction ? t.direction === 'CREDIT' : t.transactionType === 'DEPOSIT');
