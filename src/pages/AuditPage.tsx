import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, LogIn, Search, ShieldCheck, UserPlus, Wallet, type LucideIcon } from 'lucide-react';
import { api, errMsg } from '../lib/api';
import { dateTime } from '../lib/format';
import type { AuditLog } from '../types';
import { EmptyState, PageHeader, PageLoader } from '../components/ui';

const ICONS: Record<string, { icon: LucideIcon; tone: string }> = {
  LOGIN: { icon: LogIn, tone: 'bg-bank-50 text-bank-600' },
  REGISTER: { icon: UserPlus, tone: 'bg-violet-50 text-violet-600' },
  CREATE_ACCOUNT: { icon: Wallet, tone: 'bg-amber-50 text-amber-600' },
  DEPOSIT: { icon: ArrowDownToLine, tone: 'bg-emerald-50 text-emerald-600' },
  WITHDRAW: { icon: ArrowUpFromLine, tone: 'bg-rose-50 text-rose-600' },
  TRANSFER: { icon: ArrowLeftRight, tone: 'bg-indigo-50 text-indigo-600' },
};

export default function AuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try { setLogs(await api.audit()); } catch (e) { toast.error(errMsg(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? logs.filter((l) => [l.action, l.performedBy, l.details].some((v) => v?.toLowerCase().includes(s))) : logs;
  }, [logs, q]);

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader title="Audit Log" subtitle="A timeline of account activity and security events." />
      <div className="card">
        <div className="border-b border-slate-100 p-4">
          <div className="relative sm:w-96">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search by action, user or details…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </div>
        {rows.length === 0 ? (
          <EmptyState icon={ShieldCheck} title="No audit entries" text={logs.length ? 'Nothing matches your search.' : 'Activity will be recorded here.'} />
        ) : (
          <ol className="relative p-5 sm:p-6">
            <div className="absolute bottom-8 left-[39px] top-8 w-px bg-slate-200 sm:left-[43px]" />
            {rows.map((l) => {
              const meta = ICONS[l.action] ?? { icon: ShieldCheck, tone: 'bg-slate-100 text-slate-600' };
              const Icon = meta.icon;
              return (
                <li key={l.id} className="relative flex gap-4 py-3">
                  <div className={`z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${meta.tone}`}><Icon className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="text-sm font-semibold text-slate-900">{l.action.replace(/_/g, ' ')}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">@{l.performedBy}</span>
                      <span className="text-xs text-slate-400">{dateTime(l.createdAt)}</span>
                    </div>
                    {l.details && <p className="mt-0.5 break-words text-sm text-slate-500">{l.details}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </>
  );
}
