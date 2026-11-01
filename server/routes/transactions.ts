import { Router } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { HttpError, mapRpcError, mapTx, parseAmount, parseId, wrap } from '../utils';

export const transactionsRouter = Router();
transactionsRouter.use(requireAuth);

async function runOp(fn: 'bank_deposit' | 'bank_withdraw', req: any, res: any) {
  const { user } = req as AuthedRequest;
  const accountId = parseId(req.body?.accountId, 'account id');
  const amount = parseAmount(req.body?.amount);
  const { data, error } = await supabase.rpc(fn, {
    p_account_id: accountId, p_user_id: user.id, p_username: user.username, p_amount: amount,
  });
  if (error) throw mapRpcError(error);
  res.status(201).json(mapTx(data));
}

transactionsRouter.post('/deposit',  wrap((req, res) => runOp('bank_deposit', req, res)));
transactionsRouter.post('/withdraw', wrap((req, res) => runOp('bank_withdraw', req, res)));

transactionsRouter.get('/', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts!inner(account_number, user_id)')
    .eq('accounts.user_id', user.id)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  res.json((data ?? []).map(mapTx));
}));

transactionsRouter.get('/account/:accountId', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const accountId = parseId(req.params.accountId, 'account id');
  const { data: acc, error: accErr } = await supabase
    .from('accounts').select('id').eq('id', accountId).eq('user_id', user.id).maybeSingle();
  if (accErr) throw accErr;
  if (!acc) throw new HttpError(404, 'Account not found');
  const { data, error } = await supabase
    .from('transactions')
    .select('*, accounts(account_number)')
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  res.json((data ?? []).map(mapTx));
}));
