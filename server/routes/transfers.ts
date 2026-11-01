import { Router } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { HttpError, mapRpcError, mapTransfer, parseAmount, parseId, wrap } from '../utils';

export const transfersRouter = Router();
transfersRouter.use(requireAuth);

transfersRouter.post('/', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const fromId = parseId(req.body?.fromAccountId, 'source account id');
  const toId = parseId(req.body?.toAccountId, 'destination account id');
  if (fromId === toId) throw new HttpError(400, 'Cannot transfer to the same account');
  const amount = parseAmount(req.body?.amount);
  const description = typeof req.body?.description === 'string' ? req.body.description.slice(0, 255) : '';

  const { data, error } = await supabase.rpc('bank_transfer', {
    p_from: fromId, p_to: toId, p_user_id: user.id, p_username: user.username,
    p_amount: amount, p_desc: description,
  });
  if (error) throw mapRpcError(error);
  res.status(201).json(mapTransfer(data));
}));
