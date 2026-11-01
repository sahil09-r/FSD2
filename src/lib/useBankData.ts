import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { api, errMsg } from './api';
import type { Account, Transaction } from '../types';

export function useBankData() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [a, t] = await Promise.all([api.accounts(), api.transactions()]);
      setAccounts(a);
      setTransactions(t);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);
  return { accounts, transactions, loading, reload };
}
