import { Router } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { HttpError, mapAccount, mapRpcError, parseAmount, parseId, wrap } from '../utils';

export const accountsRouter = Router();
accountsRouter.use(requireAuth);

accountsRouter.post('/', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const { accountHolderName, accountType, initialBalance } = req.body ?? {};
  if (typeof accountHolderName !== 'string' || !accountHolderName.trim())
    throw new HttpError(400, 'Account holder name is required');
  if (!['SAVINGS', 'CHECKING', 'CURRENT'].includes(accountType))
    throw new HttpError(400, 'Account type must be SAVINGS, CHECKING or CURRENT');
  const initial = initialBalance == null || initialBalance === '' ? 0 : parseAmount(initialBalance, true);

  const { data, error } = await supabase.rpc('bank_create_account', {
    p_user_id: user.id,
    p_username: user.username,
    p_holder: accountHolderName.trim(),
    p_type: accountType,
    p_initial: initial,
  });
  if (error) throw mapRpcError(error);
  res.status(201).json(mapAccount(data));
}));

accountsRouter.get('/', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const { data, error } = await supabase
    .from('accounts').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  if (error) throw error;
  res.json((data ?? []).map(mapAccount));
}));

accountsRouter.get('/account-number/:accountNumber', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const { data, error } = await supabase
    .from('accounts').select('*')
    .eq('account_number', req.params.accountNumber).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Account not found');
  res.json(mapAccount(data));
}));

accountsRouter.get('/:id', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const id = parseId(req.params.id, 'account id');
  const { data, error } = await supabase
    .from('accounts').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!data) throw new HttpError(404, 'Account not found');
  res.json(mapAccount(data));
}));
