import { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils';

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ success: false, message: 'Not found' });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ success: false, message: err.message, error: err.message });
  }
  console.error(err);
  res.status(500).json({ success: false, message: 'Internal server error', error: 'Internal server error' });
}
