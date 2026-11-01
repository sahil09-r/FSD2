import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase } from '../supabase';
import { config } from '../config';
import { HttpError, audit, wrap } from '../utils';

export const authRouter = Router();

authRouter.post('/register', wrap(async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (typeof username !== 'string' || username.trim().length < 3 || username.trim().length > 50)
    throw new HttpError(400, 'Username must be 3-50 characters');
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new HttpError(400, 'Valid email is required');
  if (typeof password !== 'string' || password.length < 6)
    throw new HttpError(400, 'Password must be at least 6 characters');

  const password_hash = await bcrypt.hash(password, 10);
  const { data, error } = await supabase
    .from('users')
    .insert({ username: username.trim(), email: email.trim().toLowerCase(), password_hash })
    .select('id, username, email, role, created_at')
    .single();
  if (error) {
    if (error.code === '23505') throw new HttpError(409, 'Username or email already exists');
    throw error;
  }
  await audit('REGISTER', data.username, `User registered: ${data.email}`);
  res.status(201).json({
    id: data.id, username: data.username, email: data.email, role: data.role, createdAt: data.created_at,
  });
}));

authRouter.post('/login', wrap(async (req, res) => {
  const { username, password } = req.body ?? {};
  if (typeof username !== 'string' || typeof password !== 'string' || !username || !password)
    throw new HttpError(400, 'Username and password are required');

  const { data: user, error } = await supabase
    .from('users').select('*').eq('username', username.trim()).maybeSingle();
  if (error) throw error;
  if (!user || !(await bcrypt.compare(password, user.password_hash)))
    throw new HttpError(401, 'Invalid username or password');

  const token = jwt.sign(
    { sub: String(user.id), username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn },
  );
  await audit('LOGIN', user.username, 'User logged in');
  res.json({ token, username: user.username, email: user.email, role: user.role });
}));
