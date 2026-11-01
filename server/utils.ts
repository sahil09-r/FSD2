import { NextFunction, Request, RequestHandler, Response } from 'express';
import { supabase } from './supabase';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

const RPC_ERRORS: Record<string, [number, string]> = {
  INVALID_AMOUNT: [400, 'Amount must be greater than zero'],
  INVALID_ACCOUNT_TYPE: [400, 'Account type must be SAVINGS, CHECKING or CURRENT'],
  INSUFFICIENT_FUNDS: [400, 'Insufficient funds'],
  SAME_ACCOUNT: [400, 'Cannot transfer to the same account'],
  ACCOUNT_INACTIVE: [400, 'Account is not active'],
  ACCOUNT_NOT_FOUND: [404, 'Account not found'],
  TARGET_NOT_FOUND: [404, 'Destination account not found'],
};

export function mapRpcError(err: { message?: string }): Error {
  const msg = err?.message ?? '';
  for (const code of Object.keys(RPC_ERRORS)) {
    if (msg.includes(code)) return new HttpError(RPC_ERRORS[code][0], RPC_ERRORS[code][1]);
  }
  return new Error(msg || 'Database error');
}

export async function audit(action: string, performedBy: string, details: string) {
  const { error } = await supabase
    .from('audit_logs')
    .insert({ action, performed_by: performedBy, details });
  if (error) console.error('audit log failed:', error.message);
}

export function parseAmount(value: unknown, allowZero = false): number {
  const n = typeof value === 'string' ? Number(value) : (value as number);
  if (typeof n !== 'number' || !Number.isFinite(n)) throw new HttpError(400, 'Invalid amount');
  if (allowZero ? n < 0 : n <= 0) throw new HttpError(400, 'Amount must be greater than zero');
  if (n > 1_000_000_000) throw new HttpError(400, 'Amount exceeds maximum allowed');
  if (Math.round(n * 100) / 100 !== n) throw new HttpError(400, 'Amount can have at most 2 decimal places');
  return n;
}

export function parseId(value: unknown, label = 'id'): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, `Invalid ${label}`);
  return n;
}

/* ---------- response mappers (snake_case -> camelCase) ---------- */
export const mapAccount = (a: any) => ({
  id: a.id,
  userId: a.user_id,
  accountNumber: a.account_number,
  accountHolderName: a.account_holder_name,
  accountType: a.account_type,
  balance: Number(a.balance),
  status: a.status,
  createdAt: a.created_at,
});

export const mapTx = (t: any) => ({
  id: t.id,
  accountId: t.account_id,
  accountNumber: t.accounts?.account_number,
  transactionType: t.transaction_type,
  direction: t.direction,
  amount: Number(t.amount),
  description: t.description,
  balanceAfter: t.balance_after == null ? null : Number(t.balance_after),
  createdAt: t.created_at,
  timestamp: t.created_at,
});

export const mapAudit = (l: any) => ({
  id: l.id,
  action: l.action,
  performedBy: l.performed_by,
  username: l.performed_by,
  details: l.details,
  createdAt: l.created_at,
  timestamp: l.created_at,
});

export const mapTransfer = (t: any) => ({
  id: t.id,
  fromAccountId: t.from_account_id,
  toAccountId: t.to_account_id,
  amount: Number(t.amount),
  description: t.description,
  status: t.status,
  createdAt: t.created_at,
});
