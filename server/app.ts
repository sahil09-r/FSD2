import express from 'express';
import cors from 'cors';
import { config } from './config';
import { authRouter } from './routes/auth';
import { accountsRouter } from './routes/accounts';
import { transactionsRouter } from './routes/transactions';
import { transfersRouter } from './routes/transfers';
import { auditRouter } from './routes/audit';
import { errorHandler, notFound } from './middleware/error';

const app = express();
app.disable('x-powered-by');
app.use(cors({ origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(','), credentials: true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ status: 'UP', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/transfers', transfersRouter);
app.use('/api/audit', auditRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
