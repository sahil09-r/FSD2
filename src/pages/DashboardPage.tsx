import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, CalendarClock, DollarSign, Plus, Receipt, ScrollText, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useBankData } from '../lib/useBankData';
import { dateOnly, dateTime, isCredit, money } from '../lib/format';
import { EmptyState, PageHeader, PageLoader, StatCard, TxBadge } from '../components/ui';

const ACTIONS = [
  { to: '/accounts?new=1', label: 'New Account', icon: Plus, color: 'bg-bank-50 text-bank-700 hover:bg-bank-100' },
  { to: '/deposit', label: 'Deposit', icon: ArrowDownToLine, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
  { to: '/withdraw', label: 'Withdraw', icon: ArrowUpFromLine, color: 'bg-rose-50 text-rose-700 hover:bg-rose-100' },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight, color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { accounts, transactions, loading } = useBankData();

  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const since = accounts.length ? dateOnly(accounts.reduce((m, a) => (a.createdAt < m ? a.createdAt : m), accounts[0].createdAt)) : '—';

  const chart = useMemo(() => {
    const byDay = new Map<string, { key: string; label: string; Deposits: number; Withdrawals: number }>();
    [...transactions].reverse().forEach((t) => {
      if (t.transactionType === 'TRANSFER') return;
      const d = new Date(t.createdAt);
      const key = d.toISOString().slice(0, 10);
      const row = byDay.get(key) ?? { key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), Deposits: 0, Withdrawals: 0 };
      if (t.transactionType === 'DEPOSIT') row.Deposits += t.amount; else row.Withdrawals += t.amount;
      byDay.set(key, row);
    });
    return [...byDay.values()].sort((a, b) => a.key.localeCompare(b.key));
  }, [transactions]);

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title={`Hello, ${user?.username} 👋`} subtitle="Here's a snapshot of your finances." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Balance" value={money(total)} icon={DollarSign} tone="bg-bank-50 text-bank-600" />
        <StatCard label="Accounts" value={String(accounts.length)} icon={Wallet} tone="bg-emerald-50 text-emerald-600" />
        <StatCard label="Transactions" value={String(transactions.length)} icon={Receipt} tone="bg-violet-50 text-violet-600" />
        <StatCard label="Active Since" value={since} icon={CalendarClock} tone="bg-amber-50 text-amber-600" />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ACTIONS.map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className={`flex flex-col items-center gap-2 rounded-2xl px-4 py-5 text-sm font-semibold transition ${color}`}>
            <Icon className="h-6 w-6" /> {label}
          </Link>
        ))}
      </div>

      <div className="card mt-6 p-5 sm:p-6">
        <h2 className="text-base font-semibold text-slate-900">Deposits vs. Withdrawals</h2>
        {chart.length === 0 ? (
          <EmptyState icon={ScrollText} title="No activity yet" text="Make a deposit or withdrawal to see your trends." />
        ) : (
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gDep" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.35} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gWd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} /><stop offset="95%" stopColor="#f43f5e" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v >= 1000 ? `${v / 1000}k` : v}`} />
                <Tooltip formatter={(v) => money(Number(v))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="Deposits" stroke="#10b981" strokeWidth={2.5} fill="url(#gDep)" />
                <Area type="monotone" dataKey="Withdrawals" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gWd)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">Recent Transactions</h2>
          <Link to="/transactions" className="text-sm font-semibold text-bank-600 hover:text-bank-700">View all</Link>
        </div>
        {transactions.length === 0 ? (
          <EmptyState icon={Receipt} title="No transactions yet" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                <tr><th className="px-6 py-3">Type</th><th className="px-6 py-3">Description</th><th className="px-6 py-3">Date</th><th className="px-6 py-3 text-right">Amount</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60">
                    <td className="px-6 py-3.5"><TxBadge tx={t} /></td>
                    <td className="max-w-[240px] truncate px-6 py-3.5 text-slate-600">{t.description || '—'}</td>
                    <td className="whitespace-nowrap px-6 py-3.5 text-slate-500">{dateTime(t.createdAt)}</td>
                    <td className={`whitespace-nowrap px-6 py-3.5 text-right font-semibold ${isCredit(t) ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {isCredit(t) ? '+' : '−'}{money(t.amount)}
                    </td>
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
