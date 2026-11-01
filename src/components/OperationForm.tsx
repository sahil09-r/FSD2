import { useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Wallet } from 'lucide-react';
import { api, errMsg } from '../lib/api';
import { money } from '../lib/format';
import { useBankData } from '../lib/useBankData';
import { EmptyState, PageHeader, PageLoader, Spinner } from './ui';
import { Link } from 'react-router-dom';

const CHIPS = [100, 250, 500, 1000, 2500];

export default function OperationForm({ mode }: { mode: 'deposit' | 'withdraw' }) {
  const isDeposit = mode === 'deposit';
  const { accounts, loading, reload } = useBankData();
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (accounts.length === 0) {
    return (
      <>
        <PageHeader title={isDeposit ? 'Deposit' : 'Withdraw'} />
        <div className="card">
          <EmptyState icon={Wallet} title="No accounts yet" text="Open an account first to make transactions."
            action={<Link to="/accounts?new=1" className="btn-primary">Open an account</Link>} />
        </div>
      </>
    );
  }

  const selected = accounts.find((a) => String(a.id) === accountId) ?? accounts[0];
  const amt = parseFloat(amount) || 0;
  const decimalsOk = Math.round(amt * 100) / 100 === amt;
  const overdraft = !isDeposit && amt > selected.balance;
  const newBalance = isDeposit ? selected.balance + amt : selected.balance - amt;
  const valid = amt > 0 && decimalsOk && !overdraft && amt <= 1_000_000_000;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    try {
      await (isDeposit ? api.deposit(selected.id, amt) : api.withdraw(selected.id, amt));
      toast.success(`${isDeposit ? 'Deposited' : 'Withdrew'} ${money(amt)} ${isDeposit ? 'into' : 'from'} your account`);
      setAmount('');
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const Icon = isDeposit ? ArrowDownToLine : ArrowUpFromLine;
  return (
    <>
      <PageHeader title={isDeposit ? 'Deposit Funds' : 'Withdraw Funds'}
        subtitle={isDeposit ? 'Add money to one of your accounts.' : 'Take money out of one of your accounts.'} />
      <form onSubmit={submit} className="card mx-auto max-w-xl space-y-6 p-6">
        <div>
          <label className="label" htmlFor="acct">Account</label>
          <select id="acct" className="input" value={String(selected.id)} onChange={(e) => setAccountId(e.target.value)}>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.accountType} •••• {a.accountNumber.slice(-4)} — {money(a.balance)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Quick amounts</label>
          <div className="flex flex-wrap gap-2">
            {CHIPS.map((c) => (
              <button
                type="button"
                key={c}
                disabled={!isDeposit && c > selected.balance}
                onClick={() => setAmount(String(c))}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                  amt === c ? 'border-bank-600 bg-bank-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-bank-400 hover:bg-bank-50'
                }`}
              >
                ${c.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="label" htmlFor="amt">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input id="amt" type="number" inputMode="decimal" min="0.01" step="0.01" placeholder="0.00"
              className="input pl-8" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          {amount && !decimalsOk && <p className="mt-1.5 text-xs text-rose-600">Use at most 2 decimal places.</p>}
        </div>

        {overdraft && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Insufficient funds. Available balance is {money(selected.balance)}.</span>
          </div>
        )}

        <div className="rounded-xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-500"><span>Current balance</span><span className="font-medium text-slate-800">{money(selected.balance)}</span></div>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-2">
            <span className="text-slate-500">{isDeposit ? 'New balance' : 'Remaining balance'}</span>
            <span className={`font-bold ${overdraft ? 'text-rose-600' : isDeposit ? 'text-emerald-600' : 'text-slate-900'}`}>
              {amt > 0 ? money(newBalance) : money(selected.balance)}
            </span>
          </div>
        </div>

        <button type="submit" disabled={!valid || busy} className={`${isDeposit ? 'btn-primary' : 'btn-danger'} w-full`}>
          {busy ? <Spinner className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          {isDeposit ? 'Deposit' : 'Withdraw'} {amt > 0 && decimalsOk ? money(amt) : ''}
        </button>
      </form>
    </>
  );
}
