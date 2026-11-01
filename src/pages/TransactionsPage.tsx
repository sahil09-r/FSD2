import { useMemo, useState } from 'react';
import { Receipt, Search } from 'lucide-react';
import { useBankData } from '../lib/useBankData';
import { dateTime, isCredit, money } from '../lib/format';
import { EmptyState, PageHeader, PageLoader, TxBadge } from '../components/ui';

const FILTERS = ['ALL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER'] as const;

export default function TransactionsPage() {
  const { transactions, loading } = useBankData();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return transactions.filter((t) => {
      if (filter !== 'ALL' && t.transactionType !== filter) return false;
      if (!s) return true;
      return [t.description, t.transactionType, t.accountNumber, String(t.amount), String(t.id)].some((v) => v?.toLowerCase().includes(s));
    });
  }, [transactions, q, filter]);

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title="Transactions" subtitle="Your complete transaction history." />
      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative sm:w-80">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search transactions…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-bank-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions found" text={transactions.length ? 'Try a different search or filter.' : 'Your transactions will appear here.'} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Type</th><th className="px-6 py-3">Description</th><th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Date</th><th className="px-6 py-3 text-right">Amount</th><th className="px-6 py-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5"><TxBadge tx={t} /></td>
                    <td className="max-w-[260px] truncate px-6 py-3.5 text-slate-600">{t.description || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 font-mono text-xs text-slate-500">{t.accountNumber ? `•••• ${t.accountNumber.slice(-4)}` : `#${t.accountId}`}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-slate-500">{dateTime(t.createdAt)}</td>
                    <td className={`whitespace-nowrap px-6 py-3.5 text-right font-semibold ${isCredit(t) ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isCredit(t) ? '+' : '−'}{money(t.amount)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-right text-slate-600">{t.balanceAfter == null ? '—' : money(t.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
