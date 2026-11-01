import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Plus, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, errMsg } from '../lib/api';
import { useBankData } from '../lib/useBankData';
import type { AccountType } from '../types';
import AccountCard from '../components/AccountCard';
import { EmptyState, Modal, PageHeader, PageLoader, Spinner } from '../components/ui';

const TYPES: { value: AccountType; label: string; hint: string }[] = [
  { value: 'SAVINGS', label: 'Savings', hint: 'Grow your money' },
  { value: 'CHECKING', label: 'Checking', hint: 'Everyday spending' },
  { value: 'CURRENT', label: 'Current', hint: 'Business & flexible' },
];

export default function AccountsPage() {
  const { user } = useAuth();
  const { accounts, loading, reload } = useBankData();
  const [params, setParams] = useSearchParams();
  const open = params.get('new') === '1';
  const [name, setName] = useState(user?.username ?? '');
  const [type, setType] = useState<AccountType>('SAVINGS');
  const [initial, setInitial] = useState('');
  const [busy, setBusy] = useState(false);

  const close = () => setParams({}, { replace: true });
  const openModal = () => setParams({ new: '1' }, { replace: true });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const amt = initial === '' ? 0 : parseFloat(initial);
    if (!name.trim()) return toast.error('Account holder name is required');
    if (!Number.isFinite(amt) || amt < 0 || Math.round(amt * 100) / 100 !== amt) return toast.error('Enter a valid initial deposit');
    setBusy(true);
    try {
      await api.createAccount({ accountHolderName: name.trim(), accountType: type, initialBalance: amt });
      toast.success('Account opened successfully');
      setInitial('');
      close();
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <PageLoader />;
  const newBtn = <button onClick={openModal} className="btn-primary"><Plus className="h-4 w-4" /> New Account</button>;

  return (
    <>
      <PageHeader title="Accounts" subtitle="Manage all your bank accounts in one place." action={newBtn} />
      {accounts.length === 0 ? (
        <div className="card"><EmptyState icon={Wallet} title="No accounts yet" text="Open your first account to get started." action={newBtn} /></div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {accounts.map((a) => <AccountCard key={a.id} account={a} />)}
        </div>
      )}

      <Modal open={open} onClose={close} title="Open a new account">
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label" htmlFor="holder">Account holder name</label>
            <input id="holder" className="input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <span className="label">Account type</span>
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => (
                <button type="button" key={t.value} onClick={() => setType(t.value)}
                  className={`rounded-xl border p-3 text-left transition ${type === t.value ? 'border-bank-600 bg-bank-50 ring-2 ring-bank-100' : 'border-slate-200 hover:border-slate-300'}`}>
                  <p className="text-sm font-semibold text-slate-900">{t.label}</p>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-500">{t.hint}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label" htmlFor="init">Initial deposit (optional)</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <input id="init" type="number" min="0" step="0.01" inputMode="decimal" className="input pl-8" placeholder="0.00" value={initial} onChange={(e) => setInitial(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={close} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={busy} className="btn-primary flex-1">{busy && <Spinner className="h-4 w-4" />} Open account</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
