import { Router } from 'express';
import { supabase } from '../supabase';
import { requireAuth, AuthedRequest } from '../middleware/auth';
import { HttpError, mapAudit, wrap } from '../utils';

export const auditRouter = Router();
auditRouter.use(requireAuth);

// ADMIN sees all logs; regular users see only their own.
auditRouter.get('/', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).order('id', { ascending: false }).limit(500);
  if (user.role !== 'ADMIN') q = q.eq('performed_by', user.username);
  const { data, error } = await q;
  if (error) throw error;
  res.json((data ?? []).map(mapAudit));
}));

auditRouter.get('/user/:username', wrap(async (req, res) => {
  const { user } = req as AuthedRequest;
  const target = req.params.username;
  if (user.role !== 'ADMIN' && target !== user.username) throw new HttpError(403, 'Forbidden');
  const { data, error } = await supabase
    .from('audit_logs').select('*').eq('performed_by', target)
    .order('created_at', { ascending: false }).order('id', { ascending: false }).limit(500);
  if (error) throw error;
  res.json((data ?? []).map(mapAudit));
}));
