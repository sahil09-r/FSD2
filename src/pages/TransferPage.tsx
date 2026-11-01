import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertTriangle, ArrowDown, ArrowLeftRight, Wallet } from 'lucide-react';
import { api, errMsg } from '../lib/api';
import { money } from '../lib/format';
import { useBankData } from '../lib/useBankData';
import { EmptyState, Modal, PageHeader, PageLoader, Spinner } from '../components/ui';

const OTHER = 'other';

export default function TransferPage() {
  const { accounts, loading, reload } = useBankData();
  const [fromId, setFromId] = useState('');
  const [toId, setToId] = useState('');
  const [otherId, setOtherId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <PageLoader />;
  if (accounts.length === 0) {
    return (
      <>
        <PageHeader title="Transfer" />
        <div className="card"><EmptyState icon={Wallet} title="No accounts yet" text="Open an account to start transferring money."
          action={<Link to="/accounts?new=1" className="btn-primary">Open an account</Link>} /></div>
      </>
    );
  }

  const from = accounts.find((a) => String(a.id) === fromId) ?? accounts[0];
  const targets = accounts.filter((a) => a.id !== from.id);
  const toValue = toId === OTHER ? OTHER : targets.find((a) => String(a.id) === toId) ? toId : targets[0] ? String(targets[0].id) : OTHER;
  const toOwn = toValue === OTHER ? undefined : targets.find((a) => String(a.id) === toValue);
  const toNumericId = toValue === OTHER ? parseInt(otherId, 10) : Number(toValue);
  const amt = parseFloat(amount) || 0;
  const decimalsOk = Math.round(amt * 100) / 100 === amt;
  const overdraft = amt > from.balance;
  const targetOk = Number.isInteger(toNumericId) && toNumericId > 0 && toNumericId !== from.id;
  const valid = amt > 0 && decimalsOk && !overdraft && targetOk;

  const run = async () => {
    setBusy(true);
    try {
      await api.transfer({ fromAccountId: from.id, toAccountId: toNumericId, amount: amt, description: note.trim() });
      toast.success(`Transferred ${money(amt)} successfully`);
      setAmount(''); setNote(''); setConfirm(false);
      await reload();
    } catch (err) {
      toast.error(errMsg(err));
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Transfer Money" subtitle="Move funds between accounts instantly." />
      <div className="card mx-auto max-w-xl space-y-4 p-6">
        <div>
          <label className="label" htmlFor="from">From account</label>
          <select id="from" className="input" value={String(from.id)} onChange={(e) => setFromId(e.target.value)}>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.accountType} •••• {a.accountNumber.slice(-4)} — {money(a.balance)}</option>)}
          </select>
        </div>

        <div className="flex justify-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-bank-50 text-bank-600 ring-4 ring-white"><ArrowDown className="h-5 w-5" /></div>
        </div>

        <div>
          <label className="label" htmlFor="to">To account</label>
          <select id="to" className="input" value={toValue} onChange={(e) => setToId(e.target.value)}>
            {targets.map((a) => <option key={a.id} value={a.id}>{a.accountType} •••• {a.accountNumber.slice(-4)} — {money(a.balance)}</option>)}
            <option value={OTHER}>Another account (enter ID)…</option>
          </select>
          {toValue === OTHER && (
            <input type="number" min="1" step="1" className="input mt-2" placeholder="Destination account ID" value={otherId} onChange={(e) => setOtherId(e.target.value)} />
          )}
        </div>

        <div>
          <label className="label" htmlFor="tamt">Amount</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
            <input id="tamt" type="number" min="0.01" step="0.01" inputMode="decimal" className="input pl-8" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          {amount && !decimalsOk && <p className="mt-1.5 text-xs text-rose-600">Use at most 2 decimal places.</p>}
        </div>

        <div>
          <label className="label" htmlFor="note">Note (optional)</label>
          <input id="note" maxLength={120} className="input" placeholder="What's this for?" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        {overdraft && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>Insufficient funds. Available: {money(from.balance)}.</span>
          </div>
        )}

        <button disabled={!valid} onClick={() => setConfirm(true)} className="btn-primary w-full">
          <ArrowLeftRight className="h-4 w-4" /> Review transfer
        </button>
      </div>

      <Modal open={confirm} onClose={() => !busy && setConfirm(false)} title="Confirm transfer">
        <div className="space-y-3 rounded-xl bg-slate-50 p-4 text-sm">
          <Row k="From" v={`${from.accountType} •••• ${from.accountNumber.slice(-4)}`} />
          <Row k="To" v={toOwn ? `${toOwn.accountType} •••• ${toOwn.accountNumber.slice(-4)}` : `Account #${toNumericId}`} />
          <Row k="Amount" v={money(amt)} strong />
          {note.trim() && <Row k="Note" v={note.trim()} />}
          <Row k="Balance after" v={money(from.balance - amt)} />
        </div>
        <div className="mt-5 flex gap-3">
          <button className="btn-secondary flex-1" disabled={busy} onClick={() => setConfirm(false)}>Cancel</button>
          <button className="btn-primary flex-1" disabled={busy} onClick={run}>{busy && <Spinner className="h-4 w-4" />} Confirm</button>
        </div>
      </Modal>
    </>
  );
}

function Row({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{k}</span>
      <span className={`text-right ${strong ? 'text-base font-bold text-slate-900' : 'font-medium text-slate-800'}`}>{v}</span>
    </div>
  );
}
